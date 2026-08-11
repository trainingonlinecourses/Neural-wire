import { RadarView } from '@/components/radar-view';

export const metadata = { title: 'World Radar — NEURALWIRE' };

export default function RadarPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            🌍 WORLD RADAR <span className="mini">fear & greed, climate, air travel, CO₂ — live</span>
          </h2>
        </div>
      </div>
      <RadarView />
    </section>
  );
}
