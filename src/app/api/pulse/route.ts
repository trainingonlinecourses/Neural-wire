import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { computePulseSignals } from '@/lib/pulse';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * AI Pulse — GET /api/pulse
 * The desk's live signal panel, computed from the current feed (Postgres or
 * live demo feeds). No third-party keys; the news data layer owns freshness.
 */
export async function GET() {
  const data = await getNewsData();
  const signals = computePulseSignals(data.stories);
  return NextResponse.json({
    signals,
    storyCount: data.stories.length,
    demo: data.demo,
    fetchedAt: data.fetchedAt,
  });
}
