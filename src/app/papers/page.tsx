import { PapersView } from '@/components/papers-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Daily Papers — NEURALWIRE' };

export default function PapersPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📄 ML research"
          title="DAILY PAPERS"
          desc="Trending ML/AI papers from HuggingFace — upvoted by the community, ranked by relevance."
          index="12"
        />
      </div>
      <PapersView />
    </section>
  );
}
