import { NextResponse } from 'next/server';
import { getLiveModels, DATA_VERSION, type LiveModel } from '@/lib/live-models';

export const dynamic = 'force-dynamic';

/** In-memory cache so repeated client polls don't hammer upstream APIs. */
let cache: { at: number; version: string; data: LiveModel[] } | null = null;
const TTL_MS = 15 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at > TTL_MS || cache.version !== DATA_VERSION) {
    cache = { at: now, version: DATA_VERSION, data: await getLiveModels() };
  }
  return NextResponse.json({ models: cache.data, fetchedAt: cache.at });
}
