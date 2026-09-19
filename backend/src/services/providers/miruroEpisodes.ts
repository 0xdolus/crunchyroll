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

type MiruroResponse = {
  results?: {
    providers?: Record<
      string,
      {
        episodes?: {
          sub?: Omit<Episode, "provider" | "audio">[];
          dub?: Omit<Episode, "provider" | "audio">[];
        };
      }
    >;
  };
};

export async function fetchEpisodes(anilistId: number): Promise<Episode[]> {
  const res = await fetch(
    `${env.MIRURO_ENDPOINT.replace(/\/$/, "")}/episodes/${anilistId}`
  );

  if (!res.ok) {
    throw new Error(`Miruro episodes failed (${res.status})`);
  }

  const data = (await res.json()) as MiruroResponse;

  const providers = data.results?.providers ?? {};
  const episodes: Episode[] = [];

  for (const [provider, value] of Object.entries(providers)) {
    for (const ep of value.episodes?.sub ?? []) {
      episodes.push({ ...ep, provider, audio: "sub" });
    }

    for (const ep of value.episodes?.dub ?? []) {
      episodes.push({ ...ep, provider, audio: "dub" });
    }
  }

  episodes.sort((a, b) => a.number - b.number);

  return episodes;
}
