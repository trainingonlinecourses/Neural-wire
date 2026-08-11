'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';
import { ENTITY_DEFS, isKnownEntity } from '@/lib/extract/entities';

interface WatchItem {
  entity: { name: string; kind: string } | null;
  stories: Array<{ id: string; title: string; link: string; published_at: string; source_id: string }>;
}

export function WatchlistView() {
  const [follows, setFollows] = useState<WatchItem[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/watchlist');
      const j = await r.json();
      if (j.demo) setDemo(true);
      if (j.follows) setFollows(j.follows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function follow(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (!name.trim()) return;
    if (!isKnownEntity(name.trim())) {
      setErr(`"${name.trim()}" isn't in the tracked entity dictionary. Try e.g. Anthropic, OpenAI, Nvidia.`);
      return;
    }
    const r = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_name: name.trim() }),
    });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || 'request failed');
    setMsg(`Following ${j.entity_name}`);
    setName('');
    load();
  }

  async function unfollow(entityName: string) {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_name: entityName }),
    });
    load();
  }

  if (loading) return <div className="wrap"><p className="empty">Loading watchlist…</p></div>;

  return (
    <>
      <div className="wrap">
        <form className="searchbar" onSubmit={follow}>
          <input
            className="field"
            placeholder="Follow an entity — e.g. Anthropic, OpenAI, Nvidia, Mistral"
            list="entity-suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <datalist id="entity-suggestions">
            {ENTITY_DEFS.map((x) => (
              <option key={x.name} value={x.name} />
            ))}
          </datalist>
          <button className="btn primary" type="submit">
            + FOLLOW
          </button>
        </form>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>
            {follows.length} followed {demo ? '· DEMO (no DB — sign in with Supabase configured to persist)' : '· persisted per account'}
          </span>
        </div>
      </div>
      <div className="wrap grid">
        {follows.map((f) => (
          <div key={f.entity?.name} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '.95rem', color: 'var(--gold)' }}>
                  {f.entity?.kind === 'company' ? '🏢' : f.entity?.kind === 'model' ? '🧠' : '👤'} {f.entity?.name}
                </h3>
                <button className="btn danger" style={{ marginLeft: 'auto' }} onClick={() => unfollow(f.entity?.name || '')}>
                  UNFOLLOW
                </button>
              </div>
              <div className="timeline">
                {f.stories.length === 0 && <p className="dim">No recent stories mention this entity yet.</p>}
                {f.stories.slice(0, 8).map((s) => (
                  <div key={s.id} className="tl-row">
                    <a href={s.link} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span className="l">{ago(new Date(s.published_at))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {follows.length === 0 && !demo && (
          <p className="empty">
            <b>Nothing followed yet.</b> Follow companies, models and people to build your own intelligence
            timeline.
          </p>
        )}
      </div>
      {msg && <div className="wrap"><div className="banner show"><span>{msg}</span></div></div>}
      {err && <div className="wrap"><div className="banner show"><span>{err}</span></div></div>}
    </>
  );
}
