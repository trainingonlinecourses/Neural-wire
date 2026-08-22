import { FeedHealthView } from '@/components/feed-health-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Feed Health — NEURALWIRE' };

export default function FeedHealthPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📡 Source monitoring"
          title="FEED HEALTH"
          desc="Real-time health of all news sources. See which feeds are active, stale, or offline."
          index="19"
        />
      </div>
      <FeedHealthView />
    </section>
  );
}
