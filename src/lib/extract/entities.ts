import type { EntityKind, EntityRef } from '../types';

/**
 * Entity dictionary for the Watchlist feature.
 *
 * Each definition maps a canonical entity name to its kind and the alias
 * strings that should resolve to it (case-insensitive substring match).
 * Entity extraction normalizes "DeepMind" → "Google DeepMind", "xAI" variants,
 * etc. so a user can follow one canonical entity and see every mention.
 */
export interface EntityDef {
  name: string;
  kind: EntityKind;
  aliases: string[];
}

export const ENTITY_DEFS: EntityDef[] = [
  // Companies
  { name: 'OpenAI', kind: 'company', aliases: ['openai'] },
  { name: 'Anthropic', kind: 'company', aliases: ['anthropic'] },
  { name: 'Google DeepMind', kind: 'company', aliases: ['deepmind', 'google deepmind'] },
  { name: 'Google', kind: 'company', aliases: ['google', 'alphabet'] },
  { name: 'Microsoft', kind: 'company', aliases: ['microsoft'] },
  { name: 'NVIDIA', kind: 'company', aliases: ['nvidia'] },
  { name: 'Meta', kind: 'company', aliases: ['meta ai', 'meta'] },
  { name: 'Mistral AI', kind: 'company', aliases: ['mistral'] },
  { name: 'xAI', kind: 'company', aliases: ['xai', 'x ai'] },
  { name: 'DeepSeek', kind: 'company', aliases: ['deepseek'] },
  { name: 'Alibaba', kind: 'company', aliases: ['alibaba', 'qwen team', 'tongyi'] },
  { name: 'Hugging Face', kind: 'company', aliases: ['huggingface', 'hugging face'] },
  { name: 'Amazon', kind: 'company', aliases: ['amazon', 'aws'] },
  { name: 'Apple', kind: 'company', aliases: ['apple'] },
  { name: 'Intel', kind: 'company', aliases: ['intel'] },
  { name: 'AMD', kind: 'company', aliases: ['amd'] },
  { name: 'Tesla', kind: 'company', aliases: ['tesla'] },
  { name: 'Midjourney', kind: 'company', aliases: ['midjourney'] },
  { name: 'Stability AI', kind: 'company', aliases: ['stability ai'] },
  { name: 'Cohere', kind: 'company', aliases: ['cohere'] },
  { name: 'Perplexity', kind: 'company', aliases: ['perplexity'] },
  { name: 'Scale AI', kind: 'company', aliases: ['scale ai'] },
  { name: 'Databricks', kind: 'company', aliases: ['databricks'] },
  { name: 'Replicate', kind: 'company', aliases: ['replicate'] },
  // Models (kind model) — the subset worth following as entities
  { name: 'GPT-5', kind: 'model', aliases: ['gpt-5'] },
  { name: 'GPT-4', kind: 'model', aliases: ['gpt-4', 'gpt-4o'] },
  { name: 'ChatGPT', kind: 'model', aliases: ['chatgpt'] },
  { name: 'Claude', kind: 'model', aliases: ['claude'] },
  { name: 'Gemini', kind: 'model', aliases: ['gemini'] },
  { name: 'Llama', kind: 'model', aliases: ['llama'] },
  { name: 'Grok', kind: 'model', aliases: ['grok'] },
  { name: 'Qwen', kind: 'model', aliases: ['qwen'] },
  { name: 'Sora', kind: 'model', aliases: ['sora'] },
  { name: 'Stable Diffusion', kind: 'model', aliases: ['stable diffusion'] },
  // People
  { name: 'Sam Altman', kind: 'person', aliases: ['sam altman'] },
  { name: 'Demis Hassabis', kind: 'person', aliases: ['demis hassabis'] },
  { name: 'Jensen Huang', kind: 'person', aliases: ['jensen huang'] },
  { name: 'Elon Musk', kind: 'person', aliases: ['elon musk'] },
  { name: 'Dario Amodei', kind: 'person', aliases: ['dario amodei'] },
  { name: 'Mira Murati', kind: 'person', aliases: ['mira murati'] },
  { name: 'Ilya Sutskever', kind: 'person', aliases: ['ilya sutskever'] },
  { name: 'Satya Nadella', kind: 'person', aliases: ['satya nadella'] },
  { name: 'Sundar Pichai', kind: 'person', aliases: ['sundar pichai'] },
  { name: 'Mark Zuckerberg', kind: 'person', aliases: ['mark zuckerberg'] },
];

const compiled: { name: string; kind: EntityKind; re: RegExp }[] = ENTITY_DEFS.map((d) => ({
  name: d.name,
  kind: d.kind,
  // Build one regex per entity: canonical name + aliases, longest alias first.
  re: new RegExp(
    '\\b(' +
      [...d.aliases, d.name]
        .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length)
        .join('|') +
      ')\\b',
    'i'
  ),
}));

/** Extract canonical entity references from text, deduped, in dictionary order. */
export function extractEntities(text: string): EntityRef[] {
  const hits: EntityRef[] = [];
  for (const e of compiled) {
    if (hits.some((h) => h.name === e.name)) continue;
    if (e.re.test(text)) hits.push({ name: e.name, kind: e.kind });
  }
  return hits;
}

/** Does the entity dictionary contain this canonical name? */
export function isKnownEntity(name: string): boolean {
  return ENTITY_DEFS.some((d) => d.name === name);
}

/** Find an entity def by canonical name (for lookups). */
export function entityDef(name: string): EntityDef | undefined {
  return ENTITY_DEFS.find((d) => d.name === name);
}
