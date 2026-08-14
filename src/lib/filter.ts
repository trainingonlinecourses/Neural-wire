import type { Story } from './types';

/**
 * Case-insensitive search across a story's title, description, model
 * mentions and topics. An empty or whitespace-only query returns the list
 * unchanged. Shared by the newsroom explorer and the public /api/news endpoint.
 */
export function filterStories(stories: Story[], q: string): Story[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return stories;
  return stories.filter(
    (s) =>
      s.title.toLowerCase().includes(needle) ||
      s.description.toLowerCase().includes(needle) ||
      s.models.some((m) => m.toLowerCase().includes(needle)) ||
      s.topics.some((t) => t.toLowerCase().includes(needle)),
  );
}
