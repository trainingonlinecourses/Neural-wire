'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchGhTrending,
  fetchHfTrending,
  fetchRadarSignals,
  rankAll,
  type Cand,
  type RadarSignal,
  type TrendingKind,
  type TrendingRow,
} from '@/lib/trending';
import { ago } from '@/lib/utils';

type Filter = 'all' | TrendingKind;

const CACHE_TTL = 5 * 60 * 1000;
let cache: { rows: TrendingRow[]; at: number } | null = null;

const KIND_LABEL: Record<TrendingKind, string> = { gh: '🔥 GH', hf: '🤗 HF', radar: '🌍 RADAR' };

function signalToCand(s: RadarSignal): Cand {
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

function TrendRow({ row, rank }: { row: TrendingRow; rank: number }) {
  const inner = (
    <>
      <div className={'trend-rank' + (rank <= 3 ? ' top' : '')}>{rank}</div>
      <div className="trend-main">
        <span className={'trend-kind ' + row.kind}>{KIND_LABEL[row.kind]}</span>
        <span className="trend-name">{row.name}</span>
        {row.tags &&
          row.tags.length > 0 &&
          row.tags.map((t) => (
            <span className="gh-topic" key={t}>
              {t}
            </span>
          ))}
        <span className="trend-sub">{row.sub}</span>
      </div>
      <div className="trend-meta">
        <span className="trend-metric">{row.metric}</span>
        <div className="trend-heat">
          <i style={{ width: row.heat + '%' }} />
        </div>
        <span className="trend-pct">{row.heat}% heat</span>
      </div>
    </>
  );
  return row.href ? (
    <a className="trend-row" href={row.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className="trend-row">{inner}</div>
  );
}

export function TrendingView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [rows, setRows] = useState<TrendingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);

  const load = useCallback((force = false) => {
    if (!force && cache && Date.now() - cache.at < CACHE_TTL) {
      setRows(cache.rows);
      setAt(cache.at);
      return;
    }
    setLoading(true);
    setError(null);
    const key = (typeof window !== 'undefined' ? window.localStorage.getItem('nw_wmkey') : '') || '';
    Promise.allSettled([fetchGhTrending(), fetchHfTrending(), fetchRadarSignals(key)]).then((results) => {
      const kinds: TrendingKind[] = ['gh', 'hf', 'radar'];
      const groups: { kind: TrendingKind; items: Cand[] }[] = [];
      const errs: string[] = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const value = res.value as Cand[] | RadarSignal[];
          const items: Cand[] = kinds[i] === 'radar' ? (value as RadarSignal[]).map(signalToCand) : (value as Cand[]);
          groups.push({ kind: kinds[i], items });
        } else errs.push(kinds[i] + ': ' + (res.reason as Error).message);
      });
      if (groups.length === 0) {
        setError(errs.join(' · '));
      } else if (errs.length) {
        setError('partial: ' + errs.join(' · '));
      }
      const ranked = rankAll(groups);
      cache = { rows: ranked, at: Date.now() };
      setRows(ranked);
      setAt(Date.now());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = rows ? (filter === 'all' ? rows : rows.filter((r) => r.kind === filter)) : null;
  const counts = rows
    ? {
        gh: rows.filter((r) => r.kind === 'gh').length,
        hf: rows.filter((r) => r.kind === 'hf').length,
        radar: rows.filter((r) => r.kind === 'radar').length,
      }
    : null;

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
              🌐 ALL
            </button>
            <button className={'seg-btn' + (filter === 'gh' ? ' active' : '')} onClick={() => setFilter('gh')}>
              🔥 GITHUB
            </button>
            <button className={'seg-btn' + (filter === 'hf' ? ' active' : '')} onClick={() => setFilter('hf')}>
              🤗 HF
            </button>
            <button className={'seg-btn' + (filter === 'radar' ? ' active' : '')} onClick={() => setFilter('radar')}>
              🌍 RADAR
            </button>
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="stats">
          <div className="stat">
            <b>{rows?.length ?? '—'}</b>trending items
          </div>
          <div className="stat">
            <b>{counts?.gh ?? '—'}</b>github repos
          </div>
          <div className="stat">
            <b>{counts?.hf ?? '—'}</b>hf models
          </div>
          <div className="stat">
            <b>{counts?.radar ?? '—'}</b>radar signals
          </div>
          <div className="stat">
            <b>{at ? ago(new Date(at)) : '—'}</b>last fetched
          </div>
        </div>
        <div className="meta-row">
          <span>UNIFIED RANKING — heat = position within its own source (★ stars · ❤ likes · 🌍 index), normalized to 100</span>
          {error && <span className="err">{error}</span>}
        </div>
      </div>
      <div className="wrap">
        <div className="trend">
          {shown?.map((r, i) => (
            <TrendRow key={r.kind + ':' + r.id} row={r} rank={i + 1} />
          ))}
          {loading && !rows && <p className="empty">Pulling GitHub, Hugging Face & WorldMonitor live…</p>}
          {!rows && !loading && !error && <p className="empty">Loading…</p>}
          {!rows && error && (
            <p className="empty">
              <b>Trending feed unavailable ({error})</b>
              <br />
              Check connection and retry.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
