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

    // Search is handled by the Railway backend because AniList
    // blocks requests originating from Cloudflare Worker IPs.
    if (path === "/search") {
      return json({
        error: "NotImplemented",
        message: "Search is handled by the Railway backend.",
      }, 501);
    }

    // Minimal Miruro connectivity test.
    if (request.method === "GET" && path.startsWith("/episodes/")) {
      const anilistId = path.split("/")[2];

      if (!anilistId || !/^\d+$/.test(anilistId)) {
        return json({
          error: "InvalidAnilistId",
          message: "anilistId must be a numeric AniList ID.",
        }, 400);
      }

      const payload = {
        path: "episodes",
        method: "GET",
        query: {
          anilistId: Number(anilistId),
        },
        body: null,
        version: "0.1.0",
      };

      const bytes = new TextEncoder().encode(JSON.stringify(payload));

      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }

      const encoded = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

      const miruroBase = env.MIRURO_BASE || "https://www.miruro.tv/api";
      const pipeUrl = `${miruroBase}/secure/pipe?e=${encoded}`;

      let upstream;
      try {
        upstream = await fetch(pipeUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Origin": "https://www.miruro.tv",
            "Referer": "https://www.miruro.tv/",
          },
        });
      } catch (err) {
        return json({
          error: "MiruroUnavailable",
          status: 0,
          message: err instanceof Error ? err.message : String(err),
        }, 502);
      }

      if (!upstream.ok) {
        const body = await upstream.text();

        return json({
          error: "MiruroUnavailable",
          status: upstream.status,
          body: body.slice(0, 500),
        }, 502);
      }

      try {
        const obfuscated = upstream.headers.get("x-obfuscated");

        if (obfuscated !== "2") {
          return json(await upstream.json());
        }

        const encodedBody = (await upstream.text()).trim();

        const normalized = encodedBody
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const padded =
          normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

        const decodedBinary = atob(padded);
        const decoded = new Uint8Array(decodedBinary.length);

        for (let i = 0; i < decodedBinary.length; i++) {
          decoded[i] = decodedBinary.charCodeAt(i);
        }

        const keyHex =
          "71951034f8fbcf53d89db52ceb3dc22c";

        const key = new Uint8Array(keyHex.length / 2);

        for (let i = 0; i < key.length; i++) {
          key[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16);
        }

        for (let i = 0; i < decoded.length; i++) {
          decoded[i] ^= key[i % key.length];
        }

        const decompressed = new Response(
          new Blob([decoded]).stream().pipeThrough(
            new DecompressionStream("gzip")
          )
        );

        const text = await decompressed.text();

        return json(JSON.parse(text));
      } catch (err) {
        return json({
          error: "MiruroDecodeError",
          message: err instanceof Error ? err.message : String(err),
        }, 502);
      }
    }

    return json({ error: "Not Found", path }, 404);
  },
};
