import { describe, expect, it } from 'vitest';
import {
  GH_STAR_FLOOR,
  hfSortFor,
  liveSignalCands,
  RANGE_DAYS,
  rankAll,
  signalToCand,
  withinWindow,
  type Cand,
  type RadarSignal,
} from './trending';

const cand = (id: string, value: number): Cand => ({
  id,
  name: id,
  sub: '',
  metric: String(value),
  value,
  href: 'https://example.com/' + id,
});

describe('rankAll', () => {
  it('normalizes heat to 100 for the leader of each category', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('a', 1200), cand('b', 300)] },
      { kind: 'hf', items: [cand('m', 40)] },
    ]);
    expect(rows.find((r) => r.id === 'a')?.heat).toBe(100);
    expect(rows.find((r) => r.id === 'b')?.heat).toBe(25);
    expect(rows.find((r) => r.id === 'm')?.heat).toBe(100);
  });

  it('sorts by heat desc across categories', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('small-repo', 500)] },
      { kind: 'hf', items: [cand('big-model', 300), cand('mid-model', 30)] },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['small-repo', 'big-model', 'mid-model']);
  });

  it('breaks ties by category priority then value', () => {
    const rows = rankAll([
      { kind: 'hf', items: [cand('m', 100)] },
      { kind: 'gh', items: [cand('r', 100)] },
    ]);
    expect(rows.map((r) => r.kind)).toEqual(['gh', 'hf']);
  });

  it('ranks radar signals without a numeric value at the bottom with heat 0', () => {
    const rows = rankAll([
      { kind: 'radar', items: [{ ...cand('climate', 0), name: 'Climate Intelligence' }, cand('fear-greed', 45)] },
      { kind: 'gh', items: [cand('r', 1000)] },
    ]);
    expect(rows.find((r) => r.id === 'fear-greed')?.heat).toBe(100);
    expect(rows.find((r) => r.id === 'climate')?.heat).toBe(0);
    expect(rows[rows.length - 1].id).toBe('climate');
  });

  it('assigns a cross-category global percentile (100 top, 0 bottom)', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('a', 1000), cand('b', 500)] },
      { kind: 'hf', items: [cand('m', 300), cand('n', 10)] },
    ]);
    expect(rows.map((r) => r.global)).toEqual([100, 67, 33, 0]);
  });

  it('gives a single row full global heat', () => {
    const rows = rankAll([{ kind: 'gh', items: [cand('only', 10)] }]);
    expect(rows[0].global).toBe(100);
  });

  it('handles an empty category without dividing by zero', () => {
    const rows = rankAll([{ kind: 'gh', items: [] }]);
    expect(rows).toEqual([]);
  });
});

describe('time ranges', () => {
  it('maps each range to its window in days', () => {
    expect(RANGE_DAYS).toEqual({ '24h': 1, '7d': 7, '30d': 30 });
  });
  it('raises the GitHub star floor for older windows', () => {
    expect(GH_STAR_FLOOR['24h']).toBeLessThan(GH_STAR_FLOOR['7d']);
    expect(GH_STAR_FLOOR['7d']).toBeLessThan(GH_STAR_FLOOR['30d']);
  });
  it('uses trendingScore for short windows and likes for 30d', () => {
    expect(hfSortFor('24h')).toBe('trendingScore');
    expect(hfSortFor('7d')).toBe('trendingScore');
    expect(hfSortFor('30d')).toBe('likes');
  });
  it('keeps timestamps inside the window inclusive of the boundary', () => {
    const now = 1_700_000_000_000;
    const day = 86_400_000;
    expect(withinWindow(now - day, 1, now)).toBe(true);
    expect(withinWindow(now - day - 1, 1, now)).toBe(false);
    expect(withinWindow(now - 7 * day, 7, now)).toBe(true);
    expect(withinWindow(now - 7 * day - 1, 7, now)).toBe(false);
  });
});

describe('signalToCand', () => {
  const signal = (id: string, value: number | null): RadarSignal => ({
    id,
    name: id,
    icon: '📡',
    value,
    detail: 'reading',
    href: 'https://www.worldmonitor.app',
  });

  it('maps a numeric signal to a scored candidate', () => {
    expect(signalToCand(signal('fg', 42)).value).toBe(42);
    expect(signalToCand(signal('fg', 42)).metric).toBe('42 / 100');
  });
  it('maps a null-value signal to a zero-score candidate', () => {
    const c = signalToCand(signal('climate', null));
    expect(c.value).toBe(0);
    expect(c.metric).toBe('—');
  });
});

describe('liveSignalCands', () => {
  const signal = (id: string, value: number | null, detail: string): RadarSignal => ({
    id,
    name: id,
    icon: '📡',
    value,
    detail,
    href: 'https://www.worldmonitor.app',
  });

  it('drops pure status rows and keeps real readings', () => {
    const cands = liveSignalCands([
      signal('fg', 55, 'greed'),
      signal('climate', null, 'WorldMonitor API key required'),
      signal('co2', null, 'endpoint unreachable'),
    ]);
    expect(cands.map((c) => c.id)).toEqual(['fg']);
  });
  it('keeps informational rows with a real detail even without a number', () => {
    const cands = liveSignalCands([signal('air', null, 'JFK — Ground Stop')]);
    expect(cands.map((c) => c.id)).toEqual(['air']);
  });
});
