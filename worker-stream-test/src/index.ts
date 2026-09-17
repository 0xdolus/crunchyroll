const REFERER = "https://kwik.cx/";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health endpoint
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        worker: "stream-test",
      });
    }

    // Proxy endpoint
    if (url.pathname === "/proxy") {
      const target = url.searchParams.get("url");

      if (!target) {
        return new Response("Missing url parameter", { status: 400 });
      }

      const upstream = await fetch(target, {
        headers: {
          Referer: REFERER,
          Origin: "https://kwik.cx",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
        },
      });

      if (!upstream.ok) {
        return new Response(`Upstream error: ${upstream.status}`, {
          status: upstream.status,
        });
      }

      const contentType = upstream.headers.get("content-type") || "";

      // Rewrite playlists so keys and segments also go through the worker.
      if (
        contentType.includes("mpegurl") ||
        target.endsWith(".m3u8")
      ) {
        let playlist = await upstream.text();

        playlist = playlist.replace(
          /(URI=")([^"]+)(")/g,
          (_, a, b, c) =>
            `${a}${url.origin}/proxy?url=${encodeURIComponent(b)}${c}`
        );

        playlist = playlist.replace(
          /^https?:\/\/.*$/gm,
          (line) => `${url.origin}/proxy?url=${encodeURIComponent(line)}`
        );

        return new Response(playlist, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store",
          },
        });
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ||
            "application/octet-stream",
          "Cache-Control": "public, max-age=60",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response("Crunchyroll Stream Test Worker");
  },
};
