import { describe, expect, it } from 'vitest';
import { parseFeedXML } from './parse';

describe('parseFeedXML', () => {
  it('parses an RSS channel into items with media thumbnail', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Fixture</title>
    <item>
      <title>OpenAI releases GPT-5</title>
      <link>https://example.com/1</link>
      <description>First story</description>
      <pubDate>Tue, 05 Aug 2026 10:00:00 GMT</pubDate>
      <media:content url="https://example.com/img1.png"/>
    </item>
    <item>
      <title>Second story</title>
      <link>https://example.com/2</link>
      <description><![CDATA[<p>With cdata</p>]]></description>
      <pubDate>Wed, 06 Aug 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;
    const items = parseFeedXML(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('OpenAI releases GPT-5');
    expect(items[0].link).toBe('https://example.com/1');
    expect(items[0].pubDate).toBe('Tue, 05 Aug 2026 10:00:00 GMT');
    expect(items[0].thumbnail).toBe('https://example.com/img1.png');
    expect(items[1].thumbnail).toBe('');
  });

  it('parses an Atom feed with alternate links', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Fixture</title>
  <entry>
    <title>DeepMind paper released</title>
    <link rel="alternate" href="https://example.com/atom/1"/>
    <published>2026-08-05T10:00:00Z</published>
    <summary type="html">&lt;p&gt;A summary.&lt;/p&gt;</summary>
  </entry>
</feed>`;
    const items = parseFeedXML(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('DeepMind paper released');
    expect(items[0].link).toBe('https://example.com/atom/1');
    expect(items[0].pubDate).toBe('2026-08-05T10:00:00Z');
    expect(items[0].description).toContain('summary');
  });

  it('returns an empty array for non-feed XML', () => {
    expect(parseFeedXML('<html><body>hi</body></html>')).toEqual([]);
  });
});
