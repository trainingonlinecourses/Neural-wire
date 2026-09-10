import { NextResponse } from 'next/server';
import {
  getLiveReleases,
  groupReleasesByDate,
  type ModelRelease,
  type ReleaseDateSection,
} from '@/lib/model-releases';
import { DATA_VERSION } from '@/lib/live-models';

export const dynamic = 'force-dynamic';

/** In-memory cache so repeated client polls don't hammer upstream APIs. */
interface Cache {
  at: number;
  version: string;
  data: ModelRelease[];
  sections: ReleaseDateSection[];
}
let cache: Cache | null = null;
const TTL_MS = 15 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at > TTL_MS || cache.version !== DATA_VERSION) {
    const data = await getLiveReleases();
    cache = { at: now, version: DATA_VERSION, data, sections: groupReleasesByDate(data) };
  }
  return NextResponse.json({
    releases: cache.data,
    sections: cache.sections,
    windowDays: 30,
    fetchedAt: cache.at,
  });
}