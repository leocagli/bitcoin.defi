'use client';

import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

export function Hero() {
  return (
    <section className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-8 lg:p-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-wide text-slate-300">
            Bitcoin L2 · Stacks
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Copy trading con gestión de riesgo
            <span className="block text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text">
              auditada on-chain
            </span>
          </h1>
          <p className="text-lg text-slate-300/80">
            Replica a los traders con mejor histórico, revisa backtests verificables
            y delegá capital en Stacks con guardianes automáticos que protegen tu
            rendimiento frente a drawdowns.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300/80">
            <FeatureBadge text="Backtests con métricas Sharpe/Sortino" />
            <FeatureBadge text="Monitoreo de riesgo en tiempo real" />
            <FeatureBadge text="Integración con Hiro Wallet" />
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-300/80">
            Conectá tu wallet de Stacks para simular órdenes, revisar métricas
            personalizadas y desplegar contratos de copy trading seguro.
          </p>
          <ConnectWalletButton />
        </div>
      </div>
    </section>
  );
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/40 px-3 py-1">
      <span className="size-2 rounded-full bg-sky-400" />
      {text}
    </span>
  );
}
