import { ReleasesView } from '@/components/releases-view';
import { PageHead } from '@/components/page-head';
import { getNewsData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Model Releases — NEURALWIRE' };

export default async function ReleasesPage() {
  const data = await getNewsData();
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🚀 New launches"
          title="MODEL RELEASES"
          desc="Fresh model launches from the last 30 days, grouped by date — LAST 24 HOURS / THIS WEEK / THIS MONTH. Real data live from OpenRouter, Hugging Face, Together and Groq, with wire news covering each launch."
          index="17"
        />
      </div>
      <ReleasesView data={data} />
    </section>
  );
}