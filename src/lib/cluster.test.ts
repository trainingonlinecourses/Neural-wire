import { describe, expect, it } from 'vitest';
import { normalizeTitle, titleTokens, jaccard, coverageClusters, coverageMembers, FUZZY_THRESHOLD } from './cluster';
import type { Story } from '@/lib/types';

function story(id: string, title: string, date = '2026-08-15T10:00:00Z'): Story {
  return {
    id,
    title,
    link: 'https://example.com/' + id,
    description: '',
    date: new Date(date),
    img: '',
    points: null,
    comments: null,
    discussion: null,
    sourceId: 'hn',
    models: [],
    topics: [],
    benchmarks: [],
    isModel: false,
  };
}

describe('normalizeTitle', () => {
  it('strips common HN prefixes', () => {
    expect(normalizeTitle('Show HN: My New Thing')).toBe('my new thing');
    expect(normalizeTitle('Ask HN: What stack?')).toBe('what stack');
  });

  it('strips source suffixes', () => {
    expect(normalizeTitle('Big model news — TechCrunch')).toBe('big model news');
    expect(normalizeTitle('Big model news | Hacker News')).toBe('big model news');
  });

  it('lowercases and collapses punctuation/whitespace', () => {
    expect(normalizeTitle('  Hello,   WORLD!!! ')).toBe('hello world');
    expect(normalizeTitle('C++ vs Rust: the sequel')).toBe('c vs rust the sequel');
  });
});

describe('titleTokens / jaccard', () => {
  it('drops stopwords and short tokens', () => {
    expect(titleTokens('The quick brown fox')).toEqual(['quick', 'brown', 'fox']);
  });

  it('scores identical sets 1 and disjoint sets 0', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1);
    expect(jaccard(['a'], ['b'])).toBe(0);
    expect(jaccard([], [])).toBe(1);
    expect(jaccard([], ['x'])).toBe(0);
  });
});

describe('coverageClusters', () => {
  it('clusters near-identical titles across sources', () => {
    const s1 = story('a', 'Google launches a new robotics model');
    const s2 = story('b', 'Google launches a new robotics model — TechCrunch', '2026-08-15T11:00:00Z');
    const clusters = coverageClusters([s1, s2]);
    expect(clusters.size).toBe(2);
    expect(coverageMembers(clusters, 'a')).toEqual(['b']);
    expect(coverageMembers(clusters, 'b')).toEqual(['a']);
  });

  it('clusters fuzzy paraphrases above the threshold', () => {
    const s1 = story('a', 'OpenAI announces GPT-5 Turbo with vision');
    const s2 = story('b', 'OpenAI unveils GPT-5 Turbo model with vision features', '2026-08-15T11:00:00Z');
    const clusters = coverageClusters([s1, s2]);
    expect(coverageMembers(clusters, 'a')).toContain('b');
  });

  it('does not cluster unrelated stories', () => {
    const s1 = story('a', 'NVIDIA reports record data center revenue');
    const s2 = story('b', 'A tiny moon base for astronauts', '2026-08-15T11:00:00Z');
    const clusters = coverageClusters([s1, s2]);
    expect(coverageMembers(clusters, 'a')).toEqual([]);
    expect(coverageMembers(clusters, 'b')).toEqual([]);
    expect(clusters.size).toBe(0);
  });

  it('picks the newest story as representative', () => {
    const older = story('old', 'Robots learn to cook by watching videos');
    const newer = story('new', 'Robots learn to cook by watching videos', '2026-08-15T12:00:00Z');
    const clusters = coverageClusters([older, newer]);
    // Both map to the same group whose key is the newest id.
    expect(clusters.get('old')?.key).toBe('new');
    expect(clusters.get('new')?.key).toBe('new');
  });

  it('groups chains of three', () => {
    const s1 = story('a', 'Tesla robotaxi unveiling set for October');
    const s2 = story('b', 'Tesla robotaxi unveiling set for October — Ars Technica', '2026-08-15T11:00:00Z');
    const s3 = story('c', 'Tesla robotaxi unveiling set for October — The Verge', '2026-08-15T12:00:00Z');
    const clusters = coverageClusters([s1, s2, s3]);
    expect(coverageMembers(clusters, 'a')).toHaveLength(2);
    expect(coverageMembers(clusters, 'b')).toHaveLength(2);
    expect(coverageMembers(clusters, 'c')).toHaveLength(2);
  });

  it('uses the exported fuzzy threshold', () => {
    expect(FUZZY_THRESHOLD).toBeGreaterThan(0.5);
    expect(FUZZY_THRESHOLD).toBeLessThan(1);
  });
});
