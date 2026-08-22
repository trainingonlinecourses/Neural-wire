import { BreakthroughView } from '@/components/breakthrough-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Breakthrough Alerts — NEURALWIRE' };

export default function BreakthroughPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🚨 Anomaly detection"
          title="BREAKTHROUGH ALERTS"
          desc="Detects when multiple high-impact stories cluster together — something big happened. Velocity × diversity × engagement."
          index="18"
        />
      </div>
      <BreakthroughView />
    </section>
  );
}
