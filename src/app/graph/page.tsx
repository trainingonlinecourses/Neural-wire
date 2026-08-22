import { StoryGraphView } from '@/components/story-graph-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Story Graph — NEURALWIRE' };

export default function GraphPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🕸 Knowledge graph"
          title="STORY GRAPH"
          desc="Visualize how AI stories connect through shared models, topics, and entities. Discover hidden relationships in the AI landscape."
          index="14"
        />
      </div>
      <StoryGraphView />
    </section>
  );
}
