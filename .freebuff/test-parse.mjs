import { parseFeedXML } from '../src/lib/feeds/parse.ts';

const URLS = [
  'https://feed.infoq.com/ai-ml-data-eng',
  'https://txt.cohere.com/rss/',
  'https://www.nature.com/natmachintell.rss',
  'https://feeds.bloomberg.com/technology/news.rss',
  'https://blog.research.google/feed/',
  'https://openai.com/blog/rss.xml',
  'https://www.anthropic.com/index.xml',
];

async function main() {
  for (const url of URLS) {
    const r = await fetch(url, { redirect: 'follow' });
    const x = await r.text();
    const items = parseFeedXML(x);
    console.log(items.length, r.status, url);
  }
}

main();
