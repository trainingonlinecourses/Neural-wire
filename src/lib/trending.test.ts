import { describe, expect, it } from 'vitest';
import { rankAll, type Cand } from './trending';

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

  it('handles an empty category without dividing by zero', () => {
    const rows = rankAll([{ kind: 'gh', items: [] }]);
    expect(rows).toEqual([]);
  });
});
