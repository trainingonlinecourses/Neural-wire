import { describe, expect, it } from 'vitest';
import { formatCountdown, storyDiff } from './refresh';
import type { Story } from './types';

const story = (id: string): Story => ({
  id,
  sourceId: 'hn',
  title: id,
  link: `https://example.com/${id}`,
  description: '',
  date: new Date(),
  img: '',
  points: null,
  comments: null,
  discussion: null,
  models: [],
  topics: [],
  benchmarks: [],
  isModel: false,
});

describe('formatCountdown', () => {
  it('formats whole minutes', () => {
    expect(formatCountdown(180)).toBe('3:00');
  });
  it('pads seconds below ten', () => {
    expect(formatCountdown(65)).toBe('1:05');
  });
  it('shows bare seconds below a minute', () => {
    expect(formatCountdown(9)).toBe('0:09');
  });
  it('never goes negative', () => {
    expect(formatCountdown(-4)).toBe('0:00');
  });
});

describe('storyDiff', () => {
  it('reports added and removed stories', () => {
    const d = storyDiff([story('a'), story('b')], [story('b'), story('c')]);
    expect(d).toEqual({ added: 1, removed: 1 });
  });
  it('reports no changes for identical lists', () => {
    expect(storyDiff([story('a')], [story('a')])).toEqual({ added: 0, removed: 0 });
  });
  it('ignores ordering', () => {
    expect(storyDiff([story('a'), story('b')], [story('b'), story('a')])).toEqual({
      added: 0,
      removed: 0,
    });
  });
  it('handles a fully fresh list', () => {
    const d = storyDiff([], [story('x')]);
    expect(d).toEqual({ added: 1, removed: 0 });
  });
});
