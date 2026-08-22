import { NewsExplorer } from '@/components/news-explorer';
import { Hero } from '@/components/hero';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { TopicClusters } from '@/components/topic-clusters';
import { getNewsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getNewsData();
  const heatmapStories = data.stories.slice(0, 500);
  return (
    <section className="page">
      <Hero
        stories={data.stories.length}
        sources={data.sources.length}
        models={data.stories.filter((s) => s.isModel).length}
      />
      <div className="wrap">
        <TopicClusters stories={heatmapStories} />
      </div>
      <div className="wrap">
        <ActivityHeatmap stories={heatmapStories} />
      </div>
      <NewsExplorer data={data} />
    </section>
  );
}
