'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGhStarDelta,
  fetchGhTrending,
  fetchHfTrending,
  rankAll,
  signalToCand,
  sortByRisers,
  type Cand,
  type TimeRange,
  type TrendingKind,
  type TrendingRow,
} from '@/lib/trending';
import type { PulseSignal } from '@/lib/pulse';
import { addedKeys, formatCountdown, idDiff, parseRefreshInterval, refreshIntervalLabel, REFRESH_INTERVALS } from '@/lib/refresh';
import { useAutoSync } from '@/lib/use-auto-sync';
import { ago } from '@/lib/utils';
import { TrendRow } from './trend-row';

type Filter = 'all' | TrendingKind;
type SortMode = 'heat' | 'risers';

const CACHE_TTL = 5 * 60 * 1000;
let cache: Partial<Record<TimeRange, { rows: TrendingRow[]; at: number }>> = {};

const RANGES: TimeRange[] = ['24h', '7d', '30d'];

const REFRESH_KEY = 'nw_trend_refresh';
/** localStorage snapshot of the last fetched ranking, so data survives reloads. */
const TREND_CACHE_KEY = 'nw_trend_cache';
const DEFAULT_REFRESH_SECONDS = 180;

function readTrendCache(range: TimeRange): { rows: TrendingRow[]; at: number } | null {
  try {
    const raw = window.localStorage.getItem(TREND_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, { rows: TrendingRow[]; at: number } | undefined>;
    const hit = parsed[range];
    if (!hit || !Array.isArray(hit.rows)) return null;
    if (Date.now() - hit.at > CACHE_TTL) return null;
    return hit;
  } catch {
    return null;
  }
}

function writeTrendCache(range: TimeRange, rows: TrendingRow[], at: number): void {
  try {
    const raw = window.localStorage.getItem(TREND_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    parsed[range] = { rows, at };
    window.localStorage.setItem(TREND_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    /* storage unavailable — in-memory cache only */
  }
}

export function TrendingView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [range, setRangeState] = useState<TimeRange>('7d');
  const rangeRef = useRef<TimeRange>('7d');
  const [rows, setRows] = useState<TrendingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [at, setAt] = useState(0);
  const [lastSync, setLastSync] = useState<{ added: number; removed: number } | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  /** kind:id keys introduced by the most recent sync — they show the NEW badge. */
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [intervalSec, setIntervalSec] = useState(DEFAULT_REFRESH_SECONDS);
  const [sortMode, setSortMode] = useState<SortMode>('heat');
  /** Client-side backoff after a GitHub 403/429 while attaching star deltas (ref, not state, to avoid a stale closure in load). */
  const climbLockedRef = useRef(false);
  const rowsRef = useRef<TrendingRow[] | null>(null);

  // Restore the persisted refresh interval on mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    setIntervalSec(parseRefreshInterval(window.localStorage.getItem(REFRESH_KEY)));
  }, []);

  // Hydrate the ranking from the last session so the page isn't empty on reload.
  useEffect(() => {
    const hit = readTrendCache('7d');
    if (hit) {
      rowsRef.current = hit.rows;
      setRows(hit.rows);
      setAt(hit.at);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const fetchPulse = async (): Promise<PulseSignal[]> => {
      const res = await fetch('/api/pulse', { cache: 'no-store' });
      if (!res.ok) throw new Error('pulse ' + res.status);
      const j = (await res.json()) as { signals: PulseSignal[] };
      return j.signals;
    };
    Promise.allSettled([fetchGhTrending(r), fetchHfTrending(r), fetchPulse()]).then((results) => {
      const kinds: TrendingKind[] = ['gh', 'hf', 'pulse'];
      const groups: { kind: TrendingKind; items: Cand[] }[] = [];
      const errs: string[] = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const value = res.value as Cand[] | PulseSignal[];
          const items: Cand[] = kinds[i] === 'pulse' ? (value as PulseSignal[]).map(signalToCand) : (value as Cand[]);
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
      writeTrendCache(r, ranked, Date.now());
      setRows(ranked);
      setAt(Date.now());
      setLoading(false);
      void attachClimbs(ranked);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Attach real 24h star deltas to the top GH repos so the RISERS sort has
   * genuine climb data. Bounded, non-blocking, with a 10-min cooldown on
   * rate-limit responses (shared-IP safety, same guard as the brief server).
   */
  const attachClimbs = async (rows: TrendingRow[]) => {
    if (climbLockedRef.current) return;
    const ghTop = rows.filter((r) => r.kind === 'gh').slice(0, 6);
    if (!ghTop.length) return;
    const results = await Promise.allSettled(ghTop.map((r) => fetchGhStarDelta(r.id)));
    let limited = false;
    const starsById = new Map<string, number>();
    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        if (res.value.rateLimited) limited = true;
        else if (res.value.stars != null) starsById.set(ghTop[i].id, res.value.stars);
      }
    });
    if (limited) climbLockedRef.current = true;
    if (starsById.size) {
      setRows((prev) =>
        prev?.map((r) => (starsById.has(r.id) ? { ...r, delta: { ...(r.delta || {}), stars: starsById.get(r.id)! } } : r)) ?? null,
      );
    }
  };

  const selectRange = (r: TimeRange) => {
    rangeRef.current = r;
    setRangeState(r);
    rowsRef.current = null; // a range switch is a fresh ranking, not a sync diff
    setNewKeys(new Set());
    load(true);
  };

  const selectInterval = (sec: number) => {
    if (!(REFRESH_INTERVALS as readonly number[]).includes(sec)) return;
    setIntervalSec(sec);
    try {
      window.localStorage.setItem(REFRESH_KEY, String(sec));
    } catch {
      /* storage unavailable — keep the in-memory choice */
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { remaining, syncing, sync } = useAutoSync(intervalSec, () => load(true));

  const shown = rows
    ? sortMode === 'risers'
      ? sortByRisers(filter === 'all' ? rows : rows.filter((r) => r.kind === filter))
      : filter === 'all'
        ? rows
        : rows.filter((r) => r.kind === filter)
    : null;
  const counts = rows
    ? {
        gh: rows.filter((r) => r.kind === 'gh').length,
        hf: rows.filter((r) => r.kind === 'hf').length,
        pulse: rows.filter((r) => r.kind === 'pulse').length,
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
            <button className={'seg-btn' + (filter === 'pulse' ? ' active' : '')} onClick={() => setFilter('pulse')}>
              ⚡ PULSE
            </button>
          </div>
          <div className="seg" role="group" aria-label="Sort mode">
            <button
              className={'seg-btn' + (sortMode === 'heat' ? ' active' : '')}
              onClick={() => setSortMode('heat')}
              aria-pressed={sortMode === 'heat'}
              title="Sort by overall heat within the ranking"
            >
              🔥 HEAT
            </button>
            <button
              className={'seg-btn' + (sortMode === 'risers' ? ' active' : '')}
              onClick={() => setSortMode('risers')}
              aria-pressed={sortMode === 'risers'}
              title="Sort by 24h climb: new stars (GitHub) and HF momentum first"
            >
              ⚡ RISERS
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
          <select
            className="field refresh-select"
            value={intervalSec}
            onChange={(e) => selectInterval(Number(e.target.value))}
            title="Auto re-sync interval"
            aria-label="Auto re-sync interval"
          >
            {REFRESH_INTERVALS.map((s) => (
              <option key={s} value={s}>
                {refreshIntervalLabel(s)}
              </option>
            ))}
          </select>
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
            <b>{counts?.pulse ?? '—'}</b>pulse signals
          </div>
          <div className="stat">
            <b>{at ? ago(new Date(at)) : '—'}</b>last fetched
          </div>
        </div>
        <div className="meta-row">
          <span>UNIFIED RANKING — LAST {range.toUpperCase()} · heat = position within its own source (★ stars · ❤ likes · ⚡ pulse), normalized to 100</span>
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
              title={`Auto re-syncs every ${refreshIntervalLabel(intervalSec).toLowerCase()} without a reload`}
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
          {loading && !rows && (
            <div className="skel-rows" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="skel-row" key={i}>
                  <div className="sh" style={{ width: 46, height: 16 }} />
                  <div className="sh" style={{ height: 18 }} />
                  <div className="sh" style={{ width: 96, height: 16 }} />
                </div>
              ))}
            </div>
          )}
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
