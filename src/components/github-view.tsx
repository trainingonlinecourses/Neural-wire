'use client';

import { useCallback, useEffect, useState } from 'react';
import { GhCard, type GhRepo } from './gh-card';
import { isoDaysAgo, fmtStars, ago } from '@/lib/utils';

type Mode = 'rising' | 'active';

interface GHData {
  items: GhRepo[];
  at: number;
  total: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const cache: Partial<Record<Mode, GHData>> = {};

async function ghSearch(q: string, sort: string, order: string, per = 20, page = 1): Promise<{ total_count: number; items: GhRepo[] }> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&per_page=${per}&page=${page}`;
  const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

export function GitHubView() {
  const [mode, setMode] = useState<Mode>('rising');
  const [data, setData] = useState<GHData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [langFilter, setLangFilter] = useState<string>('all');

  const load = useCallback((m: Mode, force = false) => {
    if (!force && cache[m] && Date.now() - cache[m].at < CACHE_TTL) {
      setData(cache[m]);
      return;
    }
    setLoading(true);
    setError(null);
    const d7 = isoDaysAgo(7);
    const d1 = isoDaysAgo(1);
    const queries =
      m === 'rising'
        ? ['topic:ai created:>=' + d7 + ' stars:>=3', 'topic:llm created:>=' + d7 + ' stars:>=3', 'topic:generative-ai created:>=' + d7 + ' stars:>=3']
        : ['topic:ai pushed:>=' + d1 + ' stars:>=200', 'topic:llm pushed:>=' + d1 + ' stars:>=200'];
    Promise.all(queries.map((q) => ghSearch(q, 'stars', 'desc', 20, 1)))
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
        if (m === 'rising') items.sort((a, b) => b.stargazers_count - a.stargazers_count);
        else items.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
        const slim = items.slice(0, 24);
        cache[m] = { items: slim, at: Date.now(), total };
        setData(cache[m]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    load(m);
  };

  const starsSum = data?.items.reduce((a, r) => a + r.stargazers_count, 0) || 0;

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (mode === 'rising' ? ' active' : '')} onClick={() => switchMode('rising')}>
              ⚡ RISING
            </button>
            <button className={'seg-btn' + (mode === 'active' ? ' active' : '')} onClick={() => switchMode('active')}>
              🔥 ACTIVE
            </button>
          </div>
          <button className="btn primary" onClick={() => load(mode, true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="stats">
          <div className="stat">
            <b>{fmtStars(data?.total || 0)}</b>matching repos
          </div>
          <div className="stat">
            <b>{fmtStars(starsSum)}</b>combined stars
          </div>
          <div className="stat">
            <b>{data?.items.length || 0}</b>repos shown
          </div>
          <div className="stat">
            <b>{data ? ago(new Date(data.at)) : '—'}</b>last fetched
          </div>
        </div>
        <div className="meta-row">
          <span>
            {mode === 'rising'
              ? 'METHOD: CREATED ≤7 DAYS · TOPICS ai/llm/generative-ai · BY STARS'
              : 'METHOD: PUSHED ≤24H · 200+ STARS · TOPICS ai/llm · BY LATEST PUSH'}
          </span>
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
              {langs.slice(0, 8).map((l) => {
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
