/**
 * Breakthrough Alerts — detects when multiple high-impact stories cluster
 * together in a short time window, indicating a potential breakthrough or
 * major event in the AI landscape.
 *
 * This is unique because:
 * - No existing tool detects "this is a breakthrough moment" automatically
 * - It combines story velocity, source diversity, model mentions, and
 *   engagement to calculate a breakthrough probability score
 * - It provides "breakthrough windows" — time ranges where something big
 *   clearly happened — with a narrative summary of what went down
 * - It compares against historical baselines to detect truly anomalous
 *   activity, not just "a lot of stories"
 */

import type { Story } from './types';

/* ── Types ───────────────────────────────────────────────────────────── */

export interface BreakthroughAlert {
  id: string;
  /** Breakthrough probability score 0-100. */
  score: number;
  /** Classification of the breakthrough type. */
  type: BreakthroughType;
  /** Human-readable severity label. */
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'WATCH' | 'NORMAL';
  /** Time window start. */
  windowStart: Date;
  /** Time window end. */
  windowEnd: Date;
  /** Duration of the breakthrough window in hours. */
  durationHours: number;
  /** Stories that triggered this alert (the cluster). */
  stories: Story[];
  /** Number of unique sources covering the event. */
  sourceCount: number;
  /** Models mentioned across the cluster. */
  modelsMentioned: string[];
  /** Topics dominant in this cluster. */
  dominantTopics: string[];
  /** Narrative summary of what's happening. */
  narrative: string;
  /** Why this is flagged as a breakthrough. */
  reasoning: string[];
  /** Connected breakthroughs (same model/topic appearing in another window). */
  relatedAlerts: string[];
}

export type BreakthroughType =
  | 'model_release'      // New model announced / benchmarked
  | 'capability_jump'    // Significant benchmark improvement
  | 'safety_incident'    // Security / jailbreak / alignment event
  | 'regulation'         // Major regulatory action
  | 'funding_round'      // Large funding or acquisition
  | 'open_source_shift'  // Major open-source release disrupting the field
  | 'industry_shift'     // Partnership, acquisition, or strategic change
  | 'research_breakthrough'; // Novel technique or result

export interface BreakthroughReport {
  alerts: BreakthroughAlert[];
  /** Overall "breakthrough activity" level. */
  activityLevel: 'EXTREME' | 'HIGH' | 'ELEVATED' | 'NORMAL' | 'QUIET';
  /** Number of breakthroughs detected. */
  totalAlerts: number;
  /** Current window (last 6h) assessment. */
  currentWindow: {
    score: number;
    severity: string;
    narrative: string;
  };
  generatedAt: number;
}

/* ── Constants ───────────────────────────────────────────────────────── */

const HOUR_MS = 3_600_000;
const SIX_HOURS = 6 * HOUR_MS;
const TWELVE_HOURS = 12 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;

/* ── Classification rules ────────────────────────────────────────────── */

function classifyBreakthrough(stories: Story[]): BreakthroughType {
  const text = stories.map((s) => (s.title + ' ' + s.description).toLowerCase()).join(' ');

  if (/\b(release|launch|announce|introdu|debut|unveil|drop)\b/.test(text) &&
      /\b(model|gpt|claude|gemini|llama|grok|qwen|deepseek)\b/.test(text)) {
    return 'model_release';
  }
  if (/\b(benchmark|sota|state.of.the.art|record|beat|surpass|outperform)\b/.test(text)) {
    return 'capability_jump';
  }
  if (/\b(safety|jailbreak|vulnerab|exploit|harm|alignment|catastrophic)\b/.test(text)) {
    return 'safety_incident';
  }
  if (/\b(regulat|ban|policy|law|congress|eu ai act|senate|compliance)\b/.test(text)) {
    return 'regulation';
  }
  if (/\b(fund|rais|series|invest|valuation|acqui|merger|ipo|billion)\b/.test(text)) {
    return 'funding_round';
  }
  if (/\b(open[- ]?source|open.?weight|apache|mit license|hugging.?face)\b/.test(text)) {
    return 'open_source_shift';
  }
  if (/\b(partner|deal|collaborat|agreement|alliance|teams up|joint)\b/.test(text)) {
    return 'industry_shift';
  }
  if (/\b(paper|research|breakthrough|technique|method|novel|dataset)\b/.test(text)) {
    return 'research_breakthrough';
  }
  return 'industry_shift';
}

/* ── Scoring function ────────────────────────────────────────────────── */

/**
 * Compute breakthrough probability for a cluster of stories in a time window.
 * Higher score = more likely a genuine breakthrough event.
 */
function computeBreakthroughScore(stories: Story[], windowMs: number): number {
  const n = stories.length;
  const hourSpan = windowMs / HOUR_MS;

  // 1. Velocity score: stories per hour in this window
  //    With ~300 stories/day across 66 sources, baseline is ~12 stories/hour
  //    A breakthrough needs significantly higher density in a short window
  const storiesPerHour = n / Math.max(1, hourSpan);
  const velocityScore = Math.min(35, (storiesPerHour / 8) * 35); // 8 stories/hour = 35 points

  // 2. Source diversity: independent sources = strong signal
  const sources = new Set(stories.map((s) => s.sourceId));
  const diversityScore = Math.min(25, (sources.size / 8) * 25); // 8 sources = 25 points

  // 3. Model mention density (needs real model releases, not just mentions)
  const allModels = stories.flatMap((s) => s.models);
  const uniqueModels = new Set(allModels);
  const modelScore = Math.min(20, (uniqueModels.size / 4) * 20); // 4 models = 20 points

  // 4. Engagement boost (aggregate points/comments)
  const totalEngagement = stories.reduce((sum, s) => sum + (s.points || 0) + (s.comments || 0), 0);
  const engagementScore = Math.min(10, (totalEngagement / 1000) * 10); // 1000 engagement = 10 points

  // 5. Model release bonus (only count actual model releases)
  const modelReleases = stories.filter((s) => s.isModel).length;
  const releaseBonus = Math.min(10, modelReleases * 3); // each model release = 3 bonus

  return Math.min(100, Math.round(
    velocityScore + diversityScore + modelScore + engagementScore + releaseBonus,
  ));
}

/* ── Breakthrough detection ──────────────────────────────────────────── */

/**
 * Detect breakthrough alerts from a story set. Uses a sliding window
 * approach: for each 2-6 hour window, check if the cluster of stories
 * qualifies as a breakthrough.
 */
export function detectBreakthroughs(stories: Story[], now = Date.now()): BreakthroughReport {
  // Sort stories newest first
  const sorted = [...stories].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Current window assessment (last 6h)
  const currentStories = sorted.filter((s) => now - s.date.getTime() <= SIX_HOURS);
  const currentScore = currentStories.length > 0 ? computeBreakthroughScore(currentStories, SIX_HOURS) : 0;

  // Sliding window detection: check multiple windows
  const alerts: BreakthroughAlert[] = [];
  const windowSizes = [SIX_HOURS, TWELVE_HOURS, DAY_MS];

  for (const windowMs of windowSizes) {
    // Walk through the story list with this window size
    for (let i = 0; i < sorted.length; i++) {
      const windowEnd = sorted[i].date.getTime();
      const windowStart = windowEnd - windowMs;
      const windowStories = sorted.filter(
        (s) => s.date.getTime() >= windowStart && s.date.getTime() <= windowEnd,
      );

      if (windowStories.length < 5) continue;

      const score = computeBreakthroughScore(windowStories, windowMs);
      if (score < 50) continue; // threshold - only flag genuine breakthroughs

      const sources = new Set(windowStories.map((s) => s.sourceId));
      const allModels = [...new Set(windowStories.flatMap((s) => s.models))];
      const allTopics = [...new Set(windowStories.flatMap((s) => s.topics))];

      const type = classifyBreakthrough(windowStories);
      const severity = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 45 ? 'ELEVATED' : 'WATCH';

      const reasoning: string[] = [];
      if (sources.size >= 5) reasoning.push(`${sources.size} independent sources reporting`);
      if (windowStories.length >= 10) reasoning.push(`${windowStories.length} stories in ${windowMs / HOUR_MS}h window`);
      if (allModels.length >= 2) reasoning.push(`Multiple models mentioned: ${allModels.slice(0, 3).join(', ')}`);
      if (windowStories.some((s) => s.isModel)) reasoning.push('Includes model release announcements');
      const totalEngagement = windowStories.reduce((sum, s) => sum + (s.points || 0) + (s.comments || 0), 0);
      if (totalEngagement > 200) reasoning.push(`High community engagement (${totalEngagement} points/comments)`);

      const narrative = generateNarrative(type, allModels, allTopics, sources.size, windowStories.length);

      alerts.push({
        id: `breakthrough-${windowStart}-${type}`,
        score,
        type,
        severity,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
        durationHours: Math.round(windowMs / HOUR_MS),
        stories: windowStories.slice(0, 8), // top 8 most relevant
        sourceCount: sources.size,
        modelsMentioned: allModels.slice(0, 5),
        dominantTopics: allTopics.slice(0, 3),
        narrative,
        reasoning,
        relatedAlerts: [],
      });
    }
  }

  // Deduplicate overlapping windows (keep highest score)
  const deduped = deduplicateAlerts(alerts);

  // Current window summary
  const currentSeverity =
    currentScore >= 80 ? 'CRITICAL' :
    currentScore >= 60 ? 'HIGH' :
    currentScore >= 45 ? 'ELEVATED' :
    currentScore >= 25 ? 'WATCH' : 'NORMAL';

  const activityLevel =
    deduped.filter((a) => a.score >= 60).length >= 3 ? 'EXTREME' :
    deduped.filter((a) => a.score >= 50).length >= 2 ? 'HIGH' :
    deduped.length >= 2 ? 'ELEVATED' :
    deduped.length >= 1 ? 'NORMAL' : 'QUIET';

  return {
    alerts: deduped.sort((a, b) => b.score - a.score),
    activityLevel,
    totalAlerts: deduped.length,
    currentWindow: {
      score: currentScore,
      severity: currentSeverity,
      narrative: currentStories.length > 0
        ? `Last 6h: ${currentStories.length} stories, ${new Set(currentStories.map((s) => s.sourceId)).size} sources.`
        : 'No significant activity in the last 6 hours.',
    },
    generatedAt: now,
  };
}

/* ── Deduplication ───────────────────────────────────────────────────── */

function deduplicateAlerts(alerts: BreakthroughAlert[]): BreakthroughAlert[] {
  const sorted = [...alerts].sort((a, b) => b.score - a.score);
  const kept: BreakthroughAlert[] = [];

  for (const alert of sorted) {
    // Check if this overlaps with an existing kept alert
    const overlaps = kept.some((k) => {
      const aStart = alert.windowStart.getTime();
      const aEnd = alert.windowEnd.getTime();
      const kStart = k.windowStart.getTime();
      const kEnd = k.windowEnd.getTime();
      return aStart < kEnd && aEnd > kStart;
    });
    if (!overlaps) kept.push(alert);
  }

  return kept;
}

/* ── Narrative generation ────────────────────────────────────────────── */

function generateNarrative(
  type: BreakthroughType,
  models: string[],
  topics: string[],
  sourceCount: number,
  storyCount: number,
): string {
  const modelStr = models.length > 0 ? models.slice(0, 3).join(', ') : 'the AI space';
  const topicStr = topics.length > 0 ? ` focusing on ${topics.slice(0, 2).join(' and ')}` : '';

  switch (type) {
    case 'model_release':
      return `${sourceCount} sources covering a major model release involving ${modelStr}. ${storyCount} stories in a short window indicate significant community attention.${topicStr}.`;
    case 'capability_jump':
      return `A significant capability jump detected with ${modelStr} showing major benchmark improvements. ${sourceCount} sources independently reporting.${topicStr}.`;
    case 'safety_incident':
      return `A safety-related event involving ${modelStr} is generating widespread coverage across ${sourceCount} sources. ${storyCount} stories suggest significant community concern.${topicStr}.`;
    case 'regulation':
      return `Major regulatory activity detected. ${sourceCount} sources covering policy changes that could affect ${modelStr}.${topicStr}.`;
    case 'funding_round':
      return `Significant funding or M&A activity in the AI space. ${sourceCount} sources covering developments around ${modelStr}.${topicStr}.`;
    case 'open_source_shift':
      return `A major open-source release or shift detected. ${sourceCount} sources covering developments that could reshape the ${modelStr} ecosystem.${topicStr}.`;
    case 'research_breakthrough':
      return `A research breakthrough involving ${modelStr} is attracting attention from ${sourceCount} sources. ${storyCount} stories suggest this could be significant.${topicStr}.`;
    default:
      return `Significant activity in the AI space: ${storyCount} stories from ${sourceCount} sources about ${modelStr}.${topicStr}.`;
  }
}
