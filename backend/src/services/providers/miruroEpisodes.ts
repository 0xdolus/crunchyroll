import { getEnv } from "../../config/env.js";

const env = getEnv();

export type Episode = {
  id: string;
  number: number;
  title?: string | null;
  image?: string | null;
  airDate?: string | null;
  audio: "sub" | "dub";
  provider: string;
  filler?: boolean;
  fillerType?: string | null;
};

type MiruroEpisodeResponse = {
  results?: {
    providers?: Record<
      string,
      {
        episodes?: {
          sub?: Episode[];
          dub?: Episode[];
        };
      }
    >;
  };
};

export async function fetchEpisodes(anilistId: number): Promise<Episode[]> {
  const url = `${env.MIRURO_ENDPOINT.replace(/\/$/, "")}/episodes/${anilistId}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Miruro episodes failed (${res.status})`);
  }

  const data = (await res.json()) as MiruroEpisodeResponse;
  const providers = data.results?.providers ?? {};
  const episodes: Episode[] = [];

  for (const [provider, providerData] of Object.entries(providers)) {
    const sub = providerData.episodes?.sub ?? [];
    const dub = providerData.episodes?.dub ?? [];

    for (const ep of sub) {
      episodes.push({
        ...ep,
        provider,
        audio: "sub",
      });
    }

    for (const ep of dub) {
      episodes.push({
        ...ep,
        provider,
        audio: "dub",
      });
    }
  }

  episodes.sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    if (a.audio !== b.audio) return a.audio === "sub" ? -1 : 1;
    return a.provider.localeCompare(b.provider);
  });

  return episodes;
}
