'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGhTrending,
  fetchHfTrending,
  fetchRadarSignals,
  rankAll,
  signalToCand,
  type Cand,
  type RadarSignal,
  type TimeRange,
  type TrendingKind,
  type TrendingRow,
} from '@/lib/trending';
import { addedKeys, formatCountdown, idDiff } from '@/lib/refresh';
import { useAutoSync } from '@/lib/use-auto-sync';
import { ago } from '@/lib/utils';
import { TrendRow } from './trend-row';

type Filter = 'all' | TrendingKind;

const CACHE_TTL = 5 * 60 * 1000;
let cache: Partial<Record<TimeRange, { rows: TrendingRow[]; at: number }>> = {};

const RANGES: TimeRange[] = ['24h', '7d', '30d'];

const AUTO_REFRESH_SECONDS = 180;

export function TrendingView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [range, setRangeState] = useState<TimeRange>('7d');
  const rangeRef = useRef<TimeRange>('7d');
  const [rows, setRows] = useState<TrendingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);
  const [lastSync, setLastSync] = useState<{ added: number; removed: number } | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  /** kind:id keys introduced by the most recent sync — they show the NEW badge. */
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const rowsRef = useRef<TrendingRow[] | null>(null);

  const load = useCallback((force = false) => {
    const r = rangeRef.current;
    const hit = cache[r];
    if (!force && hit && Date.now() - hit.at < CACHE_TTL) {
      setRows(hit.rows);
      setAt(hit.at);
      return;
    }
    setLoading(true);
    setError(null);
    const key = (typeof window !== 'undefined' ? window.localStorage.getItem('nw_wmkey') : '') || '';
    Promise.allSettled([fetchGhTrending(r), fetchHfTrending(r), fetchRadarSignals(key)]).then((results) => {
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
      const prev = rowsRef.current;
      if (prev) {
        const prevKeys = prev.map((r) => r.kind + ':' + r.id);
        const nextKeys = ranked.map((r) => r.kind + ':' + r.id);
        setLastSync(idDiff(prevKeys, nextKeys));
        setSyncFailed(errs.length > 0);
        // Rows that appeared since the previous sync get the flashing NEW badge.
        setNewKeys(new Set(addedKeys(prevKeys, nextKeys)));
      }
      rowsRef.current = ranked;
      cache[r] = { rows: ranked, at: Date.now() };
      setRows(ranked);
      setAt(Date.now());
      setLoading(false);
    });
  }, []);

  const selectRange = (r: TimeRange) => {
    rangeRef.current = r;
    setRangeState(r);
    rowsRef.current = null; // a range switch is a fresh ranking, not a sync diff
    setNewKeys(new Set());
    load(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { remaining, syncing, sync } = useAutoSync(AUTO_REFRESH_SECONDS, () => load(true));

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
          <div className="seg" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r}
                className={'seg-btn' + (range === r ? ' active' : '')}
                onClick={() => selectRange(r)}
                aria-pressed={range === r}
                title={'Trending from the last ' + (r === '24h' ? '24 hours' : r === '7d' ? '7 days' : '30 days')}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={sync} disabled={loading}>
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
          <span>UNIFIED RANKING — LAST {range.toUpperCase()} · heat = position within its own source (★ stars · ❤ likes · 🌍 index), normalized to 100</span>
          <span className="meta-right">
            {lastSync !== null && (
              <span className={'sync' + (syncFailed ? ' err' : '')}>
                {syncing
                  ? '⟳ syncing…'
                  : syncFailed
                    ? '⚠ sync failed'
                    : lastSync.added > 0 || lastSync.removed > 0
                      ? `✓ +${lastSync.added} · −${lastSync.removed}`
                      : '✓ up to date'}
              </span>
            )}
            <span
              className={'sync-count' + (remaining <= 10 && !syncing ? ' urgent' : '')}
              title="Auto re-syncs every 3 minutes without a reload"
            >
              ⟳ {syncing ? '…' : formatCountdown(remaining)}
            </span>
            {error && <span className="err">{error}</span>}
          </span>
        </div>
      </div>
      <div className="wrap">
        <div className="trend">
          {shown?.map((r, i) => (
            <TrendRow
              key={r.kind + ':' + r.id}
              row={r}
              rank={i + 1}
              isNew={newKeys.has(r.kind + ':' + r.id)}
            />
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
