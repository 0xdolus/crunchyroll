import { describe, it, expect } from "@jest/globals";
import type { Anime } from "../src/types/anime.js";

/**
 * Unit-level verification of merge priority rules.
 * AniList wins for metadata; TMDB only fills missing artwork.
 */
function applyTmdbArtworkOnly(
  base: Anime,
  art: { poster_path?: string | null; backdrop_path?: string | null } | null
): Anime {
  if (!art) return base;
  const next = { ...base };
  if (!next.cover_image && art.poster_path) {
    next.cover_image = art.poster_path;
  }
  if (!next.banner_image && art.backdrop_path) {
    next.banner_image = art.backdrop_path;
  }
  return next;
}

describe("metadata merge rules", () => {
  it("never overwrites AniList cover with TMDB when present", () => {
    const anilist: Anime = {
      id: "1",
      anilist_id: 1,
      title: "Test",
      cover_image: "https://anilist.co/cover.jpg",
      banner_image: null,
    };
    const tmdb = {
      poster_path: "https://tmdb.org/poster.jpg",
      backdrop_path: "https://tmdb.org/backdrop.jpg",
    };
    const merged = applyTmdbArtworkOnly(anilist, tmdb);
    expect(merged.cover_image).toBe("https://anilist.co/cover.jpg");
    expect(merged.banner_image).toBe("https://tmdb.org/backdrop.jpg");
  });

  it("fills missing AniList artwork from TMDB", () => {
    const anilist: Anime = {
      id: "1",
      anilist_id: 1,
      title: "Test",
      cover_image: null,
      banner_image: null,
    };
    const tmdb = {
      poster_path: "https://tmdb.org/poster.jpg",
      backdrop_path: "https://tmdb.org/backdrop.jpg",
    };
    const merged = applyTmdbArtworkOnly(anilist, tmdb);
    expect(merged.cover_image).toBe("https://tmdb.org/poster.jpg");
    expect(merged.banner_image).toBe("https://tmdb.org/backdrop.jpg");
  });
});
