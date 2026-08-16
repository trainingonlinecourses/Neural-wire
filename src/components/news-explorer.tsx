'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SourceRow, NewsData } from '@/lib/data';
import type { Story } from '@/lib/types';
import { NewsCard } from './news-card';
import { HeadlineTicker } from './headline-ticker';
import { filterStories } from '@/lib/filter';
import { fmtDate } from '@/lib/utils';
import { formatCountdown, storyDiff } from '@/lib/refresh';
import { useAutoSync } from '@/lib/use-auto-sync';
import { coverageClusters, coverageMembers } from '@/lib/cluster';
import { loadWatchTerms, saveWatchTerms, normalizeTerm, matchStories, MAX_WATCH_TERMS } from '@/lib/watch';

type Sort = 'newest' | 'oldest';
type Show = 'all' | 'models';

interface SyncState {
  added: number;
  removed: number;
}

interface WatchAlert {
  story: Story;
  term: string;
}

/** Shape returned by GET /api/news/refresh (dates serialized as ISO strings). */
interface RefreshPayload {
  stories: Array<Omit<Story, 'date'> & { date: string }>;
  sources: SourceRow[];
  demo: boolean;
  fetchedAt: number;
}

const SYNC_TIMEOUT_MS = 20_000;
const MAX_ALERTS = 24;

export function NewsExplorer({ data, refreshSeconds = 180 }: { data: NewsData; refreshSeconds?: number }) {
  const [feed, setFeed] = useState<NewsData>(data);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [src, setSrc] = useState('all');
  const [show, setShow] = useState<Show>('all');

  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSync, setLastSync] = useState<SyncState | null>(null);

  // Keyword watch: watched terms + alerts raised by new stories on sync.
  const [watchTerms, setWatchTerms] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState('');
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);

  const feedRef = useRef<NewsData>(data);
  const watchTermsRef = useRef<string[]>([]);

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  useEffect(() => {
    watchTermsRef.current = watchTerms;
  }, [watchTerms]);

  // Restore watched terms on mount (client-only, no SSR mismatch).
  useEffect(() => {
    setWatchTerms(loadWatchTerms());
  }, []);

  const addWatchTerm = () => {
    const t = normalizeTerm(watchInput);
    if (!t) return;
    setWatchTerms((prev) => {
      if (prev.includes(t)) return prev;
      const next = [...prev, t].slice(0, MAX_WATCH_TERMS);
      saveWatchTerms(next);
      return next;
    });
    setWatchInput('');
  };

  const removeWatchTerm = (t: string) => {
    setWatchTerms((prev) => {
      const next = prev.filter((x) => x !== t);
      saveWatchTerms(next);
      return next;
    });
  };

  const dismissAlert = (i: number) => setAlerts((prev) => prev.filter((_, idx) => idx !== i));
  const clearAlerts = () => setAlerts([]);

  /** Fetch the latest feed and swap it in, preserving the user's filters. */
  const doSync = useCallback(async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SYNC_TIMEOUT_MS);
    try {
      const res = await fetch('/api/news/refresh', { cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) throw new Error(`refresh ${res.status}`);
      const payload = (await res.json()) as RefreshPayload;
      const next: NewsData = {
        stories: payload.stories.map((s) => ({ ...s, date: new Date(s.date) })),
        sources: payload.sources,
        demo: payload.demo,
        fetchedAt: payload.fetchedAt,
      };
      const diff = storyDiff(feedRef.current.stories, next.stories);
      // Raise alerts only for stories that are NEW since the last sync.
      const prevIds = new Set(feedRef.current.stories.map((s) => s.id));
      const added = next.stories.filter((s) => !prevIds.has(s.id));
      const fresh = matchStories(added, watchTermsRef.current);
      if (fresh.length) setAlerts((prev) => [...fresh, ...prev].slice(0, MAX_ALERTS));
      feedRef.current = next;
      setFeed(next);
      setLastSync(diff);
      setSyncFailed(false);
    } catch {
      setSyncFailed(true);
    } finally {
      clearTimeout(timer);
    }
  }, []);

  // Shared timestamp-based countdown (same hook as /trending): self-corrects
  // after tab throttling, catches up on visibility, re-arms after each sync.
  const { remaining, syncing, sync } = useAutoSync(refreshSeconds, doSync);

  const filtered = useMemo(() => {
    let list = feed.stories;
    if (src !== 'all') list = list.filter((s) => s.sourceId === src);
    if (show === 'models') list = list.filter((s) => s.isModel);
    list = filterStories(list, q);
    return [...list].sort((a, b) =>
      sort === 'newest' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime(),
    );
  }, [feed.stories, q, sort, src, show]);

  const byId = useMemo(() => new Map(feed.stories.map((s) => [s.id, s])), [feed.stories]);

  // Coverage clusters over the current view: same story from several sources.
  const clusters = useMemo(() => coverageClusters(filtered), [filtered]);

  const status =
    syncing
      ? '⟳ syncing…'
      : syncFailed
        ? '⚠ sync failed'
        : lastSync && (lastSync.added > 0 || lastSync.removed > 0)
          ? `✓ +${lastSync.added} · −${lastSync.removed}`
          : '✓ up to date';

  return (
    <>
      <div className="wrap" id="wire">
        <HeadlineTicker stories={feed.stories} />
      </div>
      <div className="wrap">
        <div className="searchbar">
          <input
            className="field"
            placeholder="Search stories, models, topics…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="field" value={show} onChange={(e) => setShow(e.target.value as Show)}>
            <option value="all">ALL STORIES</option>
            <option value="models">MODEL RELEASES</option>
          </select>
          <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
          </select>
        </div>
      </div>
      <div className="wrap">
        <div className="chips">
          <button className={'chip' + (src === 'all' ? ' on' : '')} onClick={() => setSrc('all')}>
            ALL · {feed.stories.length}
          </button>
          {feed.sources
            .filter((s: SourceRow) => s.count > 0)
            .map((s: SourceRow) => (
              <button
                key={s.id}
                className={'chip' + (src === s.id ? ' on' : '')}
                style={src === s.id ? { background: s.color, borderColor: s.color } : undefined}
                onClick={() => setSrc(s.id)}
              >
                {s.short} · {s.count}
              </button>
            ))}
        </div>
      </div>
      <div className="wrap">
        <div className="watch-bar">
          <span className="watch-label">🔔 WATCH</span>
          <input
            className="field watch-input"
            placeholder="Alert me when a new story mentions…"
            value={watchInput}
            onChange={(e) => setWatchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addWatchTerm();
            }}
            aria-label="Watch term"
          />
          <button className="btn" onClick={addWatchTerm} disabled={!normalizeTerm(watchInput)}>
            + ADD
          </button>
          {watchTerms.map((t) => (
            <span className="watch-chip" key={t}>
              {t}
              <button className="watch-x" onClick={() => removeWatchTerm(t)} aria-label={'Remove watch term ' + t}>
                ✕
              </button>
            </span>
          ))}
          {watchTerms.length === 0 && <span className="watch-hint">no terms — add one to get pinged on new matches</span>}
        </div>
      </div>
      {alerts.length > 0 && (
        <div className="wrap">
          <div className="alert-stack">
            <div className="alert-head">
              <span>
                🔔 {alerts.length} new match{alerts.length === 1 ? '' : 'es'}
              </span>
              <button className="btn sync-btn" onClick={clearAlerts}>
                CLEAR ALL
              </button>
            </div>
            {alerts.slice(0, 8).map((a, i) => (
              <div className="alert-row" key={a.story.id + ':' + i}>
                <span className="alert-term">{a.term}</span>
                <a href={a.story.link} target="_blank" rel="noopener noreferrer" className="alert-title">
                  {a.story.title}
                </a>
                <button className="watch-x" onClick={() => dismissAlert(i)} aria-label="Dismiss alert">
                  ✕
                </button>
              </div>
            ))}
            {alerts.length > 8 && <div className="alert-more">+ {alerts.length - 8} more</div>}
          </div>
        </div>
      )}
      <div className="wrap">
        <div className="meta-row">
          <span>
            {filtered.length} stories {feed.demo ? '· DEMO MODE (live feeds, no DB)' : '· persisted in Postgres'}
          </span>
          <span className="meta-right">
            {lastSync !== null && <span className={'sync' + (syncFailed ? ' err' : '')}>{status}</span>}
            <span
              className={'sync-count' + (remaining <= 10 && !syncing ? ' urgent' : '')}
              title="Feed re-syncs automatically without a page reload"
            >
              ⟳ {syncing ? '…' : formatCountdown(remaining)}
            </span>
            <button className="btn sync-btn" onClick={() => sync()} disabled={syncing}>
              SYNC NOW
            </button>
            <span className="dim">{fmtDate(new Date(feed.fetchedAt))}</span>
          </span>
        </div>
      </div>
      <div className="wrap grid">
        {filtered.map((s) => (
          <NewsCard
            key={s.id}
            story={s}
            coverage={coverageMembers(clusters, s.id)
              .map((id) => byId.get(id))
              .filter((x): x is Story => Boolean(x))}
          />
        ))}
        {filtered.length === 0 && <p className="empty">No stories match. Try another search.</p>}
      </div>
    </>
  );
}
