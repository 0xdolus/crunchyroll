import axios from "axios";
import { getEnv } from "../../config/env.js";

export interface TmdbArtwork {
  poster_path?: string | null;
  backdrop_path?: string | null;
}

export async function fetchTmdbArtwork(
  title: string,
  year?: number | null
): Promise<TmdbArtwork | null> {
  const token = getEnv().TMDB_ACCESS_TOKEN;
  try {
    const params: Record<string, string | number> = {
      query: title,
      include_adult: "false",
    };
    if (year) params.year = year;

    const { data } = await axios.get(
      "https://api.themoviedb.org/3/search/tv",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
        params,
        timeout: 8000,
      }
    );

    const result = data.results?.[0];
    if (!result) return null;

    return {
      poster_path: result.poster_path
        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
        : null,
      backdrop_path: result.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${result.backdrop_path}`
        : null,
    };
  } catch {
    return null;
  }
}
