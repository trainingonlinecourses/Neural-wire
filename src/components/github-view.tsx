'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GhCard, type GhRepo } from './gh-card';
import { isoDaysAgo, fmtStars, ago } from '@/lib/utils';

type TimeRange = 'day' | 'week' | 'month' | '3mo' | '6mo' | '1yr' | 'all';

interface GHData {
  items: GhRepo[];
  at: number;
  total: number;
}

const RANGE_DAYS: Record<TimeRange, number> = { day: 1, week: 7, month: 30, '3mo': 90, '6mo': 180, '1yr': 365, all: 9999 };
const RANGE_LABELS: Record<TimeRange, string> = { day: '24H', week: '7D', month: '1M', '3mo': '3M', '6mo': '6M', '1yr': '1Y', all: 'ALL' };
const RANGE_MIN_STARS: Record<TimeRange, number> = { day: 10, week: 5, month: 10, '3mo': 20, '6mo': 50, '1yr': 100, all: 200 };

const CACHE_TTL = 5 * 60 * 1000;
const cache: Partial<Record<TimeRange, GHData>> = {};

async function ghSearch(q: string, sort: string, order: string, per = 30): Promise<{ total_count: number; items: GhRepo[] }> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&per_page=${per}`;
  const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

export function GitHubView() {
  const [range, setRangeState] = useState<TimeRange>('week');
  const rangeRef = useRef<TimeRange>('week');
  const [data, setData] = useState<GHData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [langFilter, setLangFilter] = useState<string>('all');

  const load = useCallback((r: TimeRange, force = false) => {
    if (!force && cache[r] && Date.now() - cache[r].at < CACHE_TTL) {
      setData(cache[r]);
      return;
    }
    setLoading(true);
    setError(null);
    const days = RANGE_DAYS[r];
    const minStars = RANGE_MIN_STARS[r];
    const since = isoDaysAgo(days);
    const topics = ['ai', 'llm', 'generative-ai', 'machine-learning', 'deep-learning', 'neural-network'];
    const queries = days <= 7
      ? topics.slice(0, 3).map((t) => `topic:${t} created:>=${since} stars:>=${minStars}`)
      : days <= 365
        ? topics.slice(0, 3).map((t) => `topic:${t} created:>=${since} stars:>=${minStars}`)
        : topics.slice(0, 3).map((t) => `topic:${t} stars:>=${minStars}`);

    Promise.all(queries.map((q) => ghSearch(q, 'stars', 'desc', 30)))
      .then((results) => {
        const seen = new Set<string>();
        const items: GhRepo[] = [];
        let total = 0;
        results.forEach((j) => {
          total = Math.max(total, j.total_count || 0);
          (j.items || []).forEach((r) => {
            if (!seen.has(r.full_name)) {
              seen.add(r.full_name);
              items.push(r);
            }
          });
        });
        items.sort((a, b) => b.stargazers_count - a.stargazers_count);
        const slim = items.slice(0, 40);
        cache[r] = { items: slim, at: Date.now(), total };
        setData(cache[r]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const switchRange = (r: TimeRange) => {
    rangeRef.current = r;
    setRangeState(r);
    load(r);
  };

  const starsSum = data?.items.reduce((a, r) => a + r.stargazers_count, 0) || 0;

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg" role="group" aria-label="Time range">
            {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
              <button
                key={r}
                className={'seg-btn' + (range === r ? ' active' : '')}
                onClick={() => switchRange(r)}
                aria-pressed={range === r}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => load(range, true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="stats">
          <div className="stat"><b>{fmtStars(data?.total || 0)}</b>matching repos</div>
          <div className="stat"><b>{fmtStars(starsSum)}</b>combined stars</div>
          <div className="stat"><b>{data?.items.length || 0}</b>repos shown</div>
          <div className="stat"><b>{data ? ago(new Date(data.at)) : '—'}</b>last fetched</div>
        </div>
        <div className="meta-row">
          <span>GITHUB TRENDING · LAST {RANGE_LABELS[range]} · {RANGE_MIN_STARS[range]}+ STARS · TOPICS ai/llm/machine-learning</span>
          {error && <span className="err">{error}</span>}
        </div>
        {data && data.items.length > 0 && (() => {
          const langs = [...new Set(data.items.map((r) => r.language).filter((l): l is string => Boolean(l)))].sort();
          if (langs.length < 2) return null;
          return (
            <div className="gh-lang-chips">
              <button className={'chip' + (langFilter === 'all' ? ' on' : '')} onClick={() => setLangFilter('all')}>
                ALL · {data.items.length}
              </button>
              {langs.slice(0, 10).map((l) => {
                const count = data.items.filter((r) => r.language === l).length;
                return (
                  <button key={l} className={'chip' + (langFilter === l ? ' on' : '')} onClick={() => setLangFilter(l)}>
                    {l} · {count}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>
      <div className="wrap grid">
        {data?.items
          .filter((r) => langFilter === 'all' || r.language === langFilter)
          .map((r, i) => (
            <GhCard key={r.full_name} r={r} rank={i + 1} />
          ))}
        {loading && !data && <p className="empty">Pulling live from the GitHub API…</p>}
        {!data && !loading && !error && <p className="empty">Loading…</p>}
        {error && !data && (
          <p className="empty">
            <b>GitHub request failed ({error})</b>
            <br />
            {/403|429/.test(error)
              ? 'Unauthenticated rate limit — wait ~1 minute and retry.'
              : 'Check your connection and retry.'}
          </p>
        )}
      </div>
    </>
  );
}


