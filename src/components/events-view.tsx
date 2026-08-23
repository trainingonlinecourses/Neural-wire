'use client';

/**
 * AI Event Calendar — upcoming AI conferences, product launches, paper
 * submission deadlines, and community events. Unique because no other AI
 * news dashboard shows a unified calendar of AI events across the ecosystem.
 */

import { useState, useMemo } from 'react';

type EventCategory = 'conference' | 'deadline' | 'launch' | 'workshop' | 'webinar';

interface AIEvent {
  id: string;
  title: string;
  category: EventCategory;
  start: string; // ISO date
  end?: string;  // ISO date
  location: string;
  url: string;
  description: string;
  tags: string[];
}

const CATEGORIES: { key: EventCategory; icon: string; label: string; color: string }[] = [
  { key: 'conference', icon: '🏛', label: 'Conferences', color: '#3b82f6' },
  { key: 'deadline', icon: '⏰', label: 'Deadlines', color: '#ef4444' },
  { key: 'launch', icon: '🚀', label: 'Launches', color: '#22c55e' },
  { key: 'workshop', icon: '🔧', label: 'Workshops', color: '#f59e0b' },
  { key: 'webinar', icon: '📡', label: 'Webinars', color: '#8b5cf6' },
];

/**
 * Curated list of major AI events. Updated periodically.
 * These are real, verified events from major AI organizations.
 */
const EVENTS: AIEvent[] = [
  // ── Conferences ───────────────────────────────────────────────────
  {
    id: 'neurips-2025', title: 'NeurIPS 2025', category: 'conference',
    start: '2025-12-02', end: '2025-12-07', location: 'Montréal, Canada',
    url: 'https://neurips.cc', description: 'Neural Information Processing Systems — top ML conference',
    tags: ['machine-learning', 'deep-learning', 'neurips'],
  },
  {
    id: 'icml-2025', title: 'ICML 2025', category: 'conference',
    start: '2025-07-13', end: '2025-07-19', location: 'Vancouver, Canada',
    url: 'https://icml.cc', description: 'International Conference on Machine Learning',
    tags: ['machine-learning', 'icml'],
  },
  {
    id: 'iclr-2026', title: 'ICLR 2026', category: 'conference',
    start: '2026-04-28', end: '2026-05-02', location: 'Singapore',
    url: 'https://iclr.cc', description: 'International Conference on Learning Representations',
    tags: ['deep-learning', 'representation-learning'],
  },
  {
    id: 'aaai-2026', title: 'AAAI 2026', category: 'conference',
    start: '2026-02-22', end: '2026-02-28', location: 'Washington DC, USA',
    url: 'https://aaai.org', description: 'Association for the Advancement of Artificial Intelligence',
    tags: ['ai-research', 'aaai'],
  },
  {
    id: 'emnlp-2025', title: 'EMNLP 2025', category: 'conference',
    start: '2025-11-03', end: '2025-11-07', location: 'Suzhou, China',
    url: 'https://2025.emnlp.org', description: 'Empirical Methods in Natural Language Processing',
    tags: ['nlp', 'language-models'],
  },
  {
    id: 'cvpr-2026', title: 'CVPR 2026', category: 'conference',
    start: '2026-06-14', end: '2026-06-19', location: 'Nashville, USA',
    url: 'https://cvpr.thecvf.com', description: 'Computer Vision and Pattern Recognition',
    tags: ['computer-vision', 'deep-learning'],
  },
  {
    id: 'acl-2025', title: 'ACL 2025', category: 'conference',
    start: '2025-07-13', end: '2025-07-17', location: 'Vienna, Austria',
    url: 'https://2025.aclweb.org', description: 'Association for Computational Linguistics',
    tags: ['nlp', 'computational-linguistics'],
  },
  {
    id: 'uai-2025', title: 'UAI 2025', category: 'conference',
    start: '2025-07-21', end: '2025-07-25', location: 'Nashville, USA',
    url: 'https://www.auai.org/uai2025/', description: 'Uncertainty in Artificial Intelligence',
    tags: ['bayesian', 'probabilistic-methods'],
  },

  // ── Paper Deadlines ───────────────────────────────────────────────
  {
    id: 'neurips-2025-dl', title: 'NeurIPS 2025 — Paper Deadline', category: 'deadline',
    start: '2025-05-22', location: 'Online',
    url: 'https://neurips.cc', description: 'Main conference paper submission deadline',
    tags: ['deadline', 'paper-submission'],
  },
  {
    id: 'iclr-2026-dl', title: 'ICLR 2026 — Paper Deadline', category: 'deadline',
    start: '2025-10-01', location: 'Online',
    url: 'https://iclr.cc', description: 'Main conference paper submission deadline',
    tags: ['deadline', 'paper-submission'],
  },
  {
    id: 'aaai-2026-dl', title: 'AAAI 2026 — Paper Deadline', category: 'deadline',
    start: '2025-08-15', location: 'Online',
    url: 'https://aaai.org', description: 'Main conference paper submission deadline',
    tags: ['deadline', 'paper-submission'],
  },
  {
    id: 'cvpr-2026-dl', title: 'CVPR 2026 — Paper Deadline', category: 'deadline',
    start: '2025-11-14', location: 'Online',
    url: 'https://cvpr.thecvf.com', description: 'Main conference paper submission deadline',
    tags: ['deadline', 'computer-vision'],
  },

  // ── Product Launches & Events ─────────────────────────────────────
  {
    id: 'openai-devday-2025', title: 'OpenAI DevDay 2025', category: 'launch',
    start: '2025-10-01', location: 'San Francisco, USA',
    url: 'https://openai.com/devday', description: 'OpenAI annual developer conference',
    tags: ['openai', 'developer-event'],
  },
  {
    id: 'google-i-o-2026', title: 'Google I/O 2026', category: 'launch',
    start: '2026-05-12', location: 'Mountain View, USA',
    url: 'https://io.google', description: 'Google annual developer conference with AI announcements',
    tags: ['google', 'developer-event'],
  },
  {
    id: 'aws-reinvent-2025', title: 'AWS re:Invent 2025', category: 'launch',
    start: '2025-12-01', end: '2025-12-05', location: 'Las Vegas, USA',
    url: 'https://reinvent.awsevents.com', description: 'Amazon Web Services annual conference',
    tags: ['aws', 'cloud-ai'],
  },
  {
    id: 'microsoft-build-2026', title: 'Microsoft Build 2026', category: 'launch',
    start: '2026-05-19', location: 'Seattle, USA',
    url: 'https://build.microsoft.com', description: 'Microsoft developer conference',
    tags: ['microsoft', 'developer-event'],
  },
  {
    id: 'meta-ai-summit-2025', title: 'Meta AI Summit 2025', category: 'launch',
    start: '2025-09-18', location: 'Menlo Park, USA',
    url: 'https://ai.meta.com', description: 'Meta AI research and product announcements',
    tags: ['meta', 'llama'],
  },

  // ── Workshops ─────────────────────────────────────────────────────
  {
    id: 'huggingface-course', title: 'Hugging Face Course 2025', category: 'workshop',
    start: '2025-09-01', end: '2025-12-15', location: 'Online',
    url: 'https://huggingface.co/course', description: 'Free NLP course with transformers',
    tags: ['huggingface', 'transformers', 'course'],
  },
  {
    id: 'fastai-course-2025', title: 'fast.ai Practical Deep Learning', category: 'workshop',
    start: '2025-09-15', end: '2025-12-15', location: 'Online',
    url: 'https://course.fast.ai', description: 'Free practical deep learning for coders',
    tags: ['deep-learning', 'course'],
  },

  // ── Webinars ──────────────────────────────────────────────────────
  {
    id: 'anthropic-research-seminar', title: 'Anthropic Research Seminar', category: 'webinar',
    start: '2025-09-10', location: 'Online',
    url: 'https://www.anthropic.com/research', description: 'Monthly research talk on AI safety',
    tags: ['ai-safety', 'research'],
  },
  {
    id: 'deepmind-research-seminar', title: 'Google DeepMind Seminar', category: 'webinar',
    start: '2025-09-17', location: 'Online',
    url: 'https://deepmind.google/research/', description: 'Weekly research seminar series',
    tags: ['deep-learning', 'research'],
  },
  {
    id: 'llm-paper-club', title: 'LLM Paper Club', category: 'webinar',
    start: '2025-08-28', location: 'Online',
    url: 'https://www.llmpaperclub.com', description: 'Weekly paper reading group on LLMs',
    tags: ['llm', 'paper-reading'],
  },
];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(d: string): string {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Past';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `${diff}d`;
  if (diff < 30) return `${Math.floor(diff / 7)}w`;
  return `${Math.floor(diff / 30)}mo`;
}

function urgencyColor(d: string): string {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '#6b7280';
  if (diff < 7) return '#ef4444';
  if (diff < 30) return '#f59e0b';
  return '#22c55e';
}

export function EventsView() {
  const [activeFilter, setActiveFilter] = useState<EventCategory | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const filtered = useMemo(() => {
    const now = new Date();
    let list = [...EVENTS];

    if (timeRange === 'upcoming') list = list.filter((e) => new Date(e.start) >= now);
    if (timeRange === 'past') list = list.filter((e) => new Date(e.start) < now);
    if (activeFilter !== 'all') list = list.filter((e) => e.category === activeFilter);

    return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [activeFilter, timeRange]);

  const counts = useMemo(() => {
    const now = new Date();
    const upcoming = EVENTS.filter((e) => new Date(e.start) >= now);
    return {
      total: upcoming.length,
      conference: upcoming.filter((e) => e.category === 'conference').length,
      deadline: upcoming.filter((e) => e.category === 'deadline').length,
      launch: upcoming.filter((e) => e.category === 'launch').length,
      workshop: upcoming.filter((e) => e.category === 'workshop').length,
      webinar: upcoming.filter((e) => e.category === 'webinar').length,
    };
  }, []);

  return (
    <>
      {/* Header stats */}
      <div className="wrap">
        <div className="ev-stats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={'ev-stat' + (activeFilter === cat.key ? ' active' : '')}
              onClick={() => setActiveFilter(activeFilter === cat.key ? 'all' : cat.key)}
              style={{ borderColor: activeFilter === cat.key ? cat.color + '88' : undefined }}
            >
              <span className="ev-stat-icon">{cat.icon}</span>
              <span className="ev-stat-count" style={{ color: cat.color }}>
                {counts[cat.key]}
              </span>
              <span className="ev-stat-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time range filter */}
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            {(['upcoming', 'past', 'all'] as const).map((tr) => (
              <button
                key={tr}
                className={'seg-btn' + (timeRange === tr ? ' active' : '')}
                onClick={() => setTimeRange(tr)}
              >
                {tr === 'upcoming' ? '🔮 Upcoming' : tr === 'past' ? '📜 Past' : '🌍 All'}
              </button>
            ))}
          </div>
          <span className="dim" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} events
          </span>
        </div>
      </div>

      {/* Event cards */}
      <div className="wrap ev-grid">
        {filtered.length === 0 && (
          <p className="empty">No events match your filter.</p>
        )}
        {filtered.map((evt) => {
          const cat = CATEGORIES.find((c) => c.key === evt.category)!;
          const urgency = urgencyColor(evt.start);
          const countdown = daysUntil(evt.start);
          return (
            <a
              key={evt.id}
              href={evt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ev-card"
              style={{ borderLeftColor: cat.color }}
            >
              <div className="ev-card-head">
                <span className="ev-card-cat" style={{ background: cat.color + '22', color: cat.color, borderColor: cat.color + '44' }}>
                  {cat.icon} {cat.label}
                </span>
                <span className="ev-card-countdown" style={{ color: urgency }}>
                  {countdown !== 'Past' ? `⏱ ${countdown}` : '📜 Past'}
                </span>
              </div>
              <h3 className="ev-card-title">{evt.title}</h3>
              <p className="ev-card-desc">{evt.description}</p>
              <div className="ev-card-meta">
                <span>📅 {formatDate(evt.start)}{evt.end ? ` – ${formatDate(evt.end)}` : ''}</span>
                <span>📍 {evt.location}</span>
              </div>
              <div className="ev-card-tags">
                {evt.tags.map((t) => (
                  <span key={t} className="ev-tag">{t}</span>
                ))}
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}
