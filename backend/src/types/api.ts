export interface HealthResponse {
  status: "ok";
  timestamp: string;
  version: string;
}

export interface HistoryEntry {
  episode_id: string;
  anime_id: string;
  progress: number;
  watched_at: string;
}

export interface FavoriteEntry {
  anime_id: string;
  added_at: string;
}
