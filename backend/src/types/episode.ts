export interface Episode {
  id: string;
  anime_id: string;
  episode_number: number;
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  air_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
