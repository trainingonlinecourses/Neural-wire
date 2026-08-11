import { describe, expect, it } from 'vitest';
import { detectModels } from './models';

describe('detectModels', () => {
  it('detects an explicit model name', () => {
    expect(detectModels('Anthropic releases Claude 4')).toEqual(['Claude']);
  });

  it('detects multiple models, deduped, in definition order', () => {
    expect(detectModels('OpenAI announced GPT-5 and o3 today; GPT-5 later')).toEqual(['GPT-5', 'o3']);
  });

  it('does not fire on plain text', () => {
    expect(detectModels('Market closes up 2% on earnings')).toEqual([]);
  });
});
