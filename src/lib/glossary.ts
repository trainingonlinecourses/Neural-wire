/**
 * Desk glossary — every term NEURALWIRE uses, defined in one place so the
 * wire speaks one language. The page (/glossary) renders this list with
 * search + category filters; the integrity test keeps ids unique and links
 * pointing at real routes.
 */

export type GlossaryCategory = 'ranking' | 'desk' | 'data' | 'account';

export interface GlossaryEntry {
  id: string;
  term: string;
  category: GlossaryCategory;
  /** One-line definition shown on the card. */
  short: string;
  /** Optional fuller explanation. */
  long?: string;
  /** Related pages to jump to. */
  see?: { label: string; href: string }[];
}

export const GLOSSARY_CATEGORIES: { id: GlossaryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'ranking', label: 'RANKING & SIGNALS' },
  { id: 'desk', label: 'THE DESK' },
  { id: 'data', label: 'SOURCES & ENTITIES' },
  { id: 'account', label: 'ACCOUNT & TOOLS' },
];

/** Fast lookup by id for inline tooltips and other surfaces. */
export function glossaryById(id: string): GlossaryEntry | undefined {
  return GLOSSARY.find((e) => e.id === id);
}

export const GLOSSARY: GlossaryEntry[] = [
  // ── Ranking & signals ──────────────────────────────────────────────
  {
    id: 'movers',
    term: 'Movers',
    category: 'ranking',
    short: 'The unified 24h ranking of GitHub repos, Hugging Face models and AI pulse signals, scored on one scale.',
    long: 'Every source contributes candidates with their own raw metric (stars, likes, pulse readings); each is normalized to a 0–100 heat against the top of its own category, then merged into one list. Movers appears on the Today in AI brief and on the watchlist.',
    see: [
      { label: 'Full ranking', href: '/trending' },
      { label: 'On the brief', href: '/brief' },
    ],
  },
  {
    id: 'heat',
    term: 'Heat (in-source)',
    category: 'ranking',
    short: '0–100 strength within a row’s own category — 100 is the top repo, model or signal of that kind.',
  },
  {
    id: 'global-percentile',
    term: 'Global percentile',
    category: 'ranking',
    short: 'Cross-category strength: where a row sits among all sources on one 0–100 scale (top = 100, bottom = 0).',
    long: 'The merged ranking sorts by heat, then each position is converted to a percentile. It lets you compare a 5th-place repo with a 3rd-place model directly, even though stars and likes are wildly different units.',
  },
  {
    id: 'star-delta',
    term: 'Star delta',
    category: 'ranking',
    short: 'New GitHub stars a repo gained in the last 24 hours, shown as a ▲ +N ★ chip.',
    long: 'Counted from each repo’s public event stream (a “Watch” event is one new star), bounded to the rendered movers rows with a rate-limit backoff. Rows without an available reading simply omit the chip.',
    see: [{ label: 'Trending', href: '/trending' }],
  },
  {
    id: 'trending-score',
    term: 'HF trending score',
    category: 'ranking',
    short: 'Hugging Face’s momentum metric for a model in the sort window — the ▲ chip on model rows.',
    long: 'The 24h and 7d rankings sort models by trendingScore (short-window heat); the 30d view sorts by likes for durable popularity. Either way, the chip shows why the model is climbing.',
    see: [{ label: 'HF Hub', href: '/huggingface' }],
  },
  {
    id: 'time-range',
    term: 'Time range',
    category: 'ranking',
    short: 'The 24H / 7D / 30D window on Trending, which controls which repos and models are eligible.',
    long: 'The GitHub query window moves with the range and the star floor rises for older windows (≥1 / ≥3 / ≥20), so each range surfaces appropriately-sized projects. The 30d list also switches the HF sort from momentum to likes.',
  },
  {
    id: 'new-badge',
    term: 'NEW badge',
    category: 'ranking',
    short: 'Flashes on rows that entered the ranking since the last sync — new since your last look.',
    long: 'Each sync diffs the ranking keys and badges exactly the rows it added; switching time range resets the set because a new window is a fresh ranking, not a sync.',
  },
  {
    id: 'climb-chip',
    term: '24h climb chip',
    category: 'ranking',
    short: 'The ▲ chip next to a metric showing how fast a row is rising: star delta for repos, trending score for models.',
  },

  // ── The desk ───────────────────────────────────────────────────────
  {
    id: 'newsroom',
    term: 'Newsroom',
    category: 'desk',
    short: 'The live feed of curated AI stories from 50 sources, refreshed in place every few minutes.',
    see: [{ label: 'Open the desk', href: '/' }],
  },
  {
    id: 'ticker',
    term: 'Headline ticker',
    category: 'desk',
    short: 'The scrolling strip of the newest stories atop the newsroom — hover to pause.',
  },
  {
    id: 'sync-countdown',
    term: 'Auto-refresh countdown',
    category: 'desk',
    short: 'The ⟳ M:SS pill — when it hits zero the page re-syncs in place, no reload, filters preserved.',
    long: 'Timestamp-based, so it self-corrects after browser tab throttling and catches up the moment the tab regains focus. The newsroom, trending and pulse all run on the same loop.',
  },
  {
    id: 'sync-diff',
    term: 'Sync diff',
    category: 'desk',
    short: 'The ✓ +N · −M report after a sync: how many stories were added and removed.',
  },
  {
    id: 'brief',
    term: 'Today in AI',
    category: 'desk',
    short: 'The daily digest: the last 24h of the wire, distilled into topics, movers and fresh stories.',
    see: [{ label: 'Read the brief', href: '/brief' }],
  },
  {
    id: 'demo-mode',
    term: 'Demo mode',
    category: 'desk',
    short: 'When no database is configured, the desk runs on live feeds without persistence or accounts.',
  },
  {
    id: 'fetched-at',
    term: 'Fetched-at',
    category: 'desk',
    short: 'The timestamp of the last feed pull, shown next to the countdown so you know how fresh the wire is.',
  },

  // ── Sources & entities ─────────────────────────────────────────────
  {
    id: 'pulse',
    term: 'AI Pulse',
    category: 'data',
    short: 'Six live signals derived from the current wire — velocity, model buzz, hottest model, story heat, busiest source and feed health — re-run every 3 minutes.',
    long: 'No third-party keys: every reading is computed from the stories the desk already carries, so the panel stays on-topic and honest wherever the data comes from. Status-only signals (no numeric reading) are kept out of the unified ranking.',
    see: [{ label: 'Open the pulse', href: '/pulse' }],
  },
  {
    id: 'entity',
    term: 'Entity',
    category: 'data',
    short: 'A tracked company, model or person in the dictionary — OpenAI, Claude, Sam Altman — resolved by alias.',
    long: 'Entity extraction normalizes “DeepMind” → “Google DeepMind” and similar, so following one canonical entity surfaces every mention across the wire.',
  },
  {
    id: 'source',
    term: 'Source',
    category: 'data',
    short: 'One of the desk’s curated feeds — an official lab blog, a press outlet, a research wire or a community source — identified by its short code on the filter chips.',
    long: 'Every story keeps its origin: hover a chip like OAI or HN to see which feed it came from, and click it to filter the wire to that source alone.',
  },
  {
    id: 'coverage',
    term: 'Coverage',
    category: 'desk',
    short: 'When the same story arrives from more than one source, the desk clusters the near-duplicates and shows a “N SOURCES COVERING” chip.',
    long: 'Clicking the chip expands the other versions side by side, so you can read the same story from different outlets and compare angles at a glance.',
  },
  {
    id: 'watchlist',
    term: 'Watchlist',
    category: 'data',
    short: 'Followed entities with their story timelines and current 24h movers status on each card.',
    see: [{ label: 'Manage follows', href: '/watchlist' }],
  },
  {
    id: 'model-watch',
    term: 'Model Watch',
    category: 'data',
    short: 'New releases and model mentions across the wire, tracked as first-class entities.',
    see: [{ label: 'Model Watch', href: '/model-watch' }],
  },
  {
    id: 'leaderboard',
    term: 'Leaderboard',
    category: 'data',
    short: 'Benchmark scores extracted live from the wire — one table, sortable, per-model.',
    see: [{ label: 'Leaderboard', href: '/leaderboard' }],
  },

  // ── Account & tools ────────────────────────────────────────────────
  {
    id: 'collections',
    term: 'Saved collections',
    category: 'account',
    short: 'Story collections, synced per account across devices.',
    see: [{ label: 'Your saved', href: '/saved' }],
  },
  {
    id: 'system-theme',
    term: 'Theme: System',
    category: 'account',
    short: 'Follows your OS light/dark automatically; Light and Dark pin a choice, System re-enables following anytime.',
    long: 'The choice persists in localStorage and, when signed in, follows you across devices.',
  },
  {
    id: 'shortcuts',
    term: 'Keyboard shortcuts',
    category: 'account',
    short: 'Press ? anywhere to open the desk’s shortcut map.',
  },
];
