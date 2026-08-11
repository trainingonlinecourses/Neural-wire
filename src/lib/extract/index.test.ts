import { describe, expect, it } from 'vitest';
import { extractStoryMeta } from './index';

describe('extractStoryMeta', () => {
  it('flags a model release story', () => {
    const meta = extractStoryMeta('OpenAI releases GPT-5', '');
    expect(meta.isModel).toBe(true);
    expect(meta.models).toContain('GPT-5');
    expect(meta.topics).toContain('PRODUCT');
    expect(meta.entities.map((e) => e.name)).toContain('OpenAI');
  });

  it('extracts benchmark scores from the blob', () => {
    const meta = extractStoryMeta('Anthropic launches Claude 4', 'SWE-bench Verified 78.5%');
    expect(meta.benchmarks).toEqual([{ benchmark: 'SWE-bench Verified', score: 78.5, unit: '%' }]);
    expect(meta.models).toContain('Claude');
  });

  it('non-model story stays unflagged', () => {
    const meta = extractStoryMeta('EU passes new AI regulation', '');
    expect(meta.isModel).toBe(false);
    expect(meta.models).toEqual([]);
  });
});
