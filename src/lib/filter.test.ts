import { describe, expect, it } from 'vitest';
import { filterStories } from './filter';
import type { Story } from './types';

function story(over: Partial<Story>): Story {
  return {
    id: 's::' + Math.random(),
    sourceId: 'openai',
    title: 'A story title',
    link: 'https://example.com/story',
    description: '',
    date: new Date('2026-08-14T10:00:00Z'),
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
  story({ id: 'a', title: 'OpenAI ships a new agent', models: ['GPT-5'], topics: ['agents'] }),
  story({ id: 'b', title: 'Nvidia earnings beat expectations', models: [], topics: ['hardware'] }),
  story({
    id: 'c',
    title: 'DeepMind paper review',
    description: 'A look at the latest robotics results',
    models: ['Gemini'],
    topics: ['robotics', 'research'],
  }),
];

describe('filterStories', () => {
  it('returns the list unchanged for an empty or whitespace query', () => {
    expect(filterStories(stories, '')).toEqual(stories);
    expect(filterStories(stories, '   ')).toEqual(stories);
  });

  it('matches case-insensitively on the title', () => {
    expect(filterStories(stories, 'NVIDIA').map((s) => s.id)).toEqual(['b']);
  });

  it('matches on description', () => {
    expect(filterStories(stories, 'robotics results').map((s) => s.id)).toEqual(['c']);
  });

  it('matches on model mentions', () => {
    expect(filterStories(stories, 'gpt-5').map((s) => s.id)).toEqual(['a']);
  });

  it('matches on topics', () => {
    expect(filterStories(stories, 'hardware').map((s) => s.id)).toEqual(['b']);
  });

  it('preserves original order and keeps every matching story', () => {
    expect(filterStories(stories, 'ai').length).toBeGreaterThan(0);
    const ids = filterStories(stories, '').map((s) => s.id);
    expect(ids).toEqual(stories.map((s) => s.id));
  });
});
