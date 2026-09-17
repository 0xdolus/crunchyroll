const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

function encodeUrl(url: string) {
  return btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeUrl(value: string) {
  value = value.replace(/-/g, "+").replace(/_/g, "/");
  while (value.length % 4) value += "=";
  return atob(value);
}

async function upstreamFetch(target: string) {
  return fetch(target, {
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      "Accept-Encoding": "identity",
      Referer: "https://strm.cx/",
      Origin: "https://strm.cx",
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "crunchyroll-stream-proxy",
      });
    }

    let target: string | null = null;

    if (url.pathname === "/proxy") {
      target = url.searchParams.get("url");
    }

    if (url.pathname.startsWith("/proxy/seg.ts/")) {
      target = decodeUrl(url.pathname.slice("/proxy/seg.ts/".length));
    }

    if (!target) {
      return new Response("Missing url parameter.", { status: 400 });
    }

    const upstream = await upstreamFetch(target);

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("mpegurl") || target.endsWith(".m3u8")) {
      let playlist = await upstream.text();

      playlist = playlist.replace(/URI="([^"]+)"/g, (_, uri) => {
        return `URI="${url.origin}/proxy?url=${encodeURIComponent(uri)}"`;
      });

      playlist = playlist.replace(/^https?:\/\/.*$/gm, (line) => {
        if (line.includes("/seg.jpg")) {
          return `${url.origin}/proxy/seg.ts/${encodeUrl(line)}`;
        }

        return `${url.origin}/proxy?url=${encodeURIComponent(line)}`;
      });

      return new Response(playlist, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let type = contentType;

    if (target.includes("/seg.jpg")) {
      type = "video/mp2t";
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": type || "application/octet-stream",
        "Cache-Control": "public,max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
