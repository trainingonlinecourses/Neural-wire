import { ModelWatch } from '@/components/model-watch';
import { getNewsData } from '@/lib/data';

export const revalidate = 180;

export default async function ModelWatchPage() {
  const data = await getNewsData();
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            🧠 MODEL WATCH <span className="mini">new releases + model mentions across the wire</span>
          </h2>
        </div>
      </div>
      <ModelWatch data={data} />
    </section>
  );
}
