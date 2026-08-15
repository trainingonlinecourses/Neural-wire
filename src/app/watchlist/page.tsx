import { WatchlistView } from '@/components/watchlist-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Watchlist — NEURALWIRE' };

export default function WatchlistPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="👀 Follow entities"
          title="ENTITY WATCHLIST"
          desc="Follow companies, models and people — get their wire timeline and 24h movers status."
          index="09"
        />
      </div>
      <WatchlistView />
    </section>
  );
}
