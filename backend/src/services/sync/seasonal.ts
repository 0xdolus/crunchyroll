import { GraphQLClient, gql } from "graphql-request";
import { getEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { upsertAnime } from "../../repositories/anime.js";

const SEASONAL_QUERY = gql`
  query ($season: MediaSeason, $seasonYear: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        coverImage {
          large
          extraLarge
        }
        bannerImage
        genres
        status
        episodes
        season
        seasonYear
        averageScore
        popularity
        format
        source
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

function currentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month <= 3) return { season: "WINTER", year };
  if (month <= 6) return { season: "SPRING", year };
  if (month <= 9) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export async function syncSeasonal(): Promise<{ upserted: number }> {
  logger.info("Starting seasonal sync");
  let upserted = 0;
  const { season, year } = currentSeason();
  const client = new GraphQLClient(getEnv().ANILIST_ENDPOINT);

  try {
    for (let page = 1; page <= 3; page++) {
      const data: any = await client.request(SEASONAL_QUERY, {
        season,
        seasonYear: year,
        page,
      });
      const media = data.Page?.media ?? [];
      if (media.length === 0) break;

      for (const m of media) {
        try {
          await upsertAnime({
            anilist_id: m.id,
            mal_id: m.idMal ?? null,
            title: m.title?.english || m.title?.romaji || m.title?.native || "Unknown",
            title_english: m.title?.english ?? null,
            title_romaji: m.title?.romaji ?? null,
            title_native: m.title?.native ?? null,
            description: m.description ?? null,
            cover_image: m.coverImage?.extraLarge || m.coverImage?.large || null,
            banner_image: m.bannerImage ?? null,
            genres: m.genres ?? [],
            status: m.status ?? null,
            episodes_count: m.episodes ?? null,
            season: m.season ?? null,
            season_year: m.seasonYear ?? null,
            average_score: m.averageScore ?? null,
            popularity: m.popularity ?? null,
            format: m.format ?? null,
            source: m.source ?? null,
            studios: m.studios?.nodes?.map((n: any) => n.name) ?? [],
          });
          upserted++;
        } catch (err) {
          logger.warn({ err, anilist_id: m.id }, "Failed to upsert seasonal anime");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Seasonal sync failed");
    throw err;
  }

  logger.info({ upserted, season, year }, "Seasonal sync completed");
  return { upserted };
}
