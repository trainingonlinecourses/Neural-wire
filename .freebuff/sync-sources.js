/* One-off: upsert the newly added RSS sources into Supabase.
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
  { id: 'gradient', name: 'The Gradient', short: 'GRD', color: '#6ee7b7', grad: 'linear-gradient(135deg,#0d3a2c,#051a12)', kind: 'rss', url: 'https://thegradient.pub/rss/' },
  { id: 'simonw', name: 'Simon Willison', short: 'SW', color: '#fbbf24', grad: 'linear-gradient(135deg,#45330a,#1e1503)', kind: 'rss', url: 'https://simonwillison.net/atom/everything/' },
  { id: 'oneusefulthing', name: 'One Useful Thing', short: 'OUT', color: '#fb7185', grad: 'linear-gradient(135deg,#43222a,#1d0c10)', kind: 'rss', url: 'https://www.oneusefulthing.org/feed' },
  { id: 'importai', name: 'Import AI', short: 'IAI', color: '#a78bfa', grad: 'linear-gradient(135deg,#2e2154,#130c26)', kind: 'rss', url: 'https://importai.substack.com/feed' },
  { id: 'lillog', name: "Lil'Log", short: 'LL', color: '#f472b6', grad: 'linear-gradient(135deg,#431f34,#1d0b16)', kind: 'rss', url: 'https://lilianweng.github.io/index.xml' },
  { id: 'arxiv', name: 'arXiv cs.AI', short: 'AXV', color: '#b91c1c', grad: 'linear-gradient(135deg,#3f0d0d,#1a0404)', kind: 'rss', url: 'https://export.arxiv.org/rss/cs.AI' },
  { id: 'kaggle', name: 'Kaggle Blog', short: 'KGL', color: '#20beff', grad: 'linear-gradient(135deg,#0c3a52,#051a25)', kind: 'rss', url: 'https://medium.com/feed/kaggle-blog' },
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
