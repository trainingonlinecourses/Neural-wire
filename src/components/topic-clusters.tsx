'use client';

/**
 * Topic Clusters — groups stories by their dominant topic, showing
 * visual clusters with counts and the most important story in each.
 * Gives a bird's-eye view of what's happening across AI right now.
 */

import { useMemo, useState } from 'react';
import type { Story } from '@/lib/types';
import { ago } from '@/lib/utils';

interface TopicGroup {
  name: string;
  stories: Story[];
  models: string[];
  color: string;
}

const TOPIC_COLORS: Record<string, string> = {
  'llm': '#4f7cff',
  'agent': '#22d3ee',
  'safety': '#ff5470',
  'open-source': '#2dd4a7',
  'regulation': '#fbbf24',
  'robotics': '#f472b6',
  'vision': '#a78bfa',
  'funding': '#f97316',
  'research': '#60a5fa',
  'hardware': '#94a3b8',
  'startup': '#fbbf24',
  'product': '#22d3ee',
  'benchmark': '#ffd21e',
  'multimodal': '#c084fc',
  'reasoning': '#34d399',
  'code': '#4f7cff',
  'data': '#6ee7b7',
  'infrastructure': '#818cf8',
  'default': '#6b7280',
};

function getTopicColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TOPIC_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return TOPIC_COLORS.default;
}

function extractTopics(stories: Story[]): TopicGroup[] {
  const topicMap = new Map<string, Story[]>();
  const topicModels = new Map<string, Set<string>>();

  for (const s of stories) {
    const topics = s.topics?.length ? s.topics : ['uncategorized'];
    for (const t of topics) {
      const key = t.toLowerCase();
      if (!topicMap.has(key)) {
        topicMap.set(key, []);
        topicModels.set(key, new Set());
      }
      topicMap.get(key)!.push(s);
      if (s.models) {
        for (const m of s.models) topicModels.get(key)!.add(m);
      }
    }
  }

  const groups: TopicGroup[] = [];
  for (const [name, storyList] of topicMap) {
    if (storyList.length < 2) continue; // skip topics with only 1 story
    storyList.sort((a, b) => b.date.getTime() - a.date.getTime());
    groups.push({
      name,
      stories: storyList,
      models: [...(topicModels.get(name) ?? [])].slice(0, 5),
      color: getTopicColor(name),
    });
  }

  groups.sort((a, b) => b.stories.length - a.stories.length);
  return groups;
}

export function TopicClusters({ stories }: { stories: Story[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const clusters = useMemo(() => extractTopics(stories), [stories]);
  const displayed = showAll ? clusters : clusters.slice(0, 8);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalInClusters = clusters.reduce((a, c) => a + c.stories.length, 0);

  return (
    <div className="topic-clusters">
      <div className="topic-clusters-header">
        <span className="heatmap-title">🏷 Topic Clusters — {clusters.length} groups · {totalInClusters} stories</span>
      </div>
      <div className="topic-clusters-grid">
        {displayed.map((c) => {
          const isOpen = expanded.has(c.name);
          const top = c.stories[0];
          return (
            <div
              className="topic-cluster-card"
              key={c.name}
              onClick={() => toggle(c.name)}
              style={{ borderColor: c.color + '44' }}
            >
              <div className="tc-head">
                <span className="tc-badge" style={{ background: c.color + '22', color: c.color, borderColor: c.color + '55' }}>
                  {c.stories.length}
                </span>
                <span className="tc-name">{c.name}</span>
                {c.models.length > 0 && (
                  <span className="tc-models">
                    {c.models.slice(0, 3).map((m) => (
                      <span className="tc-model-pill" key={m}>{m}</span>
                    ))}
                  </span>
                )}
              </div>
              {top && (
                <div className="tc-top">
                  <a href={top.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    {top.title}
                  </a>
                  <span className="dim">{ago(top.date)}</span>
                </div>
              )}
              {isOpen && (
                <div className="tc-expanded">
                  {c.stories.slice(1, 6).map((s) => (
                    <div className="tc-story" key={s.id}>
                      <a href={s.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        {s.title}
                      </a>
                      <span className="dim">{ago(s.date)}</span>
                    </div>
                  ))}
                  {c.stories.length > 6 && (
                    <span className="dim tc-more">+{c.stories.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {clusters.length > 8 && !showAll && (
        <button className="btn topic-show-more" onClick={() => setShowAll(true)}>
          SHOW ALL {clusters.length} CLUSTERS
        </button>
      )}
    </div>
  );
}
