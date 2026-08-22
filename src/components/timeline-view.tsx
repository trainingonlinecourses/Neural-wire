'use client';

import { useCallback, useEffect, useState } from 'react';
/**
 * AI Timeline — interactive chronology of major AI events/milestones.
 * Shows how different threads (models, regulation, funding, breakthroughs)
 * weave through time with thread-colored events and era clustering.
 */

interface TimelineEvent {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  date: string;
  thread: string;
  subThread: string;
  importance: number;
  connections: string[];
  clusterSize: number;
  models: string[];
  topics: string[];
}

interface TimelineEra {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  eventCount: number;
  dominantThread: string;
  topModels: string[];
  highlight: string;
}

interface TimelineThread {
  id: string;
  label: string;
  color: string;
  icon: string;
  count: number;
}

interface TimelinePayload {
  events: TimelineEvent[];
  eras: TimelineEra[];
  threads: TimelineThread[];
  stats: {
    totalEvents: number;
    totalEras: number;
    timespan: string;
    topModel: string;
    mostActiveThread: string;
  };
  demo: boolean;
  generatedAt: number;
}

const THREAD_COLORS: Record<string, string> = {
  model: '#3b82f6',
  regulation: '#ef4444',
  funding: '#22c55e',
  research: '#8b5cf6',
  product: '#f59e0b',
  safety: '#ec4899',
  other: '#6b7280',
};

const THREAD_ICONS: Record<string, string> = {
  model: '🧠',
  regulation: '⚖️',
  funding: '💰',
  research: '📄',
  product: '🚀',
  safety: '🛡️',
  other: '📰',
};

function ImportanceBar({ score }: { score: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f59e0b' : score >= 40 ? '#22c55e' : '#6b7280';
  return (
    <div className="tl-importance" title={`Importance: ${score}/100`}>
      <div className="tl-imp-bar" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

export function TimelineView() {
  const [data, setData] = useState<TimelinePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadFilter, setThreadFilter] = useState<string>('all');

  const [expandedEra, setExpandedEra] = useState<string | null>(null);

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/timeline', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<TimelinePayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data && loading) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Building timeline…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Timeline unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  // Group events by day
  const eventsByDay = new Map<string, TimelineEvent[]>();
  for (const e of data.events) {
    const day = new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    if (!eventsByDay.has(day)) eventsByDay.set(day, []);
    eventsByDay.get(day)!.push(e);
  }

  // Filter events
  const filteredEvents = threadFilter === 'all'
    ? data.events
    : data.events.filter((e) => e.thread === threadFilter);

  // Group filtered events by day
  const filteredByDay = new Map<string, TimelineEvent[]>();
  for (const e of filteredEvents) {
    const day = new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    if (!filteredByDay.has(day)) filteredByDay.set(day, []);
    filteredByDay.get(day)!.push(e);
  }

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (threadFilter === 'all' ? ' active' : '')} onClick={() => setThreadFilter('all')}>
              🌐 ALL
            </button>
            {data.threads.filter((t) => t.count > 0).map((t) => (
              <button
                key={t.id}
                className={'seg-btn' + (threadFilter === t.id ? ' active' : '')}
                onClick={() => setThreadFilter(t.id)}
                style={threadFilter === t.id ? { background: t.color + '20', borderColor: t.color } : undefined}
              >
                {t.icon} {t.label} ({t.count})
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'BUILDING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="stats">
          <div className="stat"><b>{data.stats.totalEvents}</b> events</div>
          <div className="stat"><b>{data.stats.totalEras}</b> eras</div>
          <div className="stat"><b>{data.stats.timespan}</b> timespan</div>
          <div className="stat"><b>{data.stats.topModel}</b> top model</div>
        </div>
      </div>

      {/* Thread legend */}
      <div className="wrap">
        <div className="tl-threads">
          {data.threads.map((t) => (
            <span key={t.id} className="tl-thread-badge" style={{ borderColor: t.color, color: t.color }}>
              {t.icon} {t.label} · {t.count}
            </span>
          ))}
        </div>
      </div>

      {/* Eras */}
      <div className="wrap">
        <h3 className="tl-section-title">📌 ERAS</h3>
        <div className="tl-eras">
          {data.eras.map((era) => (
            <article
              key={era.id}
              className="tl-era"
              onClick={() => setExpandedEra(expandedEra === era.id ? null : era.id)}
            >
              <div className="tl-era-head">
                <span className="tl-era-label">{era.label}</span>
                <span className="tl-era-count">{era.eventCount} events</span>
                <span className="tl-era-thread" style={{ color: THREAD_COLORS[era.dominantThread] }}>
                  {THREAD_ICONS[era.dominantThread]} {era.dominantThread}
                </span>
              </div>
              {era.topModels.length > 0 && (
                <div className="tl-era-models">
                  {era.topModels.map((m) => (
                    <span key={m} className="model-pill">{m}</span>
                  ))}
                </div>
              )}
              {expandedEra === era.id && (
                <p className="tl-era-highlight dim">Highlight: {era.highlight}</p>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="wrap">
        <h3 className="tl-section-title">📅 EVENTS</h3>
        <div className="tl-timeline">
          {[...filteredByDay.entries()].map(([day, events]) => (
            <div key={day} className="tl-day">
              <div className="tl-day-header">
                <span className="tl-day-label">{day}</span>
                <span className="tl-day-count">{events.length} events</span>
              </div>
              <div className="tl-day-events">
                {events.map((e) => (
                  <article
                    key={e.id}
                    className="tl-event"
                    style={{ borderLeftColor: THREAD_COLORS[e.thread] || '#666' }}
                  >
                    <div className="tl-event-head">
                      <span className="tl-event-time">
                        {new Date(e.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="tl-event-thread" style={{ color: THREAD_COLORS[e.thread] }}>
                        {THREAD_ICONS[e.thread]} {e.thread}
                      </span>
                      {e.models.length > 0 && (
                        <span className="tl-event-models">
                          {e.models.slice(0, 2).map((m) => (
                            <span key={m} className="model-pill">{m}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <h4>
                      <a href={e.link} target="_blank" rel="noopener noreferrer">
                        {e.title}
                      </a>
                    </h4>
                    <div className="tl-event-footer">
                      <span className="dim">{e.sourceId}</span>
                      <ImportanceBar score={e.importance} />
                      {e.connections.length > 0 && (
                        <span className="tl-connections" title={`${e.connections.length} connected events`}>
                          🔗 {e.connections.length}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
