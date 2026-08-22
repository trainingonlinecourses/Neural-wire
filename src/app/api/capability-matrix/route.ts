import { NextResponse } from 'next/server';
import { buildCapabilityMatrix, valueRanking } from '@/lib/capability-matrix';

export const runtime = 'nodejs';
export const revalidate = 3600; // cache for 1 hour (static data)

/**
 * GET /api/capability-matrix
 * Returns model capability profiles and comparison data for radar charts.
 */
export async function GET() {
  const matrix = buildCapabilityMatrix();
  const value = valueRanking(matrix.profiles);

  return NextResponse.json({
    profiles: matrix.profiles,
    dimensions: matrix.dimensions,
    valueRanking: value.map((p) => ({ name: p.name, vendor: p.vendor, valueScore: p.valueScore, composite: p.composite })),
    generatedAt: matrix.generatedAt,
  });
}
