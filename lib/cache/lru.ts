import { LRUCache } from "lru-cache";

export interface CacheEntry<T> {
  value: T;
  ts: number;
}

const MAX = Number(process.env.CACHE_MAX_ITEMS ?? 500);

const cache = new LRUCache<string, CacheEntry<unknown>>({
  max: MAX,
  ttl: 1000 * 60 * 30, // 30-min TTL
});

let hits = 0;
let misses = 0;

export function cacheGet<T>(key: string): T | null {
  const e = cache.get(key) as CacheEntry<T> | undefined;
  if (e) {
    hits++;
    return e.value;
  }
  misses++;
  return null;
}

export function cacheSet<T>(key: string, value: T): void {
  cache.set(key, { value, ts: Date.now() });
}

export function cacheStats(): { hits: number; misses: number; size: number; max: number } {
  return { hits, misses, size: cache.size, max: MAX };
}

/** Lowercase + collapse whitespace — used as cache key prefix for natural-language questions. */
export function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}
