/**
 * Radar formatting helpers — pure functions so the card rendering stays
 * testable and no raw fetch errors / API JSON ever reaches the public page.
 */

/** Clamp a value into [min, max] as a 0–100 percentage for gauge markers. */
export function gaugePct(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Short human label for a 0–100 sentiment index. */
export function sentimentLabel(v: number): string {
  if (v < 20) return 'EXTREME FEAR';
  if (v < 40) return 'FEAR';
  if (v < 60) return 'NEUTRAL';
  if (v < 80) return 'GREED';
  return 'EXTREME GREED';
}

/**
 * Gradient gauge (red → amber → green) with a position marker for 0–100
 * signals like fear & greed. Pure CSS; no motion, safe for reduced-motion.
 */
export function gaugeBarHTML(pct: number): string {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    '<div class="rg-gauge" role="img" aria-label="Signal level ' + p + ' out of 100">' +
    '<div class="rg-track">' +
    '<div class="rg-marker" style="left:' + p + '%"></div>' +
    '</div>' +
    '<div class="rg-scale"><span>0</span><span>100</span></div>' +
    '</div>'
  );
}

/**
 * Range bar for absolute measurements (CO₂ ppm etc.): a reference band shows
 * the normal range, the marker shows the current reading.
 */
export function rangeBarHTML(value: number, min: number, max: number, refLow: number, refHigh: number): string {
  const pct = gaugePct(value, min, max);
  const bandLow = gaugePct(refLow, min, max);
  const bandHigh = gaugePct(refHigh, min, max);
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    '<div class="rg-gauge rg-range" role="img" aria-label="Reading ' + value + ' within range ' + min + ' to ' + max + '">' +
    '<div class="rg-track">' +
    '<div class="rg-band" style="left:' + bandLow + '%;width:' + Math.max(0, bandHigh - bandLow) + '%"></div>' +
    '<div class="rg-marker" style="left:' + p + '%"></div>' +
    '</div>' +
    '<div class="rg-scale"><span>' + min + '</span><span>' + max + '</span></div>' +
    '</div>'
  );
}

/**
 * Clean offline note for the public UI. The cause is never surfaced verbatim —
 * no browser error strings, no HTTP codes, no raw JSON. If the endpoint
 * actually needs a user-supplied key we say so, because that is actionable.
 */
export function offlineNoteHTML(needKey: boolean): string {
  if (needKey) {
    return (
      '<div class="radar-note">' +
      '<b>API KEY REQUIRED</b> — this signal needs a WorldMonitor API key. ' +
      'Add yours above and hit <span class="mono">APPLY &amp; RUN</span>, or get one at ' +
      '<a href="https://www.worldmonitor.app" target="_blank" rel="noopener" class="l">worldmonitor.app</a>.' +
      '</div>'
    );
  }
  return (
    '<div class="radar-note">' +
    '<b>SOURCE OFFLINE</b> — the signal could not be reached. It will retry automatically on the next sync.' +
    '</div>'
  );
}

/** Fallback shown when a live response doesn't match a known shape. */
export const SHAPE_FALLBACK_HTML =
  '<div class="radar-note"><b>DATA UNAVAILABLE</b> — the signal responded but in an unexpected format. It will refresh on the next sync.</div>';

/** "Last updated" meta line for a card footer. */
export function updatedMetaHTML(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return 'last updated ' + hh + ':' + mm;
}
