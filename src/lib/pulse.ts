import type { Story } from './types';
import { coverageClusters } from './cluster';
import { srcById } from './sources';

/**
 * AI Pulse — the desk's own live-signal layer, computed entirely from the
 * stories the wire already carries. No third-party keys, no off-topic feeds:
 * velocity, model buzz, hottest model, story heat, busiest source and feed
 * health are all derived from the current feed, so the panel stays honest
 * wherever the data comes from (Postgres or live demo feeds).
 */

const DAY_MS = 86_400_000;

export interface PulseSignal {
  id: string;
  icon: string;
  name: string;
  /** 0-100 reading when the signal is numeric, else null (status only). */
  value: number | null;
  detail: string;
  href: string | null;
  /** Small unit / qualifier under the reading, e.g. "stories / 24h". */
  meta?: string;
}

/** True when a story was published within the last 24h. */
export function within24h(s: Story, now = Date.now()): boolean {
  return s.date.getTime() >= now - DAY_MS;
}

/** Stories published in the last 24h. */
export function recentStories(stories: Story[], now = Date.now()): Story[] {
  return stories.filter((s) => within24h(s, now));
}

/**
 * Feed velocity reading: 24h story count normalized to 0-100 (200 stories/day
 * reads as a full-strength wire). Always numeric.
 */
export function velocityReading(stories: Story[], now = Date.now()): { value: number; count: number } {
  const count = recentStories(stories, now).length;
  return { value: Math.min(100, Math.round((count / 200) * 100)), count };
}

/** Model buzz: 24h model-release stories, 0-100 at 30/day. */
export function modelBuzzReading(stories: Story[], now = Date.now()): { value: number; count: number } {
  const count = recentStories(stories, now).filter((s) => s.isModel).length;
  return { value: Math.min(100, Math.round((count / 30) * 100)), count };
}

/** Most-mentioned model across 24h headlines (by `models` tags). */
export function hottestModel(
  stories: Story[],
  now = Date.now(),
): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const s of recentStories(stories, now)) {
    for (const m of s.models) {
      const key = m.trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

/** Busiest source over the last 24h (by story count). */
export function busiestSource(
  stories: Story[],
  now = Date.now(),
): { id: string; name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const s of recentStories(stories, now)) {
    counts.set(s.sourceId, (counts.get(s.sourceId) || 0) + 1);
  }
  let best: { id: string; count: number } | null = null;
  for (const [id, count] of counts) {
    if (!best || count > best.count) best = { id, count };
  }
  if (!best) return null;
  return { id: best.id, name: srcById[best.id]?.name || best.id, count: best.count };
}

/** Largest coverage cluster in the current feed (the story everyone covered). */
export function topStoryHeat(
  stories: Story[],
): { title: string; link: string; members: number } | null {
  let best: { title: string; link: string; members: number } | null = null;
  for (const g of coverageClusters(stories).values()) {
    if (g.members.length >= 2 && (!best || g.members.length > best.members)) {
      const rep = stories.find((s) => s.id === g.members[0]);
      if (rep) best = { title: rep.title, link: rep.link, members: g.members.length };
    }
  }
  return best;
}

/** Feed health: % of sources that delivered at least one 24h story. */
export function feedHealthReading(
  stories: Story[],
  totalSources: number,
  now = Date.now(),
): { value: number; live: number; total: number } {
  const live = new Set(recentStories(stories, now).map((s) => s.sourceId)).size;
  const total = Math.max(1, totalSources);
  return { value: Math.round((live / total) * 100), live, total };
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Truncate a headline for card layout. */
export function clipTitle(title: string, max = 96): string {
  return title.length > max ? title.slice(0, max - 1).trimEnd() + '…' : title;
}

/**
 * The six AI Pulse signals, derived purely from the current feed. Order is
 * stable so the panel doesn't reshuffle between syncs.
 */
export function computePulseSignals(stories: Story[], now = Date.now()): PulseSignal[] {
  const velocity = velocityReading(stories, now);
  const buzz = modelBuzzReading(stories, now);
  const hotModel = hottestModel(stories, now);
  const source = busiestSource(stories, now);
  const heat = topStoryHeat(stories);
  const health = feedHealthReading(stories, Object.keys(srcById).length, now);

  return [
    {
      id: 'velocity',
      icon: '📰',
      name: 'Story velocity',
      value: velocity.value,
      detail: velocity.count + ' stories in the last 24h',
      meta: 'stories / 24h',
      href: null,
    },
    {
      id: 'model-buzz',
      icon: '🧠',
      name: 'Model buzz',
      value: buzz.value,
      detail: buzz.count === 1 ? buzz.count + ' model release in the last 24h' : buzz.count + ' model releases in the last 24h',
      meta: 'releases / 24h',
      href: '/model-watch',
    },
    {
      id: 'hot-model',
      icon: '🔥',
      name: 'Hottest model',
      value: hotModel ? clamp100((hotModel.count / 10) * 100) : null,
      detail: hotModel ? hotModel.name + ' — most-mentioned across 24h headlines' : 'no model mentions in the last 24h',
      meta: hotModel ? (hotModel.count === 1 ? '1 mention' : hotModel.count + ' mentions') : undefined,
      href: hotModel ? 'https://huggingface.co/models?search=' + encodeURIComponent(hotModel.name) : null,
    },
    {
      id: 'story-heat',
      icon: '🪞',
      name: 'Story heat',
      value: heat ? clamp100((heat.members / 5) * 100) : null,
      detail: heat ? clipTitle(heat.title) : 'no multi-source story right now',
      meta: heat ? (heat.members === 2 ? '2 sources covering' : heat.members + ' sources covering') : undefined,
      href: heat ? heat.link : null,
    },
    {
      id: 'source',
      icon: '📡',
      name: 'Busiest source',
      value: source ? clamp100((source.count / 60) * 100) : null,
      detail: source ? source.name + ' — ' + source.count + ' stories in the last 24h' : 'no stories in the last 24h',
      meta: source ? 'stories / 24h' : undefined,
      href: null,
    },
    {
      id: 'health',
      icon: '💚',
      name: 'Feed health',
      value: health.value,
      detail: health.live + ' of ' + health.total + ' sources reporting in the last 24h',
      meta: '% sources live',
      href: null,
    },
  ];
}

/* ---------- Rendering helpers (pure HTML, no browser APIs) ---------- */

/**
 * Gradient gauge (red → amber → green) with a position marker for 0-100
 * signals. Pure CSS; no motion, safe for reduced-motion.
 */
export function gaugeBarHTML(pct: number): string {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    '<div class="rg-gauge" role="img" aria-label="Signal level ' + p + ' out of 100">' +
    '<div class="rg-track">' +
    '<div class="rg-marker" style="left:' + p + '%"></div>' +
    '</div>' +
    '<div class="rg-scale"><span>0</span><span>100</span></div>' +
    '</div>'
  );
}

/** Tone label for a 0-100 reading. */
export function pulseLabel(v: number): string {
  if (v < 20) return 'QUIET';
  if (v < 40) return 'LOW';
  if (v < 60) return 'STEADY';
  if (v < 80) return 'HOT';
  return 'BOILING';
}

/** Clean offline note for the public UI — never surfaces raw error text. */
export const PULSE_OFFLINE_HTML =
  '<div class="radar-note"><b>PULSE OFFLINE</b> — the wire could not be reached. It will retry automatically on the next sync.</div>';

/** "Last updated" meta line for a card footer. */
export function updatedMetaHTML(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return 'last updated ' + hh + ':' + mm;
}
