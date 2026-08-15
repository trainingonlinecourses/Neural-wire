import { NewsExplorer } from '@/components/news-explorer';
import { PageHead } from '@/components/page-head';
import { getNewsData } from '@/lib/data';

export const revalidate = 180;

export default async function Home() {
  const data = await getNewsData();
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📰 Live desk"
          title="LIVE NEWSROOM"
          desc="Curated AI intelligence from 15 sources — refreshed continuously, in place, without reloading."
          index="01"
        />
      </div>
      <NewsExplorer data={data} />
    </section>
  );
}
