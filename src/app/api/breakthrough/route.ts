import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { detectBreakthroughs } from '@/lib/breakthrough';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * GET /api/breakthrough
 * Detects breakthrough moments — when multiple high-impact stories cluster
 * together in a short time window, indicating something big happened.
 */
export async function GET() {
  const data = await getNewsData();
  const report = detectBreakthroughs(data.stories);

  return NextResponse.json({
    ...report,
    alerts: report.alerts.map((a) => ({
      ...a,
      windowStart: a.windowStart.toISOString(),
      windowEnd: a.windowEnd.toISOString(),
      stories: a.stories.map((s) => ({
        id: s.id,
        title: s.title,
        link: s.link,
        sourceId: s.sourceId,
        date: s.date.toISOString(),
        models: s.models,
        topics: s.topics,
      })),
    })),
    demo: data.demo,
  });
}
