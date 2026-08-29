import { InsightsView } from '@/components/insights-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'AI Insights — NEURALWIRE' };

export default function InsightsPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🧠 AI Insights"
          title="INSIGHTS"
          desc="Curated daily digest — trending topics, key takeaways, and top stories classified across 16 AI domains."
          index="22"
        />
      </div>
      <InsightsView />
    </section>
  );
}
