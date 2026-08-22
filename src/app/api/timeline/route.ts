import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { buildTimeline } from '@/lib/ai-timeline';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * GET /api/timeline
 * Returns an interactive AI history timeline built from the story feed,
 * with events classified into threads and clustered into eras.
 */
export async function GET() {
  const data = await getNewsData();
  const timeline = buildTimeline(data.stories);

  return NextResponse.json({
    events: timeline.events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
    eras: timeline.eras.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
    })),
    threads: timeline.threads,
    stats: timeline.stats,
    demo: data.demo,
    generatedAt: Date.now(),
  });
}
