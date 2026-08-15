import { HFView } from '@/components/hf-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'HF Hub — NEURALWIRE' };

export default function HfPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🤗 Hugging Face"
          title="HF HUB"
          desc="Trending models and spaces, live from huggingface.co."
          index="07"
        />
      </div>
      <HFView />
    </section>
  );
}
