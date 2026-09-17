# Architecture

## High-level

```
Client (Android / web)
    │
    ▼
Fastify API  ──► Supabase (Postgres + Auth)
    │
    ├── Metadata: AniList (primary) → TMDB (artwork only) → Jikan (fallback)
    ├── Streams:  Consumet primary → Consumet fallback
    └── Proxy:    Cloudflare Stream Worker (existing, immutable)
```

## Layers

1. **Routes** – HTTP surface, validation, rate-limit config, auth hooks.
2. **Services** – Business logic (metadata merge, stream resolution, sync jobs).
3. **Repositories** – Supabase access only. No raw SQL in routes.
4. **Lib / Config** – Logger, LRU caches, env validation, Supabase client.

## Stream flow (`GET /watch/:episodeId`)

1. Lookup `streams` by `episode_id`.
2. If row exists and `expires_at > now` → return `proxy_playlist_url`.
3. Else call Consumet (primary endpoint, then fallback).
4. Build Worker URL with `proxyPlaylist` / `proxySegment` / `encodeUrl`.
5. Insert or update the stream row.
6. Return the fresh proxy URL.

Never return a stale playlist. Never expose upstream provider error messages.

## Proxy URL rules (Worker-compatible)

- Playlist / key / subtitle / normal segment:

  `${STREAM_PROXY_URL}/proxy?url=${encodeURIComponent(url)}`

- MPEG-TS disguised as image (`pathname.endsWith("/seg.jpg")`):

  `${STREAM_PROXY_URL}/proxy/seg.ts/${encodeUrl(url)}`

`encodeUrl` is the exact base64url implementation used by the Worker.

## Auth

- User routes: Supabase JWT via `supabase.auth.getUser(token)`.
- Sync routes: static `Bearer ${SYNC_SECRET}`.
- Service-role key never leaves the server.

## Caching

LRU caches keyed by query / id. TTLs come exclusively from environment variables:

- `CACHE_TTL_SEARCH`
- `CACHE_TTL_ANIME`
- `CACHE_TTL_EPISODES`
- `CACHE_TTL_TRENDING`

## Rate limiting

`@fastify/rate-limit` with `enableDraftSpec: false` so responses use legacy `x-ratelimit-*` headers.

| Route group | max | window |
|-------------|-----|--------|
| `/search`   | 60  | 60 s   |
| `/anime/*`  | 120 | 60 s   |
| `/watch/*`  | 30  | 60 s   |
| `/me/*`     | 120 | 60 s   |
| `/sync/*`   | 10  | 3600 s |

## Sync jobs

Idempotent upserts:

- Anime by `anilist_id`
- Episodes by `(anime_id, episode_number)`
- Streams never duplicated for the same episode while still valid

Partial failures are logged; valid data is never deleted.
