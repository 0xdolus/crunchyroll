import { getEnv } from "../../config/env.js";
import { AppError, providerUnavailable } from "../../middleware/errors.js";
import { proxyPlaylist } from "./stream.js";

export type MiruroStreamSource = {
  url: string;
  quality?: string;
  type?: string;
};

export type MiruroSubtitle = {
  file: string;
  label: string;
  kind?: string;
};

type MiruroWatchResponse = {
  success?: boolean;
  results?: {
    streams?: MiruroStreamSource[];
    subtitles?: MiruroSubtitle[];
  };
  streams?: MiruroStreamSource[];
  subtitles?: MiruroSubtitle[];
};

export type ResolvedMiruroStream = {
  /** Upstream HLS playlist URL (not proxied). */
  playlistUrl: string;
  /** Cloudflare-proxied playlist URL for clients. */
  proxyPlaylistUrl: string;
  expiresAt: Date;
  quality: string | null;
  sources: Array<{ quality: string; url: string }>;
  subtitles: Array<{ language: string; url: string }>;
  rawSources: MiruroStreamSource[];
};

/**
 * Normalize a Miruro watch ID into a path under MIRURO_ENDPOINT.
 * Accepts either a full path like "watch/kiwi/20/sub/anikoto-1"
 * or a leading-slash form.
 */
export function miruroWatchPath(watchId: string): string {
  const trimmed = watchId.trim().replace(/^\//, "");
  if (!trimmed) {
    throw new AppError(400, "BadRequest", "Missing Miruro watch ID");
  }
  // Contract: resolve through /watch/:provider/:anilistId/:category/:slug
  // The episode id from Miruro already looks like "watch/kiwi/20/sub/anikoto-1"
  if (trimmed.startsWith("watch/")) {
    return trimmed;
  }
  return `watch/${trimmed}`;
}

function extractStreams(data: MiruroWatchResponse): MiruroStreamSource[] {
  if (Array.isArray(data.results?.streams)) return data.results!.streams!;
  if (Array.isArray(data.streams)) return data.streams;
  return [];
}

function extractSubtitles(data: MiruroWatchResponse): MiruroSubtitle[] {
  if (Array.isArray(data.results?.subtitles)) return data.results!.subtitles!;
  if (Array.isArray(data.subtitles)) return data.subtitles;
  return [];
}

function pickHlsStream(streams: MiruroStreamSource[]): MiruroStreamSource | null {
  // Prefer explicit HLS / m3u8
  const hls = streams.find(
    (s) =>
      typeof s.url === "string" &&
      (s.url.includes(".m3u8") ||
        s.type === "hls" ||
        (s.quality && /hls/i.test(s.quality)))
  );
  if (hls) return hls;

  // Fallback: any URL ending with .m3u8
  return streams.find((s) => typeof s.url === "string" && s.url.endsWith(".m3u8")) ?? null;
}

/**
 * Resolve a Miruro provider_episode_id (watch ID) to an HLS stream,
 * then wrap the playlist through the existing Cloudflare proxy.
 *
 * Does NOT accept a Supabase episode UUID — pass provider_episode_id.
 */
export async function resolveMiruroWatchId(
  watchId: string
): Promise<ResolvedMiruroStream> {
  if (!watchId || typeof watchId !== "string") {
    throw new AppError(400, "BadRequest", "Missing Miruro watch ID");
  }

  const env = getEnv();
  const base = env.MIRURO_ENDPOINT.replace(/\/$/, "");
  const path = miruroWatchPath(watchId);
  const endpoint = `${base}/${path}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new AppError(
      503,
      "ProviderUnavailable",
      `Miruro watch request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new AppError(404, "NotFound", "Miruro stream not found for this episode");
    }
    throw providerUnavailable();
  }

  let data: MiruroWatchResponse;
  try {
    data = (await res.json()) as MiruroWatchResponse;
  } catch {
    throw new AppError(502, "BadGateway", "Malformed Miruro watch response");
  }

  const streams = extractStreams(data);
  if (streams.length === 0) {
    throw providerUnavailable();
  }

  const hls = pickHlsStream(streams);
  if (!hls || !hls.url) {
    // Non-HLS only → treat as unavailable rather than returning a fake URL
    throw providerUnavailable();
  }

  const subtitlesRaw = extractSubtitles(data);
  const subtitles = subtitlesRaw
    .filter((s) => s.file)
    .map((s) => ({
      language: s.label || "unknown",
      url: s.file,
    }));

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  return {
    playlistUrl: hls.url,
    proxyPlaylistUrl: proxyPlaylist(hls.url),
    expiresAt,
    quality: hls.quality ?? null,
    sources: streams
      .filter((s) => typeof s.url === "string")
      .map((s) => ({
        quality: s.quality ?? "auto",
        url: s.url,
      })),
    subtitles,
    rawSources: streams,
  };
}

/**
 * Attempt to resolve a primary watch ID; on failure, try fallback watch IDs
 * (e.g. alternate providers stored in metadata or discovered at request time).
 */
export async function resolveMiruroWithFallback(
  primaryWatchId: string,
  fallbackWatchIds: string[] = []
): Promise<ResolvedMiruroStream> {
  const candidates = [primaryWatchId, ...fallbackWatchIds].filter(Boolean);
  let lastError: unknown;

  for (const id of candidates) {
    try {
      return await resolveMiruroWatchId(id);
    } catch (err) {
      lastError = err;
      // Only continue on provider-level failures
      if (err instanceof AppError && err.statusCode === 404) {
        continue;
      }
      if (err instanceof AppError && err.error === "ProviderUnavailable") {
        continue;
      }
      // Unexpected errors stop the chain
      throw err;
    }
  }

  if (lastError instanceof AppError) throw lastError;
  throw providerUnavailable();
}

/** @deprecated Use resolveMiruroWatchId. Kept temporarily for route migration. */
export async function resolveProxyPlaylist(watchId: string) {
  return resolveMiruroWatchId(watchId);
}
