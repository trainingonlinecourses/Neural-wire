'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NewsData } from '@/lib/data';
import { NewsCard } from './news-card';
import { LiveModelsView } from './live-models-view';
import { rosterByNewest, vendorFlag } from '@/lib/benchmarks';
import { groupByTime } from '@/lib/time-groups';

export function ModelWatch({ data }: { data: NewsData }) {
  const [q, setQ] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const roster = useMemo(() => rosterByNewest(), []);

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

  const groups = useMemo(() => {
    return groupByTime(models, (s) => s.date);
  }, [models]);

  // Auto-expand the first group
  useEffect(() => {
    if (groups.length > 0 && expandedGroup === null) {
      setExpandedGroup(groups[0].label);
    }
  }, [groups, expandedGroup]);

  const mentioned = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of data.stories) for (const m of s.models) counts.set(m, (counts.get(m) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [data.stories]);

  const toggleGroup = (label: string) => {
    setExpandedGroup(expandedGroup === label ? null : label);
  };

  return (
    <>
      <LiveModelsView />
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
          <span>
            MODEL ROSTER · {roster.length} VERIFIED FLAGSHIPS — newest first
          </span>
          <span className="meta-right">
            <a className="open" href="/leaderboard" target="_blank" rel="noopener noreferrer">
              COMPARE ON LEADERBOARD ↗
            </a>
          </span>
        </div>
        <div className="roster">
          {roster.map((m) => (
            <div className="roster-row" key={m.model}>
              <span className="roster-flag" title={m.vendor} aria-hidden="true">
                {vendorFlag(m.vendor)}
              </span>
              <span className="roster-name">{m.model}</span>
              <span className="roster-vendor">{m.vendor}</span>
              <span className="roster-date">{m.released}</span>
              <span className="roster-scores">
                {Object.entries(m.scores)
                  .filter(([, v]) => v != null)
                  .map(([bid, v]) => bid.toUpperCase() + ' ' + (v as number).toFixed(1))
                  .join(' · ')}
              </span>
              <a
                className="open roster-src"
                href={m.source}
                target="_blank"
                rel="noopener noreferrer"
                title={'Official: ' + m.source}
              >
                CARD ↗
              </a>
            </div>
          ))}
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
      {/* Time-grouped model stories */}
      <div className="wrap">
        <div className="meta-row">
          <span>MODEL NEWS · {models.length} stories grouped by date</span>
        </div>
      </div>
      <div className="model-time-groups">
        {groups.length === 0 && (
          <div className="wrap">
            <p className="empty">No model releases in the feed right now.</p>
          </div>
        )}
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.label;
          return (
            <div key={group.label} className="model-time-group">
              <button
                className="mtg-header"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isExpanded}
              >
                <span className="mtg-label">📰 {group.label}</span>
                <span className="mtg-count">{group.items.length} stor{group.items.length !== 1 ? 'ies' : 'y'}</span>
                <span className="mtg-chevron">{isExpanded ? '▾' : '▸'}</span>
              </button>
              {isExpanded && (
                <div className="mtg-body grid">
                  {(group.items as typeof models).map((s) => (
                    <NewsCard key={s.id} story={s} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
