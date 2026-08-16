'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from '@/lib/glossary';

const CAT_LABEL: Record<GlossaryCategory, string> = {
  ranking: 'RANKING & SIGNALS',
  desk: 'THE DESK',
  data: 'SOURCES & ENTITIES',
  account: 'ACCOUNT & TOOLS',
};

export function GlossaryView() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GlossaryCategory | 'all'>('all');

  const entries = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (!needle) return true;
      return (
        e.term.toLowerCase().includes(needle) ||
        e.short.toLowerCase().includes(needle) ||
        (e.long || '').toLowerCase().includes(needle)
      );
    });
  }, [q, cat]);

  return (
    <div className="wrap">
      <div className="gloss-toolbar">
        <input
          className="field"
          placeholder="Search terms — movers, heat, pulse, entity…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search glossary"
        />
        <span className="gloss-count">
          {entries.length}/{GLOSSARY.length} TERMS
        </span>
      </div>
      <div className="chips">
        {GLOSSARY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={'chip' + (cat === c.id ? ' active' : '')}
            onClick={() => setCat(c.id)}
          >
            {c.label} · {c.id === 'all' ? GLOSSARY.length : GLOSSARY.filter((e) => e.category === c.id).length}
          </button>
        ))}
      </div>
      {entries.length > 0 ? (
        <div className="gloss-grid">
          {entries.map((e) => (
            <div key={e.id} className="gloss-card">
              <div className="gloss-term">
                <h3>{e.term}</h3>
                <span className={'gloss-tag ' + e.category}>{CAT_LABEL[e.category]}</span>
              </div>
              <p className="gloss-short">{e.short}</p>
              {e.long && <p className="gloss-long">{e.long}</p>}
              {e.see && e.see.length > 0 && (
                <div className="gloss-see">
                  {e.see.map((s) => (
                    <Link key={s.href} href={s.href}>
                      {s.label} ↗
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">
          <b>No terms match “{q}”.</b>
          Try another search or clear the filters.
        </p>
      )}
    </div>
  );
}
