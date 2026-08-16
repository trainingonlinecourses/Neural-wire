import {
  fetchGhStarDelta,
  fetchGhTrending,
  fetchHfTrending,
  rankAll,
  pulseSignalCands,
  type Cand,
  type TimeRange,
  type TrendingKind,
  type TrendingRow,
} from './trending';
import { computePulseSignals, type PulseSignal } from './pulse';
import { getNewsData } from './data';

/**
 * Server-only movers pipeline. Kept out of `trending.ts` because it touches
 * the news data layer (Postgres via Supabase server client / live feeds) —
 * pulling it into a client bundle would leak server-only imports.
 */

const MOVERS_TTL = 3 * 60 * 1000;
let moversCache: { range: TimeRange; rows: TrendingRow[]; at: number } | null = null;

/* 24h climb signal (GH star deltas). Each repo needs its own events call, so a
   rate-limit backoff keeps us from hammering the GitHub API. */
let deltaCooldownUntil = 0;

/**
 * The desk's own signal layer for the unified ranking: computed from the
 * current news feed (Postgres or live demo feeds), so it needs no third-party
 * key and can never drift off-topic. Status-only signals (no numeric reading)
 * are kept out of the ranking by `pulseSignalCands`.
 */
export async function fetchPulseSignals(): Promise<PulseSignal[]> {
  const data = await getNewsData();
  return computePulseSignals(data.stories);
}

/**
 * The merged movers ranking for a window, computed once per TTL and shared by
 * every consumer (brief Movers, watchlist movers status). Status-only pulse
 * rows are dropped, matching the /brief digest. Each row also gets its 24h
 * climb signal: star deltas for the top GH repos (events API, per-repo call)
 * and HF trendingScore for models.
 */
export async function getMoversRows(range: TimeRange = '24h'): Promise<TrendingRow[]> {
  if (!moversCache || moversCache.range !== range || Date.now() - moversCache.at > MOVERS_TTL) {
    const [ghRes, hfRes, pulseRes] = await Promise.allSettled([
      fetchGhTrending(range),
      fetchHfTrending(range),
      fetchPulseSignals(),
    ]);
    const groups: { kind: TrendingKind; items: Cand[] }[] = [];
    if (ghRes.status === 'fulfilled') groups.push({ kind: 'gh', items: ghRes.value });
    if (hfRes.status === 'fulfilled') groups.push({ kind: 'hf', items: hfRes.value });
    if (pulseRes.status === 'fulfilled') groups.push({ kind: 'pulse', items: pulseSignalCands(pulseRes.value) });
    const rows = rankAll(groups);

    // 24h climb signal — GH star deltas (only the rendered top repos; bounded
    // per-repo calls with a cooldown after a rate limit).
    if (Date.now() >= deltaCooldownUntil) {
      const ghTop = rows.filter((r) => r.kind === 'gh').slice(0, 10);
      const deltas = await Promise.all(ghTop.map((r) => fetchGhStarDelta(r.id)));
      let limited = false;
      ghTop.forEach((r, i) => {
        const d = deltas[i];
        if (d.rateLimited) {
          limited = true;
          return;
        }
        if (d.stars != null) r.delta = { ...(r.delta || {}), stars: d.stars };
      });
      if (limited) deltaCooldownUntil = Date.now() + 10 * 60 * 1000;
    }
    // HF momentum — no extra call needed, trendingScore rides the fetch above.
    for (const r of rows) {
      if (r.kind === 'hf' && r.trendingScore != null) {
        r.delta = { ...(r.delta || {}), score: r.trendingScore };
      }
    }

    moversCache = { range, rows, at: Date.now() };
  }
  return moversCache.rows;
}

/** A followed entity's spot in the movers ranking. */
export interface MoversMatch {
  row: TrendingRow;
  /** 1-based position in the merged ranking. */
  rank: number;
}

/**
 * Match a followed entity (canonical name + aliases) against the movers
 * ranking by case-insensitive substring on row names — so "NVIDIA" matches
 * `NVIDIA/…` repos, "Mistral AI" matches `mistralai/…` models, and "Claude"
 * matches `anthropic/claude-…`. Returns matches in ranking order with their
 * actual rank, so the UI can show a real "position in the 24h ranking".
 */
export function matchMovers(
  entity: { name: string; aliases?: string[] },
  rows: TrendingRow[],
): MoversMatch[] {
  const terms = [entity.name, ...(entity.aliases || [])]
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const out: MoversMatch[] = [];
  rows.forEach((row, i) => {
    const hay = row.name.toLowerCase();
    if (terms.some((t) => hay.includes(t))) out.push({ row, rank: i + 1 });
  });
  return out;
}
