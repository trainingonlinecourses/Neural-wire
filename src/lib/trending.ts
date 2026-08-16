import { fmtStars, isoDaysAgo } from './utils';
import type { PulseSignal } from './pulse';

export type TrendingKind = 'gh' | 'hf' | 'pulse';


/** One ranked entry before/after normalization. */
export interface Cand {
  id: string;
  name: string;
  sub: string;
  metric: string;
  /** Raw score within its own category (stars / likes / index). */
  value: number;
  href: string | null;
  tags?: string[];
  /** Hugging Face momentum score for the sort window (24h/7d), when known. */
  trendingScore?: number;
}

/** 24h climb signal attached to a movers row: new stars (GH) or HF momentum. */
export interface RowDelta {
  /** New stars gained in the last 24h (GitHub WatchEvents). */
  stars?: number;
  /** Hugging Face trendingScore for the window. */
  score?: number;
}

export interface TrendingRow extends Cand {
  kind: TrendingKind;
  /** 0-100, position within the item's own category. */
  heat: number;
  /** 0-100 cross-category percentile: absolute strength in the merged ranking. */
  global: number;
  delta?: RowDelta;
}

const KIND_PRIORITY: Record<TrendingKind, number> = { gh: 0, hf: 1, pulse: 2 };

/**
 * Merge per-category candidates into a single ranking. Each item's heat is
 * normalized to 0-100 against the top value of its own category, so a star
 * leader can rank beside a liked model and a pulse reading. Pulse signals
 * without a numeric reading rank at the bottom with heat 0.
 */
export function rankAll(groups: { kind: TrendingKind; items: Cand[] }[]): TrendingRow[] {
  const maxByKind: Partial<Record<TrendingKind, number>> = {};
  for (const g of groups) {
    maxByKind[g.kind] = Math.max(0, ...g.items.map((i) => i.value));
  }
  const rows: TrendingRow[] = [];
  for (const g of groups) {
    const max = maxByKind[g.kind] || 0;
    for (const it of g.items) {
      rows.push({ ...it, kind: g.kind, heat: max > 0 ? Math.round((100 * it.value) / max) : 0, global: 0 });
    }
  }
  rows.sort((a, b) => {
    if (b.heat !== a.heat) return b.heat - a.heat;
    if (KIND_PRIORITY[a.kind] !== KIND_PRIORITY[b.kind]) return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
  // Cross-category percentile: the top item is 100, the bottom is 0.
  const total = rows.length;
  rows.forEach((r, i) => {
    r.global = total <= 1 ? 100 : Math.round((100 * (total - 1 - i)) / (total - 1));
  });
  return rows;
}

/* ---------- Time range selection ---------- */

export type TimeRange = '24h' | '7d' | '30d';

/** Window size in days per range (24h = 1 day). */
export const RANGE_DAYS: Record<TimeRange, number> = { '24h': 1, '7d': 7, '30d': 30 };

/** Minimum stars for the GitHub query per range (older windows need a floor). */
export const GH_STAR_FLOOR: Record<TimeRange, number> = { '24h': 1, '7d': 3, '30d': 20 };

/** Hugging Face sort per range: trendingScore is short-window, likes suit 30d. */
export function hfSortFor(range: TimeRange): 'trendingScore' | 'likes' {
  return range === '30d' ? 'likes' : 'trendingScore';
}

/** True when a created-at timestamp (ms) falls inside the window. */
export function withinWindow(createdMs: number, days: number, now = Date.now()): boolean {
  return createdMs >= now - days * 86_400_000;
}

/* ---------- Climb signals ---------- */

/**
 * Stars gained by one repo in the last 24h, counted from its public event
 * stream (a WatchEvent with action 'started' is a new star). Returns null when
 * the count is unavailable; rateLimited flags a 403/429 so callers can back off.
 */
export async function fetchGhStarDelta(
  fullName: string,
): Promise<{ stars: number | null; rateLimited: boolean }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${fullName}/events?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(12000),
    });
    if (r.status === 403 || r.status === 429) return { stars: null, rateLimited: true };
    if (!r.ok) return { stars: null, rateLimited: false };
    const j = (await r.json()) as unknown;
    if (!Array.isArray(j)) return { stars: null, rateLimited: false };
    const cutoff = Date.now() - 24 * 3_600_000;
    const stars = j
      .filter((e: Record<string, unknown>) => {
        if (e.type !== 'WatchEvent') return false;
        const action = (e.payload as Record<string, unknown> | undefined)?.action;
        if (action && action !== 'started') return false;
        const t = typeof e.created_at === 'string' ? Date.parse(e.created_at) : NaN;
        return Number.isFinite(t) && t >= cutoff;
      })
      .length;
    return { stars, rateLimited: false };
  } catch {
    return { stars: null, rateLimited: false };
  }
}

/** Compact 24h-climb label for a movers row: new stars (GH) or HF momentum. */
export function deltaText(delta: RowDelta): string | null {
  if (delta.stars != null) return '▲ +' + fmtStars(delta.stars) + ' ★';
  if (delta.score != null) return '▲ ' + fmtStars(delta.score) + ' score';
  return null;
}

/**
 * Numeric climb signal for sorting the "fastest risers" view: GH star deltas
 * win, then HF momentum (explicit delta or the raw trendingScore), else 0.
 */
export function climbScore(row: TrendingRow): number {
  return row.delta?.stars ?? row.delta?.score ?? row.trendingScore ?? 0;
}

/** Sort merged rows by 24h climb (risers first), heat as the tiebreak. */
export function sortByRisers(rows: TrendingRow[]): TrendingRow[] {
  return [...rows].sort((a, b) => {
    const d = climbScore(b) - climbScore(a);
    if (d !== 0) return d;
    if (b.heat !== a.heat) return b.heat - a.heat;
    return b.global - a.global;
  });
}

/* ---------- Shared row mapping ---------- */

/** Pulse signal -> ranking candidate (null-value signals rank at the bottom). */
export function signalToCand(s: PulseSignal): Cand {
  return {
    id: s.id,
    name: s.name,
    sub: s.detail,
    metric: s.value != null ? s.value + ' / 100' : '—',
    value: s.value ?? 0,
    href: s.href,
    tags: [],
  };
}

/** Pulse signals -> candidates, dropping pure status rows (no numeric reading). */
export function pulseSignalCands(signals: PulseSignal[]): Cand[] {
  return signals.filter((s) => s.value != null).map(signalToCand);
}

/* ---------- GitHub (same queries as the GitHub page, rising mode) ---------- */

interface RawRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  owner?: { login: string };
}

async function ghSearch(q: string, per = 100): Promise<RawRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${per}&page=1`;
  const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const j = await r.json();
  return (j.items || []) as RawRepo[];
}

export async function fetchGhTrending(range: TimeRange = '7d'): Promise<Cand[]> {
  const since = isoDaysAgo(RANGE_DAYS[range]);
  const floor = GH_STAR_FLOOR[range];
  const queries = [
    'topic:ai created:>=' + since + ' stars:>=' + floor,
    'topic:llm created:>=' + since + ' stars:>=' + floor,
    'topic:generative-ai created:>=' + since + ' stars:>=' + floor,
  ];
  const results = await Promise.all(queries.map((q) => ghSearch(q)));
  const seen = new Set<string>();
  const items: RawRepo[] = [];
  for (const list of results) {
    for (const r of list) {
      if (!seen.has(r.full_name)) {
        seen.add(r.full_name);
        items.push(r);
      }
    }
  }
  items.sort((a, b) => b.stargazers_count - a.stargazers_count);
  return items.slice(0, 100).map((r) => ({
    id: r.full_name,
    name: r.full_name,
    sub: (r.owner?.login || '') + (r.language ? ' · ' + r.language : ''),
    metric: '★ ' + fmtStars(r.stargazers_count) + ' stars',
    value: r.stargazers_count,
    href: r.html_url,
    tags: (r.topics || []).slice(0, 3),
  }));
}

/* ---------- Hugging Face models ---------- */

interface RawHF {
  id?: string;
  likes?: number;
  downloads?: number;
  pipeline_tag?: string;
  library_name?: string;
  createdAt?: string | number;
  created_at?: number;
  lastModified?: string;
  trendingScore?: number;
}

async function hfFetch(url: string): Promise<RawHF[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HF ' + r.status);
  return r.json();
}

export async function fetchHfTrending(range: TimeRange = '7d'): Promise<Cand[]> {
  const days = RANGE_DAYS[range];
  const sort = hfSortFor(range);
  const other = sort === 'likes' ? 'trendingScore' : 'likes';
  const urls = [
    `https://huggingface.co/api/models?sort=${sort}&limit=60&full=false`,
    `https://huggingface.co/api/models?sort=${other}&limit=60&full=false`,
  ];
  let j: RawHF[] = [];
  for (const u of urls) {
    try {
      j = await hfFetch(u);
      if (j.length) break;
    } catch {
      /* try the fallback sort */
    }
  }
  if (j.length === 0) throw new Error('HF API unreachable');
  // The sort IS the window: trendingScore is HF's own short-window momentum,
  // likes suit the 30d view. The createdAt field comes back as an ISO string,
  // so never feed it to the numeric withinWindow — and never filter the
  // trendingScore list by creation date (a model created 10 days ago can be
  // trending today). Only the 30d likes view narrows to recently-created.
  const inWindow =
    sort === 'likes'
      ? j.filter((m) => {
          const t = m.createdAt ? Date.parse(String(m.createdAt)) : 0;
          return t ? withinWindow(t, days) : true;
        })
      : j;
  if (sort === 'likes') inWindow.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  return inWindow.slice(0, 25).map((m) => ({
    id: m.id || '',
    name: m.id || '',
    sub: (m.pipeline_tag || m.library_name || 'model') + ' · ' + range,
    metric: '❤ ' + fmtStars(m.likes ?? 0) + ' likes',
    value: m.likes ?? 0,
    href: 'https://huggingface.co/' + (m.id || ''),
    tags: [m.pipeline_tag || '', m.library_name || ''].filter(Boolean),
    trendingScore: m.trendingScore,
  }));
}


