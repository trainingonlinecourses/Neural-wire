import { XMLParser } from 'fast-xml-parser';
import type { RawFeedItem } from '../types';

/**
 * Server-side RSS/Atom → RawFeedItem parser.
 * Replaces the browser's DOMParser (unavailable in Node). Uses fast-xml-parser.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => name === 'item' || name === 'entry',
});

type Node = Record<string, unknown> | string | null | undefined;

function asArray(v: unknown): Node[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v as Node[];
  return [v as Node];
}

/** Coerce an XML node's text value to a trimmed string. */
function textOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o['#text'] === 'string') return o['#text'].trim();
    // numeric-looking content
    if (typeof o[''] === 'string' || typeof o[''] === 'number') return String(o['']).trim();
  }
  if (typeof v === 'number') return String(v);
  return '';
}

function attrOf(v: unknown, attr: string): string {
  if (v == null || typeof v !== 'object') return '';
  const o = v as Record<string, unknown>;
  const val = o[attr];
  return typeof val === 'string' ? val.trim() : '';
}

/** Locate the first media thumbnail / content image URL on an RSS node. */
function mediaUrl(n: Record<string, unknown>): string {
  const keys = ['media:content', 'media:thumbnail', 'media:group'];
  for (const k of keys) {
    const v = n[k];
    if (v == null) continue;
    const candidates = asArray(v);
    for (const c of candidates) {
      if (c && typeof c === 'object') {
        const u = attrOf(c, '@_url');
        if (u) return u;
        const nested = (c as Record<string, unknown>)['media:content'] ?? (c as Record<string, unknown>)['media:thumbnail'];
        const nestedUrl = attrOf(nested, '@_url');
        if (nestedUrl) return nestedUrl;
      }
    }
  }
  const enc = asArray(n['enclosure'])[0];
  if (enc && typeof enc === 'object' && /image/.test(attrOf(enc, '@_type'))) {
    return attrOf(enc, '@_url');
  }
  return '';
}

/** Parse an RSS/Atom XML string into raw feed items. */
export function parseFeedXML(xml: string): RawFeedItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  if (!doc) return [];

  const feed = doc.feed as Record<string, unknown> | undefined;
  const channel = (doc.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;

  const isAtom = !!feed;
  const nodes = isAtom ? asArray(feed?.entry) : asArray(channel?.item);

  return nodes.map((n) => {
    if (!n || typeof n !== 'object') return {};
    const rec = n as Record<string, unknown>;

    let link = textOf(rec['link']);
    if (isAtom) {
      const links = asArray(rec['link']);
      for (const l of links) {
        if (!l || typeof l !== 'object') continue;
        const href = attrOf(l, '@_href') || textOf(l);
        const rel = attrOf(l, '@_rel');
        if (!rel || rel === 'alternate') {
          link = href;
          if (!rel) break;
        }
      }
    }

    const desc =
      textOf(rec['description']) || textOf(rec['summary']) || textOf(rec['content']);

    return {
      title: textOf(rec['title']),
      link,
      pubDate: textOf(rec['pubDate']) || textOf(rec['published']) || textOf(rec['updated']),
      description: desc,
      thumbnail: mediaUrl(rec),
    };
  });
}
