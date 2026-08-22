import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { srcById } from '@/lib/sources';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * GET /api/feed — RSS 2.0 feed of the latest stories.
 * Allows users to subscribe to the NEURALWIRE wire in any RSS reader.
 */
export async function GET() {
  const data = await getNewsData();
  const stories = data.stories.slice(0, 50);

  const items = stories
    .map((s) => {
      const src = srcById[s.sourceId];
      const pubDate = s.date.toUTCString();
      return `    <item>
      <title><![CDATA[${escapeXml(s.title)}]]></title>
      <link>${escapeXml(s.link)}</link>
      <guid isPermaLink="false">${escapeXml(s.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${escapeXml(s.description)}]]></description>
      <category>${escapeXml(s.sourceId)}</category>
      ${s.models.map((m) => `<category>model:${escapeXml(m)}</category>`).join('\n      ')}
      ${s.topics.map((t) => `<category>topic:${escapeXml(t)}</category>`).join('\n      ')}
      <source url="${escapeXml(s.link)}">${escapeXml(src?.name || s.sourceId)}</source>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>NEURALWIRE — Real-Time AI Intelligence Desk</title>
    <link>https://neural-wire-nine.vercel.app</link>
    <description>Live AI newsroom with ${data.stories.length} stories from ${data.sources.length} curated sources — news, models, benchmarks and pulse signals.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://neural-wire-nine.vercel.app/api/feed" rel="self" type="application/rss+xml"/>
    <generator>NEURALWIRE v2.0</generator>
    <ttl>5</ttl>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
