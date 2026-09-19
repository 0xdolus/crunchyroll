import { env } from "../../config/env.js";

type MiruroWatch = {
  results: {
    streams: Array<{
      url: string;
      quality?: string;
    }>;
    subtitles?: Array<{
      file: string;
      label: string;
    }>;
  };
};

export async function resolveProxyPlaylist(episodeId: string) {
  // episodeId is expected to already be:
  // watch/kiwi/20/sub/animepahe-1

  const endpoint =
    `${env.MIRURO_ENDPOINT.replace(/\/$/, "")}/${episodeId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error(`Miruro watch failed (${res.status})`);
  }

  const data = (await res.json()) as MiruroWatch;

  const stream = data.results.streams.find((s) => s.url.endsWith(".m3u8"));

  if (!stream) {
    throw new Error("No HLS stream returned by Miruro.");
  }

  return {
    playlistUrl: stream.url,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    subtitles: data.results.subtitles ?? [],
    rawSources: data.results.streams,
  };
}
