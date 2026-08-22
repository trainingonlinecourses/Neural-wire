'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';

/**
 * Sentiment Momentum — shows which AI topics are exploding, surging,
 * or cooling based on story velocity, source diversity, and engagement.
 * Unlike simple "hot topic" lists, momentum captures DIRECTION.
 */

interface TopicMomentum {
  topic: string;
  kind: 'topic' | 'model' | 'entity';
  momentum: number;
  direction: 'EXPLODING' | 'SURGING' | 'STEADY' | 'COOLING' | 'DORMANT';
  recentCount: number;
  dayCount: number;
  sourceDiversity: number;
  engagement: number;
  latestStoryAge: number;
  topStories: { title: string; link: string; sourceId: string; date: string }[];
  sparkline: number[];
}

interface SentimentPayload {
  topics: TopicMomentum[];
  hotTopics: TopicMomentum[];
  modelMomentum: TopicMomentum[];
  topicMomentum: TopicMomentum[];
  generatedAt: number;
  totalStories: number;
  windowHours: number;
  marketTemperature: number;
  demo: boolean;
}

const DIRECTION_COLORS: Record<string, string> = {
  EXPLODING: '#ef4444',
  SURGING: '#f59e0b',
  STEADY: '#22c55e',
  COOLING: '#6b7280',
  DORMANT: '#374151',
};

const DIRECTION_ICONS: Record<string, string> = {
  EXPLODING: '🔥',
  SURGING: '▲',
  STEADY: '→',
  COOLING: '▼',
  DORMANT: '·',
};

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data);
  return (
    <div className="sparkline" aria-hidden="true">
      {data.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{
            height: `${Math.max(2, (v / max) * 100)}%`,
            opacity: 0.4 + (v / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export function SentimentView() {
  const [data, setData] = useState<SentimentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'model' | 'topic'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/sentiment', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<SentimentPayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data && loading) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Computing narrative momentum…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Sentiment feed unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  const topics = filter === 'all'
    ? data.topics
    : data.topics.filter((t) => t.kind === filter);

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
              🌐 ALL
            </button>
            <button className={'seg-btn' + (filter === 'model' ? ' active' : '')} onClick={() => setFilter('model')}>
              🧠 MODELS
            </button>
            <button className={'seg-btn' + (filter === 'topic' ? ' active' : '')} onClick={() => setFilter('topic')}>
              🏷 TOPICS
            </button>
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'COMPUTING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="sentiment-dashboard">
          <div className="sentiment-gauge">
            <div className="sg-label">MARKET TEMPERATURE</div>
            <div className="sg-value" style={{
              color: data.marketTemperature >= 60 ? '#ef4444' : data.marketTemperature >= 30 ? '#f59e0b' : '#22c55e'
            }}>
              {data.marketTemperature}
            </div>
            <div className="sg-bar">
              <div className="sg-fill" style={{ width: `${data.marketTemperature}%` }} />
            </div>
            <div className="sg-meta">{data.totalStories} stories in {data.windowHours}h</div>
          </div>
          <div className="sentiment-quick-stats">
            <div className="qs-item">
              <span className="qs-count" style={{ color: DIRECTION_COLORS.EXPLODING }}>
                {data.topics.filter((t) => t.direction === 'EXPLODING').length}
              </span>
              <span className="qs-label">🔥 Exploding</span>
            </div>
            <div className="qs-item">
              <span className="qs-count" style={{ color: DIRECTION_COLORS.SURGING }}>
                {data.topics.filter((t) => t.direction === 'SURGING').length}
              </span>
              <span className="qs-label">▲ Surging</span>
            </div>
            <div className="qs-item">
              <span className="qs-count" style={{ color: DIRECTION_COLORS.STEADY }}>
                {data.topics.filter((t) => t.direction === 'STEADY').length}
              </span>
              <span className="qs-label">→ Steady</span>
            </div>
            <div className="qs-item">
              <span className="qs-count" style={{ color: DIRECTION_COLORS.COOLING }}>
                {data.topics.filter((t) => t.direction === 'COOLING').length}
              </span>
              <span className="qs-label">▼ Cooling</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="meta-row">
          <span>MOMENTUM — topics ranked by acceleration (velocity × diversity × engagement)</span>
          <span className="meta-right dim">{topics.length} topics · fetched {ago(new Date(data.generatedAt))}</span>
        </div>
      </div>

      <div className="wrap sentiment-list">
        {topics.length === 0 && (
          <p className="empty">
            <b>Waiting for more data…</b>
            <br />
            Momentum needs 2+ stories per topic in the last 24h. The wire refreshes every few minutes.
          </p>
        )}
        {topics.map((t) => {
          const isExpanded = expandedId === t.topic;
          return (
            <article
              key={t.topic}
              className="sentiment-card"
              style={{ borderLeftColor: DIRECTION_COLORS[t.direction] }}
            >
              <div className="sc-head">
                <span className="sc-direction" style={{ color: DIRECTION_COLORS[t.direction] }}>
                  {DIRECTION_ICONS[t.direction]} {t.direction}
                </span>
                <span className="sc-topic">{t.topic}</span>
                <span className="sc-kind">{t.kind}</span>
                <span className="sc-momentum">{t.momentum}</span>
              </div>
              <div className="sc-body">
                <Sparkline data={t.sparkline} />
                <div className="sc-stats">
                  <span title="Stories in last 6h">⚡ {t.recentCount} recent</span>
                  <span title="Stories in last 24h">📰 {t.dayCount} total</span>
                  <span title="Unique sources">📡 {t.sourceDiversity} sources</span>
                  <span title="Engagement">💬 {t.engagement}</span>
                </div>
              </div>
              {t.topStories.length > 0 && (
                <button className="sc-toggle" onClick={() => setExpandedId(isExpanded ? null : t.topic)}>
                  {isExpanded ? 'SHOW LESS' : `${t.topStories.length} TOP STORIES`}
                </button>
              )}
              {isExpanded && (
                <div className="sc-stories">
                  {t.topStories.map((s, i) => (
                    <div key={i} className="sc-story">
                      <span className="sc-story-source">{s.sourceId}</span>
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="sc-story-title">
                        {s.title}
                      </a>
                      <span className="dim">{ago(new Date(s.date))}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
