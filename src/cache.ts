import { CacheStore } from "./platform/types";
import { ProfileData, PaperData } from "./types";

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 1 day
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function isStale(fetchedAt: number): boolean {
  return Date.now() - fetchedAt > STALE_THRESHOLD_MS;
}

export async function getCachedProfile(
  cache: CacheStore,
  key: string
): Promise<ProfileData | null> {
  return cache.get<ProfileData>(`profile:${key}`);
}

export async function cacheProfile(
  cache: CacheStore,
  key: string,
  data: ProfileData
): Promise<void> {
  await cache.set(`profile:${key}`, data, CACHE_TTL_SECONDS);
}

export async function getCachedPaper(
  cache: CacheStore,
  paperId: string
): Promise<PaperData | null> {
  return cache.get<PaperData>(`paper:${paperId}`);
}

export async function cachePaper(
  cache: CacheStore,
  paperId: string,
  data: PaperData
): Promise<void> {
  await cache.set(`paper:${paperId}`, data, CACHE_TTL_SECONDS);
}
