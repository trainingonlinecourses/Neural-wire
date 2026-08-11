import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const DEFAULT_BENCH = 'swe-bench-verified';

/**
 * GET /api/leaderboard?benchmark=arena-elo
 * Latest score per model for the given benchmark, highest first.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const benchmark = url.searchParams.get('benchmark') || DEFAULT_BENCH;

  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ benchmark, rows: [], demo: true });

  const { data: scores } = await supabase
    .from('benchmark_scores')
    .select('model_entity_id, score, unit, reported_at, entities(name)')
    .eq('benchmark_id', benchmark)
    .order('reported_at', { ascending: false })
    .limit(400);

  // Keep the most recent score per model.
  const latest = new Map<string, Record<string, unknown>>();
  for (const s of scores || []) {
    const id = s.model_entity_id as string;
    if (!latest.has(id)) latest.set(id, s);
  }

  const rows = [...latest.values()]
    .map((s) => ({
      model: ((s.entities as Record<string, unknown> | null)?.name as string) || '?',
      score: Number(s.score),
      unit: String(s.unit || '%'),
      reported_at: s.reported_at as string,
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ benchmark, rows });
}
