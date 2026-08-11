# NEURALWIRE Rebuild — Design Spec

Date: 2026-08-10
Status: Approved (via build directive)

## Goal

Rebuild the static single-file NEURALWIRE dashboard (`index.html`) as a real **frontend + backend** application: Next.js (App Router) on Vercel, Supabase (Postgres + Auth + Realtime) for persistence, multi-user accounts. Move all feed-fetching server-side to eliminate browser CORS proxies.

## Phase 1 Scope

- Foundation: auth, server-side ingest, rebuilt dashboard (Newsroom, Model Watch, GitHub, HF, Radar, Saved)
- Collections + tags + notes
- Custom user wires
- **Entity Watchlist** (follow entities → narrative timelines)
- **Model Leaderboard** (auto-extracted benchmark scores, charted over time)

## Architecture (Approach A — Next.js monolith)

One Next.js app on Vercel. Route handlers = backend + cron. Supabase = DB/Auth/Realtime. Server Components for reads, Server Actions / API routes for writes.

```
app/
  page.tsx                    # Newsroom
  login/page.tsx
  model-watch/page.tsx
  github/page.tsx             # trending + explorer
  huggingface/page.tsx
  radar/page.tsx
  watchlist/page.tsx          # NEW
  leaderboard/page.tsx        # NEW
  saved/page.tsx
  api/
    cron/ingest/route.ts      # Vercel Cron → fetch+extract+store
    feeds/[id]/route.ts       # on-demand wire refresh
    github/search/route.ts    # server-side GitHub w/ DB cache
    hf/trending/route.ts      # server-side HF w/ DB cache
    stories/route.ts
    collections/route.ts
    watchlist/route.ts
    notes/route.ts
    tags/route.ts
components/ lib/ supabase/ vercel.json middleware.ts
```

## Data model (Supabase)

- `profiles` — extends auth.users (username, avatar)
- `sources` — 15 built-in wires (seeded)
- `custom_wires` — user RSS (user_id, url, status pending→approved)
- `stories` — global pool, `link` UNIQUE, models[]/topics[]
- `entities` — canonical identity (name, kind: company/model/person, aliases[])
- `story_entities` — M:N + role
- `benchmarks` — seeded (SWE-bench, MMLU, GPQA, HumanEval…)
- `benchmark_scores` — model_entity_id, benchmark_id, score, source_story_id, reported_at
- `watchlist` — user_id, entity_id
- `collections` / `collection_items` — user bookmarks (public flag)
- `story_notes` / `story_tags` — per-user
- `read_state` — PK(user_id, story_id)
- `user_prefs` — jsonb (sort, density, WorldMonitor key)

Shared global stories; personal data user_id-scoped.

## Ingest pipeline

```
Vercel Cron (every 3 min) → /api/cron/ingest
  → parallel fetch 15 wires (server-side, direct — no CORS proxy)
  → normalize (port normItem) → upsert stories (ON CONFLICT link)
  → entity extract (dict + regex, alias→canonical)
  → benchmark extract (regex, only if model entity)
  → write benchmark_scores (dedupe story+benchmark+model)
  → update source.last_fetched_at
  → Realtime broadcast
```

- `?force=1` on-demand; per-feed try/catch; source status live/cached/off.
- Vercel Hobby 10s limit → parallel fetch (≈ slowest feed, 2–5s). Fallback: Supabase Edge Function.

## Frontend

Port existing CSS wholesale (global stylesheet). Convert render funcs → React components. Same design language.
Port to `lib/`: `SOURCES`, `MODEL_TERMS`, `TOPIC_RULES`, `LANG_COLORS`, `normItem`, feed fetchers.
New: `EntityTimeline`, `BenchChart` (SVG), `WatchlistSidebar`.

## Auth

Supabase Auth (email/password + magic link). `middleware.ts` guards personalized pages.
News browsable logged-out; watchlist/saves/notes require login.

## Error handling

- Per-feed isolation; rate-limit cache/backoff for GitHub/HF.
- Idempotent upserts; skeleton loaders; offline banner; toasts.

## Testing

- Vitest unit tests: extractors (entities, benchmarks, topics, models), XML/feed parsers, normalizer. Fixture-based.
- Ingest integration test with mocked fetches.
- Component smoke tests. No E2E in Phase 1.

## Migration

- Port config/fetchers/extractors into `lib/`.
- localStorage state → Supabase (read_state, saved→collections, prefs, source toggles).
- Keep `index.html` until UI parity; then remove.

## Constraints / blockers

- Requires Supabase project URL + anon + service-role keys (user provides; `.env.example` supplied).
- `DEMO_MODE` env flag serves live feed data without DB so UI is testable pre-keys.
