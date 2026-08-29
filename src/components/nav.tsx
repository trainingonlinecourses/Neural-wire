'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Two-row navigation. Row 1 = core pages (always visible).
 * Row 2 = data & analysis pages (also visible via flex-wrap).
 * Account items (Watchlist, Saved) are in the header bar.
 */

interface NavItem {
  href: string;
  label: string;
  external?: boolean;
  group: 'core' | 'data';
}

export const NAV: NavItem[] = [
  // ── Row 1: Core ────────────────────────────────────────────────
  { href: '/', label: '📰 Newsroom', group: 'core' },
  { href: '/brief', label: '⚡ Brief', group: 'core' },
  { href: '/trending', label: '📈 Trending', group: 'core' },
  { href: '/model-watch', label: '🧠 Model Watch', group: 'core' },
  { href: '/leaderboard', label: '🏆 Leaderboard', group: 'core' },
  { href: '/compare', label: '🔀 Compare', group: 'core' },
  { href: '/github', label: '🔥 GitHub', group: 'core' },
  { href: '/huggingface', label: '🤗 HF Hub', group: 'core' },
  { href: '/pulse', label: '⚡ Pulse', group: 'core' },
  { href: '/insights', label: '🧠 Insights', group: 'core' },
  { href: '/providers', label: '🏢 Providers', group: 'core' },
  // ── Row 2: Personal + Data & Analysis ─────────────────────────
  { href: '/watchlist', label: '👀 Watchlist', group: 'data' },
  { href: '/saved', label: '💾 Saved', group: 'data' },
  { href: '/papers', label: '📄 Papers', group: 'data' },
  { href: '/graph', label: '🕸 Graph', group: 'data' },
  { href: '/sentiment', label: '📈 Momentum', group: 'data' },
  { href: '/capability-matrix', label: '📊 Matrix', group: 'data' },
  { href: '/timeline', label: '📅 Timeline', group: 'data' },
  { href: '/breakthrough', label: '🚨 Alerts', group: 'data' },
  { href: '/alerts', label: '🔔 Custom Alerts', group: 'data' },
  { href: '/feed-health', label: '📡 Health', group: 'data' },
  { href: '/events', label: '📅 Events', group: 'data' },
  { href: '/glossary', label: '📖 Glossary', group: 'data' },
  { href: '/api/feed', label: '📡 RSS', external: true, group: 'data' },
];

export function Nav() {
  const path = usePathname();

  const renderTab = (n: NavItem) => {
    const active = path === n.href;
    if ('external' in n && n.external) {
      return (
        <a
          key={n.href}
          href={n.href}
          className="tab"
          target="_blank"
          rel="noopener noreferrer"
        >
          {n.label}
        </a>
      );
    }
    return (
      <Link
        key={n.href}
        href={n.href}
        className={'tab' + (active ? ' active' : '')}
      >
        {n.label}
      </Link>
    );
  };

  const coreItems = NAV.filter((n) => n.group === 'core');
  const dataItems = NAV.filter((n) => n.group === 'data');

  return (
    <nav className="nav nav-2row">
      <div className="nav-row nav-row-primary">
        {coreItems.map(renderTab)}
      </div>
      <div className="nav-row nav-row-data">
        {dataItems.map(renderTab)}
      </div>
    </nav>
  );
}

/**
 * All NAV items flattened for use by GlobalSearch and other consumers.
 */
export const NAV_FLAT = NAV.map(({ group: _, ...rest }) => rest);
