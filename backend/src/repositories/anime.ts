import { getSupabase } from "../lib/supabase.js";
import type { Anime } from "../types/anime.js";

export async function findAnimeByAnilistId(
  anilistId: number
): Promise<Anime | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (error) throw error;
  return data as Anime | null;
}

export async function findAnimeById(id: string): Promise<Anime | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Anime | null;
}

export async function upsertAnime(
  anime: Partial<Anime> & { anilist_id: number }
): Promise<Anime> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anime")
    .upsert(anime, { onConflict: "anilist_id" })
    .select()
    .single();

  if (error) throw error;
  return data as Anime;
}

export async function searchAnime(
  query: string,
  page: number,
  perPage: number
): Promise<{ results: Anime[]; total: number }> {
  const supabase = getSupabase();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("anime")
    .select("*", { count: "exact" })
    .or(
      `title.ilike.%${query}%,title_english.ilike.%${query}%,title_romaji.ilike.%${query}%`
    )
    .order("popularity", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    results: (data as Anime[]) ?? [],
    total: count ?? 0,
  };
}
