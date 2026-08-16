import { describe, expect, it } from 'vitest';
import {
  busiestSource,
  computePulseSignals,
  feedHealthReading,
  gaugeBarHTML,
  hottestModel,
  modelBuzzReading,
  pulseLabel,
  recentStories,
  topStoryHeat,
  velocityReading,
} from './pulse';
import type { Story } from './types';

const NOW = Date.parse('2026-08-16T12:00:00Z');

function story(partial: Partial<Story> & { id: string; title: string; sourceId: string; link: string }): Story {
  return {
    id: partial.id,
    sourceId: partial.sourceId,
    title: partial.title,
    link: partial.link,
    description: '',
    date: partial.date ?? new Date(NOW),
    img: '',
    points: null,
    comments: null,
    discussion: null,
    models: partial.models ?? [],
    topics: partial.topics ?? [],
    benchmarks: [],
    isModel: partial.isModel ?? false,
  };
}

const fresh = (h: number) => new Date(NOW - h * 3_600_000);

describe('recentStories / within24h', () => {
  it('keeps stories from the last 24h and drops older ones', () => {
    const list = [
      story({ id: 'a', sourceId: 'hn', title: 'Fresh', link: 'a', date: fresh(2) }),
      story({ id: 'b', sourceId: 'hn', title: 'Old', link: 'b', date: fresh(30) }),
    ];
    expect(recentStories(list, NOW).map((s) => s.id)).toEqual(['a']);
  });
});

describe('velocityReading', () => {
  it('is 0 when nothing arrived in 24h', () => {
    const list = [story({ id: 'a', sourceId: 'hn', title: 'Old', link: 'a', date: fresh(48) })];
    expect(velocityReading(list, NOW)).toEqual({ value: 0, count: 0 });
  });

  it('caps at 100 for a very busy wire', () => {
    const list = Array.from({ length: 400 }, (_, i) =>
      story({ id: 's' + i, sourceId: 'hn', title: 'S' + i, link: 's' + i, date: fresh(1) }),
    );
    expect(velocityReading(list, NOW).value).toBe(100);
  });

  it('scales proportionally', () => {
    const list = Array.from({ length: 50 }, (_, i) =>
      story({ id: 's' + i, sourceId: 'hn', title: 'S' + i, link: 's' + i, date: fresh(1) }),
    );
    expect(velocityReading(list, NOW).value).toBe(25);
  });
});

describe('modelBuzzReading', () => {
  it('counts only model-release stories in the 24h window', () => {
    const list = [
      story({ id: 'a', sourceId: 'hn', title: 'Model drop', link: 'a', date: fresh(1), isModel: true }),
      story({ id: 'b', sourceId: 'hn', title: 'Model drop 2', link: 'b', date: fresh(1), isModel: true }),
      story({ id: 'c', sourceId: 'hn', title: 'Old model', link: 'c', date: fresh(48), isModel: true }),
      story({ id: 'd', sourceId: 'hn', title: 'Not a model', link: 'd', date: fresh(1), isModel: false }),
    ];
    expect(modelBuzzReading(list, NOW)).toEqual({ value: Math.round((2 / 30) * 100), count: 2 });
  });
});

describe('hottestModel', () => {
  it('returns the most-mentioned model with its mention count', () => {
    const list = [
      story({ id: 'a', sourceId: 'hn', title: 'A', link: 'a', models: ['Qwen3.8-27B'], date: fresh(1) }),
      story({ id: 'b', sourceId: 'hn', title: 'B', link: 'b', models: ['Qwen3.8-27B', 'DeepSeek-V4'], date: fresh(2) }),
      story({ id: 'c', sourceId: 'hn', title: 'C', link: 'c', models: ['DeepSeek-V4'], date: fresh(3) }),
    ];
    expect(hottestModel(list, NOW)).toEqual({ name: 'Qwen3.8-27B', count: 2 });
  });

  it('returns null when nothing is tagged', () => {
    expect(hottestModel([story({ id: 'a', sourceId: 'hn', title: 'A', link: 'a', date: fresh(1) })], NOW)).toBeNull();
  });
});

describe('busiestSource', () => {
  it('finds the source with the most 24h stories', () => {
    const list = [
      story({ id: 'a', sourceId: 'openai', title: 'A', link: 'a', date: fresh(1) }),
      story({ id: 'b', sourceId: 'openai', title: 'B', link: 'b', date: fresh(2) }),
      story({ id: 'c', sourceId: 'hn', title: 'C', link: 'c', date: fresh(3) }),
    ];
    const best = busiestSource(list, NOW);
    expect(best).toEqual({ id: 'openai', name: 'OpenAI', count: 2 });
  });
});

describe('topStoryHeat', () => {
  it('finds the largest multi-source cluster', () => {
    const list = [
      story({ id: 'a', sourceId: 'openai', title: 'OpenAI unveils GPT-5.5 with vision', link: 'a', date: fresh(1) }),
      story({ id: 'b', sourceId: 'hn', title: 'OpenAI unveils GPT-5.5 with vision', link: 'b', date: fresh(2) }),
      story({ id: 'c', sourceId: 'techcrunch', title: 'OpenAI unveils GPT-5.5 with vision', link: 'c', date: fresh(3) }),
      story({ id: 'd', sourceId: 'verge', title: 'Something completely different', link: 'd', date: fresh(1) }),
    ];
    const heat = topStoryHeat(list);
    expect(heat?.members).toBe(3);
    expect(heat?.title).toContain('GPT-5.5');
  });

  it('returns null when nothing is multi-covered', () => {
    const list = [
      story({ id: 'a', sourceId: 'openai', title: 'One', link: 'a', date: fresh(1) }),
      story({ id: 'b', sourceId: 'hn', title: 'Two', link: 'b', date: fresh(2) }),
    ];
    expect(topStoryHeat(list)).toBeNull();
  });
});

describe('feedHealthReading', () => {
  it('computes the share of sources reporting in 24h', () => {
    const list = [
      story({ id: 'a', sourceId: 'openai', title: 'A', link: 'a', date: fresh(1) }),
      story({ id: 'b', sourceId: 'hn', title: 'B', link: 'b', date: fresh(2) }),
      story({ id: 'c', sourceId: 'openai', title: 'C', link: 'c', date: fresh(3) }),
    ];
    // Only 2 distinct sources delivered stories; totalSources is a param.
    expect(feedHealthReading(list, 8, NOW)).toEqual({ value: 25, live: 2, total: 8 });
  });
});

describe('computePulseSignals', () => {
  it('returns all six signals in a stable order', () => {
    const list = [
      story({ id: 'a', sourceId: 'openai', title: 'OpenAI drops a new model', link: 'a', date: fresh(1), isModel: true, models: ['GPT-5.5'] }),
      story({ id: 'b', sourceId: 'hn', title: 'OpenAI drops a new model', link: 'b', date: fresh(2), isModel: true, models: ['GPT-5.5'] }),
      story({ id: 'c', sourceId: 'openai', title: 'Something else', link: 'c', date: fresh(3) }),
    ];
    const signals = computePulseSignals(list, NOW);
    expect(signals.map((s) => s.id)).toEqual(['velocity', 'model-buzz', 'hot-model', 'story-heat', 'source', 'health']);
    const velocity = signals[0];
    expect(velocity.value).toBe(Math.round((3 / 200) * 100));
    expect(velocity.detail).toContain('3 stories');
    const hot = signals[2];
    expect(hot.detail).toContain('GPT-5.5');
    expect(hot.href).toContain('GPT-5.5');
    const heat = signals[3];
    expect(heat.value).toBeGreaterThan(0);
    expect(heat.detail).toContain('OpenAI drops a new model');
  });

  it('stays honest when the wire is empty', () => {
    const signals = computePulseSignals([], NOW);
    expect(signals[0]).toMatchObject({ value: 0, detail: '0 stories in the last 24h' });
    expect(signals[2].value).toBeNull();
    expect(signals[3].value).toBeNull();
    expect(signals[5].value).toBe(0);
  });
});

describe('gaugeBarHTML / pulseLabel', () => {
  it('clamps the gauge marker into 0-100', () => {
    expect(gaugeBarHTML(140)).toContain('left:100%');
    expect(gaugeBarHTML(-5)).toContain('left:0%');
    expect(gaugeBarHTML(42)).toContain('left:42%');
  });

  it('labels readings by band', () => {
    expect(pulseLabel(10)).toBe('QUIET');
    expect(pulseLabel(30)).toBe('LOW');
    expect(pulseLabel(50)).toBe('STEADY');
    expect(pulseLabel(70)).toBe('HOT');
    expect(pulseLabel(95)).toBe('BOILING');
  });
});
