export interface Stream {
  id: string;
  episode_id: string;
  provider: string;
  quality?: string | null;
  playlist_url: string;
  proxy_playlist_url: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface WatchResponse {
  episodeId: string;
  playlistUrl: string;
  expiresAt: string;
  sources?: Array<{
    quality: string;
    url: string;
  }>;
  subtitles?: Array<{
    language: string;
    url: string;
  }>;
}
