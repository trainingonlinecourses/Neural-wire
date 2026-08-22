/* One-off: upsert the 12 newest RSS sources into Supabase.
   Reads credentials from .env.local; never prints them. */
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
};
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('missing supabase env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const NEW_SOURCES = [
  { id: 'latent', name: 'Latent Space', short: 'LT', color: '#818cf8', grad: 'linear-gradient(135deg,#23205e,#0f0d2b)', kind: 'rss', url: 'https://www.latent.space/feed' },
  { id: 'mlmastery', name: 'ML Mastery', short: 'MLM', color: '#f97316', grad: 'linear-gradient(135deg,#4a2405,#201002)', kind: 'rss', url: 'https://machinelearningmastery.com/feed/' },
  { id: 'kdnuggets', name: 'KDnuggets', short: 'KDN', color: '#f8e71c', grad: 'linear-gradient(135deg,#4a4306,#211c02)', kind: 'rss', url: 'https://www.kdnuggets.com/feed' },
  { id: 'chiphuyen', name: 'Chip Huyen', short: 'CH', color: '#5eead4', grad: 'linear-gradient(135deg,#12443c,#071c18)', kind: 'rss', url: 'https://huyenchip.com/feed.xml' },
  { id: 'raschka', name: 'Ahead of AI', short: 'AAI', color: '#f472b6', grad: 'linear-gradient(135deg,#43204a,#1d0b21)', kind: 'rss', url: 'https://magazine.sebastianraschka.com/feed' },
  { id: 'sequence', name: 'The Sequence', short: 'SEQ', color: '#4ade80', grad: 'linear-gradient(135deg,#0f3d23,#051a0d)', kind: 'rss', url: 'https://thesequence.substack.com/feed' },
  { id: 'interconnects', name: 'Interconnects', short: 'INT', color: '#a78bfa', grad: 'linear-gradient(135deg,#2e1f5e,#130c28)', kind: 'rss', url: 'https://www.interconnects.ai/feed' },
  { id: 'decoder', name: 'The Decoder', short: 'DEC', color: '#60a5fa', grad: 'linear-gradient(135deg,#122c55,#071229)', kind: 'rss', url: 'https://the-decoder.com/feed/' },
  { id: 'techmeme', name: 'Techmeme', short: 'TM', color: '#e2e8f0', grad: 'linear-gradient(135deg,#2d3442,#12151d)', kind: 'rss', url: 'https://techmeme.com/feed.xml' },
  { id: 'uniteai', name: 'Unite AI', short: 'UAI', color: '#22c55e', grad: 'linear-gradient(135deg,#0e3a1f,#051a0c)', kind: 'rss', url: 'https://www.unite.ai/feed/' },
  { id: 'marktechpost', name: 'MarkTechPost', short: 'MTP', color: '#fb923c', grad: 'linear-gradient(135deg,#452708,#1d0f03)', kind: 'rss', url: 'https://www.marktechpost.com/feed/' },
  { id: 'snorkel', name: 'Snorkel', short: 'SNK', color: '#7dd3fc', grad: 'linear-gradient(135deg,#123d55,#071a26)', kind: 'rss', url: 'https://snorkel.ai/feed/' },
];

(async () => {
  const { data, error } = await supabase
    .from('sources')
    .upsert(NEW_SOURCES, { onConflict: 'id' })
    .select('id');
  if (error) {
    console.error('upsert failed:', error.message);
    process.exit(1);
  }
  console.log('upserted:', data.length, 'sources');
})();
