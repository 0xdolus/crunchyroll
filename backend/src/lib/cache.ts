import { LRUCache } from "lru-cache";

function ttlSeconds(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = Number(raw);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const searchCache = new LRUCache<string, any>({
  max: 500,
  ttl: ttlSeconds("CACHE_TTL_SEARCH", 600) * 1000,
});

export const animeCache = new LRUCache<string, any>({
  max: 1000,
  ttl: ttlSeconds("CACHE_TTL_ANIME", 21600) * 1000,
});

export const episodesCache = new LRUCache<string, any>({
  max: 1500,
  ttl: ttlSeconds("CACHE_TTL_EPISODES", 3600) * 1000,
});

export const metadataCache = new LRUCache<string, any>({
  max: 2000,
  ttl: ttlSeconds("CACHE_TTL_ANIME", 86400) * 1000,
});

export const streamCache = new LRUCache<string, any>({
  max: 500,
  ttl: ttlSeconds("CACHE_TTL_EPISODES", 1800) * 1000,
});
