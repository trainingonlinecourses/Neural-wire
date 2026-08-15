import type { Story } from '@/lib/types';

/**
 * Story coverage clustering — groups near-duplicate stories (the same story
 * covered by HN, Ars, TechCrunch, …) so the desk can show "N sources covering".
 * Pure functions, fully unit-tested.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'with', 'and', 'or', 'on', 'in', 'to', 'at',
  'is', 'are', 'was', 'were', 'be', 'it', 'its', 'this', 'that', 'as', 'by',
  'from', 'how', 'why', 'what', 'who', 'new', 'ai', 'your', 'you', 'we', 'us',
]);

const TITLE_SUFFIX_RE = /\s*(?:[—–|-]|\|)\s*(hacker\s*news|techcrunch|venturebeat|the\s*verge|arstechnica|mit\s*technology\s*review|lobsters|dev\s*community|opensource\.google|aws\s*machine\s*learning\s*blog|nvidia\s*blog|google\s*deepmind|google\s*ai\s*blog|openai|google)$/i;
const TITLE_PREFIX_RE = /^(show\s+hn:?|ask\s+hn:?|tell\s+hn:?|launch\s+hn:?|video\s+)\s*/i;
const PUNCT_RE = /[^\p{L}\p{N}]+/gu;

/** Normalize a headline for comparison: lower, strip prefixes/suffixes/punct. */
export function normalizeTitle(title: string): string {
  let t = title.trim().toLowerCase();
  t = t.replace(TITLE_PREFIX_RE, '');
  t = t.replace(TITLE_SUFFIX_RE, '');
  return t.replace(PUNCT_RE, ' ').replace(/\s+/g, ' ').trim();
}

/** Distinct content tokens of a normalized title (stopwords dropped). */
export function titleTokens(title: string): string[] {
  return normalizeTitle(title)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Jaccard similarity of two token sets, 0..1. */
export function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Overlap coefficient — shared tokens over the smaller set. Better than
 * Jaccard for short news titles, where one side legitimately has extra words
 * ("OpenAI announces X" vs "OpenAI unveils X model with vision features").
 */
export function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const min = Math.min(sa.size, sb.size);
  return min === 0 ? 0 : inter / min;
}

export const FUZZY_THRESHOLD = 0.62;

export interface ClusterGroup {
  /** Representative (newest) story id of the cluster. */
  key: string;
  /** All member story ids, including the representative. */
  members: string[];
}

/**
 * Group stories into coverage clusters. Exact normalized-title matches always
 * cluster; remaining stories join a cluster when their token Jaccard clears
 * the fuzzy threshold. Deterministic (input order decides ties).
 */
export function coverageClusters(stories: Story[]): Map<string, ClusterGroup> {
  const byId = new Map(stories.map((s) => [s.id, s]));
  const groups = new Map<string, ClusterGroup>(); // key -> group

  const addTo = (key: string, id: string) => {
    groups.get(key)!.members.push(id);
  };

  // Newest first so the newest story becomes the cluster representative.
  const ordered = [...stories].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const s of ordered) {
    const norm = normalizeTitle(s.title);
    const tokens = titleTokens(s.title);

    // 1) exact normalized match
    let key: string | null = null;
    for (const [k, g] of groups) {
      if (g.members.length === 0) continue;
      const rep = byId.get(g.members[0]);
      if (rep && normalizeTitle(rep.title) === norm) {
        key = k;
        break;
      }
    }
    if (key === null && norm) {
      // 2) fuzzy token match against each cluster representative
      for (const [k, g] of groups) {
        const rep = byId.get(g.members[0]);
        if (!rep || rep.id === s.id) continue;
        if (tokens.length > 0 && overlap(tokens, titleTokens(rep.title)) >= FUZZY_THRESHOLD) {
          key = k;
          break;
        }
      }
    }

    if (key !== null) {
      addTo(key, s.id);
    } else {
      groups.set(s.id, { key: s.id, members: [s.id] });
    }
  }

  // Only return clusters with 2+ members; keep the map keyed by member id.
  const result = new Map<string, ClusterGroup>();
  for (const [k, g] of groups) {
    if (g.members.length < 2) continue;
    for (const id of g.members) {
      if (byId.has(id)) result.set(id, g);
    }
  }
  return result;
}

/** Convenience: coverage member ids for one story (excluding itself). */
export function coverageMembers(clusters: Map<string, ClusterGroup>, storyId: string): string[] {
  const g = clusters.get(storyId);
  if (!g) return [];
  return g.members.filter((id) => id !== storyId);
}
