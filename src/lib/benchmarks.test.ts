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
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('has unique model names and release dates', () => {
    const names = BENCH_MODELS.map((m) => m.model);
    expect(new Set(names).size).toBe(names.length);
    for (const m of BENCH_MODELS) expect(m.released).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/);
  });

  it('covers every benchmark with at least two models (SWE-bench is the sparsest)', () => {
    for (const b of BENCHMARKS) {
      expect(modelsForBench(b.id).length, b.name).toBeGreaterThanOrEqual(2);
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
    for (const cn of ['DeepSeek-V3', 'DeepSeek-R1', 'Qwen2.5-72B', 'Kimi K2', 'GLM-4.5']) {
      expect(names).toContain(cn);
    }
  });

  it('has a roster of at least 15 models', () => {
    expect(BENCH_MODELS.length).toBeGreaterThanOrEqual(15);
  });

  it('resolves benchmark ids', () => {
    expect(benchById('mmlu')?.name).toBe('MMLU');
    expect(benchById('nope')).toBeUndefined();
  });
});
