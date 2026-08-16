'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCountdown } from '@/lib/refresh';
import { useAutoSync } from '@/lib/use-auto-sync';
import {
  gaugeBarHTML,
  PULSE_OFFLINE_HTML,
  pulseLabel,
  updatedMetaHTML,
  type PulseSignal,
} from '@/lib/pulse';

interface PulsePayload {
  signals: PulseSignal[];
  storyCount: number;
  demo: boolean;
  fetchedAt: number;
}

const PULSE_REFRESH_SECONDS = 180;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function pulseCardHTML(sig: PulseSignal, status: 'wait' | 'live' | 'off', updated: number | null): string {
  const chip =
    status === 'wait'
      ? '<span class="rst wait">◌ FETCHING</span>'
      : status === 'live'
        ? '<span class="rst live">● LIVE</span>'
        : '<span class="rst off">● OFFLINE</span>';

  let body: string;
  if (status !== 'live' || sig.value == null) {
    body = '<div class="radar-note">' + esc(sig.detail) + '</div>';
  } else {
    const col = sig.value < 25 ? 'var(--hot-ink)' : sig.value < 50 ? 'var(--warn-ink)' : 'var(--ok-ink)';
    body =
      '<div class="radar-big">' +
      '<div class="num" style="color:' + col + '">' + sig.value + '</div>' +
      '<div class="lab" style="color:' + col + '">' + pulseLabel(sig.value) + '</div>' +
      gaugeBarHTML(sig.value) +
      '</div>';
  }

  const detail =
    '<div class="radar-row" style="border:0;padding-top:6px"><span>' + esc(sig.detail) +
    (sig.meta ? '<br><span class="l">' + esc(sig.meta) + '</span>' : '') +
    '</span>' +
    (sig.href ? '<a class="open" href="' + esc(sig.href) + '" target="_blank" rel="noopener noreferrer">OPEN ↗</a>' : '') +
    '</div>';

  return (
    '<div class="card" style="cursor:default">' +
    '<div class="card-body">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<h3 style="font-size:.92rem">' + sig.icon + ' ' + esc(sig.name) + '</h3>' +
    '<span style="margin-left:auto">' + chip + '</span>' +
    '</div>' +
    '<div>' + body + '</div>' +
    detail +
    (updated ? '<div class="card-meta"><span class="mono">' + updatedMetaHTML(updated) + '</span></div>' : '') +
    '</div>' +
    '</div>'
  );
}

export function PulseView() {
  const [signals, setSignals] = useState<PulseSignal[] | null>(null);
  const [status, setStatus] = useState<'wait' | 'live' | 'off'>('wait');
  const [updated, setUpdated] = useState<number | null>(null);
  const [storyCount, setStoryCount] = useState(0);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setStatus('wait');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20_000);
      const r = await fetch('/api/pulse', { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('pulse ' + r.status);
      const j = (await r.json()) as PulsePayload;
      setSignals(j.signals);
      setStoryCount(j.storyCount);
      setStatus('live');
      setUpdated(Date.now());
      setFailed(false);
    } catch {
      setStatus('off');
      setFailed(true);
    }
  }, []);

  const { remaining, syncing, sync } = useAutoSync(PULSE_REFRESH_SECONDS, load);

  useEffect(() => {
    sync();
  }, [sync]);

  const liveCount = signals?.length ?? 0;

  return (
    <>
      <div className="wrap">
        <div className="meta-row">
          <span>
            AI Pulse — signals derived from the current wire ({storyCount || '—'} stories) · no external keys
          </span>
          <span className="meta-right">
            <span className="sync">
              {syncing ? '⟳ syncing…' : status === 'off' ? '⚠ pulse offline' : `✓ ${liveCount}/6 signals live`}
            </span>
            <span
              className={'sync-count' + (remaining <= 10 && !syncing ? ' urgent' : '')}
              title="Signals recompute automatically every 3 minutes"
            >
              ⟳ {syncing ? '…' : formatCountdown(remaining)}
            </span>
            <button className="btn sync-btn" onClick={sync} disabled={syncing}>
              SYNC NOW
            </button>
          </span>
        </div>
      </div>
      <div className="wrap grid">
        {status === 'wait' && !signals && (
          <div className="card">
            <div className="card-body">
              <div className="sh" style={{ height: 64 }} />
            </div>
          </div>
        )}
        {status === 'off' && failed && (
          <div className="card">
            <div className="card-body" dangerouslySetInnerHTML={{ __html: PULSE_OFFLINE_HTML }} />
          </div>
        )}
        {(signals ?? []).map((sig) => (
          <div
            key={sig.id}
            dangerouslySetInnerHTML={{ __html: pulseCardHTML(sig, status, status === 'live' ? updated : null) }}
          />
        ))}
      </div>
    </>
  );
}
