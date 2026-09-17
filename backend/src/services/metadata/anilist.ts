import { GraphQLClient, gql } from "graphql-request";
import { getEnv } from "../../config/env.js";
import type { Anime } from "../../types/anime.js";

const SEARCH_QUERY = gql`
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        coverImage {
          large
          extraLarge
        }
        bannerImage
        genres
        status
        episodes
        season
        seasonYear
        averageScore
        popularity
        format
        source
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const MEDIA_QUERY = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
        extraLarge
      }
      bannerImage
      genres
      status
      episodes
      season
      seasonYear
      averageScore
      popularity
      format
      source
      studios {
        nodes {
          name
        }
      }
    }
  }
`;

function mapMedia(media: any): Anime {
  return {
    id: "", // filled later by DB
    anilist_id: media.id,
    mal_id: media.idMal ?? null,
    title: media.title?.english || media.title?.romaji || media.title?.native || "Unknown",
    title_english: media.title?.english ?? null,
    title_romaji: media.title?.romaji ?? null,
    title_native: media.title?.native ?? null,
    description: media.description ?? null,
    cover_image: media.coverImage?.extraLarge || media.coverImage?.large || null,
    banner_image: media.bannerImage ?? null,
    genres: media.genres ?? [],
    status: media.status ?? null,
    episodes_count: media.episodes ?? null,
    season: media.season ?? null,
    season_year: media.seasonYear ?? null,
    average_score: media.averageScore ?? null,
    popularity: media.popularity ?? null,
    format: media.format ?? null,
    source: media.source ?? null,
    studios: media.studios?.nodes?.map((n: any) => n.name) ?? [],
  };
}

export async function searchAnilist(
  query: string,
  page = 1,
  perPage = 20
): Promise<{ results: Anime[]; total: number; hasNextPage: boolean }> {
  const client = new GraphQLClient(getEnv().ANILIST_ENDPOINT);
  const data: any = await client.request(SEARCH_QUERY, {
    search: query,
    page,
    perPage,
  });

  const pageInfo = data.Page.pageInfo;
  const results = (data.Page.media ?? []).map(mapMedia);
  return {
    results,
    total: pageInfo.total ?? results.length,
    hasNextPage: pageInfo.hasNextPage ?? false,
  };
}

export async function getAnilistMedia(id: number): Promise<Anime | null> {
  const client = new GraphQLClient(getEnv().ANILIST_ENDPOINT);
  try {
    const data: any = await client.request(MEDIA_QUERY, { id });
    if (!data.Media) return null;
    return mapMedia(data.Media);
  } catch {
    return null;
  }
}
