import Link from 'next/link';
import {
  fetchGhTrending,
  fetchHfTrending,
  fetchRadarSignals,
  liveSignalCands,
  rankAll,
  type Cand,
  type TrendingKind,
  type TrendingRow,
} from '@/lib/trending';
import { TrendRow } from './trend-row';

const TTL = 3 * 60 * 1000;
let cache: { rows: TrendingRow[]; at: number } | null = null;

/**
 * 'Movers' — the same ranking as /trending, computed for the last 24h and
 * rendered server-side on the /brief digest. Module-level cache so repeated
 * brief renders stay fast; radar status rows (key required / unreachable)
 * are dropped to keep the digest clean.
 */
export async function Movers() {
  if (!cache || Date.now() - cache.at > TTL) {
    const [ghRes, hfRes, radarRes] = await Promise.allSettled([
      fetchGhTrending('24h'),
      fetchHfTrending('24h'),
      fetchRadarSignals(''),
    ]);
    const groups: { kind: TrendingKind; items: Cand[] }[] = [];
    if (ghRes.status === 'fulfilled') groups.push({ kind: 'gh', items: ghRes.value });
    if (hfRes.status === 'fulfilled') groups.push({ kind: 'hf', items: hfRes.value });
    if (radarRes.status === 'fulfilled') groups.push({ kind: 'radar', items: liveSignalCands(radarRes.value) });
    cache = { rows: rankAll(groups), at: Date.now() };
  }

  const rows = cache.rows.slice(0, 10);
  return (
    <div className="wrap">
      <div className="section-note">
        Movers — GitHub · Hugging Face · radar, last 24h
        <Link href="/trending">FULL RANKING ↗</Link>
      </div>
      <div className="trend">
        {rows.map((r, i) => (
          <TrendRow key={r.kind + ':' + r.id} row={r} rank={i + 1} />
        ))}
        {rows.length === 0 && (
          <p className="empty">
            <b>Movers are unavailable right now</b>
            <br />
            The live sources may be rate-limited — check the full /trending page.
          </p>
        )}
      </div>
    </div>
  );
}
