import { getEnv } from "../../config/env.js";

const env = getEnv();

export type Episode = {
  id: string;
  number: number;
  title?: string;
  image?: string;
  airDate?: string;
  filler?: boolean;
};

export async function fetchEpisodes(anilistId: number): Promise<Episode[]> {
  const url = `${env.MIRURO_ENDPOINT}/episodes/${anilistId}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Miruro episodes failed (${res.status})`);
  }

  const data = await res.json();

  const providers = data.results?.providers ?? {};

  // Prefer kiwi provider.
  const kiwi = providers.kiwi?.episodes?.sub;
  if (Array.isArray(kiwi) && kiwi.length) return kiwi;

  // Otherwise return first provider that has sub episodes.
  for (const provider of Object.values(providers) as any[]) {
    const sub = provider?.episodes?.sub;
    if (Array.isArray(sub) && sub.length) return sub;
  }

  return [];
}
