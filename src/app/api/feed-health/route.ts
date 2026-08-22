import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { SOURCES } from '@/lib/sources';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Feed Health — GET /api/feed-health
 * Shows the health status of all news sources: story count, freshness,
 * and whether each source is reporting data.
 */
export async function GET() {
  const data = await getNewsData();
  const stories = data.stories;
  const now = Date.now();

  // Count stories per source
  const sourceStats = new Map<string, { count: number; latest: number; oldest: number }>();
  for (const s of stories) {
    const existing = sourceStats.get(s.sourceId);
    const time = s.date.getTime();
    if (existing) {
      existing.count++;
      if (time > existing.latest) existing.latest = time;
      if (time < existing.oldest) existing.oldest = time;
    } else {
      sourceStats.set(s.sourceId, { count: 1, latest: time, oldest: time });
    }
  }

  const sources = SOURCES.map((src) => {
    const stats = sourceStats.get(src.id);
    const storyCount = stats?.count ?? 0;
    const latestStory = stats?.latest ?? 0;
    const ageMs = latestStory ? now - latestStory : Infinity;
    const ageHours = ageMs / (1000 * 60 * 60);

    // Health score: 0-100 based on story count and freshness
    let health = 0;
    if (storyCount > 0) {
      health += Math.min(50, storyCount * 5); // up to 50 pts for volume
      if (ageHours < 6) health += 30;
      else if (ageHours < 24) health += 20;
      else if (ageHours < 72) health += 10;
      else if (ageHours < 168) health += 5;
    }

    return {
      id: src.id,
      name: src.name,
      short: src.short,
      color: src.color,
      kind: src.kind,
      storyCount,
      latestStory: latestStory || null,
      ageHours: ageHours === Infinity ? null : Math.round(ageHours * 10) / 10,
      health,
      status: storyCount > 0 ? (ageHours < 24 ? 'active' : ageHours < 168 ? 'stale' : 'dormant') : 'offline',
    };
  });

  const active = sources.filter((s) => s.status === 'active').length;
  const stale = sources.filter((s) => s.status === 'stale').length;
  const dormant = sources.filter((s) => s.status === 'dormant').length;
  const offline = sources.filter((s) => s.status === 'offline').length;
  const avgHealth = Math.round(sources.reduce((a, s) => a + s.health, 0) / sources.length);

  return NextResponse.json({
    sources: sources.sort((a, b) => b.storyCount - a.storyCount),
    summary: {
      total: sources.length,
      active,
      stale,
      dormant,
      offline,
      avgHealth,
      totalStories: stories.length,
    },
    generatedAt: now,
    demo: data.demo,
  });
}
