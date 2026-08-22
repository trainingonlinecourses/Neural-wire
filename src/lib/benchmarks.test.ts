import { describe, expect, it } from 'vitest';
import { BENCHMARKS, BENCH_MODELS, benchById, modelsForBench } from './benchmarks';

describe('benchmark dataset integrity', () => {
  const ids = new Set(BENCHMARKS.map((b) => b.id));

  it('has unique benchmark ids with descriptions', () => {
    expect(ids.size).toBe(BENCHMARKS.length);
    for (const b of BENCHMARKS) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.desc.length).toBeGreaterThan(10);
    }
  });

  it('sources every model to an official-looking URL', () => {
    for (const m of BENCH_MODELS) {
      expect(m.source.startsWith('https://'), `${m.model} source`).toBe(true);
      const host = new URL(m.source).hostname;
      expect(host.length).toBeGreaterThan(3);
    }
  });

  it('has no fabricated scores: every score is on a known benchmark and in range', () => {
    for (const m of BENCH_MODELS) {
      for (const [bid, v] of Object.entries(m.scores)) {
        expect(ids.has(bid), `${m.model} unknown bench ${bid}`).toBe(true);
        expect(typeof v).toBe('number');
        expect(v).toBeGreaterThan(0);
        // Arena Elo scores are 1000-1600, percentage benchmarks are 0-100
        const bench = BENCHMARKS.find((b) => b.id === bid);
        const maxScore = bench?.unit === ' elo' ? 2000 : 100;
        expect(v).toBeLessThanOrEqual(maxScore);
      }
    }
  });

  it('has unique model names and release dates', () => {
    const names = BENCH_MODELS.map((m) => m.model);
    expect(new Set(names).size).toBe(names.length);
    for (const m of BENCH_MODELS) expect(m.released).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/);
  });

  it('offers only benchmarks current models report (MMLU + SWE-bench)', () => {
    expect(modelsForBench('mmlu').length).toBeGreaterThanOrEqual(2);
    expect(modelsForBench('swebench').length).toBeGreaterThanOrEqual(2);
    // HumanEval/GSM8K are 2024-era — the 2025+ roster doesn't report them.
    expect(modelsForBench('humaneval').length).toBe(0);
    expect(modelsForBench('gsm8k').length).toBe(0);
  });

  it('keeps the roster to 2025+ releases only', () => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const m of BENCH_MODELS) {
      const month = MONTHS.indexOf(m.released.slice(0, 3));
      const year = parseInt(m.released.slice(4), 10);
      expect(year * 12 + month, m.model + ' (' + m.released + ')').toBeGreaterThanOrEqual(2025 * 12);
    }
  });

  it('sorts best-first and honours missing scores', () => {
    const rows = modelsForBench('swebench');
    const vals = rows.map((m) => m.scores.swebench!);
    expect([...vals].sort((a, b) => b - a)).toEqual(vals);
    expect(rows.length).toBeLessThan(BENCH_MODELS.length); // not every model reports SWE-bench
  });

  it('includes the full Chinese ecosystem in the roster', () => {
    const names = BENCH_MODELS.map((m) => m.model);
    for (const cn of ['DeepSeek-R1', 'Kimi K2', 'GLM-4.5', 'Qwen3-235B-A22B-Instruct', 'Qwen3-30B-A3B-Instruct', 'MiniMax-M1-80K', 'GLM-4.6']) {
      expect(names).toContain(cn);
    }
  });

  it('has a roster of at least 12 current models', () => {
    expect(BENCH_MODELS.length).toBeGreaterThanOrEqual(12);
  });

  it('resolves benchmark ids', () => {
    expect(benchById('mmlu')?.name).toBe('MMLU');
    expect(benchById('nope')).toBeUndefined();
  });
});
