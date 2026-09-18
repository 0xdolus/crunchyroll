import { LRUCache } from "lru-cache";
import { Env } from "../config/env.js";

export const searchCache = new LRUCache<string, unknown>({
  max: 500,
  ttl: Env.SEARCH_CACHE_TTL * 1000,
});

export const animeCache = new LRUCache<string, unknown>({
  max: 1000,
  ttl: Env.ANIME_CACHE_TTL * 1000,
});

export const episodesCache = new LRUCache<string, unknown>({
  max: 1000,
  ttl: Env.ANIME_CACHE_TTL * 1000,
});

export const metadataCache = new LRUCache<string, unknown>({
  max: 2000,
  ttl: Env.METADATA_CACHE_TTL * 1000,
});

export const streamCache = new LRUCache<string, unknown>({
  max: 2000,
  ttl: Env.STREAM_CACHE_TTL * 1000,
});
