'use client';

import type { Strategy } from '@/types/strategy';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPercentage } from '@/lib/format';
import { useMemo } from 'react';

type Props = {
  strategy: Strategy;
};

export function BacktestChart({ strategy }: Props) {
  const chartData = useMemo(() => {
    return strategy.backtest.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString('es-AR', {
        month: 'short',
        year: 'numeric',
      }),
      roiPercent: point.roi * 100,
      benchmarkPercent: point.benchmarkRoi * 100,
      drawdownPercent: point.drawdown * 100,
    }));
  }, [strategy.backtest]);
  const lastPoint = strategy.backtest[strategy.backtest.length - 1];

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Backtest & gestión de riesgo
          </h3>
          <p className="mt-1 text-sm text-slate-300/80">
            Rendimiento acumulado vs. Bitcoin y drawdown controlado en el último
            año.
          </p>
        </div>
      </div>
      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, left: 0, right: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.15)"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="rgba(148, 163, 184, 0.5)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderRadius: '16px',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#e2e8f0',
              }}
              formatter={(value: number | string, name: string) => {
                const numeric = typeof value === 'number' ? value : Number(value);
                if (Number.isNaN(numeric)) return [value, name];
                return [`${numeric.toFixed(1)}%`, name];
              }}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-slate-200">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="roiPercent"
              name="Estrategia"
              stroke="#38bdf8"
              fill="url(#colorStrategy)"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="benchmarkPercent"
              name="BTC"
              stroke="#facc15"
              fill="url(#colorBenchmark)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="drawdownPercent"
              name="Drawdown"
              stroke="#f87171"
              fill="rgba(248, 113, 113, 0.12)"
              strokeWidth={1.8}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Return YTD"
          value={formatPercentage(lastPoint?.roi ?? 0, 1)}
        />
        <Stat
          label="Drawdown controlado"
          value={formatPercentage(strategy.metrics.maxDrawdown, 1)}
          muted
        />
        <Stat
          label="Volatilidad diaria"
          value={formatPercentage(strategy.metrics.dailyVolatility, 2)}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-2 text-xl font-semibold ${
          muted ? 'text-amber-200' : 'text-sky-200'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
