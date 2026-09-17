# API Reference

Base URL: `http://localhost:3000` (or your deployed host)

All error responses follow:

```json
{
  "statusCode": 400,
  "error": "ErrorName",
  "message": "Human readable message"
}
```

Unauthorized:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token."
}
```

Rate limited (429):

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after <N> seconds."
}
```

Headers on rate-limited routes: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after`.

---

## GET /health

**Auth:** none  
**Limit:** none

```json
{
  "status": "ok",
  "timestamp": "2026-09-17T12:00:00.000Z",
  "version": "2.0.0"
}
```

---

## GET /search

**Query:** `q` (required), `page` (default 1), `perPage` (default 20, max 50)  
**Limit:** 60 / 60 s

```json
{
  "results": [ /* Anime objects */ ],
  "page": 1,
  "perPage": 20,
  "total": 120,
  "hasNextPage": true
}
```

---

## GET /anime/:id

**Limit:** 120 / 60 s

Returns a full Anime object. `:id` may be the internal UUID or an AniList numeric id (auto-fetches & upserts on miss).

---

## GET /anime/:id/episodes

**Limit:** 120 / 60 s

```json
{
  "animeId": "uuid",
  "episodes": [ /* Episode objects */ ]
}
```

---

## GET /watch/:episodeId

**Limit:** 30 / 60 s

Looks up a cached stream. If missing or expired (`streams.expires_at`), refreshes via Consumet (primary → fallback). Returns a Worker-compatible proxy playlist URL. Never returns a stale playlist.

On provider failure:

```json
{
  "statusCode": 503,
  "error": "ProviderUnavailable",
  "message": "All stream providers are currently unavailable. Please try again later."
}
```

Success:

```json
{
  "episodeId": "uuid",
  "playlistUrl": "https://stream-proxy.../proxy?url=...",
  "expiresAt": "2026-09-17T16:00:00.000Z",
  "sources": [
    { "quality": "1080p", "url": "https://..." }
  ]
}
```

---

## Authenticated routes (Supabase JWT)

Header: `Authorization: Bearer <access_token>`

### GET /me/history

```json
{ "history": [ { "episode_id", "anime_id", "progress", "watched_at" } ] }
```

### PUT /me/history/:episodeId

Body: `{ "progress": 0-100 }`

### GET /me/favorites

```json
{ "favorites": [ { "anime_id", "added_at" } ] }
```

### POST /me/favorites/:animeId

Returns the created entry (201).

### DELETE /me/favorites/:animeId

204 No Content.

---

## Internal sync (Bearer SYNC_SECRET)

### POST /sync/trending

Upserts popular AniList titles by `anilist_id`.

### POST /sync/seasonal

Upserts current season titles.

### POST /sync/metadata

Refreshes missing artwork for existing rows (AniList → TMDB artwork only → Jikan fallback).

All return `{ "ok": true, ... }`.
