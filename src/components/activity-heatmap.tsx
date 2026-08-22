'use client';

/**
 * Activity Heatmap — visualizes hourly news activity over the past 7 days.
 * Shows which hours have the most AI news activity, revealing patterns
 * like "AI news peaks at 9am PT" or "weekends are quiet".
 *
 * Rendered as a grid: 7 rows (days) × 24 columns (hours).
 * Color intensity = number of stories published that hour.
 */

import { useState, useMemo } from 'react';
import type { Story } from '@/lib/types';

interface HourBucket {
  day: string;
  hour: number;
  count: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function bucketize(stories: Story[]): Map<string, number> {
  const buckets = new Map<string, number>();
  for (const s of stories) {
    const d = s.date;
    const key = `${d.getUTCDay()}:${d.getUTCHours()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return buckets;
}

function getColor(count: number, max: number): string {
  if (count === 0) return 'rgba(148, 163, 255, 0.04)';
  const ratio = count / max;
  if (ratio < 0.15) return 'rgba(79, 124, 255, 0.15)';
  if (ratio < 0.3) return 'rgba(79, 124, 255, 0.3)';
  if (ratio < 0.5) return 'rgba(79, 124, 255, 0.5)';
  if (ratio < 0.7) return 'rgba(34, 211, 238, 0.6)';
  return 'rgba(34, 211, 238, 0.85)';
}

export function ActivityHeatmap({ stories }: { stories: Story[] }) {
  const [hovered, setHovered] = useState<HourBucket | null>(null);

  const { buckets, max, busiest } = useMemo(() => {
    const b = bucketize(stories);
    let m = 0;
    let busiestHour = '';
    let busiestCount = 0;
    for (const [key, count] of b) {
      if (count > m) m = count;
      if (count > busiestCount) {
        busiestCount = count;
        busiestHour = key;
      }
    }
    const [dayIdx, hour] = busiestHour.split(':').map(Number);
    return {
      buckets: b,
      max: m || 1,
      busiest: `${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00 — ${busiestCount} stories`,
    };
  }, [stories]);

  const peakHours = useMemo(() => {
    const hourTotals = new Array(24).fill(0);
    for (const [key, count] of buckets) {
      const [, h] = key.split(':').map(Number);
      hourTotals[h] += count;
    }
    const maxH = Math.max(...hourTotals);
    const peak = hourTotals.indexOf(maxH);
    return `${String(peak).padStart(2, '0')}:00 UTC`;
  }, [buckets]);

  return (
    <div className="heatmap">
      <div className="heatmap-header">
        <span className="heatmap-title">📰 Activity Heatmap — last 7 days</span>
        <span className="heatmap-stat">
          Peak hour: <b>{peakHours}</b>
        </span>
        <span className="heatmap-stat">
          Busiest: <b>{busiest}</b>
        </span>
      </div>
      <div className="heatmap-grid">
        <div className="heatmap-hours">
          {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
            <span key={h} className="heatmap-hour-label">
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>
        {DAYS.map((day, dayIdx) => (
          <div className="heatmap-row" key={day}>
            <span className="heatmap-day">{day}</span>
            {HOURS.map((hour) => {
              const key = `${dayIdx}:${hour}`;
              const count = buckets.get(key) ?? 0;
              return (
                <div
                  key={hour}
                  className="heatmap-cell"
                  style={{ background: getColor(count, max) }}
                  onMouseEnter={() => setHovered({ day, hour, count })}
                  onMouseLeave={() => setHovered(null)}
                  title={`${day} ${String(hour).padStart(2, '0')}:00 — ${count} stories`}
                />
              );
            })}
          </div>
        ))}
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          {[0.04, 0.15, 0.3, 0.5, 0.7, 0.85].map((opacity) => (
            <div
              key={opacity}
              className="heatmap-cell"
              style={{ background: `rgba(79, 124, 255, ${opacity})` }}
            />
          ))}
          <span className="heatmap-legend-label">More</span>
        </div>
      </div>
      {hovered && (
        <div className="heatmap-tooltip">
          {hovered.day} {String(hovered.hour).padStart(2, '0')}:00 — {hovered.count} {hovered.count === 1 ? 'story' : 'stories'}
        </div>
      )}
    </div>
  );
}
