import { NewsExplorer } from '@/components/news-explorer';
import { Hero } from '@/components/hero';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { TopicClusters } from '@/components/topic-clusters';
import { getNewsData } from '@/lib/data';

export const revalidate = 180;

export default async function Home() {
  const data = await getNewsData();
  return (
    <section className="page">
      <Hero
        stories={data.stories.length}
        sources={data.sources.length}
        models={data.stories.filter((s) => s.isModel).length}
      />
      <div className="wrap">
        <TopicClusters stories={data.stories} />
      </div>
      <div className="wrap">
        <ActivityHeatmap stories={data.stories} />
      </div>
      <NewsExplorer data={data} />
    </section>
  );
}
