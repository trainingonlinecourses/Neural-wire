import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';
import { entityDef } from '@/lib/extract/entities';
import { getMoversRows, matchMovers, type MoversMatch } from '@/lib/trending';

export const runtime = 'nodejs';

interface FollowedEntity {
  name: string;
  kind: string;
}

/**
 * GET /api/watchlist/movers — the current user's followed entities, each with
 * its current 24h movers status: which rows of the shared /trending ranking
 * (GitHub repos, HF models, radar) match the entity, in ranking order with
 * real rank positions. Reads the same module-cached ranking as /brief Movers.
 */
export async function GET() {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ movers: [], demo: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: follows } = await supabase
    .from('watchlist')
    .select('entities(name, kind)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = await getMoversRows('24h');

  const seen = new Set<string>();
  const movers: { entity: FollowedEntity; matches: MoversMatch[] }[] = [];
  for (const f of follows || []) {
    const e = (f as unknown as { entities: FollowedEntity | null }).entities;
    if (!e || seen.has(e.name)) continue;
    seen.add(e.name);
    const def = entityDef(e.name);
    movers.push({
      entity: e,
      matches: matchMovers({ name: e.name, aliases: def?.aliases }, rows),
    });
  }
  return NextResponse.json({ movers });
}
