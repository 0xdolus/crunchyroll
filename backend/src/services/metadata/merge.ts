import type { Anime } from "../../types/anime.js";
import { getAnilistMedia, searchAnilist } from "./anilist.js";
import { fetchTmdbArtwork } from "./tmdb.js";
import { getJikanAnime, searchJikan } from "./jikan.js";

/**
 * Priority:
 * 1. AniList (primary metadata)
 * 2. TMDB artwork only (fill missing cover/banner)
 * 3. Jikan fallback (when AniList has no result)
 */
export async function mergeAnimeMetadata(
  anilistId?: number,
  malId?: number | null,
  searchTitle?: string
): Promise<Anime | null> {
  let base: Anime | null = null;

  if (anilistId) {
    base = await getAnilistMedia(anilistId);
  }

  if (!base && malId) {
    base = await getJikanAnime(malId);
  }

  if (!base && searchTitle) {
    const { results } = await searchAnilist(searchTitle, 1, 1);
    if (results.length > 0) {
      base = results[0];
    } else {
      const jikan = await searchJikan(searchTitle, 1);
      if (jikan.length > 0) base = jikan[0];
    }
  }

  if (!base) return null;

  // TMDB may only fill missing artwork
  if (!base.cover_image || !base.banner_image) {
    const title =
      base.title_english || base.title_romaji || base.title || "Unknown";
    const art = await fetchTmdbArtwork(title, base.season_year);
    if (art) {
      if (!base.cover_image && art.poster_path) {
        base.cover_image = art.poster_path;
      }
      if (!base.banner_image && art.backdrop_path) {
        base.banner_image = art.backdrop_path;
      }
    }
  }

  return base;
}

export async function searchMerged(
  query: string,
  page: number,
  perPage: number
): Promise<{ results: Anime[]; total: number; hasNextPage: boolean }> {
  const anilist = await searchAnilist(query, page, perPage);
  if (anilist.results.length > 0) {
    // Optionally enrich missing artwork for top results
    const enriched = await Promise.all(
      anilist.results.slice(0, 5).map(async (a) => {
        if (a.cover_image && a.banner_image) return a;
        const art = await fetchTmdbArtwork(
          a.title_english || a.title_romaji || a.title,
          a.season_year
        );
        if (art) {
          if (!a.cover_image && art.poster_path) a.cover_image = art.poster_path;
          if (!a.banner_image && art.backdrop_path)
            a.banner_image = art.backdrop_path;
        }
        return a;
      })
    );
    return {
      results: [...enriched, ...anilist.results.slice(5)],
      total: anilist.total,
      hasNextPage: anilist.hasNextPage,
    };
  }

  // Fallback to Jikan
  const jikan = await searchJikan(query, page);
  return {
    results: jikan,
    total: jikan.length,
    hasNextPage: false,
  };
}
