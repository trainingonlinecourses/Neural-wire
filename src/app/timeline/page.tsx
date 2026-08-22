import { TimelineView } from '@/components/timeline-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'AI Timeline — NEURALWIRE' };

export default function TimelinePage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📅 Event chronology"
          title="AI TIMELINE"
          desc="Interactive chronology of AI milestones. See how models, regulation, funding, and breakthroughs weave through time."
          index="17"
        />
      </div>
      <TimelineView />
    </section>
  );
}
