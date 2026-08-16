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

  it('detects the full Chinese ecosystem', () => {
    const text =
      'DeepSeek-V3 and Qwen3 and GLM-4.5 and Kimi K2 and MiniMax M1 and Baichuan 4 and Yi-Lightning and InternLM3 and ERNIE 4.5 and Hunyuan-T1 and Step-2 and Doubao 1.5 and Skywork and iFlytek Spark X1';
    expect(detectModels(text)).toEqual([
      'DeepSeek',
      'Qwen',
      'GLM',
      'Kimi',
      'MiniMax',
      'Baichuan',
      'Yi',
      'InternLM',
      'ERNIE',
      'Hunyuan',
      'Step',
      'iFlytek',
      'Spark',
      'Doubao',
      'Skywork',
    ]);
  });

  it('detects frontier models from every major lab', () => {
    const text =
      'GPT-4.1, o1 and o3 from OpenAI, Claude from Anthropic, Gemini and Gemma from Google, Llama from Meta, Grok from xAI, Mistral and Codestral, Command A from Cohere, Nemotron from NVIDIA, Granite from IBM, Nova Pro from AWS, Phi-4 and MAI-1 from Microsoft';
    expect(detectModels(text)).toEqual([
      'GPT-4.1',
      'o1',
      'o3',
      'Claude',
      'Gemini',
      'Gemma',
      'Llama',
      'Grok',
      'Mistral',
      'Codestral',
      'Command A',
      'Cohere',
      'Nemotron',
      'Granite',
      'Nova',
      'Phi',
      'MAI',
    ]);
  });

  it('does not fire on generic words like nova, step or spark alone', () => {
    expect(detectModels('A nova is a star; take the next step; the spark plug fired')).toEqual([]);
  });
});
