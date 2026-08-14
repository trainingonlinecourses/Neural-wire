'use client';

import { useState } from 'react';

/** Copies a story URL to the clipboard with a transient ✓ confirmation. */
export function CopyLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className={'act' + (copied ? ' done' : '')}
      title={copied ? 'Copied!' : 'Copy link'}
      aria-label={copied ? 'Copied link' : 'Copy link'}
      onClick={copy}
    >
      {copied ? '✓' : '🔗'}
    </button>
  );
}
