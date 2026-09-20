import { FastifyInstance } from "fastify";
import {
  findAnimeById,
  findAnimeByAnilistId,
  upsertAnime,
} from "../repositories/anime.js";
import { findEpisodesByAnimeId } from "../repositories/episodes.js";
import { fetchAndPersistEpisodes } from "../services/providers/miruroEpisodes.js";
import { mergeAnimeMetadata } from "../services/metadata/merge.js";
import { animeCache, episodesCache } from "../lib/cache.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";
import { AppError } from "../middleware/errors.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveAnime(id: string) {
  if (UUID_RE.test(id)) {
    return findAnimeById(id);
  }

  const anilistId = Number(id);

  if (!Number.isInteger(anilistId) || anilistId <= 0) {
    return null;
  }

  let anime = await findAnimeByAnilistId(anilistId);

  if (!anime) {
    const merged = await mergeAnimeMetadata(anilistId);

    if (merged) {
      anime = await upsertAnime({
        anilist_id: merged.anilist_id,
        mal_id: merged.mal_id,
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
    }
  }

  return anime;
}

export async function animeRoutes(server: FastifyInstance) {
  server.get(
    "/anime/:id",
    {
      config: {
        rateLimit: rateLimitConfigs.anime,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const cacheKey = `anime:${id}`;

      const cached = animeCache.get(cacheKey);
      if (cached) {
        return reply.status(200).send(cached);
      }

      const anime = await resolveAnime(id);

      if (!anime) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Anime not found",
        });
      }

      animeCache.set(cacheKey, anime);
      return reply.status(200).send(anime);
    }
  );

  server.get(
    "/anime/:id/episodes",
    {
      config: {
        rateLimit: rateLimitConfigs.anime,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const cacheKey = `episodes:${id}`;

      const cached = episodesCache.get(cacheKey);
      if (cached) {
        return reply.status(200).send(cached);
      }

      const anime = await resolveAnime(id);

      if (!anime) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Anime not found",
        });
      }

      const anilistId = anime.anilist_id;
      if (!anilistId) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Anime has no AniList ID for episode discovery",
        });
      }

      // Prefer existing persisted episodes when present
      let episodes = await findEpisodesByAnimeId(anime.id);

      if (episodes.length === 0) {
        try {
          episodes = await fetchAndPersistEpisodes(anime.id, anilistId);
        } catch (err) {
          // Upstream provider failure must not look like "zero episodes"
          if (err instanceof AppError) throw err;
          throw new AppError(
            503,
            "ProviderUnavailable",
            err instanceof Error ? err.message : "Episode discovery failed"
          );
        }
      }

      const response = {
        animeId: anime.id,
        episodes,
      };

      episodesCache.set(cacheKey, response);
      return reply.status(200).send(response);
    }
  );
}
