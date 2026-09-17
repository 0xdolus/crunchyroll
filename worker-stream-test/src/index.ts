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
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "identity",
          "Referer": "https://strm.cx/",
          "Origin": "https://strm.cx",
          "Sec-Fetch-Site": "cross-site",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
        },
      });

      if (!upstream.ok) {
        const body = await upstream.text();

        return Response.json({
          worker: "stream-test",
          upstream_status: upstream.status,
          upstream_content_type: upstream.headers.get("content-type"),
          upstream_server: upstream.headers.get("server"),
          upstream_location: upstream.headers.get("location"),
          upstream_body_preview: body.slice(0, 1000),
        }, {
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
