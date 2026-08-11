/** HTML-escape a string for safe interpolation into markup. */
export function esc(s: string | null | undefined): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string;
  });
}

/** Escape regex special chars in a literal string. */
export function escRe(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Human "3m ago" / "2d ago" style relative time. */
export function ago(t: Date | number | string): string {
  const d = new Date(t);
  const s = (Date.now() - d.getTime()) / 1000;
  if (isNaN(s) || s < 0) return 'just now';
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return Math.floor(m) + 'm ago';
  const h = m / 60;
  if (h < 24) return Math.floor(h) + 'h ago';
  const dy = h / 24;
  if (dy < 7) return Math.floor(dy) + 'd ago';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** 1.2M / 3.4k star formatting. */
export function fmtStars(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/** ISO date N days ago (for GitHub search `created:>=` filters). */
export function isoDaysAgo(days: number): string {
  const t = new Date();
  t.setDate(t.getDate() - days);
  return t.toISOString().slice(0, 10);
}

/** Whole days since an ISO date. */
export function daysOld(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function fmtDate(d: Date | string | number): string {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Strip HTML tags/entities to plain text, collapse whitespace. */
export function stripHtml(h: string): string {
  const d = documentSafeDiv(h);
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function documentSafeDiv(h: string): { textContent: string } {
  if (typeof document !== 'undefined') {
    const d = document.createElement('div');
    d.innerHTML = h;
    return d;
  }
  // Server-side fallback: crude but sufficient for headline/description text.
  return { textContent: String(h).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") };
}

/** De-dupe stories by normalized link + title prefix. */
export function dedupe<T extends { link: string; title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const k =
      (it.link || it.title).replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase() +
      '|' +
      it.title.toLowerCase().slice(0, 60);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** AbortController-backed timeout signal for server-side fetch. */
export function timeoutSig(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}
