import { describe, expect, it } from 'vitest';
import {
  addedKeys,
  formatCountdown,
  idDiff,
  parseRefreshInterval,
  refreshIntervalLabel,
  REFRESH_INTERVALS,
  storyDiff,
} from './refresh';
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

describe('parseRefreshInterval', () => {
  it('accepts each allowed interval', () => {
    for (const s of REFRESH_INTERVALS) expect(parseRefreshInterval(s)).toBe(s);
  });
  it('accepts numeric strings', () => {
    expect(parseRefreshInterval('600')).toBe(600);
  });
  it('falls back for unknown values', () => {
    expect(parseRefreshInterval(240)).toBe(180);
    expect(parseRefreshInterval('abc')).toBe(180);
    expect(parseRefreshInterval(null)).toBe(180);
  });
  it('honors a custom fallback', () => {
    expect(parseRefreshInterval(999, 60)).toBe(60);
  });
});

describe('refreshIntervalLabel', () => {
  it('formats minutes', () => {
    expect(refreshIntervalLabel(60)).toBe('1 MIN');
    expect(refreshIntervalLabel(180)).toBe('3 MIN');
    expect(refreshIntervalLabel(600)).toBe('10 MIN');
  });
});

describe('addedKeys', () => {
  it('returns keys present in next but not prev', () => {
    expect(addedKeys(['a', 'b'], ['b', 'c'])).toEqual(['c']);
  });
  it('returns the empty list for identical sets', () => {
    expect(addedKeys(['a', 'b'], ['b', 'a'])).toEqual([]);
  });
  it('dedupes the next list', () => {
    expect(addedKeys(['a'], ['b', 'b'])).toEqual(['b']);
  });
  it('treats a fresh prev as all-new', () => {
    expect(addedKeys([], ['x', 'y'])).toEqual(['x', 'y']);
  });
});

describe('idDiff', () => {
  it('reports added and removed ids', () => {
    expect(idDiff(['a', 'b'], ['b', 'c'])).toEqual({ added: 1, removed: 1 });
  });
  it('reports no changes for identical lists', () => {
    expect(idDiff(['a', 'b'], ['b', 'a'])).toEqual({ added: 0, removed: 0 });
  });
  it('handles a fully fresh list', () => {
    expect(idDiff([], ['x'])).toEqual({ added: 1, removed: 0 });
  });
  it('counts duplicates once', () => {
    expect(idDiff(['a', 'a'], ['a'])).toEqual({ added: 0, removed: 0 });
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
