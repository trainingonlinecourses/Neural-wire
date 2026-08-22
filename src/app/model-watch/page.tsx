import { ModelWatch } from '@/components/model-watch';
import { PageHead } from '@/components/page-head';
import { getNewsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ModelWatchPage() {
  const data = await getNewsData();
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🧠 Model releases"
          title="MODEL WATCH"
          desc="New releases and model mentions across the wire, tracked as first-class entities."
          index="04"
        />
      </div>
      <ModelWatch data={data} />
    </section>
  );
}
