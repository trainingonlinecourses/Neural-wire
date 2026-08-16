import { describe, expect, it } from 'vitest';
import { benchmarkLabel, readMinutes, storyStats } from './story-meta';
import type { Story } from '@/lib/types';

function story(over: Partial<Story> = {}): Story {
  return {
    id: '1',
    title: 'A headline',
    link: 'https://example.com',
    description: '',
    date: new Date('2026-08-15T10:00:00Z'),
    img: '',
    points: null,
    comments: null,
    discussion: null,
    sourceId: 'hn',
    models: [],
    topics: [],
    benchmarks: [],
    isModel: false,
    ...over,
  };
}

describe('benchmarkLabel', () => {
  it('formats name, score and unit compactly', () => {
    expect(benchmarkLabel('Arena Elo', 38, 'elo')).toBe('ARENA ELO 38 elo');
    expect(benchmarkLabel('SWE-bench', 62.5, '%')).toBe('SWE-BENCH 62.5 %');
  });

  it('formats large scores with k shorthand', () => {
    expect(benchmarkLabel('MMLU', 91200, '')).toBe('MMLU 91.2k');
  });
});

describe('storyStats', () => {
  it('returns null labels when engagement is absent', () => {
    const st = storyStats(story());
    expect(st.pointsLabel).toBeNull();
    expect(st.commentsLabel).toBeNull();
    expect(st.hasDiscussion).toBe(false);
    expect(st.benchmarks).toEqual([]);
  });

  it('formats points and comments, and flags the discussion link', () => {
    const st = storyStats(
      story({ points: 279, comments: 238, discussion: 'https://news.ycombinator.com/item?id=1' }),
    );
    expect(st.pointsLabel).toBe('279');
    expect(st.commentsLabel).toBe('238');
    expect(st.hasDiscussion).toBe(true);
  });

  it('uses k shorthand for large engagement', () => {
    const st = storyStats(story({ points: 1320, comments: 4100 }));
    expect(st.pointsLabel).toBe('1.3k');
    expect(st.commentsLabel).toBe('4.1k');
  });

  it('estimates reading time from title + description length', () => {
    expect(readMinutes(story({ title: 'A headline' }))).toBe(1);
    expect(readMinutes(story({ title: 'T', description: Array(400).fill('word').join(' ') }))).toBe(2);
    expect(readMinutes(story({ title: '', description: '' }))).toBe(1);
    expect(storyStats(story({ description: Array(800).fill('word').join(' ') })).readMinutes).toBe(4);
  });

  it('builds benchmark chips capped at three', () => {
    const st = storyStats(
      story({
        benchmarks: [
          { benchmark: 'Arena Elo', score: 38, unit: 'elo' },
          { benchmark: 'MMLU', score: 84, unit: '%' },
          { benchmark: 'SWE-bench', score: 55, unit: '%' },
          { benchmark: 'GPQA', score: 49, unit: '%' },
        ],
      }),
    );
    expect(st.benchmarks).toHaveLength(3);
    expect(st.benchmarks[0].label).toBe('ARENA ELO 38 elo');
    expect(st.benchmarks[0].title).toContain('Arena Elo');
  });
});
