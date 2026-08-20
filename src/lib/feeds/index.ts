import { srcById, SOURCES } from '../sources';
import type { RawFeedItem, Source } from '../types';
import { timeoutSig } from '../utils';
import { parseFeedXML } from './parse';

/**
 * Server-side feed fetchers. Because these run in Node (not the browser), the
 * old CORS proxy chain is gone — direct HTTP fetch works everywhere.
 */

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function fetchText(url: string, ms = 12000): Promise<string> {
  const res = await fetch(url, { signal: timeoutSig(ms) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

async function fetchJSON(url: string, ms = 12000): Promise<unknown> {
  const text = await fetchText(url, ms);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('bad JSON');
  }
}

/** RSS via rss2json, falling back to direct XML parse on failure. */
async function fetchRSS(src: Source): Promise<RawFeedItem[]> {
  try {
    const j = (await fetchJSON(RSS2JSON + encodeURIComponent(src.url!), 12000)) as {
      status?: string;
      items?: Array<Record<string, unknown>>;
      message?: string;
    };
    if (j && j.status === 'ok' && Array.isArray(j.items) && j.items.length) {
      return j.items.slice(0, 18).map((it) => {
        let th = (it.thumbnail as string) || '';
        const enc = it.enclosure as { link?: string; type?: string } | undefined;
        if (!th && enc && enc.link && /image/.test(enc.type || '')) th = enc.link;
        return {
          title: (it.title as string) || '',
          link: (it.link as string) || '',
          pubDate: (it.pubDate as string) || '',
          description: (it.description as string) || '',
          thumbnail: th,
        };
      });
    }
    throw new Error((j && j.message) || 'rss2json error');
  } catch {
    const xml = await fetchText(src.url!, 10000);
    const items = parseFeedXML(xml);
    if (!items.length) throw new Error('empty feed');
    return items;
  }
}

async function fetchHN(): Promise<RawFeedItem[]> {
  const j = (await fetchJSON(
    'https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=18&numericFilters=points%3E30',
    11000
  )) as { hits?: Array<Record<string, unknown>> };
  return (j.hits || []).map((h) => {
    const objectID = h.objectID as string;
    const hnLink = 'https://news.ycombinator.com/item?id=' + objectID;
    const url = (h.url as string) || hnLink;
    return {
      title: (h.title as string) || '',
      link: url,
      pubDate: (h.created_at as string) || '',
      description: (h.points as number) + ' points · ' + (h.num_comments as number) + ' comments on Hacker News',
      points: h.points as number,
      comments: h.num_comments as number,
      discuss: url === hnLink ? null : hnLink,
    };
  });
}

async function fetchDevTo(): Promise<RawFeedItem[]> {
  const arr = (await fetchJSON(
    'https://dev.to/api/articles?tag=ai&top=3&per_page=18',
    11000
  )) as Array<Record<string, unknown>>;
  if (!Array.isArray(arr)) throw new Error('bad response');
  return arr.map((a) => ({
    title: (a.title as string) || '',
    link: (a.url as string) || (a.canonical_url as string) || '',
    pubDate: (a.published_at as string) || '',
    description: (a.description as string) || '',
    thumbnail:
      (a.cover_image as string) && (a.cover_image as string).indexOf('http') === 0
        ? (a.cover_image as string)
        : '',
    points: a.positive_reactions_count as number,
    comments: a.comments_count as number,
  }));
}

async function fetchLobsters(): Promise<RawFeedItem[]> {
  const arr = (await fetchJSON('https://lobste.rs/t/ai.json', 11000)) as Array<Record<string, unknown>>;
  if (!Array.isArray(arr)) throw new Error('bad response');
  return arr.map((s) => ({
    title: (s.title as string) || '',
    link: (s.url as string) || (s.comments_url as string) || '',
    pubDate: (s.created_at as string) || '',
    description: (s.description_plain as string) || '',
    points: s.score as number,
    comments: s.comment_count as number,
    discuss: s.comments_url as string,
  }));
}

/** Fetch one source by id. Throws on total failure. */
export async function fetchSource(srcId: string): Promise<RawFeedItem[]> {
  const src = srcById[srcId];
  if (!src) throw new Error('unknown source: ' + srcId);
  switch (src.kind) {
    case 'rss':
      return fetchRSS(src);
    case 'hn':
      return fetchHN();
    case 'devto':
      return fetchDevTo();
    case 'lobsters':
      return fetchLobsters();
    default:
      throw new Error('unknown kind');
  }
}

/** Fetch all enabled built-in sources in parallel. Per-feed failures are swallowed. */
export async function fetchAllSources(enabled: string[]): Promise<Map<string, RawFeedItem[]>> {
  const ids = enabled.length ? enabled : SOURCES.map((s) => s.id);
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const items = await fetchSource(id);
        return { id, items };
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return { id, items: [] as RawFeedItem[] };
      }
    })
  );
  const map = new Map(results.map((r) => [r.id, r.items]));
  return map;
}
