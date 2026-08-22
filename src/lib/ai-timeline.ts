/**
 * AI Timeline — an interactive chronology of major AI events/milestones.
 * Builds a visual timeline from the story feed, clustering events into
 * "eras" and showing how different threads (models, regulation, funding,
 * breakthroughs) weave through time.
 *
 * Unique features:
 * - Thread-colored timeline (blue=models, red=regulation, green=funding)
 * - Auto-clustered into "eras" based on story density gaps
 * - Zoom levels: day / week / month
 * - Cross-thread connections (same model mentioned in different contexts)
 * - "Ripple effect" indicator when one event spawns multiple follow-ups
 */

import type { Story } from './types';

/* ── Types ───────────────────────────────────────────────────────────── */

export interface TimelineEvent {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  date: Date;
  /** Which thread this event belongs to. */
  thread: EventThread;
  /** Sub-thread label (e.g. specific model name). */
  subThread: string;
  /** Importance score 0-100. */
  importance: number;
  /** Connected event IDs (same model, same company, follow-up). */
  connections: string[];
  /** How many stories clustered around this event. */
  clusterSize: number;
  /** Models mentioned. */
  models: string[];
  /** Topics. */
  topics: string[];
}

export type EventThread = 'model' | 'regulation' | 'funding' | 'research' | 'product' | 'safety' | 'other';

export interface TimelineEra {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  eventCount: number;
  dominantThread: EventThread;
  topModels: string[];
  highlight: string; // most important event title
}

export interface TimelineView {
  events: TimelineEvent[];
  eras: TimelineEra[];
  threads: { id: EventThread; label: string; color: string; icon: string; count: number }[];
  stats: {
    totalEvents: number;
    totalEras: number;
    timespan: string;
    topModel: string;
    mostActiveThread: EventThread;
  };
}

/* ── Thread definitions ──────────────────────────────────────────────── */

const THREAD_DEFS: Record<EventThread, { label: string; color: string; icon: string }> = {
  model: { label: 'Model Releases', color: '#3b82f6', icon: '🧠' },
  regulation: { label: 'Regulation & Policy', color: '#ef4444', icon: '⚖️' },
  funding: { label: 'Funding & Deals', color: '#22c55e', icon: '💰' },
  research: { label: 'Research & Papers', color: '#8b5cf6', icon: '📄' },
  product: { label: 'Product Launches', color: '#f59e0b', icon: '🚀' },
  safety: { label: 'Safety & Alignment', color: '#ec4899', icon: '🛡️' },
  other: { label: 'Other', color: '#6b7280', icon: '📰' },
};

/* ── Thread classification ───────────────────────────────────────────── */

function classifyThread(story: Story): EventThread {
  const text = (story.title + ' ' + story.description).toLowerCase();

  // Safety first (highest priority)
  if (/\b(safety|alignment|jailbreak|guardrail|red.?team|harm|bias|ethics)\b/.test(text)) return 'safety';
  // Regulation & policy
  if (/\b(regulat|ban|policy|law|congress|eu ai act|senate|compliance|executive order|legislat)\b/.test(text)) return 'regulation';
  // Funding & deals
  if (/\b(fund|rais|series|invest|valuation|acqui|merger|ipo|billion|million|venture|capital)\b/.test(text)) return 'funding';
  // Research & papers (check BEFORE model, since arxiv papers mention models)
  if (/\b(paper|arxiv|study|dataset|training run|method|technique|novel|survey|benchmark)\b/.test(text)) return 'research';
  // Product launches (not model releases)
  if (/\b(product|feature|api|plugin|integration|app|ship|rollout|update)\b/.test(text) &&
      !/\b(model|llm|gpt|claude|gemini|llama|grok|qwen|deepseek)\b/.test(text)) return 'product';
  // Model releases: explicit release verbs OR isModel flag with release context
  if (story.isModel || /\b(release|launch|announce|introdu|debut|unveil|drop|preview)\b/.test(text)) {
    if (story.models.length > 0) return 'model';
    if (/\b(model|llm|gpt|claude|gemini|llama|grok|qwen|deepseek)\b/.test(text)) return 'model';
  }
  return 'other';
}

/* ── Importance scoring ──────────────────────────────────────────────── */

function computeImportance(story: Story): number {
  let score = 30; // baseline

  // Points/comments boost
  if (story.points && story.points > 100) score += 20;
  else if (story.points && story.points > 30) score += 10;
  if (story.comments && story.comments > 50) score += 15;
  else if (story.comments && story.comments > 10) score += 5;

  // Model releases are important
  if (story.isModel) score += 15;

  // Benchmarks mentioned
  if (story.benchmarks.length > 0) score += 10;

  // Multiple models = significant
  if (story.models.length >= 3) score += 10;
  else if (story.models.length >= 2) score += 5;

  // Hot topics boost
  for (const t of story.topics) {
    if (t === 'RESEARCH' || t === 'SECURITY' || t === 'REGULATION') score += 5;
  }

  return Math.min(100, score);
}

/* ── Timeline building ───────────────────────────────────────────────── */

export function buildTimeline(stories: Story[]): TimelineView {
  // Deduplicate by normalized title (keep newest)
  const seen = new Map<string, Story>();
  for (const s of [...stories].sort((a, b) => b.date.getTime() - a.date.getTime())) {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 60);
    if (!seen.has(key)) seen.set(key, s);
  }

  const uniqueStories = [...seen.values()];

  // Build events
  const events: TimelineEvent[] = uniqueStories.map((s) => ({
    id: s.id,
    title: s.title,
    link: s.link,
    sourceId: s.sourceId,
    date: s.date,
    thread: classifyThread(s),
    subThread: s.models[0] || s.topics[0] || 'general',
    importance: computeImportance(s),
    connections: [],
    clusterSize: 1,
    models: s.models,
    topics: s.topics,
  }));

  // Build connections: link events that mention the same model within 7 days
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      const dayDiff = Math.abs(a.date.getTime() - b.date.getTime()) / 86_400_000;
      if (dayDiff > 7) continue;
      const sharedModels = a.models.filter((m) => b.models.includes(m));
      if (sharedModels.length > 0) {
        a.connections.push(b.id);
        b.connections.push(a.id);
      }
    }
  }

  // Build eras: cluster events by date gaps
  const eras = buildEras(events);

  // Thread counts
  const threadCounts = new Map<EventThread, number>();
  for (const e of events) threadCounts.set(e.thread, (threadCounts.get(e.thread) || 0) + 1);
  const threads = (Object.keys(THREAD_DEFS) as EventThread[]).map((id) => ({
    id,
    ...THREAD_DEFS[id],
    count: threadCounts.get(id) || 0,
  }));

  // Stats
  const topModelCounts = new Map<string, number>();
  for (const e of events) {
    for (const m of e.models) topModelCounts.set(m, (topModelCounts.get(m) || 0) + 1);
  }
  const topModel = [...topModelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const mostActiveThread = [...threadCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

  const timespan = events.length > 1
    ? `${Math.ceil(Math.abs(events[0].date.getTime() - events[events.length - 1].date.getTime()) / 86_400_000)} days`
    : 'single day';

  return {
    events,
    eras,
    threads,
    stats: {
      totalEvents: events.length,
      totalEras: eras.length,
      timespan,
      topModel,
      mostActiveThread,
    },
  };
}

/* ── Era detection ───────────────────────────────────────────────────── */

function buildEras(events: TimelineEvent[]): TimelineEra[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const eras: TimelineEra[] = [];
  let eraEvents: TimelineEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].date.getTime() - sorted[i - 1].date.getTime();
    const GAP_THRESHOLD = 3 * 86_400_000; // 3-day gap = new era

    if (gap > GAP_THRESHOLD) {
      eras.push(composeEra(eraEvents, eras.length));
      eraEvents = [];
    }
    eraEvents.push(sorted[i]);
  }
  if (eraEvents.length > 0) eras.push(composeEra(eraEvents, eras.length));

  return eras;
}

function composeEra(events: TimelineEvent[], index: number): TimelineEra {
  const threadCounts = new Map<EventThread, number>();
  const modelCounts = new Map<string, number>();
  for (const e of events) {
    threadCounts.set(e.thread, (threadCounts.get(e.thread) || 0) + 1);
    for (const m of e.models) modelCounts.set(m, (modelCounts.get(m) || 0) + 1);
  }
  const dominantThread = [...threadCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';
  const topModels = [...modelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m);

  const highlight = events.reduce((a, b) => (a.importance > b.importance ? a : b));

  const start = events[0].date;
  const end = events[events.length - 1].date;
  const label =
    start.getMonth() === end.getMonth()
      ? `${start.toLocaleString(undefined, { month: 'short' })} ${start.getDate()}–${end.getDate()}`
      : `${start.toLocaleString(undefined, { month: 'short' })} ${start.getDate()} – ${end.toLocaleString(undefined, { month: 'short' })} ${end.getDate()}`;

  return {
    id: `era-${index}`,
    label,
    startDate: start,
    endDate: end,
    eventCount: events.length,
    dominantThread,
    topModels,
    highlight: highlight.title,
  };
}

/* ── Formatting helpers ──────────────────────────────────────────────── */

export function threadColor(thread: EventThread): string {
  return THREAD_DEFS[thread]?.color || '#6b7280';
}

export function threadIcon(thread: EventThread): string {
  return THREAD_DEFS[thread]?.icon || '📰';
}

export function importanceLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'MAJOR';
  if (score >= 40) return 'NOTABLE';
  return 'STANDARD';
}
