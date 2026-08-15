import { describe, expect, it } from 'vitest';
import { GLOSSARY, GLOSSARY_CATEGORIES, glossaryById } from './glossary';

describe('glossary data', () => {
  it('has unique ids and non-empty terms across every category', () => {
    const ids = GLOSSARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of GLOSSARY) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.short.length).toBeGreaterThan(0);
    }
  });

  it('covers every category with at least a few entries', () => {
    const cats = GLOSSARY_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id);
    for (const c of cats) {
      expect(GLOSSARY.filter((e) => e.category === c).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('points every see-link at a real-looking route', () => {
    for (const e of GLOSSARY) {
      for (const s of e.see || []) {
        expect(s.href.startsWith('/'), `${e.id} → ${s.href}`).toBe(true);
        expect(s.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every entry’s category in the known set', () => {
    const valid = new Set(GLOSSARY_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id));
    for (const e of GLOSSARY) expect(valid.has(e.category), `${e.id}`).toBe(true);
  });

  it('resolves every inline-tooltip term the rows depend on', () => {
    // These ids are wired into TrendRow tooltips — the glossary must keep them.
    const required = ['heat', 'global-percentile', 'star-delta', 'trending-score'];
    for (const id of required) {
      const e = glossaryById(id);
      expect(e, `missing glossary entry '${id}'`).toBeDefined();
      expect(e!.short.length).toBeGreaterThan(0);
    }
    // Every glossary id resolves (no orphans in the map).
    for (const e of GLOSSARY) expect(glossaryById(e.id)?.id).toBe(e.id);
  });
});
