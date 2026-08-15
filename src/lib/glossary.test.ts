import { describe, expect, it } from 'vitest';
import { GLOSSARY, GLOSSARY_CATEGORIES } from './glossary';

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
});
