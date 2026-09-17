# Deployment

## Prerequisites

- Node.js 22
- Supabase project (existing schema – do not recreate)
- Cloudflare Stream Worker already deployed (this backend only generates compatible URLs)
- Secrets stored in the host / GitHub Actions

## Required secrets / env

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
| `TMDB_ACCESS_TOKEN` | TMDB v4 token |
| `CONSUMET_ENDPOINT` | Primary stream provider |
| `CONSUMET_FALLBACK_ENDPOINT` | Fallback (defaults to public Consumet) |
| `STREAM_PROXY_URL` | Base URL of the Cloudflare Worker |
| `SYNC_SECRET` | Bearer token for `/sync/*` |
| `ALLOWED_ORIGINS` | Comma-separated exact origins |

## Local

```bash
cp .env.example .env
# edit values
npm ci
npm run build
npm start
```

## GitHub Actions

### `deploy-backend.yml`

- Triggers on pushes / PRs that touch `backend/**`
- Node 22
- `npm ci` → `npm run build` → `npm test`
- Uses placeholder env vars for the test step so TypeScript and unit tests pass without real credentials

### `sync-cron.yml`

- Runs every 6 hours (`0 */6 * * *`) and on `workflow_dispatch`
- Calls:
  - `POST /sync/trending`
  - `POST /sync/seasonal`
  - `POST /sync/metadata`
- Authorization: `Bearer ${{ secrets.SYNC_SECRET }}`
- Requires repository secrets: `SYNC_SECRET`, `BACKEND_URL`

## Production notes

- Set `NODE_ENV=production` so CORS uses exact origin matching.
- The Worker must already be live; this package never deploys or modifies it.
- Do not commit `.env` or real credentials.
- Migrations (if any future ones are needed) go only under `backend/supabase/migrations/` as incremental SQL.
