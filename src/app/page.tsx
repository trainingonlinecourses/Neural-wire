import { NewsExplorer } from '@/components/news-explorer';
import { getNewsData } from '@/lib/data';

export const revalidate = 180;

export default async function Home() {
  const data = await getNewsData();
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            📰 LIVE NEWSROOM <span className="mini">curated AI intel, refreshed continuously</span>
          </h2>
        </div>
      </div>
      <NewsExplorer data={data} />
    </section>
  );
}
