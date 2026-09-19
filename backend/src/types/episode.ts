export interface Episode {
  id: string;
  anime_id: string;
  episode_number: number;

  title?: string | null;
  description?: string | null;

  // Matches Supabase schema
  thumbnail_url?: string | null;
  duration?: number | null;
  air_date?: string | null;

  // Provider mapping
  provider?: string | null;
  provider_episode_id?: string | null;

  metadata?: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;
}
