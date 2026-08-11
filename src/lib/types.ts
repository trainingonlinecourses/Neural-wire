export type SourceKind = 'rss' | 'hn' | 'devto' | 'lobsters';

export interface Source {
  id: string;
  name: string;
  short: string;
  color: string;
  grad: string;
  kind: SourceKind;
  url: string | null;
}

export type EntityKind = 'company' | 'model' | 'person' | 'topic';

export interface EntityRef {
  /** canonical entity name */
  name: string;
  kind: EntityKind;
}

export interface BenchRef {
  /** canonical benchmark name, e.g. "SWE-bench" */
  benchmark: string;
  /** numeric score as reported */
  score: number;
  /** unit as reported: '%' | 'points' | 'elo' | '' */
  unit: string;
}

export interface RawFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  thumbnail?: string;
  points?: number;
  comments?: number;
  discuss?: string | null;
}

export interface Story {
  id: string; // sourceId + '::' + link
  sourceId: string;
  title: string;
  link: string;
  description: string;
  date: Date;
  img: string;
  points: number | null;
  comments: number | null;
  discussion: string | null;
  models: string[];
  topics: string[];
  benchmarks: BenchRef[];
  isModel: boolean;
}

export type SourceStatus = 'wait' | 'on' | 'cache' | 'off';
