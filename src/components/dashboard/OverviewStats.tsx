'use client';

import type { Strategy } from '@/types/strategy';
import { formatPercentage, formatUsd } from '@/lib/format';

type Props = {
  strategies: Strategy[];
};

export function OverviewStats({ strategies }: Props) {
  const totalTvl = strategies.reduce((acc, strategy) => acc + strategy.tvlUsd, 0);
  const avgDrawdown =
    strategies.reduce((acc, strategy) => acc + Math.abs(strategy.metrics.maxDrawdown), 0) /
    strategies.length;
  const topSharpe = Math.max(...strategies.map((strategy) => strategy.metrics.sharpe));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="TVL supervisado"
        value={formatUsd(totalTvl)}
        helper="Capital delegado en estrategias auditadas"
      />
      <Card
        label="Drawdown promedio"
        value={formatPercentage(-avgDrawdown, 1)}
        helper="Protecciones duras activas en cada vault"
        tone="warning"
      />
      <Card
        label="Sharpe líder"
        value={topSharpe.toFixed(2)}
        helper="Estrategias con alfa sobre BTC + Stacks"
        tone="positive"
      />
      <Card
        label="Traders disponibles"
        value={`${strategies.length}`}
        helper="Desk profesionales con track verificado"
      />
    </div>
  );
}

function Card({
  label,
  value,
  helper,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper: string;
  tone?: 'default' | 'positive' | 'warning';
}) {
  const toneClasses =
    tone === 'positive'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
      : tone === 'warning'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
        : 'border-slate-800/70 bg-slate-900/40 text-slate-100';

  return (
    <div className={`rounded-2xl border ${toneClasses} p-5`}>
      <p className="text-xs uppercase tracking-wide text-slate-300/80">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-300/70">{helper}</p>
    </div>
  );
}
