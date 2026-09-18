import { FastifyInstance } from "fastify";
import { requireSyncAuth } from "../middleware/sync-auth.js";
import { syncTrending } from "../services/sync/trending.js";
import { syncSeasonal } from "../services/sync/seasonal.js";
import { syncMetadata } from "../services/sync/metadata.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";

export async function syncRoutes(server: FastifyInstance) {
  server.post(
    "/sync/trending",
    {
      preHandler: requireSyncAuth,
      config: { rateLimit: rateLimitConfigs.sync },
    },
    async (_request, reply) => {
      const result = await syncTrending();
      return reply.status(200).send({ ok: true, ...result });
    }
  );

  server.post(
    "/sync/seasonal",
    {
      preHandler: requireSyncAuth,
      config: { rateLimit: rateLimitConfigs.sync },
    },
    async (_request, reply) => {
      const result = await syncSeasonal();
      return reply.status(200).send({ ok: true, ...result });
    }
  );

  server.post(
    "/sync/metadata",
    {
      preHandler: requireSyncAuth,
      config: { rateLimit: rateLimitConfigs.sync },
    },
    async (_request, reply) => {
      const result = await syncMetadata();
      return reply.status(200).send({ ok: true, ...result });
    }
  );
}
