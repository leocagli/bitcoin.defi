'use client';

import type { Strategy } from '@/types/strategy';
import {
  formatPercentage,
  formatRiskLevel,
  formatUsd,
} from '@/lib/format';
import { motion } from 'framer-motion';
import Image from 'next/image';

type Props = {
  strategy: Strategy;
  isActive: boolean;
  onSelect: (strategy: Strategy) => void;
  index: number;
};

export function StrategyCard({ strategy, isActive, onSelect, index }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(strategy)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 ${
        isActive
          ? 'border-cyan-400/80 bg-slate-900/70'
          : 'border-slate-800/60 bg-slate-900/30 hover:border-slate-600/70'
      }`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-slate-800/40" />
      <div className="relative flex flex-1 flex-col gap-5 p-5 text-left">
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                strategy.riskLevel === 'baja'
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : strategy.riskLevel === 'media'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-rose-500/10 text-rose-300'
              }`}
            >
              {formatRiskLevel(strategy.riskLevel)} riesgo
            </span>
            <h3 className="mt-3 text-lg font-semibold text-white">
              {strategy.name}
            </h3>
            <p className="mt-1 text-sm text-slate-300/80">
              {strategy.description}
            </p>
          </div>
          <Image
            src={strategy.leadTrader.avatarUrl}
            alt={strategy.leadTrader.name}
            width={48}
            height={48}
            className="size-12 rounded-full border border-slate-700/60 object-cover"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Metric
            label="CAGR"
            value={formatPercentage(strategy.metrics.cagr)}
          />
          <Metric
            label="Drawdown max"
            value={formatPercentage(strategy.metrics.maxDrawdown, 1)}
            negative
          />
          <Metric
            label="Sharpe"
            value={strategy.metrics.sharpe.toFixed(2)}
          />
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>TVL</span>
            <span>Seguidores</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-base font-medium text-slate-100">
            <span>{formatUsd(strategy.tvlUsd)}</span>
            <span>{strategy.followers.toLocaleString('es-AR')}</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Trader: <span className="text-slate-200">{strategy.leadTrader.name}</span> |{' '}
            {strategy.leadTrader.experience}
          </p>
        </div>
      </div>
      {isActive && (
        <motion.div
          layoutId="active-shadow"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-cyan-400/60"
        />
      )}
    </motion.button>
  );
}

type MetricProps = {
  label: string;
  value: string;
  negative?: boolean;
};

function Metric({ label, value, negative = false }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-2 text-lg font-semibold ${
          negative ? 'text-rose-300' : 'text-sky-200'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
