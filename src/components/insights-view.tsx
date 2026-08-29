'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';

interface InsightStory {
  title: string;
  url: string;
  source: string;
  time: string;
  score: number;
  topic: string;
}

interface InsightTopic {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  keywords: string[];
}

interface InsightData {
  topStories: InsightStory[];
  trending: InsightTopic[];
  generated: number;
}

const TOPIC_COLORS: Record<string, string> = {
  'LLMs': '#3b82f6',
  'Open Source': '#22c55e',
  'AI Safety': '#ef4444',
  'Computer Vision': '#06b6d4',
  'Robotics': '#f97316',
  'AI Chips': '#76b900',
  'AI Agents': '#8b5cf6',
  'AI Regulation': '#ec4899',
  'AI Medical': '#14b8a6',
  'AI Finance': '#f59e0b',
  'Multimodal': '#6366f1',
  'AI Infrastructure': '#0ea5e9',
  'AI Training': '#e11d48',
  'AI Inference': '#a855f7',
  'AI Privacy': '#7c3aed',
  'AI Education': '#2563eb',
};

export function InsightsView() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/insights');
      if (!r.ok) throw new Error(`Server ${r.status}`);
      const j = await r.json();
      setData(j);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredStories = data?.topStories.filter(
    (s) => !selectedTopic || s.topic === selectedTopic
  ) || [];

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className="seg-btn active">📊 DAILY DIGEST</button>
          </div>
          <button className="btn primary" onClick={() => load()} disabled={loading}>
            {loading ? 'GENERATING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>

      {/* Trending Topics */}
      {data && data.trending.length > 0 && (
        <div className="wrap" style={{ marginBottom: 16 }}>
          <div className="section-note">TRENDING TOPICS</div>
          <div className="chips">
            <button
              className={`chip${!selectedTopic ? ' active' : ''}`}
              onClick={() => setSelectedTopic(null)}
            >
              ALL
            </button>
            {data.trending.map((t) => (
              <button
                key={t.name}
                className={`chip${selectedTopic === t.name ? ' active' : ''}`}
                onClick={() => setSelectedTopic(selectedTopic === t.name ? null : t.name)}
              >
                <span
                  className="cdot on"
                  style={{ background: TOPIC_COLORS[t.name] || '#6b7280' }}
                />
                {t.name}
                <span className="n">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {data && data.trending.length > 0 && (
        <div className="wrap" style={{ marginBottom: 20 }}>
          <div className="section-note">KEY TAKEAWAYS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {data.trending.slice(0, 6).map((t) => (
              <div
                key={t.name}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: 'var(--card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: '0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedTopic(selectedTopic === t.name ? null : t.name)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = TOPIC_COLORS[t.name] || 'rgba(79, 124, 255, 0.5)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${TOPIC_COLORS[t.name] || 'rgba(79, 124, 255, 0.15)'}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: TOPIC_COLORS[t.name] || '#6b7280',
                      boxShadow: `0 0 8px ${TOPIC_COLORS[t.name] || '#6b7280'}60`,
                    }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-mono), monospace', fontSize: '0.72rem',
                    fontWeight: 700, color: 'var(--ink)',
                  }}>
                    {t.name}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono), monospace', fontSize: '0.62rem',
                    color: t.trend === 'up' ? 'var(--ok-ink)' : t.trend === 'down' ? 'var(--hot-ink)' : 'var(--mut)',
                  }}>
                    {t.trend === 'up' ? '▲' : t.trend === 'down' ? '▼' : '—'} {t.count} stories
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      style={{
                        fontFamily: 'var(--font-mono), monospace', fontSize: '0.54rem',
                        padding: '2px 6px', borderRadius: 999,
                        border: '1px solid var(--line)', color: 'var(--mut)',
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Stories */}
      <div className="wrap">
        <div className="section-note">
          TOP STORIES {selectedTopic ? `— ${selectedTopic}` : ''} · {filteredStories.length}
        </div>
        <div className="papers-list">
          {filteredStories.map((s, i) => (
            <a
              key={`${s.url}-${i}`}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="paper-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="paper-rank">{i + 1}</div>
              <div className="paper-body">
                <div className="paper-head">
                  <span className="paper-title">{s.title}</span>
                  <div className="paper-badges">
                    {s.score > 0 && (
                      <span className="paper-badge upvotes">🔥 {s.score}</span>
                    )}
                    <span
                      className="paper-badge"
                      style={{
                        color: TOPIC_COLORS[s.topic] || 'var(--mut)',
                        background: `${TOPIC_COLORS[s.topic] || 'var(--field)'}15`,
                        border: `1px solid ${TOPIC_COLORS[s.topic] || 'var(--line)'}50`,
                      }}
                    >
                      {s.topic}
                    </span>
                  </div>
                </div>
                <div className="paper-meta">
                  <span>{s.source}</span>
                  <span>{s.time}</span>
                  <span className="open">READ ↗</span>
                </div>
              </div>
            </a>
          ))}
          {loading && !data && <p className="empty">Generating AI insights…</p>}
          {error && !data && <p className="empty"><b>Error: {error}</b></p>}
          {!loading && data && filteredStories.length === 0 && (
            <p className="empty">No stories match the selected topic.</p>
          )}
        </div>
      </div>
    </>
  );
}
