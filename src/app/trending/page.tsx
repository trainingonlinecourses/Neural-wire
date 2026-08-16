import { TrendingView } from '@/components/trending-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Trending Today — NEURALWIRE' };

export default function TrendingPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📈 Unified ranking"
          title="TRENDING TODAY"
          desc="GitHub repos, Hugging Face models and AI pulse signals — merged into one ranking on one scale."
          index="03"
        />
      </div>
      <TrendingView />
    </section>
  );
}
