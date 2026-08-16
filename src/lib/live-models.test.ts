import { describe, expect, it } from 'vitest';
import { extractBenchmarksFromCard, vendorFromId } from './live-models';

describe('extractBenchmarksFromCard', () => {
  it('parses classic markdown pipe tables (model in first column)', () => {
    const md = [
      '| Benchmark | Qwen3-235B | Qwen2.5 |',
      '|-----------|-----------|---------|',
      '| MMLU      | 89.3      | 86.1    |',
      '| HumanEval | 92.7      | 84.2    |',
      '| GSM8K     | 94.5      | 91.5    |',
      '| SWE-bench Verified | 65.8 | 50.0 |',
    ].join('\n');
    const got = extractBenchmarksFromCard(md);
    expect(got.map((b) => b.name + '=' + b.value).join(',')).toBe(
      'MMLU=89.3,HumanEval=92.7,GSM8K=94.5,SWE-bench=65.8',
    );
  });

  it('parses DeepSeek-style comparison tables (bold = own column)', () => {
    const md = [
      '| English | MMLU (Pass@1) | 88.3 | 87.2 | **91.8** | 90.8 |',
      '| | SWE Verified (Resolved) | **50.8** | 38.8 | 42.0 | 41.6 |',
      '| | GSM8K (EM) | 92.3 | 91.2 | **97.3** | 95.8 |',
    ].join('\n');
    const got = extractBenchmarksFromCard(md);
    expect(got.map((b) => b.name + '=' + b.value).join(',')).toBe('MMLU=91.8,SWE Verified=50.8,GSM8K=97.3');
  });

  it('captures modern frontier benchmarks (HLE, Terminal Bench, DeepSWE)', () => {
    const md = [
      '| Benchmark | DeepSeek-V4 | Kimi K3 |',
      '| HLE (wo / w tools) | 42.7 / 60.0 | 43.5 / 56.0 |',
      '| Terminal Bench 2.1 | 87.9 | 88.3 |',
      '| DeepSWE | 62.7 | 54.4 |',
    ].join('\n');
    const got = extractBenchmarksFromCard(md);
    expect(got.map((b) => b.name + '=' + b.value).join(',')).toBe('HLE=42.7,Terminal Bench=87.9,DeepSWE=62.7');
  });

  it('ignores HTML-table cards rather than guessing', () => {
    const html = '<table><tr><td class="benchmark-name">MMLU</td><td>92</td></tr></table>';
    expect(extractBenchmarksFromCard(html)).toEqual([]);
  });

  it('does not confuse MMLU-Pro with MMLU', () => {
    const md = ['| Benchmark | Score |', '| MMLU-Pro | 81.1 |', '| MMLU | 89.5 |'].join('\n');
    const got = extractBenchmarksFromCard(md);
    expect(got.find((b) => b.name === 'MMLU-Pro')?.value).toBe(81.1);
    expect(got.find((b) => b.name === 'MMLU')?.value).toBe(89.5);
  });

  it('caps values to the 0-100 range', () => {
    const md = ['| Benchmark | Score |', '| GSM8K | 120 |', '| MMLU | -3 |'].join('\n');
    expect(extractBenchmarksFromCard(md)).toEqual([]);
  });
});

describe('vendorFromId', () => {
  it('maps known orgs to vendors', () => {
    expect(vendorFromId('Qwen/Qwen3.8-27B')).toBe('Alibaba');
    expect(vendorFromId('zai-org/GLM-5.3')).toBe('Zhipu');
    expect(vendorFromId('deepseek-ai/DeepSeek-V4')).toBe('DeepSeek');
    expect(vendorFromId('moonshotai/Kimi-K3')).toBe('Moonshot');
    expect(vendorFromId('openai/gpt-5.2')).toBe('OpenAI');
  });
});
