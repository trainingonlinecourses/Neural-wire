import { describe, expect, it } from 'vitest';
import { detectTopics } from './topics';

describe('detectTopics', () => {
  it('tags a funding story', () => {
    expect(detectTopics('Anthropic raises $3B in Series C funding round')).toContain('FUNDING');
  });

  it('tags research and benchmarks', () => {
    expect(detectTopics('New research paper evaluates SWE-bench state of the art')).toContain('RESEARCH');
  });

  it('tags product launches', () => {
    expect(detectTopics('OpenAI launches a new ChatGPT plugin')).toContain('PRODUCT');
  });

  it('returns nothing for neutral text', () => {
    expect(detectTopics('The weather is nice today.')).toEqual([]);
  });
});
