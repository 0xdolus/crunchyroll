import type { Env } from "../env";

export async function anilistRequest(
  env: Env,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await fetch(env.ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList HTTP ${response.status}`);
  }

  const payload = await response.json() as {
    data?: unknown;
    errors?: unknown;
  };

  if (payload.errors) {
    throw new Error("AniList GraphQL error");
  }

  return payload.data;
}

export async function searchAnime(
  env: Env,
  search: string
): Promise<unknown> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(
          search: $search
          type: ANIME
          sort: SEARCH_MATCH
        ) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          description(asHtml: false)
          episodes
          status
          season
          seasonYear
          format
        }
      }
    }
  `;

  return anilistRequest(env, query, { search });
}
