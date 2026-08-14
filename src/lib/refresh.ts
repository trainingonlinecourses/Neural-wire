import type { Story } from './types';

/** Formats a whole-second countdown as m:ss (e.g. 187 -> "3:07"). Never negative. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export interface StoryDiff {
  /** stories present in `next` but not `prev` */
  added: number;
  /** stories present in `prev` but not `next` */
  removed: number;
}

/** Compares two story lists by id and reports how many were added/removed. */
export function storyDiff(prev: Story[], next: Story[]): StoryDiff {
  const prevIds = new Set(prev.map((s) => s.id));
  const nextIds = new Set(next.map((s) => s.id));
  let added = 0;
  let removed = 0;
  for (const id of nextIds) if (!prevIds.has(id)) added++;
  for (const id of prevIds) if (!nextIds.has(id)) removed++;
  return { added, removed };
}
