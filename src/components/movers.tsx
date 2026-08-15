import Link from 'next/link';
import { getMoversRows } from '@/lib/trending';
import { TrendRow } from './trend-row';

/**
 * 'Movers' — the same ranking as /trending, computed for the last 24h and
 * rendered server-side on the /brief digest. Shares the module-level ranking
 * cache with the watchlist movers status via getMoversRows, so repeated
 * renders stay fast and both pages agree on one ranking.
 */
export async function Movers() {
  const rows = (await getMoversRows('24h')).slice(0, 10);
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
