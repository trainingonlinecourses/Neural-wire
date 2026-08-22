'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GhCard, type GhRepo } from './gh-card';
import { fmtStars, ago } from '@/lib/utils';

type TimeRange = 'day' | 'week' | 'month' | '3mo' | '6mo' | '1yr' | 'all';

interface GHData {
  items: GhRepo[];
  at: number;
  total: number;
}

const RANGE_LABELS: Record<TimeRange, string> = {
  day: '24H', week: '7D', month: '1M', '3mo': '3M', '6mo': '6M', '1yr': '1Y', all: 'ALL',
};
const RANGE_MIN_STARS: Record<TimeRange, number> = {
  day: 10, week: 5, month: 10, '3mo': 20, '6mo': 50, '1yr': 100, all: 200,
};

const CACHE_TTL = 10 * 60 * 1000;
const cache: Partial<Record<TimeRange, GHData>> = {};

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

    fetch(`/api/github/trending?range=${r}`)
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.error || `Server ${resp.status}`);
        }
        return resp.json();
      })
      .then((j) => {
        const result: GHData = { items: j.items || [], at: j.at || Date.now(), total: j.total || 0 };
        cache[r] = result;
        setData(result);
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
        {loading && !data && <p className="empty">Pulling live from GitHub (server-side)…</p>}
        {!data && !loading && !error && <p className="empty">Loading…</p>}
        {error && !data && (
          <p className="empty">
            <b>GitHub request failed ({error})</b>
            <br />
            {/403|429|rate/.test(error)
              ? 'Rate-limited — the server will retry automatically. Wait ~1 minute and refresh.'
              : 'Check your connection and retry.'}
          </p>
        )}
      </div>
    </>
  );
}
