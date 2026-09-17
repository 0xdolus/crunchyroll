import { LRUCache } from "lru-cache";

function ttlMs(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  const n = raw ? Number(raw) : fallback;
  return (Number.isFinite(n) && n > 0 ? n : fallback) * 1000;
}

export const searchCache = new LRUCache<string, unknown>({
  max: 500,
  ttl: ttlMs("CACHE_TTL_SEARCH", 3600),
});

export const animeCache = new LRUCache<string, unknown>({
  max: 1000,
  ttl: ttlMs("CACHE_TTL_ANIME", 86400),
});

export const episodesCache = new LRUCache<string, unknown>({
  max: 2000,
  ttl: ttlMs("CACHE_TTL_EPISODES", 21600),
});

export const trendingCache = new LRUCache<string, unknown>({
  max: 50,
  ttl: ttlMs("CACHE_TTL_TRENDING", 1800),
});
