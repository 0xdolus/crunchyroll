const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

function b64url(s: string) {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", worker: "stream-test" });
    }

    let target: string | null = null;

    if (url.pathname === "/proxy") {
      target = url.searchParams.get("url");
    } else if (url.pathname.startsWith("/proxy/seg.ts/")) {
      target = unb64url(url.pathname.slice("/proxy/seg.ts/".length));
    }

    if (!target) return new Response("Missing url", { status: 400 });

    const upstream = await fetch(target, {
      headers: {
        "User-Agent": UA,
        Accept: "*/*",
        "Accept-Encoding": "identity",
        Referer: "https://strm.cx/",
        Origin: "https://strm.cx",
      },
    });

    const type = upstream.headers.get("content-type") || "";

    if (type.includes("mpegurl") || target.endsWith(".m3u8")) {
      let playlist = await upstream.text();

      playlist = playlist.replace(/^https?:\/\/.*$/gm, (line) => {
        if (line.includes("/seg.jpg")) {
          return `${url.origin}/proxy/seg.ts/${b64url(line)}`;
        }
        return `${url.origin}/proxy?url=${encodeURIComponent(line)}`;
      });

      playlist = playlist.replace(/URI="([^"]+)"/g, (_, uri) => {
        return `URI="${url.origin}/proxy?url=${encodeURIComponent(uri)}"`;
      });

      return new Response(playlist, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
        },
      });
    }

    let outType = type;
    if (target.includes("/seg.jpg")) outType = "video/mp2t";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": outType,
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
