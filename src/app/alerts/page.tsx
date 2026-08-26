import { AlertsView } from '@/components/alerts-view';
import { PageHead } from '@/components/page-head';

export const metadata = {
  title: 'Custom Alerts — NEURALWIRE',
  robots: { index: false, follow: false },
};

export default function AlertsPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🔔 Stay informed"
          title="CUSTOM ALERTS"
          desc="Create keyword, model, or topic alerts. Get notified when matching stories appear across the wires."
          index="19"
        />
      </div>
      <AlertsView />
    </section>
  );
}
