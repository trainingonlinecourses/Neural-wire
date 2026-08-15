import { GlossaryView } from '@/components/glossary-view';
import { PageHead } from '@/components/page-head';
import { GLOSSARY } from '@/lib/glossary';

export const metadata = { title: 'Glossary — NEURALWIRE' };

export default function GlossaryPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="📖 Desk vocabulary"
          title="GLOSSARY"
          desc={`Every term on the desk, defined — ${GLOSSARY.length} entries, so the wire speaks one language.`}
          index="11"
        />
      </div>
      <GlossaryView />
    </section>
  );
}
