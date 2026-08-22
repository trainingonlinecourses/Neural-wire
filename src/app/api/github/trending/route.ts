import { NextResponse } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Server-side GitHub Trending Proxy                                  */
/*                                                                    */
/*  The client was hitting GitHub's unauthenticated rate limit:        */
/*  10 requests/min → 403 after a few range switches.                 */
/*                                                                    */
/*  This route:                                                        */
/*  • Makes requests SEQUENTIALLY with delays (not parallel)          */
/*  • Retries on 403/429 with exponential backoff                     */
/*  • Uses GITHUB_TOKEN env var if set (5 000 req/hr vs 10/min)       */
/*  • Caches each time-range server-side for 10 minutes               */
/*  • Returns a single combined payload to the client                 */
/* ------------------------------------------------------------------ */

interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: { login: string; avatar_url: string };
  license?: { spdx_id: string } | null;
  open_issues_count: number;
  watchers_count: number;
}

type TimeRange = 'day' | 'week' | 'month' | '3mo' | '6mo' | '1yr' | 'all';

const RANGE_DAYS: Record<TimeRange, number> = {
  day: 1, week: 7, month: 30, '3mo': 90, '6mo': 180, '1yr': 365, all: 9999,
};
const RANGE_MIN_STARS: Record<TimeRange, number> = {
  day: 10, week: 5, month: 10, '3mo': 20, '6mo': 50, '1yr': 100, all: 200,
};

const TOPICS = ['ai', 'llm', 'generative-ai', 'machine-learning', 'deep-learning', 'neural-network'];

/* ---- server-side cache (per-Vercel instance, 10 min TTL) ---- */
interface CacheEntry { data: GhRepo[]; at: number; total: number; }
const CACHE_TTL = 10 * 60 * 1000;
const sCache = new Map<string, CacheEntry>();

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ghSearchRaw(q: string, per = 30, attempt = 0): Promise<{ total_count: number; items: GhRepo[] }> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${per}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const r = await fetch(url, { headers });

  if (r.status === 403 || r.status === 429) {
    if (attempt < 3) {
      const retryAfter = parseInt(r.headers.get('retry-after') || '', 10);
      const delay = retryAfter ? retryAfter * 1000 : Math.pow(2, attempt) * 3000 + Math.random() * 2000;
      await sleep(delay);
      return ghSearchRaw(q, per, attempt + 1);
    }
    throw new Error(`GitHub ${r.status} (rate-limited after retries)`);
  }
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

async function fetchRange(range: TimeRange): Promise<CacheEntry> {
  const days = RANGE_DAYS[range];
  const minStars = RANGE_MIN_STARS[range];
  const since = isoDate(days);

  // Build queries — use fewer topics for longer ranges to stay within rate limits
  const topicSlice = days <= 30 ? TOPICS.slice(0, 4) : TOPICS.slice(0, 3);
  const queries = topicSlice.map((t) => {
    const dateFilter = days < 9999 ? ` created:>=${since}` : '';
    return `topic:${t}${dateFilter} stars:>=${minStars}`;
  });

  const seen = new Set<string>();
  const items: GhRepo[] = [];
  let total = 0;

  // Sequential requests with 2s delay between each (stay under 10/min)
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await sleep(2200);
    try {
      const j = await ghSearchRaw(queries[i], 40);
      total = Math.max(total, j.total_count || 0);
      for (const repo of j.items || []) {
        if (!seen.has(repo.full_name)) {
          seen.add(repo.full_name);
          items.push(repo);
        }
      }
    } catch {
      // continue with partial results
    }
  }

  items.sort((a, b) => b.stargazers_count - a.stargazers_count);
  return { data: items.slice(0, 60), at: Date.now(), total };
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const range = (sp.get('range') || 'week') as TimeRange;

  if (!RANGE_DAYS[range]) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  const key = range;
  const cached = sCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({ items: cached.data, total: cached.total, at: cached.at });
  }

  try {
    const result = await fetchRange(range);
    sCache.set(key, result);
    return NextResponse.json({ items: result.data, total: result.total, at: result.at });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    // If we have stale data, return that instead of an error
    if (cached) {
      return NextResponse.json({ items: cached.data, total: cached.total, at: cached.at, stale: true });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
