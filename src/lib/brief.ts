import type { Story } from './types';

export interface BriefTopic {
  name: string;
  count: number;
  /** Up to 3 sample stories, newest first, for rendering. */
  sample: Story[];
}

export interface BriefModel {
  name: string;
  count: number;
  latest: Story;
}

export interface BriefSource {
  id: string;
  count: number;
}

export interface Brief {
  windowDays: number;
  total: number;
  topics: BriefTopic[];
  models: BriefModel[];
  sources: BriefSource[];
  hot: Story[];
}

const DAY_MS = 86_400_000;

/**
 * Distill the last `windowDays` of stories into a brief: the hottest topics
 * (with sample stories), most-mentioned models, most active sources and the
 * newest stories. Pure function — unit-testable and reused by the /brief page.
 */
export function buildBrief(stories: Story[], windowDays = 1): Brief {
  const cutoff = Date.now() - windowDays * DAY_MS;
  const recent = stories.filter((s) => s.date.getTime() >= cutoff);

  const topicMap = new Map<string, { count: number; sample: Story[] }>();
  for (const s of recent) {
    for (const t of s.topics) {
      const entry = topicMap.get(t) ?? { count: 0, sample: [] };
      entry.count += 1;
      if (entry.sample.length < 3) entry.sample.push(s);
      topicMap.set(t, entry);
    }
  }
  const topics: BriefTopic[] = [...topicMap.entries()]
    .map(([name, v]) => ({ name, count: v.count, sample: v.sample }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const modelMap = new Map<string, { count: number; latest: Story }>();
  for (const s of recent) {
    for (const m of s.models) {
      const entry = modelMap.get(m);
      if (!entry) {
        modelMap.set(m, { count: 1, latest: s });
      } else {
        entry.count += 1;
        if (s.date > entry.latest.date) entry.latest = s;
      }
    }
  }
  const models: BriefModel[] = [...modelMap.entries()]
    .map(([name, v]) => ({ name, count: v.count, latest: v.latest }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const srcMap = new Map<string, number>();
  for (const s of recent) srcMap.set(s.sourceId, (srcMap.get(s.sourceId) ?? 0) + 1);
  const sources: BriefSource[] = [...srcMap.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  const hot = [...recent].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);

  return { windowDays, total: recent.length, topics, models, sources, hot };
}
