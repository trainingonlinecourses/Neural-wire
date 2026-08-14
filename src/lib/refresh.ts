import type { Story } from './types';

/** Formats a whole-second countdown as m:ss (e.g. 187 -> "3:07"). Never negative. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** Allowed auto-refresh intervals, in seconds (1 / 3 / 5 / 10 minutes). */
export const REFRESH_INTERVALS = [60, 180, 300, 600] as const;

/** Coerce a stored value (number or string) into an allowed interval, else fallback. */
export function parseRefreshInterval(value: unknown, fallback = 180): number {
  const n = typeof value === 'number' ? value : Number(value);
  return (REFRESH_INTERVALS as readonly number[]).includes(n) ? n : fallback;
}

/** Human label for an interval, e.g. 300 -> "5 MIN". */
export function refreshIntervalLabel(seconds: number): string {
  return `${seconds / 60} MIN`;
}

export interface StoryDiff {
  /** items present in `next` but not `prev` */
  added: number;
  /** items present in `prev` but not `next` */
  removed: number;
}

/** The ids present in `next` but not `prev` (order-insensitive, deduped). */
export function addedKeys(prev: string[], next: string[]): string[] {
  const prevIds = new Set(prev);
  return [...new Set(next)].filter((id) => !prevIds.has(id));
}

/** Compares two id lists (order-insensitive) and counts additions/removals. */
export function idDiff(prev: string[], next: string[]): StoryDiff {
  const added = addedKeys(prev, next).length;
  const nextIds = new Set(next);
  let removed = 0;
  for (const id of new Set(prev)) if (!nextIds.has(id)) removed++;
  return { added, removed };
}

/** Compares two story lists by id and reports how many were added/removed. */
export function storyDiff(prev: Story[], next: Story[]): StoryDiff {
  return idDiff(
    prev.map((s) => s.id),
    next.map((s) => s.id),
  );
}
