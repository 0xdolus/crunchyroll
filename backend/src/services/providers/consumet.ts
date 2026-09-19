import axios from "axios";
import { getEnv } from "../../config/env.js";
import { providerUnavailable } from "../../middleware/errors.js";
import { proxyPlaylist, rewritePlaylist } from "./stream.js";
import { logger } from "../../lib/logger.js";

export interface ConsumetSource {
  url: string;
  quality?: string;
  isM3U8?: boolean;
}

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

export interface ConsumetWatchResult {
  sources: ConsumetSource[];
  subtitles?: Array<{ url: string; lang: string }>;
  headers?: Record<string, string>;
}

/* ---------- NEW: episode discovery ---------- */

export async function fetchAnimeEpisodes(
  anilistId: number
): Promise<ConsumetEpisode[]> {
  const env = getEnv();

  const url =
    `${env.CONSUMET_ENDPOINT.replace(/\/$/, "")}` +
    `/meta/anilist/info/${anilistId}?provider=gogoanime`;

  const { data } = await axios.get(url, { timeout: 15000 });

  return (data.episodes ?? []).map((ep: any) => ({
    id: ep.id,
    number: Number(ep.number ?? ep.episodeNumber ?? ep.episode),
    title: ep.title ?? null,
    description: ep.description ?? null,
    image: ep.image ?? ep.thumbnail ?? null,
  }));
}

/* ---------- existing stream logic ---------- */

async function fetchFromEndpoint(
  endpoint: string,
  episodeId: string
): Promise<ConsumetWatchResult | null> {
  try {
    const url =
      `${endpoint.replace(/\/$/, "")}` +
      `/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`;

    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!data || (!data.sources && !data.stream)) {
      return null;
    }

    const sources: ConsumetSource[] = (data.sources ?? data.stream ?? []).map(
      (s: any) => ({
        url: s.url || s.file,
        quality: s.quality || s.label,
        isM3U8: s.isM3U8 ?? (s.url || s.file || "").includes(".m3u8"),
      })
    );

    return {
      sources,
      subtitles: data.subtitles ?? data.tracks ?? [],
      headers: data.headers,
    };
  } catch (err) {
    logger.warn({ err, endpoint, episodeId }, "Consumet endpoint failed");
    return null;
  }
}

export async function fetchStreamSources(
  episodeId: string
): Promise<ConsumetWatchResult> {
  const env = getEnv();

  const primary = await fetchFromEndpoint(env.CONSUMET_ENDPOINT, episodeId);
  if (primary?.sources.length) return primary;

  const fallback = await fetchFromEndpoint(
    env.CONSUMET_FALLBACK_ENDPOINT,
    episodeId
  );

  if (fallback?.sources.length) return fallback;

  throw providerUnavailable();
}

export async function resolveProxyPlaylist(
  episodeId: string
): Promise<{
  playlistUrl: string;
  expiresAt: Date;
  rawSources: ConsumetSource[];
}> {
  const result = await fetchStreamSources(episodeId);

  const hls = result.sources.find(
    (s) => s.isM3U8 || s.url.includes(".m3u8")
  );

  const source = hls ?? result.sources[0];

  if (!source) throw providerUnavailable();

  return {
    playlistUrl: proxyPlaylist(source.url),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    rawSources: result.sources,
  };
}

export { rewritePlaylist };
