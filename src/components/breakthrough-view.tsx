'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';

/**
 * Breakthrough Alerts — detects when multiple high-impact stories cluster
 * together in a short time window, indicating a potential breakthrough.
 * Shows breakthrough probability scores, severity levels, and narrative
 * summaries of what happened.
 */

interface BreakthroughAlert {
  id: string;
  score: number;
  type: string;
  severity: string;
  windowStart: string;
  windowEnd: string;
  durationHours: number;
  stories: {
    id: string;
    title: string;
    link: string;
    sourceId: string;
    date: string;
    models: string[];
    topics: string[];
  }[];
  sourceCount: number;
  modelsMentioned: string[];
  dominantTopics: string[];
  narrative: string;
  reasoning: string[];
  relatedAlerts: string[];
}

interface BreakthroughPayload {
  alerts: BreakthroughAlert[];
  activityLevel: string;
  totalAlerts: number;
  currentWindow: {
    score: number;
    severity: string;
    narrative: string;
  };
  generatedAt: number;
  demo: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  ELEVATED: '#f59e0b',
  WATCH: '#3b82f6',
  NORMAL: '#22c55e',
};

const SEVERITY_ICONS: Record<string, string> = {
  CRITICAL: '🚨',
  HIGH: '⚡',
  ELEVATED: '⚠️',
  WATCH: '👁',
  NORMAL: '✓',
};

const ACTIVITY_COLORS: Record<string, string> = {
  EXTREME: '#ef4444',
  HIGH: '#f97316',
  ELEVATED: '#f59e0b',
  NORMAL: '#22c55e',
  QUIET: '#6b7280',
};

function ScoreGauge({ score, size = 60 }: { score: number; size?: number }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#f59e0b' : '#22c55e';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border, #374151)" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="var(--font-mono)">
        {score}
      </text>
    </svg>
  );
}

export function BreakthroughView() {
  const [data, setData] = useState<BreakthroughPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/breakthrough', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<BreakthroughPayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data && loading) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Scanning for breakthrough moments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Breakthrough scanner unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  const alerts = typeFilter === 'all'
    ? data.alerts
    : data.alerts.filter((a) => a.type === typeFilter);

  // Get unique alert types
  const alertTypes = [...new Set(data.alerts.map((a) => a.type))];

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (typeFilter === 'all' ? ' active' : '')} onClick={() => setTypeFilter('all')}>
              🌐 ALL
            </button>
            {alertTypes.map((t) => (
              <button
                key={t}
                className={'seg-btn' + (typeFilter === t ? ' active' : '')}
                onClick={() => setTypeFilter(t)}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'SCANNING…' : '⟳ RE-SCAN'}
          </button>
        </div>
      </div>

      {/* Activity dashboard */}
      <div className="wrap">
        <div className="bt-dashboard">
          <div className="bt-activity">
            <div className="bt-act-label">ACTIVITY LEVEL</div>
            <div className="bt-act-value" style={{ color: ACTIVITY_COLORS[data.activityLevel] || '#6b7280' }}>
              {data.activityLevel}
            </div>
            <div className="bt-act-count">{data.totalAlerts} breakthrough{data.totalAlerts !== 1 ? 's' : ''} detected</div>
          </div>
          <div className="bt-current">
            <div className="bt-cur-label">CURRENT WINDOW (6h)</div>
            <ScoreGauge score={data.currentWindow.score} />
            <div className="bt-cur-severity" style={{ color: SEVERITY_COLORS[data.currentWindow.severity] }}>
              {SEVERITY_ICONS[data.currentWindow.severity]} {data.currentWindow.severity}
            </div>
          </div>
          <div className="bt-narrative">
            <div className="bt-nar-label">ASSESSMENT</div>
            <p>{data.currentWindow.narrative}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="wrap">
        <div className="meta-row">
          <span>BREAKTHROUGH ALERTS — scored by velocity × diversity × engagement</span>
          <span className="meta-right dim">{alerts.length} alerts · scanned {ago(new Date(data.generatedAt))}</span>
        </div>
      </div>

      <div className="wrap bt-alerts">
        {alerts.length === 0 && (
          <p className="empty">
            <b>No breakthroughs detected.</b>
            <br />The wire is steady — no anomalous story clustering in any time window.
          </p>
        )}
        {alerts.map((alert) => {
          const isExpanded = expandedId === alert.id;
          const color = SEVERITY_COLORS[alert.severity] || '#6b7280';
          return (
            <article
              key={alert.id}
              className="bt-alert"
              style={{ borderLeftColor: color }}
            >
              <div className="bt-alert-head">
                <ScoreGauge score={alert.score} size={50} />
                <div className="bt-alert-info">
                  <div className="bt-alert-title">
                    <span className="bt-severity" style={{ color }}>
                      {SEVERITY_ICONS[alert.severity]} {alert.severity}
                    </span>
                    <span className="bt-type">{alert.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="bt-alert-meta">
                    <span>{alert.durationHours}h window · {alert.sourceCount} sources · {alert.stories.length} stories</span>
                  </div>
                </div>
              </div>
              <p className="bt-narrative-text">{alert.narrative}</p>
              {alert.modelsMentioned.length > 0 && (
                <div className="models-row">
                  {alert.modelsMentioned.map((m) => (
                    <span key={m} className="model-pill">{m}</span>
                  ))}
                </div>
              )}
              <button className="bt-toggle" onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                {isExpanded ? 'SHOW LESS' : `${alert.stories.length} STORIES + REASONING`}
              </button>
              {isExpanded && (
                <div className="bt-expanded">
                  <div className="bt-reasoning">
                    <h4>Why this is flagged:</h4>
                    <ul>
                      {alert.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bt-stories">
                    <h4>Related stories:</h4>
                    {alert.stories.map((s) => (
                      <div key={s.id} className="bt-story">
                        <a href={s.link} target="_blank" rel="noopener noreferrer">{s.title}</a>
                        <span className="dim">{s.sourceId} · {ago(new Date(s.date))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
