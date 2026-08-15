import type { Story } from '@/lib/types';

/**
 * Keyword watch — let users track terms across the live feed and get pinged
 * when a new story matches. Pure matching helpers + localStorage persistence.
 */

export const WATCH_STORAGE_KEY = 'nw_watch_terms';
export const MAX_WATCH_TERMS = 12;

export function normalizeTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** All searchable text of a story: title, snippet, models, topics, source. */
export function storySearchText(s: Story): string {
  return [
    s.title,
    s.description,
    ...s.models,
    ...s.topics,
    ...(s.benchmarks || []).map((b) => b.benchmark),
    s.sourceId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Does this story mention the term? Substring on the normalized search text. */
export function storyMatchesTerm(s: Story, term: string): boolean {
  const t = normalizeTerm(term);
  if (!t) return false;
  return storySearchText(s).includes(t);
}

/** Stories (from a set) that mention any watched term, with the matched term. */
export function matchStories(stories: Story[], terms: string[]): { story: Story; term: string }[] {
  const out: { story: Story; term: string }[] = [];
  for (const s of stories) {
    for (const term of terms) {
      if (storyMatchesTerm(s, term)) {
        out.push({ story: s, term });
        break; // one alert per story
      }
    }
  }
  return out;
}

/** Safe localStorage read; returns [] on any failure. */
export function loadWatchTerms(): string[] {
  try {
    const raw = window.localStorage.getItem(WATCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').map(normalizeTerm).filter(Boolean).slice(0, MAX_WATCH_TERMS);
  } catch {
    return [];
  }
}

/** Safe localStorage write; ignores quota/availability errors. */
export function saveWatchTerms(terms: string[]): void {
  try {
    window.localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(terms.slice(0, MAX_WATCH_TERMS)));
  } catch {
    /* storage unavailable — keep the in-memory terms */
  }
}
