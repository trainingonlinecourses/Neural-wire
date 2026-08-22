/**
 * Sentiment Momentum — tracks how narrative intensity shifts across AI
 * topics over time. Computes a "momentum score" for each topic based on:
 *
 * 1. Story velocity: how many stories about this topic in the last 6h vs 24h
 * 2. Source diversity: how many independent sources are covering it
 * 3. Engagement: aggregate points/comments
 * 4. Recency: how recently the newest story appeared
 *
 * Unlike simple "hot topic" lists, momentum captures DIRECTION — a topic
 * with 5 stories in the last 2h but 0 in the prior 22h has high momentum
 * (exploding) even though its 24h count is low. A topic with 20 stories
 * but all from 12h ago has low momentum (cooling).
 *
 * Pure functions, fully unit-testable.
 */

import type { Story } from './types';

/* ── Types ───────────────────────────────────────────────────────────── */

export interface TopicMomentum {
  /** Canonical topic name (e.g. "RESEARCH", "DeepSeek"). */
  topic: string;
  /** Primary type: topic tag, model name, or entity. */
  kind: 'topic' | 'model' | 'entity';
  /**
   * Momentum score 0-100. Positive = accelerating, 0 = flat.
   * Calculated as the ratio of recent velocity to baseline velocity,
   * scaled with source diversity and engagement multipliers.
   */
  momentum: number;
  /** Direction label for human display. */
  direction: 'EXPLODING' | 'SURGING' | 'STEADY' | 'COOLING' | 'DORMANT';
  /** Number of stories in the last 6 hours. */
  recentCount: number;
  /** Number of stories in the last 24 hours. */
  dayCount: number;
  /** Number of unique sources covering this topic in 24h. */
  sourceDiversity: number;
  /** Total engagement (points + comments) in 24h. */
  engagement: number;
  /** Time (ms ago) of the most recent story. */
  latestStoryAge: number;
  /** Top 3 most recent stories for rendering. */
  topStories: { title: string; link: string; sourceId: string; date: string }[];
  /** Trend sparkline: hourly counts for the last 24h (24 buckets). */
  sparkline: number[];
}

export interface SentimentSnapshot {
  topics: TopicMomentum[];
  generatedAt: number;
  totalStories: number;
  windowHours: number;
  /** The overall "market temperature": average momentum across all topics. */
  marketTemperature: number;
}

/* ── Constants ───────────────────────────────────────────────────────── */

const HOUR_MS = 3_600_000;
const SIX_HOURS = 6 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;
const SPARKLINE_BUCKETS = 24;

/* ── Core computation ────────────────────────────────────────────────── */

/**
 * Compute sentiment momentum for all topics across the story set.
 * Returns a ranked list of topics sorted by momentum (highest first).
 */
export function computeSentimentMomentum(stories: Story[], now = Date.now()): SentimentSnapshot {
  const dayCutoff = now - DAY_MS;
  const recentStories = stories.filter((s) => s.date.getTime() >= dayCutoff);

  // Build topic → stories map
  const topicMap = new Map<string, { kind: TopicMomentum['kind']; stories: Story[] }>();

  const addStory = (topic: string, kind: TopicMomentum['kind'], story: Story) => {
    if (!topicMap.has(topic)) topicMap.set(topic, { kind, stories: [] });
    topicMap.get(topic)!.stories.push(story);
  };

  for (const s of recentStories) {
    for (const t of s.topics) addStory(t, 'topic', s);
    for (const m of s.models) addStory(m, 'model', s);
  }

  // Compute momentum for each topic
  const topics: TopicMomentum[] = [];

  for (const [topicName, data] of topicMap) {
    const dayCount = data.stories.length;
    if (dayCount < 2) continue; // Need at least 2 stories for momentum

    const recentCount = data.stories.filter((s) => s.date.getTime() >= now - SIX_HOURS).length;
    const sources = new Set(data.stories.map((s) => s.sourceId));
    const engagement = data.stories.reduce(
      (sum, s) => sum + (s.points || 0) + (s.comments || 0),
      0,
    );
    const latestStory = data.stories.reduce((a, b) => (a.date > b.date ? a : b));
    const latestStoryAge = now - latestStory.date.getTime();

    // Velocity ratio: recent rate vs baseline rate
    // If 25% of stories came in the last 25% of time → ratio = 1.0 (steady)
    // If 50% came in 25% of time → ratio = 2.0 (surging)
    const recentRate = recentCount / 6; // stories per hour in last 6h
    const baselineRate = dayCount / 24; // stories per hour in last 24h
    const velocityRatio = baselineRate > 0 ? recentRate / baselineRate : recentCount > 0 ? 5 : 0;

    // Source diversity multiplier (1.0 for single source, up to 1.5 for 5+)
    const diversityMultiplier = 1 + Math.min(0.5, (sources.size - 1) * 0.125);

    // Engagement multiplier (1.0 baseline, up to 1.3 for high engagement)
    const engagementMultiplier = 1 + Math.min(0.3, engagement / 1000);

    // Recency decay: stories older than 4h get penalized
    const recencyMultiplier = latestStoryAge < 4 * HOUR_MS
      ? 1.2
      : latestStoryAge < 8 * HOUR_MS
        ? 1.0
        : latestStoryAge < 12 * HOUR_MS
          ? 0.8
          : 0.6;

    // Final momentum score: velocity × diversity × engagement × recency, normalized to 0-100
    const rawScore = velocityRatio * diversityMultiplier * engagementMultiplier * recencyMultiplier;
    const momentum = Math.min(100, Math.round(rawScore * 25)); // 4.0 ratio → 100 score

    // Direction label
    let direction: TopicMomentum['direction'];
    if (momentum >= 80) direction = 'EXPLODING';
    else if (momentum >= 50) direction = 'SURGING';
    else if (momentum >= 25) direction = 'STEADY';
    else if (momentum >= 10) direction = 'COOLING';
    else direction = 'DORMANT';

    // Sparkline: hourly story counts for last 24h
    const sparkline = new Array(SPARKLINE_BUCKETS).fill(0);
    for (const s of data.stories) {
      const hoursAgo = Math.floor((now - s.date.getTime()) / HOUR_MS);
      const bucket = Math.min(SPARKLINE_BUCKETS - 1, Math.max(0, SPARKLINE_BUCKETS - 1 - hoursAgo));
      sparkline[bucket]++;
    }

    // Top 3 stories (newest first)
    const topStories = data.stories
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3)
      .map((s) => ({
        title: s.title,
        link: s.link,
        sourceId: s.sourceId,
        date: s.date.toISOString(),
      }));

    topics.push({
      topic: topicName,
      kind: data.kind,
      momentum,
      direction,
      recentCount,
      dayCount,
      sourceDiversity: sources.size,
      engagement,
      latestStoryAge,
      topStories,
      sparkline,
    });
  }

  // Sort by momentum descending
  topics.sort((a, b) => b.momentum - a.momentum);

  // Market temperature: weighted average of top topics
  const topN = topics.slice(0, 10);
  const marketTemperature =
    topN.length > 0
      ? Math.round(topN.reduce((s, t) => s + t.momentum, 0) / topN.length)
      : 0;

  return {
    topics,
    generatedAt: now,
    totalStories: recentStories.length,
    windowHours: 24,
    marketTemperature,
  };
}

/* ── Query helpers ───────────────────────────────────────────────────── */

/** Get only exploding/surging topics. */
export function hotTopics(snapshot: SentimentSnapshot): TopicMomentum[] {
  return snapshot.topics.filter((t) => t.direction === 'EXPLODING' || t.direction === 'SURGING');
}

/** Get topics of a specific kind. */
export function topicsByKind(
  snapshot: SentimentSnapshot,
  kind: TopicMomentum['kind'],
): TopicMomentum[] {
  return snapshot.topics.filter((t) => t.kind === kind);
}

/** Format momentum for display (e.g. "▲ 78 SURGING"). */
export function momentumLabel(momentum: number, direction: TopicMomentum['direction']): string {
  const arrow =
    direction === 'EXPLODING' ? '🔥' :
    direction === 'SURGING' ? '▲' :
    direction === 'STEADY' ? '→' :
    direction === 'COOLING' ? '▼' : '·';
  return `${arrow} ${momentum} ${direction}`;
}

/** Color for a direction label. */
export function directionColor(direction: TopicMomentum['direction']): string {
  switch (direction) {
    case 'EXPLODING': return 'var(--hot-ink, #ef4444)';
    case 'SURGING': return 'var(--warn-ink, #f59e0b)';
    case 'STEADY': return 'var(--ok-ink, #22c55e)';
    case 'COOLING': return 'var(--dim-ink, #6b7280)';
    case 'DORMANT': return 'var(--muted-ink, #374151)';
  }
}
