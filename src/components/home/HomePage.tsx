import Link from 'next/link';

import { Hero } from '@/components/dashboard/Hero';
import { OverviewStats } from '@/components/dashboard/OverviewStats';
import { StrategyList } from '@/components/dashboard/StrategyList';
import { strategies } from '@/data/strategies';
import { coverageProtocols, optimizationInsights } from '@/data/risk-insights';

const cardClass = 'rounded-3xl border border-white/5 bg-slate-900/60 px-6 py-5 shadow-lg shadow-slate-950/40 flex flex-col gap-3';

export function HomePage() {
  const topStrategies = strategies.slice(0, 3);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-12 text-slate-100 lg:px-6 lg:py-16">
      <Hero />

      <OverviewStats strategies={strategies} />

      <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 lg:p-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Optimization</p>
            <h2 className="text-2xl font-semibold text-white">Risk controls and sizing guidance</h2>
            <p className="max-w-2xl text-sm text-slate-300/80">
              Our research combines volatility, on-chain flow and derivatives data to keep copy trading exposure efficient on Bitcoin L2.
            </p>
          </div>
          <Link
            href="/ai"
            className="inline-flex items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20"
          >
            Explore AI risk engine
          </Link>
        </header>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {optimizationInsights.map((insight) => (
            <article key={insight.id} className={cardClass}>
              <div>
                <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
                <p className="text-sm text-slate-300/80">{insight.description}</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300/90">
                {insight.recommendations.map((rec) => (
                  <li key={rec} className="flex gap-2">
                    <span className="mt-[6px] size-1.5 rounded-full bg-sky-400" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-xs text-cyan-200">
                Impact: {insight.impact}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 lg:p-8">
          <h2 className="text-2xl font-semibold text-white">Highlighted strategies</h2>
          <p className="mt-2 text-sm text-slate-300/80">
            We track traders with audited history and active risk guardrails. Keep a diversified mix between delta neutral carry, optionality and defensive positioning.
          </p>
          <div className="mt-6">
            <StrategyList strategies={topStrategies} activeId={topStrategies[0]?.id ?? ''} />
          </div>
        </div>
        <aside className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-semibold text-white">Motor AI Risk Strategy</h3>
            <p className="text-sm text-slate-300/80">
              Every hour we score the next bar with a TCN model, adjust for realized volatility and on-chain flow to deliver exposure recommendations by profile.
            </p>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-400">
              Profiles (Conservador/Balanceado/Agresivo) - Deadband 0.2 - Target vol 12%-28% - On-chain brake beta configurable.
            </div>
            <Link
              href="/ai"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
            >
              Go to AI Risk Strategy
            </Link>
          </div>
          <div className={cardClass}>
            <h3 className="text-lg font-semibold text-white">OpenBB Macro & flows</h3>
            <p className="text-sm text-slate-300/80">
              Access aggregated pricing, flow and macro narratives for BTC, ETH and L2 ecosystems. Perfect to align tactical allocation decisions.
            </p>
            <Link
              href="/openbb"
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400/40 hover:text-white"
            >
              Open OpenBB Dash
            </Link>
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 lg:p-8">
        <header className="mb-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Coverage stack</p>
          <h2 className="text-2xl font-semibold text-white">Web3 insurance and hedging protocols</h2>
          <p className="max-w-2xl text-sm text-slate-300/80">
            Combine on-chain insurance, derivative vaults and monitoring tools to protect capital allocated to copy trading strategies.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coverageProtocols.map((protocol) => (
            <article key={protocol.name} className={cardClass}>
              <div>
                <h3 className="text-lg font-semibold text-white">{protocol.name}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{protocol.category}</p>
              </div>
              <p className="text-sm text-slate-300/80">{protocol.coverage}</p>
              <p className="text-xs text-slate-400">Suggested rating: {protocol.rating}</p>
              <p className="text-xs text-slate-400/80">{protocol.notes}</p>
              <Link
                href={protocol.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                Visit site →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}



