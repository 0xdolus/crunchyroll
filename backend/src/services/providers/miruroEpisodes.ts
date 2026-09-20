import { getEnv } from "../../config/env.js";
import { upsertEpisode } from "../../repositories/episodes.js";
import type { Episode } from "../../types/episode.js";
import { AppError } from "../../middleware/errors.js";

/** Preferred Miruro providers in deterministic order. */
const PROVIDER_ORDER = [
  "kiwi",
  "arc",
  "zoro",
  "hop",
  "pewe",
  "bonk",
  "ally",
  "moo",
  "bee",
  "nun",
] as const;

export type MiruroEpisodeRaw = {
  id: string;
  number: number;
  title?: string | null;
  image?: string | null;
  airDate?: string | null;
  description?: string | null;
  duration?: number | null;
  filler?: boolean;
  fillerType?: string | null;
  audio?: string;
};

type MiruroResponse = {
  success?: boolean;
  results?: {
    providers?: Record<
      string,
      {
        meta?: Record<string, unknown>;
        episodes?: {
          sub?: MiruroEpisodeRaw[];
          dub?: MiruroEpisodeRaw[];
        };
      }
    >;
  };
};

export type ParsedMiruroEpisode = {
  watchId: string;
  number: number;
  title?: string | null;
  image?: string | null;
  airDate?: string | null;
  description?: string | null;
  duration?: number | null;
  provider: string;
  audio: "sub" | "dub";
  filler?: boolean;
  fillerType?: string | null;
};

/**
 * Parse a Miruro /episodes/:anilistId response into a flat, ordered list.
 * Does not touch Supabase.
 */
export function parseMiruroEpisodesResponse(
  data: unknown
): ParsedMiruroEpisode[] {
  if (!data || typeof data !== "object") {
    throw new AppError(502, "BadGateway", "Malformed Miruro episodes response");
  }

  const body = data as MiruroResponse;
  const providers = body.results?.providers ?? {};
  const collected: ParsedMiruroEpisode[] = [];

  // Deterministic provider order: known providers first, then remaining sorted.
  const providerNames = [
    ...PROVIDER_ORDER.filter((p) => p in providers),
    ...Object.keys(providers)
      .filter((p) => !PROVIDER_ORDER.includes(p as (typeof PROVIDER_ORDER)[number]))
      .sort(),
  ];

  for (const provider of providerNames) {
    const value = providers[provider];
    if (!value?.episodes) continue;

    for (const ep of value.episodes.sub ?? []) {
      if (!ep?.id || typeof ep.number !== "number") continue;
      collected.push({
        watchId: ep.id,
        number: ep.number,
        title: ep.title ?? null,
        image: ep.image ?? null,
        airDate: ep.airDate ?? null,
        description: ep.description ?? null,
        duration: ep.duration ?? null,
        provider,
        audio: "sub",
        filler: ep.filler,
        fillerType: ep.fillerType ?? null,
      });
    }

    for (const ep of value.episodes.dub ?? []) {
      if (!ep?.id || typeof ep.number !== "number") continue;
      collected.push({
        watchId: ep.id,
        number: ep.number,
        title: ep.title ?? null,
        image: ep.image ?? null,
        airDate: ep.airDate ?? null,
        description: ep.description ?? null,
        duration: ep.duration ?? null,
        provider,
        audio: "dub",
        filler: ep.filler,
        fillerType: ep.fillerType ?? null,
      });
    }
  }

  collected.sort((a, b) => a.number - b.number || a.provider.localeCompare(b.provider));
  return collected;
}

/**
 * Pick one canonical episode per episode_number.
 * Prefer sub over dub; within the same audio, prefer earlier PROVIDER_ORDER.
 */
export function selectCanonicalEpisodes(
  parsed: ParsedMiruroEpisode[]
): ParsedMiruroEpisode[] {
  const byNumber = new Map<number, ParsedMiruroEpisode>();

  for (const ep of parsed) {
    const existing = byNumber.get(ep.number);
    if (!existing) {
      byNumber.set(ep.number, ep);
      continue;
    }

    const preferNew =
      (existing.audio === "dub" && ep.audio === "sub") ||
      (existing.audio === ep.audio &&
        providerRank(ep.provider) < providerRank(existing.provider));

    if (preferNew) {
      byNumber.set(ep.number, ep);
    }
  }

  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

function providerRank(name: string): number {
  const idx = PROVIDER_ORDER.indexOf(name as (typeof PROVIDER_ORDER)[number]);
  return idx === -1 ? PROVIDER_ORDER.length + name.charCodeAt(0) : idx;
}

/**
 * Fetch episodes from Miruro and upsert into Supabase.
 * Returns the backend Episode shape (with Supabase UUIDs).
 */
export async function fetchAndPersistEpisodes(
  animeId: string,
  anilistId: number
): Promise<Episode[]> {
  const env = getEnv();
  const base = env.MIRURO_ENDPOINT.replace(/\/$/, "");
  const url = `${base}/episodes/${anilistId}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new AppError(
      503,
      "ProviderUnavailable",
      `Miruro episodes request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    // Distinguish upstream failure from "zero episodes"
    throw new AppError(
      res.status === 404 ? 404 : 503,
      res.status === 404 ? "NotFound" : "ProviderUnavailable",
      `Miruro episodes failed (${res.status})`
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AppError(502, "BadGateway", "Malformed Miruro episodes JSON");
  }

  const parsed = parseMiruroEpisodesResponse(data);
  const canonical = selectCanonicalEpisodes(parsed);

  const upserted: Episode[] = [];

  for (const ep of canonical) {
    const row = await upsertEpisode({
      anime_id: animeId,
      episode_number: ep.number,
      title: ep.title ?? null,
      description: ep.description ?? null,
      thumbnail_url: ep.image ?? null,
      air_date: ep.airDate ?? null,
      duration: ep.duration ?? null,
      provider: "miruro",
      provider_episode_id: ep.watchId,
      metadata: {
        miruro_provider: ep.provider,
        audio: ep.audio,
        filler: ep.filler ?? false,
        fillerType: ep.fillerType ?? null,
      },
    });
    upserted.push(row);
  }

  return upserted;
}

/** @deprecated Prefer fetchAndPersistEpisodes. Kept for unit tests of pure parse. */
export async function fetchEpisodes(anilistId: number): Promise<ParsedMiruroEpisode[]> {
  const env = getEnv();
  const base = env.MIRURO_ENDPOINT.replace(/\/$/, "");
  const res = await fetch(`${base}/episodes/${anilistId}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Miruro episodes failed (${res.status})`);
  }

  const data = await res.json();
  return parseMiruroEpisodesResponse(data);
}
