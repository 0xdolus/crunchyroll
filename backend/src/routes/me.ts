import { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { getHistory, upsertHistory } from "../repositories/watch-history.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../repositories/favorites.js";
import { findEpisodeById } from "../repositories/episodes.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";
import { z } from "zod";

export async function meRoutes(server: FastifyInstance) {
  server.get(
    "/me/history",
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitConfigs.me },
    },
    async (request, reply) => {
      const user = request.user!;
      const history = await getHistory(user.id);
      return reply.status(200).send({ history });
    }
  );

  server.put(
    "/me/history/:episodeId",
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitConfigs.me },
    },
    async (request, reply) => {
      const user = request.user!;
      const { episodeId } = request.params as { episodeId: string };
      const bodySchema = z.object({
        progress: z.number().min(0).max(100).default(0),
      });
      const parsed = bodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid body",
        });
      }

      const episode = await findEpisodeById(episodeId);
      if (!episode) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Episode not found",
        });
      }

      const entry = await upsertHistory(
        user.id,
        episodeId,
        episode.anime_id,
        parsed.data.progress
      );
      return reply.status(200).send(entry);
    }
  );

  server.get(
    "/me/favorites",
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitConfigs.me },
    },
    async (request, reply) => {
      const user = request.user!;
      const favorites = await getFavorites(user.id);
      return reply.status(200).send({ favorites });
    }
  );

  server.post(
    "/me/favorites/:animeId",
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitConfigs.me },
    },
    async (request, reply) => {
      const user = request.user!;
      const { animeId } = request.params as { animeId: string };
      const entry = await addFavorite(user.id, animeId);
      return reply.status(201).send(entry);
    }
  );

  server.delete(
    "/me/favorites/:animeId",
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitConfigs.me },
    },
    async (request, reply) => {
      const user = request.user!;
      const { animeId } = request.params as { animeId: string };
      await removeFavorite(user.id, animeId);
      return reply.status(204).send();
    }
  );
}
