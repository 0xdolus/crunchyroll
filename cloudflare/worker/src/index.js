export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...cors,
        },
      });

    if (path === "/" || path === "/health") {
      return json({
        status: "ok",
        service: "crunchyroll-api",
        version: "0.1.0",
        provider: "AniList + Miruro",
      });
    }

    // AniList GraphQL search
    if (path === "/search") {
      const search = url.searchParams.get("q");
      const page = Number(url.searchParams.get("page") || 1);
      const perPage = Number(url.searchParams.get("perPage") || 20);

      if (!search) return json({ error: "Missing q parameter" }, 400);

      const query = `
        query ($search: String!, $page: Int!, $perPage: Int!) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { currentPage hasNextPage perPage }
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
              id
              idMal
              title { romaji english native }
              coverImage { large extraLarge }
              bannerImage
              episodes
              format
              season
              seasonYear
              status
              averageScore
              genres
              isAdult
            }
          }
        }
      `;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { search, page, perPage },
        }),
      });

      return json(await res.json(), res.status);
    }

    return json({ error: "Not Found", path }, 404);
  },
};
