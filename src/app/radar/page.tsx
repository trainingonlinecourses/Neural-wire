import { RadarView } from '@/components/radar-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'World Radar — NEURALWIRE' };

export default function RadarPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🌍 WorldMonitor"
          title="WORLD RADAR"
          desc="Fear & greed, climate, air travel and CO₂ — live signals, re-run every 3 minutes."
          index="08"
        />
      </div>
      <RadarView />
    </section>
  );
}
