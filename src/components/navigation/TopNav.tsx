'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'OpenBB Dash' },
  { href: '/ai', label: 'AI Risk Strategy' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 shadow-lg shadow-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-sm font-medium lg:px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="rounded-md bg-gradient-to-r from-sky-500 to-cyan-400 px-2 py-1 text-xs uppercase tracking-[0.3em] text-slate-950">
            bitcoin.defi
          </span>
          <span className="hidden text-slate-300/80 sm:inline">Dashboards</span>
        </Link>
        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center rounded-full px-4 py-2 transition ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                    : 'border border-white/5 text-slate-300 hover:border-sky-400/40 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
