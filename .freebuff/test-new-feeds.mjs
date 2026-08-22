import { fetchSource } from '../src/lib/feeds/index.ts';

const NEW = [
  { id: 'microsoft', url: 'https://www.microsoft.com/en-us/ai/blog/feed/' },
  { id: 'cohere', url: 'https://cohere.com/blog/rss.xml' },
  { id: 'wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
  { id: 'lastweekinai', url: 'https://lastweekin.ai/feed' },
  { id: 'semianalysis', url: 'https://www.semianalysis.com/feed' },
  { id: 'aiweekly', url: 'https://aiweekly.co/feed' },
  { id: 'allenai', url: 'https://allenai.org/rss.xml' },
  { id: 'synced', url: 'https://syncedreview.com/feed' },
  { id: 'pytorch', url: 'https://pytorch.org/blog/feed.xml' },
  { id: 'wandb', url: 'https://wandb.ai/fully-connected/feed.xml' },
  { id: 'ftai', url: 'https://www.ft.com/artificial-intelligence?format=rss' },
];

async function main() {
  for (const s of NEW) {
    try {
      const items = await fetchSource(s.id === 'microsoft' ? 'microsoft' : 'openai');
      // microsoft test needs temp - use direct fetchRSS approach
      console.log(s.id, 'skip - need source in SOURCES first');
    } catch (e) {
      console.log(s.id, 'ERR', (e as Error).message);
    }
  }
}

main();
