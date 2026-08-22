import { CapabilityMatrixView } from '@/components/capability-matrix-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Capability Matrix — NEURALWIRE' };

export default function CapabilityMatrixPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📊 Radar comparison"
          title="CAPABILITY MATRIX"
          desc="Compare AI models across 8 dimensions: reasoning, coding, creative, vision, instruction, multilingual, speed, and math."
          index="16"
        />
      </div>
      <CapabilityMatrixView />
    </section>
  );
}
