'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SourceRow, NewsData } from '@/lib/data';
import type { Story } from '@/lib/types';
import { NewsCard } from './news-card';
import { HeadlineTicker } from './headline-ticker';
import { filterStories } from '@/lib/filter';
import { fmtDate } from '@/lib/utils';
import { formatCountdown, storyDiff } from '@/lib/refresh';

type Sort = 'newest' | 'oldest';
type Show = 'all' | 'models';

interface SyncState {
  added: number;
  removed: number;
}

/** Shape returned by GET /api/news/refresh (dates serialized as ISO strings). */
interface RefreshPayload {
  stories: Array<Omit<Story, 'date'> & { date: string }>;
  sources: SourceRow[];
  demo: boolean;
  fetchedAt: number;
}

const SYNC_TIMEOUT_MS = 20_000;

export function NewsExplorer({ data, refreshSeconds = 180 }: { data: NewsData; refreshSeconds?: number }) {
  const [feed, setFeed] = useState<NewsData>(data);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [src, setSrc] = useState('all');
  const [show, setShow] = useState<Show>('all');

  const [remaining, setRemaining] = useState(refreshSeconds);
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSync, setLastSync] = useState<SyncState | null>(null);

  const feedRef = useRef<NewsData>(data);
  const nextSyncAt = useRef(Date.now() + refreshSeconds * 1000);
  const busy = useRef(false);

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  /** Fetch the latest feed and swap it in, preserving the user's filters. */
  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
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
      feedRef.current = next;
      setFeed(next);
      setLastSync(diff);
      setSyncFailed(false);
    } catch {
      setSyncFailed(true);
    } finally {
      clearTimeout(timer);
      busy.current = false;
      setSyncing(false);
      nextSyncAt.current = Date.now() + refreshSeconds * 1000;
      setRemaining(refreshSeconds);
    }
  }, [refreshSeconds]);

  // Countdown ticker — timestamp-based so it self-corrects after tab throttling.
  useEffect(() => {
    nextSyncAt.current = Date.now() + refreshSeconds * 1000;
    setRemaining(refreshSeconds);
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((nextSyncAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) sync();
    }, 1000);
    return () => clearInterval(id);
  }, [refreshSeconds, sync]);

  // When the tab becomes visible again, catch up immediately if a sync is due.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) return;
      const left = Math.max(0, Math.round((nextSyncAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) sync();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sync]);

  const filtered = useMemo(() => {
    let list = feed.stories;
    if (src !== 'all') list = list.filter((s) => s.sourceId === src);
    if (show === 'models') list = list.filter((s) => s.isModel);
    list = filterStories(list, q);
    return [...list].sort((a, b) =>
      sort === 'newest' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime(),
    );
  }, [feed.stories, q, sort, src, show]);

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
      <div className="wrap">
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
          <NewsCard key={s.id} story={s} />
        ))}
        {filtered.length === 0 && <p className="empty">No stories match. Try another search.</p>}
      </div>
    </>
  );
}
