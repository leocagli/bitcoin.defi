'use client';

import type { RiskGuard, Strategy } from '@/types/strategy';

type Props = {
  strategy: Strategy;
};

export function RiskControls({ strategy }: Props) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Guardianes de riesgo activos
          </h3>
          <p className="mt-1 text-sm text-slate-300/80">
            Automatizaciones que protegen capital y replican el estilo del trader.
          </p>
        </div>
        <div className="rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-wide text-slate-300">
          {strategy.riskGuards.length} reglas supervisadas
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {strategy.riskGuards.map((guard) => (
          <RiskCard key={guard.id} guard={guard} />
        ))}
      </div>
    </div>
  );
}

function RiskCard({ guard }: { guard: RiskGuard }) {
  const isAlert = guard.status === 'alerta';

  return (
    <div
      className={`flex h-full flex-col gap-3 rounded-2xl border p-4 transition ${
        isAlert
          ? 'border-amber-400/70 bg-amber-500/5'
          : 'border-slate-800/70 bg-slate-900/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-white">{guard.label}</h4>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isAlert
              ? 'bg-amber-400/20 text-amber-200'
              : 'bg-emerald-400/10 text-emerald-200'
          }`}
        >
          {isAlert ? 'Alerta' : 'Activo'}
        </span>
      </div>
      <p className="text-sm text-slate-300/80">{guard.description}</p>
      <div className="mt-auto grid grid-cols-2 gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-xs uppercase tracking-wide text-slate-400">
        <div className="space-y-1">
          <p>Tolerancia</p>
          <p className="text-base font-semibold text-amber-200">{guard.threshold}</p>
        </div>
        <div className="space-y-1">
          <p>Actual</p>
          <p
            className={`text-base font-semibold ${
              isAlert ? 'text-amber-200' : 'text-sky-200'
            }`}
          >
            {guard.current}
          </p>
        </div>
      </div>
    </div>
  );
}
