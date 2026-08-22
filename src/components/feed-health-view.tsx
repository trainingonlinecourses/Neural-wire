'use client';

/**
 * Feed Health Dashboard — real-time monitoring of all news sources.
 * Shows which feeds are active, stale, or offline, with freshness
 * indicators and story counts. Unique because no other AI news
 * dashboard shows its own feed health.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ago } from '@/lib/utils';

interface SourceHealth {
  id: string;
  name: string;
  short: string;
  color: string;
  kind: string;
  storyCount: number;
  latestStory: number | null;
  ageHours: number | null;
  health: number;
  status: 'active' | 'stale' | 'dormant' | 'offline';
}

interface FeedHealthPayload {
  sources: SourceHealth[];
  summary: {
    total: number;
    active: number;
    stale: number;
    dormant: number;
    offline: number;
    avgHealth: number;
    totalStories: number;
  };
  generatedAt: number;
  demo: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  stale: '#f59e0b',
  dormant: '#6b7280',
  offline: '#ef4444',
};

const STATUS_ICONS: Record<string, string> = {
  active: '🟢',
  stale: '🟡',
  dormant: '⚫',
  offline: '🔴',
};

export function FeedHealthView() {
  const [data, setData] = useState<FeedHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/feed-health', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<FeedHealthPayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.sources;
    return data.sources.filter((s) => s.status === filter);
  }, [data, filter]);

  if (loading && !data) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Checking feed health…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Feed health unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <>
      {/* Dashboard header */}
      <div className="wrap">
        <div className="fh-dashboard">
          <div className="fh-gauge">
            <div className="fh-gauge-label">HEALTH INDEX</div>
            <div className="fh-gauge-value" style={{
              color: summary.avgHealth >= 60 ? '#22c55e' : summary.avgHealth >= 30 ? '#f59e0b' : '#ef4444'
            }}>
              {summary.avgHealth}
            </div>
            <div className="fh-gauge-bar">
              <div className="fh-gauge-fill" style={{ width: `${summary.avgHealth}%` }} />
            </div>
          </div>
          <div className="fh-stats-grid">
            <div className="fh-stat">
              <span className="fh-stat-count">{summary.totalStories}</span>
              <span className="fh-stat-label">Total stories</span>
            </div>
            <div className="fh-stat">
              <span className="fh-stat-count" style={{ color: STATUS_COLORS.active }}>{summary.active}</span>
              <span className="fh-stat-label">🟢 Active</span>
            </div>
            <div className="fh-stat">
              <span className="fh-stat-count" style={{ color: STATUS_COLORS.stale }}>{summary.stale}</span>
              <span className="fh-stat-label">🟡 Stale</span>
            </div>
            <div className="fh-stat">
              <span className="fh-stat-count" style={{ color: STATUS_COLORS.dormant }}>{summary.dormant}</span>
              <span className="fh-stat-label">⚫ Dormant</span>
            </div>
            <div className="fh-stat">
              <span className="fh-stat-count" style={{ color: STATUS_COLORS.offline }}>{summary.offline}</span>
              <span className="fh-stat-label">🔴 Offline</span>
            </div>
            <div className="fh-stat">
              <span className="fh-stat-count">{summary.total}</span>
              <span className="fh-stat-label">Total sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            {[
              { key: 'all', label: `🌐 ALL (${summary.total})` },
              { key: 'active', label: `🟢 ACTIVE (${summary.active})` },
              { key: 'stale', label: `🟡 STALE (${summary.stale})` },
              { key: 'dormant', label: `⚫ DORMANT (${summary.dormant})` },
              { key: 'offline', label: `🔴 OFFLINE (${summary.offline})` },
            ].map((f) => (
              <button
                key={f.key}
                className={'seg-btn' + (filter === f.key ? ' active' : '')}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'SCANNING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>

      {/* Source list */}
      <div className="wrap fh-source-list">
        {filtered.map((src) => (
          <article
            key={src.id}
            className="fh-source-card"
            style={{ borderLeftColor: STATUS_COLORS[src.status] }}
          >
            <div className="fh-source-head">
              <span
                className="fh-source-badge"
                style={{ background: src.color + '22', color: src.color, borderColor: src.color + '44' }}
              >
                {src.short}
              </span>
              <span className="fh-source-name">{src.name}</span>
              <span className="fh-source-kind dim">{src.kind}</span>
              <span className="fh-source-status" style={{ color: STATUS_COLORS[src.status] }}>
                {STATUS_ICONS[src.status]} {src.status}
              </span>
            </div>
            <div className="fh-source-stats">
              <span title="Story count">📰 {src.storyCount} stories</span>
              <span title="Latest story">
                {src.latestStory ? `🕐 ${ago(new Date(src.latestStory))}` : '—'}
              </span>
              <span title="Health score">
                ❤️ {src.health}/100
              </span>
            </div>
            {/* Health bar */}
            <div className="fh-source-bar">
              <div
                className="fh-source-bar-fill"
                style={{
                  width: `${src.health}%`,
                  background: src.health >= 60 ? '#22c55e' : src.health >= 30 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
