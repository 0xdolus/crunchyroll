import { getSupabase } from "../lib/supabase.js";
import type { FavoriteEntry } from "../types/api.js";

export async function getFavorites(userId: string): Promise<FavoriteEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .select("anime_id, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return (data as FavoriteEntry[]) ?? [];
}

export async function addFavorite(
  userId: string,
  animeId: string
): Promise<FavoriteEntry> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .upsert(
      {
        user_id: userId,
        anime_id: animeId,
        added_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anime_id" }
    )
    .select("anime_id, added_at")
    .single();

  if (error) throw error;
  return data as FavoriteEntry;
}

export async function removeFavorite(
  userId: string,
  animeId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);

  if (error) throw error;
}
