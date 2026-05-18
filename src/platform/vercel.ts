import { CacheStore } from "./types";

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export class MemoryCacheStore implements CacheStore {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return JSON.parse(entry.data) as T;
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    store.set(key, {
      data: JSON.stringify(data),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}
