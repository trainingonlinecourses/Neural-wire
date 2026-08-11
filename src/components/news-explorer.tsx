'use client';

import { useMemo, useState } from 'react';
import type { SourceRow, NewsData } from '@/lib/data';
import { NewsCard } from './news-card';
import { fmtDate } from '@/lib/utils';

type Sort = 'newest' | 'oldest';
type Show = 'all' | 'models';

export function NewsExplorer({ data }: { data: NewsData }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [src, setSrc] = useState('all');
  const [show, setShow] = useState<Show>('all');

  const filtered = useMemo(() => {
    let list = data.stories;
    if (src !== 'all') list = list.filter((s) => s.sourceId === src);
    if (show === 'models') list = list.filter((s) => s.isModel);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle) ||
          s.models.some((m) => m.toLowerCase().includes(needle)) ||
          s.topics.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    return [...list].sort((a, b) =>
      sort === 'newest' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime(),
    );
  }, [data.stories, q, sort, src, show]);

  return (
    <>
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
            ALL · {data.stories.length}
          </button>
          {data.sources
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
            {filtered.length} stories {data.demo ? '· DEMO MODE (live feeds, no DB)' : '· persisted in Postgres'}
          </span>
          <span className="dim">{fmtDate(new Date(data.fetchedAt))}</span>
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
