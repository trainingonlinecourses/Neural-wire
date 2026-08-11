'use client';

import { useMemo, useState } from 'react';
import type { NewsData } from '@/lib/data';
import { NewsCard } from './news-card';

export function ModelWatch({ data }: { data: NewsData }) {
  const [q, setQ] = useState('');

  const models = useMemo(() => {
    const list = data.stories.filter((s) => s.isModel);
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        s.models.some((m) => m.toLowerCase().includes(needle)),
    );
  }, [data.stories, q]);

  const mentioned = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of data.stories) for (const m of s.models) counts.set(m, (counts.get(m) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [data.stories]);

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <input
            className="field"
            placeholder="Filter model names…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="dim" style={{ alignSelf: 'center' }}>
            {models.length} model stories
          </span>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>MOST-MENTIONED MODELS IN THE WIRE</span>
        </div>
        <div className="chips">
          {mentioned.map(([m, n]) => (
            <button key={m} className="chip" onClick={() => setQ(m)}>
              {m} · {n}
            </button>
          ))}
        </div>
      </div>
      <div className="wrap grid">
        {models.map((s) => (
          <NewsCard key={s.id} story={s} />
        ))}
        {models.length === 0 && <p className="empty">No model releases in the feed right now.</p>}
      </div>
    </>
  );
}
