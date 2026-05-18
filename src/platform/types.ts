export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, data: unknown, ttlSeconds: number): Promise<void>;
}

export interface PlatformContext {
  cache: CacheStore;
  clientIp: string;
  waitUntil(promise: Promise<unknown>): void;
}
