import { FastifyInstance } from "fastify";
import {
  findStreamByEpisodeId,
  insertStream,
  updateStream,
  isStreamExpired,
} from "../repositories/streams.js";
import { findEpisodeById } from "../repositories/episodes.js";
import { resolveProxyPlaylist } from "../services/providers/miruro.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";
import type { WatchResponse } from "../types/stream.js";

export async function watchRoutes(server: FastifyInstance) {
  server.get(
    "/watch/:episodeId",
    {
      config: {
        rateLimit: rateLimitConfigs.watch,
      },
    },
    async (request, reply) => {
      const { episodeId } = request.params as { episodeId: string };

      const episode = await findEpisodeById(episodeId);
      if (!episode) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Episode not found",
        });
      }

      // 1. Look up cached stream
      let stream = await findStreamByEpisodeId(episodeId);

      // 2. If unexpired → return cached proxy playlist
      if (stream && !isStreamExpired(stream)) {
        const body: WatchResponse = {
          episodeId,
          playlistUrl: stream.proxy_playlist_url,
          expiresAt: stream.expires_at,
        };
        return reply.status(200).send(body);
      }

      // 3/4. Expired or missing → refresh via Miruro
      const resolved = await resolveProxyPlaylist(episodeId);

      if (stream) {
        // 5. Save refreshed stream
        stream = await updateStream(stream.id, {
          playlist_url: resolved.rawSources[0]?.url ?? "",
          proxy_playlist_url: resolved.playlistUrl,
          expires_at: resolved.expiresAt.toISOString(),
          provider: "miruro",
        });
      } else {
        stream = await insertStream({
          episode_id: episodeId,
          provider: "miruro",
          quality: resolved.rawSources[0]?.quality ?? null,
          playlist_url: resolved.rawSources[0]?.url ?? "",
          proxy_playlist_url: resolved.playlistUrl,
          expires_at: resolved.expiresAt.toISOString(),
        });
      }

      // 6. Return Worker-compatible proxy URL
      // 7. Never return stale playlist
      const body: WatchResponse = {
        episodeId,
        playlistUrl: stream.proxy_playlist_url,
        expiresAt: stream.expires_at,
        sources: resolved.rawSources.map((s) => ({
          quality: s.quality ?? "auto",
          url: s.url,
        })),
      };
      return reply.status(200).send(body);
    }
  );
}
