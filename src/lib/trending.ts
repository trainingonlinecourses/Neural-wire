import { fmtStars, isoDaysAgo } from './utils';

export type TrendingKind = 'gh' | 'hf' | 'radar';

export interface RadarSignal {
  id: string;
  name: string;
  icon: string;
  value: number | null;
  detail: string;
  href: string | null;
}

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

const KIND_PRIORITY: Record<TrendingKind, number> = { gh: 0, hf: 1, radar: 2 };

/**
 * Merge per-category candidates into a single ranking. Each item's heat is
 * normalized to 0-100 against the top value of its own category, so a star
 * leader can rank beside a liked model and a fear/greed reading. Radar
 * signals without a numeric reading rank at the bottom with heat 0.
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

/* ---------- Shared movers ranking (module-cached, one computation for all consumers) ---------- */

const MOVERS_TTL = 3 * 60 * 1000;
let moversCache: { range: TimeRange; rows: TrendingRow[]; at: number } | null = null;

/* 24h climb signal (GH star deltas). Each repo needs its own events call, so a
   rate-limit backoff keeps us from hammering the GitHub API. */
let deltaCooldownUntil = 0;

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

/**
 * The merged movers ranking for a window, computed once per TTL and shared by
 * every consumer (brief Movers, watchlist movers status). Status-only radar
 * rows are dropped and the radar key is not passed, matching the /brief digest.
 * Each row also gets its 24h climb signal: star deltas for the top GH repos
 * (events API, per-repo call) and HF trendingScore for models.
 */
export async function getMoversRows(range: TimeRange = '24h'): Promise<TrendingRow[]> {
  if (!moversCache || moversCache.range !== range || Date.now() - moversCache.at > MOVERS_TTL) {
    const [ghRes, hfRes, radarRes] = await Promise.allSettled([
      fetchGhTrending(range),
      fetchHfTrending(range),
      fetchRadarSignals(''),
    ]);
    const groups: { kind: TrendingKind; items: Cand[] }[] = [];
    if (ghRes.status === 'fulfilled') groups.push({ kind: 'gh', items: ghRes.value });
    if (hfRes.status === 'fulfilled') groups.push({ kind: 'hf', items: hfRes.value });
    if (radarRes.status === 'fulfilled') groups.push({ kind: 'radar', items: liveSignalCands(radarRes.value) });
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

/* ---------- Shared row mapping ---------- */

/** Radar signal -> ranking candidate (null-value signals rank at the bottom). */
export function signalToCand(s: RadarSignal): Cand {
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

/** Radar signals -> candidates, dropping pure status rows (key required / unreachable). */
export function liveSignalCands(signals: RadarSignal[]): Cand[] {
  return signals
    .filter((s) => s.value != null || !/(key required|unreachable)/i.test(s.detail))
    .map(signalToCand);
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

async function ghSearch(q: string, per = 30): Promise<RawRepo[]> {
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
  return items.slice(0, 15).map((r) => ({
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
  createdAt?: number;
  created_at?: number;
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
  const inWindow = j.filter((m) => withinWindow(m.createdAt ?? m.created_at ?? 0, days));
  if (sort === 'likes') inWindow.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  return inWindow.slice(0, 15).map((m) => ({
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

/* ---------- WorldMonitor radar signals ---------- */

function deepFind(
  obj: unknown,
  pred: (k: string, v: unknown) => boolean,
  depth = 0,
  out: { k: string; v: unknown }[] = [],
): { k: string; v: unknown }[] {
  if (depth > 6 || out.length >= 3 || obj == null || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) {
    obj.slice(0, 8).forEach((v) => deepFind(v, pred, depth + 1, out));
    return out;
  }
  const o = obj as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (pred(k, v)) {
      out.push({ k, v });
      if (out.length >= 3) return out;
    }
    if (v && typeof v === 'object') deepFind(v, pred, depth + 1, out);
  }
  return out;
}

async function fetchWM(path: string, key: string): Promise<{ ok: boolean; data?: unknown; needKey?: boolean }> {
  const url = 'https://api.worldmonitor.app' + path;
  const opts: RequestInit = { signal: AbortSignal.timeout(12000) };
  if (key) opts.headers = { 'X-WorldMonitor-Key': key };
  try {
    const r = await fetch(url, opts);
    const j = await r.json().catch(() => null);
    if (r.ok && j && !j.error) return { ok: true, data: j };
    if ((j && /key required|unauthenticated|api key/i.test(j.error || '')) || r.status === 401 || r.status === 403)
      return { ok: false, needKey: true };
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

const RADAR_EPS = [
  { id: 'fg', icon: '📉', name: 'Fear & Greed Index', path: '/api/market/v1/get-fear-greed-index' },
  { id: 'climate', icon: '🌦', name: 'Climate Intelligence', path: '/api/climate/v1/list-climate-news' },
  { id: 'air', icon: '🛫', name: 'Airport Delays', path: '/api/aviation/v1/list-airport-delays' },
  { id: 'co2', icon: '🧪', name: 'CO₂ Monitor', path: '/api/climate/v1/get-co2-monitoring' },
];

export async function fetchRadarSignals(key: string): Promise<RadarSignal[]> {
  const results = await Promise.all(
    RADAR_EPS.map((ep) => fetchWM(ep.path, key).then((res) => ({ ep, res }))),
  );
  const signals: RadarSignal[] = [];
  for (const { ep, res } of results) {
    if (!res.ok) {
      signals.push({
        id: ep.id,
        name: ep.name,
        icon: ep.icon,
        value: null,
        detail: res.needKey ? 'WorldMonitor API key required' : 'endpoint unreachable',
        href: 'https://www.worldmonitor.app',
      });
      continue;
    }
    const d = res.data;
    if (ep.id === 'fg') {
      const hit = deepFind(d, (k, v) => /^(value|score|index|fgi)$/i.test(k) && typeof v === 'number')[0];
      const lbl = deepFind(d, (k, v) => /classification|label|rating/i.test(k) && typeof v === 'string')[0];
      const value = hit ? Math.round((hit.v as number) * 10) / 10 : null;
      signals.push({
        id: ep.id,
        name: ep.name,
        icon: ep.icon,
        value,
        detail: lbl ? String(lbl.v) : value == null ? 'no reading' : '0 fear · 100 greed',
        href: 'https://www.worldmonitor.app',
      });
    } else if (ep.id === 'climate') {
      const hit = deepFind(d, (k, v) => k === 'items' && Array.isArray(v) && (v as unknown[]).length > 0)[0];
      const arr = hit ? (hit.v as Record<string, unknown>[]) : [];
      const top = arr[0];
      signals.push({
        id: ep.id,
        name: ep.name,
        icon: ep.icon,
        value: null,
        detail: top ? String(top.title || top.name || '—') : 'no climate signals',
        href: top && (top.url || top.link) ? String(top.url || top.link) : 'https://www.worldmonitor.app',
      });
    } else if (ep.id === 'air') {
      const hit = deepFind(d, (k, v) => k === 'alerts' && Array.isArray(v) && (v as unknown[]).length > 0)[0];
      const arr = hit ? (hit.v as Record<string, unknown>[]) : [];
      const top = arr[0];
      signals.push({
        id: ep.id,
        name: ep.name,
        icon: ep.icon,
        value: null,
        detail: top
          ? String(top.city || '') + ' ' + String(top.country || '') + ' — ' + String(top.delayType || 'delay').replace('FLIGHT_DELAY_TYPE_', '')
          : 'no delay alerts',
        href: 'https://www.worldmonitor.app',
      });
    } else {
      const hit = deepFind(d, (k, v) => k === 'currentPpm' && typeof v === 'number')[0];
      signals.push({
        id: ep.id,
        name: ep.name,
        icon: ep.icon,
        value: null,
        detail: hit ? Math.round(hit.v as number) + ' ppm CO₂' : 'no CO₂ reading',
        href: 'https://www.worldmonitor.app',
      });
    }
  }
  return signals;
}
