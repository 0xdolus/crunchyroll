import { LRUCache } from "lru-cache";
import { env } from "../config/env.js";

export const searchCache = new LRUCache<string, any>({
  max: 500,
  ttl: env.SEARCH_CACHE_TTL * 1000,
});

export const animeCache = new LRUCache<string, any>({
  max: 1000,
  ttl: env.ANIME_CACHE_TTL * 1000,
});

export const metadataCache = new LRUCache<string, any>({
  max: 1000,
  ttl: env.METADATA_CACHE_TTL * 1000,
});

export const streamCache = new LRUCache<string, any>({
  max: 250,
  ttl: env.STREAM_CACHE_TTL * 1000,
});
