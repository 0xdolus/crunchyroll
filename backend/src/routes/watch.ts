import { FastifyInstance } from "fastify";
import {
  findStreamByEpisodeId,
  insertStream,
  updateStream,
  isStreamExpired,
} from "../repositories/streams.js";
import { findEpisodeById } from "../repositories/episodes.js";
import { resolveMiruroWithFallback } from "../services/providers/miruro.js";
import { rateLimitConfigs } from "../middleware/rate-limit.js";
import { AppError, providerUnavailable } from "../middleware/errors.js";
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

      // 1. Load Supabase episode (episodeId is always the Supabase UUID)
      const episode = await findEpisodeById(episodeId);
      if (!episode) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Episode not found",
        });
      }

      // 2. Look up cached stream
      let stream = await findStreamByEpisodeId(episodeId);

      // 3. If unexpired → return cached proxy playlist
      if (stream && !isStreamExpired(stream)) {
        const body: WatchResponse = {
          episodeId,
          playlistUrl: stream.proxy_playlist_url,
          expiresAt: stream.expires_at,
        };
        return reply.status(200).send(body);
      }

      // 4. Resolve via Miruro using provider_episode_id (never the Supabase UUID)
      const watchId = episode.provider_episode_id;
      if (!watchId) {
        throw providerUnavailable();
      }

      let resolved;
      try {
        resolved = await resolveMiruroWithFallback(watchId);
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw providerUnavailable();
      }

      // 5. Persist refreshed stream (preserve cache schema / expiry semantics)
      if (stream) {
        stream = await updateStream(stream.id, {
          playlist_url: resolved.playlistUrl,
          proxy_playlist_url: resolved.proxyPlaylistUrl,
          expires_at: resolved.expiresAt.toISOString(),
          provider: "miruro",
          quality: resolved.quality,
        });
      } else {
        stream = await insertStream({
          episode_id: episodeId,
          provider: "miruro",
          quality: resolved.quality,
          playlist_url: resolved.playlistUrl,
          proxy_playlist_url: resolved.proxyPlaylistUrl,
          expires_at: resolved.expiresAt.toISOString(),
        });
      }

      // 6. Return existing public response shape
      const body: WatchResponse = {
        episodeId,
        playlistUrl: stream.proxy_playlist_url,
        expiresAt: stream.expires_at,
        sources: resolved.sources,
        subtitles: resolved.subtitles,
      };
      return reply.status(200).send(body);
    }
  );
}
