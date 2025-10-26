'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/components/providers/LanguageProvider';

const linkDefinitions = [
  { href: '/', key: 'home' },
  { href: '/ai', key: 'ai' },
  { href: '/openbb', key: 'openbb' },
] as const;

const NAV_COPY = {
  es: {
    brandSuffix: 'Dashboards',
    home: 'Inicio',
    ai: 'Estrategia IA',
    openbb: 'Macro OpenBB',
    toggleLabel: 'EN',
  },
  en: {
    brandSuffix: 'Dashboards',
    home: 'Home',
    ai: 'AI Strategy',
    openbb: 'OpenBB Macro',
    toggleLabel: 'ES',
  },
} as const;

export function TopNav() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const copy = NAV_COPY[language];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 shadow-lg shadow-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-sm font-medium lg:px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="rounded-md bg-gradient-to-r from-sky-500 to-cyan-400 px-2 py-1 text-xs uppercase tracking-[0.3em] text-slate-950">
            bitcoin.defi
          </span>
          <span className="hidden text-slate-300/80 sm:inline">{copy.brandSuffix}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {linkDefinitions.map((link) => {
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
                {copy[link.key]}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-sky-400/40 hover:text-white"
          >
            {copy.toggleLabel}
          </button>
        </nav>
      </div>
    </header>
  );
}
