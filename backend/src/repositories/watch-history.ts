import { getSupabase } from "../lib/supabase.js";
import type { HistoryEntry } from "../types/api.js";

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("watch_history")
    .select("episode_id, anime_id, progress, watched_at")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false });

  if (error) throw error;
  return (data as HistoryEntry[]) ?? [];
}

export async function upsertHistory(
  userId: string,
  episodeId: string,
  animeId: string,
  progress: number
): Promise<HistoryEntry> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("watch_history")
    .upsert(
      {
        user_id: userId,
        episode_id: episodeId,
        anime_id: animeId,
        progress,
        watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,episode_id" }
    )
    .select("episode_id, anime_id, progress, watched_at")
    .single();

  if (error) throw error;
  return data as HistoryEntry;
}
