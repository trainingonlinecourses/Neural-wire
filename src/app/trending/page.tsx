import { TrendingView } from '@/components/trending-view';

export const metadata = { title: 'Trending Today — NEURALWIRE' };

export default function TrendingPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            📈 TRENDING TODAY <span className="mini">GitHub · Hugging Face · radar — one unified ranking</span>
          </h2>
        </div>
      </div>
      <TrendingView />
    </section>
  );
}
