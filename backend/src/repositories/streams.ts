import { getSupabase } from "../lib/supabase.js";
import type { Stream } from "../types/stream.js";

export async function findStreamByEpisodeId(
  episodeId: string
): Promise<Stream | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("streams")
    .select("*")
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Stream | null;
}

export async function insertStream(
  stream: Omit<Stream, "id" | "created_at" | "updated_at">
): Promise<Stream> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("streams")
    .insert(stream)
    .select()
    .single();

  if (error) throw error;
  return data as Stream;
}

export async function updateStream(
  id: string,
  updates: Partial<Stream>
): Promise<Stream> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("streams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Stream;
}

export function isStreamExpired(stream: Stream): boolean {
  return new Date(stream.expires_at).getTime() <= Date.now();
}
