# Crunchyroll Backend v2

Fastify 4 + TypeScript (strict) + Supabase backend for the Crunchyroll Android client.

## Stack

- Node.js 22
- TypeScript (strict)
- Fastify 4.x
- `@supabase/supabase-js` v2
- `@fastify/rate-limit` (legacy `x-ratelimit-*` headers)
- Axios, GraphQL Request, Zod, Pino, LRU Cache

## Quick start

```bash
cd backend
cp .env.example .env
# fill required values
npm install
npm run build
npm start
```

Development:

```bash
npm run dev
```

## Environment

All variables are validated with Zod at startup. Missing required values cause an immediate process exit.

See `.env.example` for the full list.

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness |
| GET | `/search?q=&page=&perPage=` | — | Search anime |
| GET | `/anime/:id` | — | Anime detail |
| GET | `/anime/:id/episodes` | — | Episode list |
| GET | `/watch/:episodeId` | — | Stream playlist (Worker-proxied) |
| GET | `/me/history` | JWT | Watch history |
| PUT | `/me/history/:episodeId` | JWT | Upsert progress |
| GET | `/me/favorites` | JWT | Favorites |
| POST | `/me/favorites/:animeId` | JWT | Add favorite |
| DELETE | `/me/favorites/:animeId` | JWT | Remove favorite |
| POST | `/sync/trending` | SYNC_SECRET | Sync trending |
| POST | `/sync/seasonal` | SYNC_SECRET | Sync seasonal |
| POST | `/sync/metadata` | SYNC_SECRET | Refresh metadata |

Full contracts: [API_REFERENCE.md](./API_REFERENCE.md)

## Stream proxy compatibility

Playlist and segment URLs are rewritten to the existing Cloudflare Stream Worker using the exact `encodeUrl` implementation shared with the worker. MPEG-TS segments disguised as `/seg.jpg` use the path form `/proxy/seg.ts/{encoded}`.

## Tests

```bash
npm test
```

`stream-proxy.test.ts` verifies `encodeUrl` and fixture transformations when the repository fixtures are present (they are not packaged in this ZIP).

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) and the GitHub Actions workflows under `.github/workflows/`.
