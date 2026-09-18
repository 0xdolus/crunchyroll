import { logger } from "../../lib/logger.js";
import { getSupabase } from "../../lib/supabase.js";
import { mergeAnimeMetadata } from "../metadata/merge.js";
import { upsertAnime } from "../../repositories/anime.js";

/**
 * Refresh metadata for anime that have missing artwork or stale data.
 * Idempotent: upserts by anilist_id only.
 */
export async function syncMetadata(): Promise<{ updated: number }> {
  logger.info("Starting metadata refresh sync");
  let updated = 0;

  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from("anime")
    .select("id, anilist_id, mal_id, title, cover_image, banner_image")
    .or("cover_image.is.null,banner_image.is.null")
    .limit(100);

  if (error) {
    logger.error({ error }, "Failed to query anime for metadata sync");
    throw error;
  }

  for (const row of rows ?? []) {
    try {
      const merged = await mergeAnimeMetadata(
        row.anilist_id,
        row.mal_id,
        row.title
      );
      if (!merged) continue;

      await upsertAnime({
        anilist_id: merged.anilist_id || row.anilist_id,
        mal_id: merged.mal_id ?? row.mal_id,
        title: merged.title,
        title_english: merged.title_english,
        title_romaji: merged.title_romaji,
        title_native: merged.title_native,
        description: merged.description,
        cover_image: merged.cover_image,
        banner_image: merged.banner_image,
        genres: merged.genres,
        status: merged.status,
        episodes_count: merged.episodes_count,
        season: merged.season,
        season_year: merged.season_year,
        average_score: merged.average_score,
        popularity: merged.popularity,
        format: merged.format,
        source: merged.source,
        studios: merged.studios,
      });
      updated++;
    } catch (err) {
      logger.warn({ err, anilist_id: row.anilist_id }, "Metadata refresh failed for anime");
    }
  }

  logger.info({ updated }, "Metadata sync completed");
  return { updated };
}
