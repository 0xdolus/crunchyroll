import { logger } from "../../lib/logger.js";
import { searchAnilist } from "../metadata/anilist.js";
import { upsertAnime } from "../../repositories/anime.js";

export async function syncTrending(): Promise<{ upserted: number }> {
  logger.info("Starting trending sync");
  let upserted = 0;

  try {
    // AniList trending via search with empty query sorted by popularity
    const { results } = await searchAnilist("", 1, 50);
    for (const anime of results) {
      try {
        await upsertAnime({
          anilist_id: anime.anilist_id,
          mal_id: anime.mal_id,
          title: anime.title,
          title_english: anime.title_english,
          title_romaji: anime.title_romaji,
          title_native: anime.title_native,
          description: anime.description,
          cover_image: anime.cover_image,
          banner_image: anime.banner_image,
          genres: anime.genres,
          status: anime.status,
          episodes_count: anime.episodes_count,
          season: anime.season,
          season_year: anime.season_year,
          average_score: anime.average_score,
          popularity: anime.popularity,
          format: anime.format,
          source: anime.source,
          studios: anime.studios,
        });
        upserted++;
      } catch (err) {
        logger.warn({ err, anilist_id: anime.anilist_id }, "Failed to upsert trending anime");
      }
    }
  } catch (err) {
    logger.error({ err }, "Trending sync failed");
    throw err;
  }

  logger.info({ upserted }, "Trending sync completed");
  return { upserted };
}
