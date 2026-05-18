import { CacheStore } from "./types";

const EDGE_CACHE_URL = "https://scholar-badge-cache.internal";

export class CloudflareCacheStore implements CacheStore {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async get<T>(key: string): Promise<T | null> {
    const edgeHit = await this.getEdgeCache(key);
    if (edgeHit) return JSON.parse(edgeHit) as T;

    const kvHit = await this.kv.get(key);
    if (kvHit) {
      await this.setEdgeCache(key, kvHit);
      return JSON.parse(kvHit) as T;
    }

    return null;
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const json = JSON.stringify(data);
    await Promise.all([
      this.setEdgeCache(key, json, ttlSeconds),
      this.kv.put(key, json, { expirationTtl: ttlSeconds }),
    ]);
  }

  private async getEdgeCache(key: string): Promise<string | null> {
    const cache = caches.default;
    const response = await cache.match(new Request(`${EDGE_CACHE_URL}/${key}`));
    if (!response) return null;
    return response.text();
  }

  private async setEdgeCache(key: string, data: string, ttlSeconds = 86400): Promise<void> {
    const cache = caches.default;
    const response = new Response(data, {
      headers: {
        "Cache-Control": `public, max-age=${ttlSeconds}`,
        "Content-Type": "application/json",
      },
    });
    await cache.put(new Request(`${EDGE_CACHE_URL}/${key}`), response);
  }
}
