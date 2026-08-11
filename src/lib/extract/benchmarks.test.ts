import { describe, expect, it } from 'vitest';
import { BENCH_RULES, extractBenchmarks } from './benchmarks';

describe('extractBenchmarks', () => {
  it('parses SWE-bench Verified with percent', () => {
    expect(extractBenchmarks('Scored 92.1% on SWE-bench Verified')).toEqual([
      { benchmark: 'SWE-bench Verified', score: 92.1, unit: '%' },
    ]);
  });

  it('parses Arena Elo with elo unit', () => {
    expect(extractBenchmarks('Arena Elo 1423')).toEqual([
      { benchmark: 'Arena Elo', score: 1423, unit: 'elo' },
    ]);
  });

  it('prefers longest benchmark name over substring', () => {
    const hits = extractBenchmarks('SWE-bench Verified: 80% and SWE-bench 75%');
    expect(hits.map((h) => h.benchmark)).toContain('SWE-bench Verified');
  });

  it('skips text with no numeric score', () => {
    expect(extractBenchmarks('no benchmark scores mentioned here')).toEqual([]);
  });

  it('every rule compiles', () => {
    for (const r of BENCH_RULES) expect(r.re.test('')).toBe(false);
  });
});
