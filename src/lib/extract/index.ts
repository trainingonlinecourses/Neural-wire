import { detectModels } from './models';
import { detectTopics } from './topics';
import { extractEntities } from './entities';
import { extractBenchmarks } from './benchmarks';
import type { BenchRef, EntityRef } from '../types';

export interface StoryMeta {
  models: string[];
  topics: string[];
  entities: EntityRef[];
  benchmarks: BenchRef[];
  isModel: boolean;
}

const MODEL_RELEASE_RE =
  /\b(releases?|launch\w*|unveil\w*|announc\w*|introduc\w*|debut\w*)\b/i;
const MODEL_SUBJECT_RE = /\b(model|LLM|agent|chatbot|video gen)\b/i;

/**
 * Run all detectors over a title+description blob.
 * `isModel` matches the original index.html heuristic: an explicit model name,
 * or a release/launch headline about a model/LLM/agent.
 */
export function extractStoryMeta(title: string, desc: string): StoryMeta {
  const blob = title + ' ' + desc;
  const models = detectModels(blob);
  const topics = detectTopics(blob);
  const entities = extractEntities(blob);
  const benchmarks = extractBenchmarks(blob);
  const isModel =
    models.length > 0 ||
    (MODEL_RELEASE_RE.test(title) && MODEL_SUBJECT_RE.test(title));
  return { models, topics, entities, benchmarks, isModel };
}
