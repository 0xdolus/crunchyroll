import axios from "axios";
import { getEnv } from "../../config/env.js";
import type { Anime } from "../../types/anime.js";

export async function searchJikan(
  query: string,
  page = 1
): Promise<Anime[]> {
  try {
    const { data } = await axios.get(`${getEnv().JIKAN_ENDPOINT}/anime`, {
      params: { q: query, page, limit: 20 },
      timeout: 10000,
    });

    return (data.data ?? []).map((item: any): Anime => ({
      id: "",
      anilist_id: 0, // unknown
      mal_id: item.mal_id,
      title: item.title || item.title_english || "Unknown",
      title_english: item.title_english ?? null,
      title_romaji: item.title ?? null,
      title_native: item.title_japanese ?? null,
      description: item.synopsis ?? null,
      cover_image: item.images?.jpg?.large_image_url ?? null,
      banner_image: null,
      genres: item.genres?.map((g: any) => g.name) ?? [],
      status: item.status ?? null,
      episodes_count: item.episodes ?? null,
      season: item.season ?? null,
      season_year: item.year ?? null,
      average_score: item.score ? Math.round(item.score * 10) : null,
      popularity: item.popularity ?? null,
      format: item.type ?? null,
      source: item.source ?? null,
      studios: item.studios?.map((s: any) => s.name) ?? [],
    }));
  } catch {
    return [];
  }
}

export async function getJikanAnime(malId: number): Promise<Anime | null> {
  try {
    const { data } = await axios.get(
      `${getEnv().JIKAN_ENDPOINT}/anime/${malId}/full`,
      { timeout: 10000 }
    );
    const item = data.data;
    if (!item) return null;

    return {
      id: "",
      anilist_id: 0,
      mal_id: item.mal_id,
      title: item.title || item.title_english || "Unknown",
      title_english: item.title_english ?? null,
      title_romaji: item.title ?? null,
      title_native: item.title_japanese ?? null,
      description: item.synopsis ?? null,
      cover_image: item.images?.jpg?.large_image_url ?? null,
      banner_image: null,
      genres: item.genres?.map((g: any) => g.name) ?? [],
      status: item.status ?? null,
      episodes_count: item.episodes ?? null,
      season: item.season ?? null,
      season_year: item.year ?? null,
      average_score: item.score ? Math.round(item.score * 10) : null,
      popularity: item.popularity ?? null,
      format: item.type ?? null,
      source: item.source ?? null,
      studios: item.studios?.map((s: any) => s.name) ?? [],
    };
  } catch {
    return null;
  }
}
