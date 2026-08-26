# NEURALWIRE — AI Intelligence Desk

Next.js 16 (App Router) monolith with Supabase backend (Postgres + Auth + RLS). Aggregates AI news (15 wires), model announcements, benchmark leaderboard, GitHub trending, HuggingFace hub, WorldMonitor radar, and per-account watchlists/collections/notes.

## Commands

```bash
npm run dev        # local dev (DEMO_MODE without Supabase keys)
npm run build      # production build
npm start          # production server
npm run lint       # eslint
npm test           # vitest unit tests (src/**/*.test.ts)
```

## Architecture

**Stack**: Next.js 16 + React 19 + TypeScript + Supabase (SSR via @supabase/ssr) + fast-xml-parser

**Entry points**: `src/app/page.tsx` (home), `src/app/layout.tsx` (shell + auth), `src/middleware.ts` (route guards)

**Data flow**:
1. **Ingest** (`/api/cron/ingest` GET, `CRON_SECRET` header; `/api/feeds/[id]` per-wire) → `src/lib/feeds/*` fetch → `normBatch` normalize → upsert via service-role client (`src/lib/supabase/admin.ts` — **server-only, bypasses RLS**)
2. **Reads**: Server Components / route handlers use anon client bound to cookies (`src/lib/supabase/server.ts`). `getNewsData()` (`src/lib/data.ts`) — demo-fetch or DB query
3. **Writes**: `/api/*` route handlers use `tryClient()` (demo-safe, returns `null` in demo mode)
4. **Realtime** custom wires: Phase-2 (schema ready in `custom_wires`, `user_prefs`)

**Key modules**:
- `src/lib/extract/` — pure taggers: `models.ts`, `topics.ts`, `entities.ts`, `benchmarks.ts`, `index.ts` (`extractStoryMeta`, `isModel`)
- `src/lib/feeds/parse.ts` — RSS/Atom → `RawFeedItem` (fast-xml-parser); `feeds/index.ts` — per-kind fetchers (rss/atom, HN Algolia, dev.to, lobste.rs)
- `src/lib/normalize.ts` — `normItem`/`normBatch` (strip HTML, parse date, run detectors, set `benchmarks`)
- `src/lib/ingest.ts` — **pure** `buildIngestPayload(Map<sourceId, RawFeedItem[]>)` → DB-ready `{stories, entities, storyEntities, benchRows}`
- `src/lib/sources.ts` — `SOURCES` (15 wires) + `srcById`
- `src/lib/types.ts` — shared types (`Story`, `RawFeedItem`, `BenchRef`, `EntityRef`…)
- `src/components/` — client views: `news-explorer`, `model-watch`, `github-view`, `hf-view`, `radar-view`, `watchlist-view`, `leaderboard-view`, `saved-view` + presentational cards
- `src/app/` — pages + API routes

**Supabase schema** (`supabase/migrations/`):
- `0001_init.sql` — `profiles`, `sources`, `custom_wires`, `stories` (PK `source_id::link`; GIN on `models`/`topics`), `entities`, `story_entities`, `benchmarks`, `benchmark_scores`, `watchlist`, `collections`, `collection_items`, `story_notes`, `story_tags`, `read_state`, `user_prefs`
- `0002_seed.sql` — seeds 15 sources
- `0003_fix_microsoft_and_expand_sources.sql` — updates
- **RLS**: stories/sources public-read; per-user tables owner-only; service-role bypasses RLS for writes

**Vercel**: `vercel.json` schedules hourly `/api/cron/ingest` (maxDuration=60). Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

## Conventions

- **Server Components for reads; route handlers/Server Actions for writes**. Never import service-role client (`src/lib/supabase/admin.ts`) in client components.
- Browser client (`src/lib/supabase/client.ts`) uses anon key only.
- React escapes by default — no `esc()` needed.
- Keep `extract/*`, `normalize`, `ingest` **pure and unit-tested** — add tests in matching `*.test.ts` when adding detectors.
- Route handlers use `tryClient()` (demo-safe) not `createClient()` unless route requires Supabase.
- `DEMO_MODE`: active until `.env.local` has Supabase keys; live-fetches feeds with 3-min in-memory cache.