# Consumet → Miruro Migration — Change Specification

For verification by another agent. Backend only. Minimal change set.

## Zip contents

Primary modified implementation files (must review):
- src/services/providers/miruroEpisodes.ts
- src/services/providers/miruro.ts
- src/routes/anime.ts
- src/routes/watch.ts
- tests/miruro.test.ts
- tests/setup-env.ts

Unchanged context files included for compilation/review:
- src/services/providers/stream.ts (proxy helpers — used, not redesigned)
- src/middleware/errors.ts (providerUnavailable helper)
- src/types/episode.ts, src/types/stream.ts
- src/repositories/episodes.ts, src/repositories/streams.ts
- src/config/env.ts (already had MIRURO_ENDPOINT)
- package.json, tsconfig.json
- existing tests (health, metadata-merge, search, stream-proxy)

## Required flow (must hold)

AniList ID
→ Miruro GET /episodes/:anilistId
→ results.providers.<provider>.episodes.sub|dub
→ each episode has watch id e.g. watch/kiwi/20/sub/anikoto-1
→ upsert into Supabase episodes (existing schema)
→ GET /anime/:id/episodes returns Episode[] with Supabase UUID as id
→ GET /watch/:supabaseEpisodeUuid
→ load episode.provider_episode_id
→ Miruro GET /watch/:provider/:anilistId/:category/:slug (via watch id path)
→ select HLS/m3u8 only
→ proxyPlaylist() through existing Cloudflare STREAM_PROXY_URL
→ cache in streams table with existing expiry semantics
→ return existing WatchResponse shape

## File-by-file changes

### 1. src/services/providers/miruroEpisodes.ts (REWRITE)

Before (broken):
- Returned a local Episode type unrelated to Supabase
- Did not upsert
- Called getEnv() at module top level

After:
- parseMiruroEpisodesResponse(data): pure parse of Miruro JSON
  - Reads results.providers.<name>.episodes.sub and .dub
  - Preserves watch id in watchId field
  - Deterministic provider order: kiwi, arc, zoro, hop, pewe, bonk, ally, moo, bee, nun, then remaining sorted
- selectCanonicalEpisodes(parsed): one row per episode_number
  - Prefer sub over dub
  - Prefer earlier PROVIDER_ORDER rank
- fetchAndPersistEpisodes(animeId, anilistId):
  - GET ${MIRURO_ENDPOINT}/episodes/${anilistId}
  - On HTTP/network failure → AppError 503 ProviderUnavailable (not empty list)
  - On malformed JSON → 502
  - Upserts via existing upsertEpisode with:
    - anime_id = Supabase anime UUID
    - episode_number
    - title, description, thumbnail_url, air_date, duration when present
    - provider = "miruro"
    - provider_episode_id = Miruro watch id
    - metadata = { miruro_provider, audio, filler, fillerType }
  - Respects onConflict anime_id,episode_number (no duplicates)
- fetchEpisodes(anilistId) kept as thin pure-fetch helper for tests

### 2. src/services/providers/miruro.ts (REWRITE)

Before (broken):
- Used Supabase episode UUID as Miruro path
- Returned raw upstream URL as playlist (did not use Cloudflare proxy)
- No fallback, weak error typing

After:
- miruroWatchPath(watchId): normalizes to watch/provider/anilistId/category/slug
- resolveMiruroWatchId(watchId):
  - GET ${MIRURO_ENDPOINT}/${path}
  - Accepts streams under results.streams or top-level streams
  - pickHlsStream: requires .m3u8 or type===hls; never returns non-HLS / fake URL
  - proxyPlaylistUrl = proxyPlaylist(hls.url) from stream.ts
  - expiresAt = now + 30 minutes
  - Maps subtitles { file, label } → { language, url }
  - Errors: 404 NotFound, 503 ProviderUnavailable, 502 BadGateway
- resolveMiruroWithFallback(primary, fallbacks[]): tries candidates; 503 if all fail
- resolveProxyPlaylist alias kept for compatibility

### 3. src/routes/anime.ts (UPDATE)

Before (broken):
- fetchEpisodes(Number(id)) — breaks for UUID route params
- Did not persist to Supabase
- Returned Miruro-shaped objects, not backend Episode

After:
- resolveAnime unchanged (UUID or AniList id)
- /anime/:id/episodes:
  - Requires anime.anilist_id
  - Prefer findEpisodesByAnimeId(anime.id) if rows exist
  - Else fetchAndPersistEpisodes(anime.id, anilistId)
  - Upstream failures rethrown as AppError 503 (not silent empty list)
  - Response: { animeId: anime.id (UUID), episodes: Episode[] }
  - Cache key episodes:${id} unchanged

### 4. src/routes/watch.ts (UPDATE)

Before (broken):
- resolveProxyPlaylist(episodeId) with Supabase UUID
- Stored non-proxied / wrong URLs

After:
- episodeId param remains Supabase UUID only (never Miruro watch id)
- Load episode via findEpisodeById
- Cache hit if stream exists and !isStreamExpired → return proxy_playlist_url
- Else require episode.provider_episode_id; call resolveMiruroWithFallback
- Persist via updateStream / insertStream:
  - playlist_url = upstream HLS
  - proxy_playlist_url = Cloudflare-proxied URL
  - provider = "miruro"
  - expires_at from resolved
- Response WatchResponse: episodeId, playlistUrl (proxied), expiresAt, sources, subtitles
- Missing provider_episode_id or resolve failure → ProviderUnavailable 503

### 5. tests/setup-env.ts (CLEANUP)

- Removed CONSUMET_ENDPOINT and CONSUMET_FALLBACK_ENDPOINT
- Added MIRURO_ENDPOINT default https://miruro.test/api

### 6. tests/miruro.test.ts (NEW)

Covers:
1. Miruro episode response parsing (sub/dub, multi-provider)
2. Provider watch-ID preservation
3. Deterministic provider ordering
4. selectCanonicalEpisodes prefer sub + provider rank
5. Supabase upsert field mapping shape
6. miruroWatchPath normalization
7. resolveMiruroWatchId HLS selection + proxy URL
8. ProviderUnavailable when no HLS
9. ProviderUnavailable on upstream 5xx
10. resolveMiruroWithFallback tries next id
11. ProviderUnavailable when all fail

Does not modify existing fixture files.

## Explicit non-changes (must remain)

- Supabase schema (episodes, streams tables)
- Auth middleware, /me/*, /sync/*
- Metadata routes / AniList / Jikan / TMDB
- Cloudflare Worker code and encodeUrl / proxySegment / rewritePlaylist
- Stream cache schema and isStreamExpired semantics
- Public API response contracts (Episode, WatchResponse)
- Frontend

## Env

MIRURO_ENDPOINT (default was https://mirurotvapi.vercel.app/api in env.ts)
STREAM_PROXY_URL required (existing)

## How to verify

```bash
npm install
npm run build   # tsc must pass
npm test        # miruro.test.ts + existing tests
```

Conceptual check:
1. Mock Miruro /episodes/20 → upsert rows with provider_episode_id like watch/kiwi/20/sub/...
2. GET /anime/<uuid>/episodes → ids are UUIDs, provider_episode_id set
3. GET /watch/<episode-uuid> → playlistUrl contains STREAM_PROXY_URL /proxy?url=
4. Force all Miruro watch calls to fail → 503 ProviderUnavailable, not 200 with empty/fake URL

## Known migration note

If DB already has Consumet-era provider_episode_id values, those episodes will 503 on watch until rows are refreshed (delete episodes for that anime so /anime/:id/episodes re-fetches from Miruro).
