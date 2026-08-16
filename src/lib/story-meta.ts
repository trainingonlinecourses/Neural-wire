import type { Story } from '@/lib/types';
import { fmtStars } from '@/lib/utils';

/** One benchmark chip: compact label + full title for tooltip. */
export interface BenchmarkChip {
  label: string;
  title: string;
}

/** Card-level story signals derived from data already in the story. */
export interface StoryStats {
  /** e.g. "279" or "1.2k" — null when the story has no points. */
  pointsLabel: string | null;
  /** e.g. "238" or "3.1k" — null when the story has no comments. */
  commentsLabel: string | null;
  /** Benchmark score chips (Arena Elo, SWE-bench, …) the story references. */
  benchmarks: BenchmarkChip[];
  /** True when the story links to a discussion thread (e.g. HN). */
  hasDiscussion: boolean;
  /** Estimated reading time in minutes, from title + description length. */
  readMinutes: number;
}

/** Label for a benchmark score chip, e.g. "ARENA ELO 38" → "ARENA ELO 38". */
export function benchmarkLabel(benchmark: string, score: number, unit: string): string {
  const name = benchmark.trim().toUpperCase();
  const num = fmtStars(score);
  return (name + ' ' + num + (unit ? ' ' + unit : '')).replace(/\s+/g, ' ').trim();
}

const WORDS_PER_MINUTE = 200;

/** Rough reading time: title + description at ~200 wpm, minimum 1 minute. */
export function readMinutes(s: Story): number {
  const text = [s.title, s.description || ''].join(' ');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function storyStats(s: Story): StoryStats {
  return {
    pointsLabel: s.points != null ? fmtStars(s.points) : null,
    commentsLabel: s.comments != null ? fmtStars(s.comments) : null,
    readMinutes: readMinutes(s),
    benchmarks: (s.benchmarks || [])
      .map((b) => ({
        label: benchmarkLabel(b.benchmark, b.score, b.unit),
        title: b.benchmark + ': ' + b.score + (b.unit ? ' ' + b.unit : ''),
      }))
      .slice(0, 3),
    hasDiscussion: Boolean(s.discussion),
  };
}
