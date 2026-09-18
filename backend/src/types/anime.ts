export interface Anime {
  id: string;
  anilist_id: number;
  mal_id?: number | null;
  title: string;
  title_english?: string | null;
  title_romaji?: string | null;
  title_native?: string | null;
  description?: string | null;
  cover_image?: string | null;
  banner_image?: string | null;
  genres?: string[] | null;
  status?: string | null;
  episodes_count?: number | null;
  season?: string | null;
  season_year?: number | null;
  average_score?: number | null;
  popularity?: number | null;
  format?: string | null;
  source?: string | null;
  studios?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnimeSearchResult {
  results: Anime[];
  page: number;
  perPage: number;
  total?: number;
  hasNextPage?: boolean;
}
