import { getEnv } from "./env.js";

export interface CacheTtls {
  search: number;
  anime: number;
  episodes: number;
  trending: number;
}

export function getCacheTtls(): CacheTtls {
  const env = getEnv();
  return {
    search: env.CACHE_TTL_SEARCH,
    anime: env.CACHE_TTL_ANIME,
    episodes: env.CACHE_TTL_EPISODES,
    trending: env.CACHE_TTL_TRENDING,
  };
}
