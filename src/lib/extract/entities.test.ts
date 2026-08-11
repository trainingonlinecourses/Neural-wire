import { describe, expect, it } from 'vitest';
import { ENTITY_DEFS, entityDef, extractEntities, isKnownEntity } from './entities';

describe('extractEntities', () => {
  it('resolves aliases to canonical names', () => {
    const hits = extractEntities('OpenAI and DeepMind partner on chips');
    const names = hits.map((h) => h.name);
    expect(names).toContain('OpenAI');
    expect(names).toContain('Google DeepMind');
  });

  it('returns refs in dictionary order, deduped', () => {
    const hits = extractEntities('OpenAI OpenAI OpenAI');
    expect(hits).toEqual([{ name: 'OpenAI', kind: 'company' }]);
  });

  it('returns nothing for unknown text', () => {
    expect(extractEntities('the quick brown fox')).toEqual([]);
  });
});

describe('isKnownEntity', () => {
  it('accepts dictionary names and rejects others', () => {
    expect(isKnownEntity('OpenAI')).toBe(true);
    expect(isKnownEntity('Totally Not Real Corp')).toBe(false);
  });
});

describe('entityDef', () => {
  it('returns the definition with kind', () => {
    const def = entityDef('Anthropic');
    expect(def?.kind).toBe('company');
    expect(def?.aliases).toContain('anthropic');
  });

  it('every def has a name and kind', () => {
    for (const d of ENTITY_DEFS) {
      expect(d.name.length).toBeGreaterThan(0);
      expect(['company', 'model', 'person', 'topic']).toContain(d.kind);
    }
  });
});
