import type { Story } from './types';

/** The newest `limit` stories, newest first. Shared by the newsroom headline ticker. */
export function tickerStories(stories: Story[], limit = 10): Story[] {
  return [...stories]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, Math.max(1, limit));
}
