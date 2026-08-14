import { describe, expect, it } from 'vitest';
import { buildBrief } from './brief';
import type { Story } from './types';

const now = Date.now();
const H = 3_600_000;

function story(over: Partial<Story>): Story {
  return {
    id: 's::' + Math.random(),
    sourceId: 'openai',
    title: 'A story',
    link: 'https://example.com/' + Math.random(),
    description: '',
    date: new Date(now),
    img: '',
    points: null,
    comments: null,
    discussion: null,
    models: [],
    topics: [],
    benchmarks: [],
    isModel: false,
    ...over,
  };
}

const stories: Story[] = [
  story({ id: 'fresh-model', title: 'GPT-6 teased', date: new Date(now - 1 * H), models: ['GPT-6'], topics: ['models', 'agents'] }),
  story({ id: 'fresh-2', title: 'Agent tooling roundup', date: new Date(now - 2 * H), models: ['Claude'], topics: ['agents'] }),
  story({ id: 'fresh-3', title: 'Chip supply news', date: new Date(now - 5 * H), models: [], topics: ['hardware'] }),
  story({ id: 'old', title: 'A week-old story', date: new Date(now - 8 * 24 * H), models: ['GPT-5'], topics: ['models'] }),
];

describe('buildBrief', () => {
  it('only counts stories inside the window', () => {
    const brief = buildBrief(stories, 1);
    expect(brief.total).toBe(3);
    expect(brief.hot.map((s) => s.id)).not.toContain('old');
  });

  it('ranks topics by count, newest story first within a topic', () => {
    const brief = buildBrief(stories, 1);
    expect(brief.topics[0].name).toBe('agents');
    expect(brief.topics[0].count).toBe(2);
    expect(brief.topics[0].sample[0].id).toBe('fresh-model');
  });

  it('ranks models by mention count and tracks the latest story', () => {
    const brief = buildBrief(stories, 1);
    expect(brief.models[0].name).toBe('GPT-6');
    expect(brief.models[0].count).toBe(1);
    expect(brief.models[0].latest.id).toBe('fresh-model');
  });

  it('aggregates sources by activity', () => {
    const brief = buildBrief(stories, 1);
    const openai = brief.sources.find((s) => s.id === 'openai');
    expect(openai?.count).toBe(3);
  });

  it('handles an empty feed without throwing', () => {
    const brief = buildBrief([], 1);
    expect(brief.total).toBe(0);
    expect(brief.topics).toEqual([]);
    expect(brief.models).toEqual([]);
    expect(brief.hot).toEqual([]);
  });

  it('sorts the hot list newest first', () => {
    const brief = buildBrief(stories, 1);
    const times = brief.hot.map((s) => s.date.getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
