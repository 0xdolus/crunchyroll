import { getEnv } from "../../config/env.js";

/**
 * Exact encodeUrl matching the Cloudflare Worker implementation.
 * Output must be byte-identical.
 */
export function encodeUrl(url: string): string {
  return Buffer.from(url, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function proxyBase(): string {
  return getEnv().STREAM_PROXY_URL.replace(/\/$/, "");
}

/**
 * Playlist, keys, subtitles, and regular HLS segments all use the query form.
 */
export function proxyPlaylist(url: string): string {
  return `${proxyBase()}/proxy?url=${encodeURIComponent(url)}`;
}

export function proxyKey(url: string): string {
  return `${proxyBase()}/proxy?url=${encodeURIComponent(url)}`;
}

export function proxySubtitle(url: string): string {
  return `${proxyBase()}/proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Regular HLS segments use query form.
 * MPEG-TS disguised as image segments (pathname ends with /seg.jpg) use path form.
 */
export function proxySegment(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith("/seg.jpg")) {
      return `${proxyBase()}/proxy/seg.ts/${encodeUrl(url)}`;
    }
  } catch {
    // fall through to query form
  }
  return `${proxyBase()}/proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Rewrite an upstream m3u8 playlist so all referenced URLs go through the Worker.
 */
export function rewritePlaylist(playlist: string, baseUrl?: string): string {
  const lines = playlist.split(/\r?\n/);
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      // Keep tags, but rewrite URI attributes if present
      if (trimmed.includes("URI=")) {
        out.push(
          trimmed.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
            const absolute = resolveUrl(uri, baseUrl);
            if (uri.includes(".key") || trimmed.includes("EXT-X-KEY")) {
              return `URI="${proxyKey(absolute)}"`;
            }
            if (uri.endsWith(".vtt") || uri.endsWith(".srt")) {
              return `URI="${proxySubtitle(absolute)}"`;
            }
            return `URI="${proxyPlaylist(absolute)}"`;
          })
        );
      } else {
        out.push(line);
      }
      continue;
    }

    // Media segment line
    const absolute = resolveUrl(trimmed, baseUrl);
    out.push(proxySegment(absolute));
  }

  return out.join("\n");
}

function resolveUrl(ref: string, base?: string): string {
  try {
    return new URL(ref, base).href;
  } catch {
    return ref;
  }
}
