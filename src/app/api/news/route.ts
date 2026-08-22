import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { filterStories } from '@/lib/filter';

export const runtime = 'nodejs';

/**
 * Public news API — GET /api/news?q=&source=&limit=
 * Returns the latest stories as JSON so any client can consume the wire.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const limitRaw = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(1000, Math.max(1, limitRaw)) : 50;

  const data = await getNewsData();

  let stories = data.stories;
  if (source) stories = stories.filter((s) => s.sourceId === source);
  stories = filterStories(stories, q);

  const rows = stories.slice(0, limit).map((s) => ({
    id: s.id,
    title: s.title,
    link: s.link,
    description: s.description,
    publishedAt: s.date.toISOString(),
    source: s.sourceId,
    models: s.models,
    topics: s.topics,
    isModel: s.isModel,
  }));

  return NextResponse.json({
    total: stories.length,
    returned: rows.length,
    demo: data.demo,
    fetchedAt: new Date(data.fetchedAt).toISOString(),
    stories: rows,
  });
}
