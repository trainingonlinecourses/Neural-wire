import { HFView } from '@/components/hf-view';

export const metadata = { title: 'HF Hub — NEURALWIRE' };

export default function HfPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            🤗 HF HUB <span className="mini">trending models & spaces, live from huggingface.co</span>
          </h2>
        </div>
      </div>
      <HFView />
    </section>
  );
}
