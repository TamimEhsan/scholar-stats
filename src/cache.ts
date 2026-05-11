import { Env, ProfileData, PaperData } from "./types";

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours in ms

export function isStale(scrapedAt: number): boolean {
  return Date.now() - scrapedAt > STALE_THRESHOLD_MS;
}

export async function getCachedProfile(
  env: Env,
  userId: string
): Promise<ProfileData | null> {
  const raw = await env.CACHE.get(`profile:${userId}`);
  if (!raw) return null;
  return JSON.parse(raw) as ProfileData;
}

export async function cacheProfile(
  env: Env,
  userId: string,
  data: ProfileData
): Promise<void> {
  await env.CACHE.put(`profile:${userId}`, JSON.stringify(data), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
}

export async function getCachedPaper(
  env: Env,
  userId: string,
  paperId: string
): Promise<PaperData | null> {
  const raw = await env.CACHE.get(`paper:${userId}:${paperId}`);
  if (!raw) return null;
  return JSON.parse(raw) as PaperData;
}

export async function cachePaper(
  env: Env,
  userId: string,
  paperId: string,
  data: PaperData
): Promise<void> {
  await env.CACHE.put(
    `paper:${userId}:${paperId}`,
    JSON.stringify(data),
    { expirationTtl: CACHE_TTL_SECONDS }
  );
}
