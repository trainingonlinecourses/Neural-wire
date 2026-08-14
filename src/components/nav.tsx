'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV = [
  { href: '/', label: '📰 Newsroom' },
  { href: '/brief', label: '⚡ Brief' },
  { href: '/trending', label: '📈 Trending' },
  { href: '/model-watch', label: '🧠 Model Watch' },
  { href: '/leaderboard', label: '🏆 Leaderboard' },
  { href: '/github', label: '🔥 GitHub' },
  { href: '/huggingface', label: '🤗 HF Hub' },
  { href: '/radar', label: '🌍 Radar' },
  { href: '/watchlist', label: '👀 Watchlist' },
  { href: '/saved', label: '💾 Saved' },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={'tab' + (path === n.href ? ' active' : '')}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
