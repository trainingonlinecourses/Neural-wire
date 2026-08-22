import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { computeSentimentMomentum, hotTopics, topicsByKind } from '@/lib/sentiment';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * GET /api/sentiment
 * Returns narrative momentum scores for AI topics — showing which topics
 * are exploding, surging, or cooling based on story velocity and diversity.
 */
export async function GET() {
  const data = await getNewsData();
  const snapshot = computeSentimentMomentum(data.stories);

  return NextResponse.json({
    ...snapshot,
    hotTopics: hotTopics(snapshot),
    modelMomentum: topicsByKind(snapshot, 'model'),
    topicMomentum: topicsByKind(snapshot, 'topic'),
    demo: data.demo,
  });
}
