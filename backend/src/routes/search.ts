import { FastifyInstance } from "fastify";
import { z } from "zod";
import { searchMerged } from "../services/metadata/merge.js";
import { searchAnime } from "../repositories/anime.js";
import { searchCache } from "../lib/cache.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";

const querySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export async function searchRoutes(server: FastifyInstance) {
  server.get(
    "/search",
    {
      config: {
        rateLimit: rateLimitConfigs.search,
      },
    },
    async (request, reply) => {
      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid query parameters",
        });
      }

      const { q, page, perPage } = parsed.data;
      const cacheKey = `search:${q}:${page}:${perPage}`;

      const cached = searchCache.get(cacheKey);
      if (cached) {
        return reply.status(200).send(cached);
      }

      // Prefer DB first for speed, fall back to live providers
      let results;
      try {
        const db = await searchAnime(q, page, perPage);
        if (db.results.length > 0) {
          results = {
            results: db.results,
            page,
            perPage,
            total: db.total,
            hasNextPage: page * perPage < db.total,
          };
        }
      } catch {
        // ignore DB errors for search
      }

      if (!results) {
        const live = await searchMerged(q, page, perPage);
        results = {
          results: live.results,
          page,
          perPage,
          total: live.total,
          hasNextPage: live.hasNextPage,
        };
      }

      searchCache.set(cacheKey, results);
      return reply.status(200).send(results);
    }
  );
}
