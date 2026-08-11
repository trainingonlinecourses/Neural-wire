import { WatchlistView } from '@/components/watchlist-view';

export const metadata = { title: 'Watchlist — NEURALWIRE' };

export default function WatchlistPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            👀 ENTITY WATCHLIST <span className="mini">follow companies, models & people — get their wire timeline</span>
          </h2>
        </div>
      </div>
      <WatchlistView />
    </section>
  );
}
