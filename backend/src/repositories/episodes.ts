import { getSupabase } from "../lib/supabase.js";
import type { Episode } from "../types/episode.js";

export async function findEpisodesByAnimeId(
  animeId: string
): Promise<Episode[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("anime_id", animeId)
    .order("episode_number", { ascending: true });

  if (error) throw error;
  return (data as Episode[]) ?? [];
}

export async function findEpisodeById(id: string): Promise<Episode | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Episode | null;
}

export async function upsertEpisode(
  episode: Partial<Episode> & { anime_id: string; episode_number: number }
): Promise<Episode> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("episodes")
    .upsert(episode, { onConflict: "anime_id,episode_number" })
    .select()
    .single();

  if (error) throw error;
  return data as Episode;
}
