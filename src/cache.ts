import { Env, ProfileData, PaperData } from "./types";

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 1 day
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day in ms
const EDGE_CACHE_URL = "https://scholar-badge-cache.internal";

export function isStale(scrapedAt: number): boolean {
  return Date.now() - scrapedAt > STALE_THRESHOLD_MS;
}

async function getEdgeCache(key: string): Promise<string | null> {
  const cache = caches.default;
  const response = await cache.match(new Request(`${EDGE_CACHE_URL}/${key}`));
  if (!response) return null;
  return response.text();
}

async function setEdgeCache(key: string, data: string): Promise<void> {
  const cache = caches.default;
  const response = new Response(data, {
    headers: {
      "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      "Content-Type": "application/json",
    },
  });
  await cache.put(new Request(`${EDGE_CACHE_URL}/${key}`), response);
}

async function getCached<T>(env: Env, key: string): Promise<T | null> {
  // Layer 1: Edge Cache API (free, no write limits, per-location)
  const edgeHit = await getEdgeCache(key);
  if (edgeHit) return JSON.parse(edgeHit) as T;

  // Layer 2: KV (persistent, global, 1K writes/day on free tier)
  const kvHit = await env.CACHE.get(key);
  if (kvHit) {
    // Promote to edge cache to reduce future KV reads
    await setEdgeCache(key, kvHit);
    return JSON.parse(kvHit) as T;
  }

  return null;
}

async function setCache(env: Env, key: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);

  // Write to both layers
  await Promise.all([
    setEdgeCache(key, json),
    env.CACHE.put(key, json, { expirationTtl: CACHE_TTL_SECONDS }),
  ]);
}

export async function getCachedProfile(
  env: Env,
  userId: string
): Promise<ProfileData | null> {
  return getCached<ProfileData>(env, `profile:${userId}`);
}

export async function cacheProfile(
  env: Env,
  userId: string,
  data: ProfileData
): Promise<void> {
  await setCache(env, `profile:${userId}`, data);
}

export async function getCachedPaper(
  env: Env,
  userId: string,
  paperId: string
): Promise<PaperData | null> {
  return getCached<PaperData>(env, `paper:${userId}:${paperId}`);
}

export async function cachePaper(
  env: Env,
  userId: string,
  paperId: string,
  data: PaperData
): Promise<void> {
  await setCache(env, `paper:${userId}:${paperId}`, data);
}
