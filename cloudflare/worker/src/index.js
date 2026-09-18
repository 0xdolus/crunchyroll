export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...cors
        }
      });

    // Health
    if (path === "/" || path === "/health") {
      return json({
        status: "ok",
        service: "crunchyroll-api",
        version: "0.0.3-poc",
        provider: "Miruro",
        timestamp: new Date().toISOString()
      });
    }

    // Version
    if (path === "/version") {
      return json({
        version: "0.0.3-poc",
        worker: "Cloudflare Workers",
        provider: "Miruro"
      });
    }

    // Search
    if (path === "/search") {
      const query = url.searchParams.get("q");
      if (!query) return json({ error: "Missing q parameter" }, 400);

      const res = await fetch(
        `${env.MIRURO_BASE}/search?query=${encodeURIComponent(query)}&page=1&per_page=10`
      );

      return json(await res.json(), res.status);
    }

    // Anime details
    if (path.startsWith("/anime/")) {
      const id = path.split("/")[2];
      const res = await fetch(`${env.MIRURO_BASE}/info/${id}`);
      return json(await res.json(), res.status);
    }

    // Static episode stream test
    if (path === "/watch") {
      const res = await fetch(
        `${env.MIRURO_BASE}/watch/kiwi/21/sub/animepahe-1`
      );
      return json(await res.json(), res.status);
    }

    return json({ error: "Not Found", path }, 404);
  }
};
