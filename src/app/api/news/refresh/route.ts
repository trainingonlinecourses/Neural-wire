import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Internal feed-sync endpoint — GET /api/news/refresh
 * Returns the complete news dataset (stories + source rows) as JSON so the
 * newsroom can re-sync the feed client-side without a full page reload.
 */
export async function GET() {
  const data = await getNewsData();
  return NextResponse.json({
    stories: data.stories.map((s) => ({ ...s, date: s.date.toISOString() })),
    sources: data.sources,
    demo: data.demo,
    fetchedAt: data.fetchedAt,
  });
}
