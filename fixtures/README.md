# Stream Proxy Fixtures

These fixtures were captured from the production Cloudflare Worker and are the
source of truth for backend stream proxy compatibility.

Files:

- playlist.upstream.m3u8
  Original playlist fetched directly from the upstream provider.

- playlist.rewritten.m3u8
  Playlist returned by the Cloudflare Worker after rewriting URLs.

- segment.upstream.txt
  First upstream segment URL from the original playlist.

- segment.proxy.txt
  First rewritten proxy segment URL from the worker playlist.

- proxy-playlist-url.txt
  Playlist URL that MPV successfully played through the worker.

- rate-limit.http
  Canonical HTTP 429 response used by backend tests.
