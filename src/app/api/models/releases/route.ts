import { NextResponse } from 'next/server';
import { getLiveReleases } from '@/lib/model-releases';
import { DATA_VERSION } from '@/lib/live-models';
import type { ModelRelease } from '@/lib/model-releases';

export const dynamic = 'force-dynamic';

/** In-memory cache so repeated client polls don't hammer upstream APIs. */
let cache: { at: number; version: string; data: ModelRelease[] } | null = null;
const TTL_MS = 15 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at > TTL_MS || cache.version !== DATA_VERSION) {
    cache = { at: now, version: DATA_VERSION, data: await getLiveReleases() };
  }
  return NextResponse.json({ releases: cache.data, fetchedAt: cache.at });
}