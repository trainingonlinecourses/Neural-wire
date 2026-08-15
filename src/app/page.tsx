import { NewsExplorer } from '@/components/news-explorer';
import { Hero } from '@/components/hero';
import { getNewsData } from '@/lib/data';

export const revalidate = 180;

export default async function Home() {
  const data = await getNewsData();
  return (
    <section className="page">
      <Hero stories={data.stories.length} sources={data.sources.length} />
      <NewsExplorer data={data} />
    </section>
  );
}
