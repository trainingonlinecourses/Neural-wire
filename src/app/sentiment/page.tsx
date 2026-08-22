import { SentimentView } from '@/components/sentiment-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Sentiment Momentum — NEURALWIRE' };

export default function SentimentPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📈 Narrative momentum"
          title="SENTIMENT MOMENTUM"
          desc="Which AI topics are exploding, surging, or cooling? Momentum captures direction, not just volume."
          index="15"
        />
      </div>
      <SentimentView />
    </section>
  );
}
