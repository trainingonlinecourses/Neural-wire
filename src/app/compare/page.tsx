import { CompareView } from '@/components/compare-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Model Compare — NEURALWIRE' };

export default function ComparePage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🔀 Side-by-side"
          title="MODEL COMPARE"
          desc="Pick any two models and see a detailed benchmark-by-benchmark comparison with visual bars and radar charts."
          index="20"
        />
      </div>
      <CompareView />
    </section>
  );
}
