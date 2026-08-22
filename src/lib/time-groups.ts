/**
 * Time Groups — human-friendly date bucketing for model cards and news stories.
 * Groups items into relative time buckets: Today, Yesterday, 2 days ago, etc.
 */

const DAY_MS = 86_400_000;

export interface TimeGroup {
  /** Display label, e.g. "Today", "Yesterday", "2 days ago". */
  label: string;
  /** Sort key (lower = more recent). */
  sortKey: number;
  /** Items in this group. */
  items: unknown[];
}

/**
 * Bucket definitions in chronological order (most recent first).
 * Each bucket is [label, maxAgeDays].
 * An item falls into the first bucket whose maxAgeDays covers it.
 */
const BUCKETS: [string, number][] = [
  ['Today', 1],
  ['Yesterday', 2],
  ['2 days ago', 3],
  ['3 days ago', 4],
  ['4 days ago', 5],
  ['5 days ago', 6],
  ['6 days ago', 7],
  ['1 week ago', 14],
  ['2 weeks ago', 21],
  ['3 weeks ago', 28],
  ['1 month ago', 60],
  ['2 months ago', 90],
  ['3 months ago', 120],
  ['6 months ago', 180],
  ['Older', Infinity],
];

/**
 * Group items by time buckets. Each item needs a date (epoch ms or ISO string).
 * Returns groups with items sorted newest-first within each group.
 * Empty groups are omitted.
 */
export function groupByTime<T>(
  items: T[],
  getDate: (item: T) => number | string | Date,
  now = Date.now(),
): TimeGroup[] {
  const groups: TimeGroup[] = BUCKETS.map(([label, maxAgeDays], i) => ({
    label,
    sortKey: i,
    items: [],
  }));

  for (const item of items) {
    const raw = getDate(item);
    const ts = raw instanceof Date ? raw.getTime() : typeof raw === 'string' ? new Date(raw).getTime() : raw;
    const ageDays = (now - ts) / DAY_MS;

    for (const group of groups) {
      const bucketIndex = BUCKETS.findIndex(([label]) => label === group.label);
      const maxAge = BUCKETS[bucketIndex][1];
      if (ageDays < maxAge) {
        group.items.push(item);
        break;
      }
    }
  }

  // Sort items within each group newest-first
  for (const group of groups) {
    group.items.sort((a, b) => {
      const aTs = getDate(a as T);
      const bTs = getDate(b as T);
      const aMs = aTs instanceof Date ? aTs.getTime() : typeof aTs === 'string' ? new Date(aTs).getTime() : aTs;
      const bMs = bTs instanceof Date ? bTs.getTime() : typeof bTs === 'string' ? new Date(bTs).getTime() : bTs;
      return bMs - aMs;
    });
  }

  // Only return non-empty groups
  return groups.filter((g) => g.items.length > 0);
}

/**
 * Compact relative time label for a single timestamp, e.g. "2h ago", "3d ago", "Jan 15".
 * More granular than the bucket labels — used for individual card timestamps.
 */
export function compactAge(ts: number | string | Date, now = Date.now()): string {
  const ms = ts instanceof Date ? ts.getTime() : typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const diff = now - ms;
  if (isNaN(diff) || diff < 0) return 'just now';
  const seconds = diff / 1000;
  if (seconds < 60) return 'just now';
  const minutes = seconds / 60;
  if (minutes < 60) return Math.floor(minutes) + 'm ago';
  const hours = minutes / 60;
  if (hours < 24) return Math.floor(hours) + 'h ago';
  const days = hours / 24;
  if (days < 7) return Math.floor(days) + 'd ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
