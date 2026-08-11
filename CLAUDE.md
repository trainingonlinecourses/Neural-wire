# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NEURALWIRE is a real-time "AI intelligence desk" — a **Next.js (App Router) monolith with a Supabase backend** (Postgres + Auth + RLS). It aggregates AI news (15 wires), model announcements, a benchmark leaderboard, GitHub trending, HuggingFace hub, a WorldMonitor radar, and per-account watchlists/collections/notes.

`index.html` is the **legacy single-file static app** this was ported from. It is kept for reference only — do not build features in it.

## Commands

```bash
npm run dev        # local dev (no Supabase → DEMO_MODE renders live feeds, no DB)
npm run build      # production build
npm test           # vitest unit tests (src/**/*.test.ts)
npm run lint       # eslint
```

- **DEMO_MODE**: until `.env.local` has Supabase keys, server pages call `getNewsData()` → live-fetch feeds directly (3-min in-memory cache) so the whole UI is testable without a DB. Personalized routes (`/watchlist`, `/saved`) render demo-empty states; API routes return `{ demo: true }`.
- **To go full-stack**: copy `.env.example` → `.env.local`, create a Supabase project, run `supabase/migrations/0001_init.sql` + `0002_seed.sql`, set `SUPABASE_SERVICE_ROLE_KEY` for cron ingest, then trigger the ingest cron.

## Architecture

### Data flow
1. **Ingest** (`/api/cron/ingest`, `GET`, protected by `CRON_SECRET` header; also `/api/feeds/[id]` for per-wire refresh) fetches all sources via `src/lib/feeds/*`, normalizes through `normBatch`, and upserts with the **service-role** client (`src/lib/supabase/admin.ts` — bypasses RLS; server-only, never import it in a client component).
2. **Reads**: Server Components / route handlers use the **anon** client bound to cookies (`src/lib/supabase/server.ts`). `getNewsData()` (`src/lib/data.ts`) is the shared news accessor — demo-fetch or DB query.
3. **Client writes**: `/api/*` route handlers (watchlist, collections, notes, read-state) use `tryClient()` which returns `null` in demo mode and bails with a demo payload.
4. **Realtime** custom wires are a Phase-2 feature; the schema (`custom_wires`, `user_prefs`) is in place.

### Key modules
- `src/lib/extract/` — pure, tested taggers: `models.ts` / `topics.ts` (regex lists ported verbatim from index.html), `entities.ts` (canonical-entity dictionary + alias resolution for Watchlist), `benchmarks.ts` (benchmark-score extraction, longest-name-first regexes), `index.ts` (`extractStoryMeta` — combines all four; `isModel` heuristic).
- `src/lib/feeds/parse.ts` — `fast-xml-parser` RSS/Atom → `RawFeedItem` (browser DOMParser is unavailable in Node). `feeds/index.ts` — per-kind fetchers (rss/atom, HN Algolia, dev.to, lobste.rs), server-side direct (no CORS proxies).
- `src/lib/normalize.ts` — `normItem`/`normBatch` (strip HTML, parse date, run all detectors, set `benchmarks`).
- `src/lib/ingest.ts` — **pure** `buildIngestPayload(Map<sourceId, RawFeedItem[]>)` → DB-ready `{stories, entities, storyEntities, benchRows}`. No I/O; fully unit-tested.
- `src/lib/sources.ts` — `SOURCES` (15 wires) + `srcById`. `src/lib/types.ts` — shared types (`Story`, `RawFeedItem`, `BenchRef`, `EntityRef`...).
- `src/components/` — client views: `news-explorer`, `model-watch`, `github-view`, `hf-view`, `radar-view`, `watchlist-view`, `leaderboard-view`, `saved-view` + presentational cards.
- `src/app/` — pages + API routes. `layout.tsx` does topbar/nav/auth; `middleware.ts` guards `/watchlist`, `/saved`, `/settings` (skipped in demo mode).

### Data model (Supabase)
`supabase/migrations/0001_init.sql` — `profiles` (auto-created on signup), `sources`, `custom_wires`, `stories` (PK = `source_id::link`; gin indexes on `models`/`topics`), `entities`, `story_entities`, `benchmarks`, `benchmark_scores`, `watchlist`, `collections`, `collection_items`, `story_notes`, `story_tags`, `read_state`, `user_prefs`. **RLS**: stories/sources are public-read; all per-user tables are owner-only rows; the service-role client bypasses RLS for writes.

### Vercel deploy
`vercel.json` schedules the hourly ingest cron (`/api/cron/ingest`). The cron route sets `maxDuration = 60`. Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`; `DEMO_MODE` flag in code checks key presence.

## Conventions

- **Server components for reads, route handlers/Server Actions for writes.** Never put the service-role key in a browser bundle; the browser client (`src/lib/supabase/client.ts`) uses the anon key only.
- React escapes output by default — no `esc()` needed in JSX (unlike the legacy ES5 string-concat app).
- Keep `extract/*`, `normalize`, and `ingest` **pure and unit-tested** — they're the invariants the whole pipeline leans on. When adding a detector, add a test in the matching `*.test.ts`.
- Route handlers use `tryClient()` (demo-safe) not `createClient()` unless the route is only reachable with Supabase configured.
