import { describe, expect, it } from 'vitest';
import { tickerStories } from './ticker';
import type { Story } from './types';

const story = (id: string, date: Date): Story => ({
  id,
  sourceId: 'hn',
  title: id,
  link: `https://example.com/${id}`,
  description: '',
  date,
  img: '',
  points: null,
  comments: null,
  discussion: null,
  models: [],
  topics: [],
  benchmarks: [],
  isModel: false,
});

const t = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000);

describe('tickerStories', () => {
  it('returns the newest stories first', () => {
    const old = story('old', t(5));
    const mid = story('mid', t(2));
    const fresh = story('fresh', t(0));
    expect(tickerStories([old, mid, fresh]).map((s) => s.id)).toEqual(['fresh', 'mid', 'old']);
  });
  it('respects the limit', () => {
    const stories = [story('a', t(1)), story('b', t(2)), story('c', t(3))];
    expect(tickerStories(stories, 2)).toHaveLength(2);
  });
  it('keeps everything when there are fewer than the limit', () => {
    const stories = [story('a', t(1)), story('b', t(2))];
    expect(tickerStories(stories, 10)).toHaveLength(2);
  });
  it('returns an empty list for no stories', () => {
    expect(tickerStories([])).toEqual([]);
  });
  it('does not mutate the input', () => {
    const stories = [story('a', t(2)), story('b', t(1))];
    tickerStories(stories);
    expect(stories.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
