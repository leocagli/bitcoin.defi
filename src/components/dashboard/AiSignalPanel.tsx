'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';

import { formatPercentage } from '@/lib/format';
import { useAiSignal } from '@/lib/hooks/useAiSignal';
import type { RiskState } from '@/types/ai-api';

type ProfileKey = 'conservador' | 'balanceado' | 'agresivo';

const PROFILE_LABELS: Record<ProfileKey, string> = {
  conservador: 'Conservador',
  balanceado: 'Balanceado',
  agresivo: 'Agresivo',
};

const RISK_COLORS: Record<RiskState, string> = {
  LOW: 'text-emerald-300 bg-emerald-300/10 border border-emerald-300/30',
  MEDIUM: 'text-amber-300 bg-amber-300/10 border border-amber-300/30',
  HIGH: 'text-rose-300 bg-rose-300/10 border border-rose-300/30',
};

const PROFILE_COLORS: Record<ProfileKey, string> = {
  conservador: '#34d399',
  balanceado: '#60a5fa',
  agresivo: '#f472b6',
};

const toDateLabel = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getUTCMonth() + 1}/${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')} ${date.getUTCHours().toString().padStart(2, '0')}:00`;
};

const buildHistoryDataset = (snapshots: ReturnType<typeof useAiSignal>['history']['data']) => {
  const items = snapshots?.snapshots ?? [];
  const slice = items.slice(-24); // keep last 24 hours for readability
  return slice.map((snapshot) => ({
    timestamp: snapshot.timestamp,
    label: toDateLabel(snapshot.timestamp),
    conservador: snapshot.recommended_exposure_final.conservador * 100,
    balanceado: snapshot.recommended_exposure_final.balanceado * 100,
    agresivo: snapshot.recommended_exposure_final.agresivo * 100,
  }));
};

const formatRiskState = (state: RiskState) => {
  const map = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  } as const;
  return map[state] ?? 'LOW';
};

const ProfileCard = ({
  profile,
  base,
  final,
}: {
  profile: ProfileKey;
  base: number | undefined;
  final: number | undefined;
}) => {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-white/5 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
        <span>{PROFILE_LABELS[profile]}</span>
        <span className="text-xs text-slate-400/80">Base vs Ajustada</span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400/70">Base</p>
          <p className="text-2xl font-semibold text-white">
            {formatPercentage(base ?? 0, 1)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400/70">Final</p>
          <p className="text-2xl font-semibold text-white">
            {formatPercentage(final ?? 0, 1)}
          </p>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-white/40 to-white/10"
          style={{ width: `${Math.min(100, (final ?? 0) * 100)}%` }}
        />
      </div>
    </div>
  );
};

type ChartDatum = {
  timestamp: string;
  label: string;
  conservador: number;
  balanceado: number;
  agresivo: number;
};

const ChartTooltip = ({
  active,
  payload,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0]?.payload as ChartDatum | undefined;
  if (!data) {
    return null;
  }
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-100">{data.label} UTC</p>
      <ul className="mt-1 space-y-1">
        {(Object.keys(PROFILE_LABELS) as ProfileKey[]).map((key) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <span className="text-slate-400">{PROFILE_LABELS[key]}</span>
            <span className="font-semibold text-slate-100">
              {data[key]?.toFixed(1) ?? '0.0'}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const BacktestHighlights = ({
  sharpe,
  cagr,
  maxDrawdown,
}: {
  sharpe?: number;
  cagr?: number;
  maxDrawdown?: number;
}) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400/80">Sharpe</p>
      <p className="text-2xl font-semibold text-white">{sharpe?.toFixed(2) ?? '--'}</p>
    </div>
    <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400/80">CAGR</p>
      <p className="text-2xl font-semibold text-white">
        {formatPercentage(cagr ?? 0, 1)}
      </p>
    </div>
    <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400/80">Max Drawdown</p>
      <p className="text-2xl font-semibold text-white">
        {formatPercentage(maxDrawdown ?? 0, 1)}
      </p>
    </div>
  </div>
);

export const AiSignalPanel = () => {
  const [asset, setAsset] = useState<'BTC' | 'ETH'>('BTC');
  const { current, history, backtest, disclaimer, refresh } = useAiSignal(asset);

  const exposures = useMemo(() => {
    if (!current.data) {
      return null;
    }
    return (Object.keys(PROFILE_LABELS) as ProfileKey[]).map((key) => ({
      profile: key,
      base: current.data?.recommended_exposure_base[key],
      final: current.data?.recommended_exposure_final[key],
    }));
  }, [current.data]);

  const historyDataset = useMemo(() => buildHistoryDataset(history.data), [history.data]);

  return (
    <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-xl shadow-black/30 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            AI Risk-Managed Strategy
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-white">
            Exposicion recomendada on-chain aware
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300/80">
            Motor cuantitativo horario que ajusta la exposicion sugerida segun volatilidad
            y senales de flujo on-chain. Analisis informativo: no ejecuta ordenes por vos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(['BTC', 'ETH'] as const).map((ticker) => (
            <button
              key={ticker}
              type="button"
              onClick={() => setAsset(ticker)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                asset === ticker
                  ? 'border-white/60 bg-white/10 text-white shadow-inner'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
              }`}
            >
              {ticker}
            </button>
          ))}
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/10"
          >
            Refrescar
          </button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400/80">
                  Ultima actualizacion
                </p>
                <p className="text-lg font-semibold text-white">
                  {current.data
                    ? new Date(current.data.timestamp).toUTCString()
                    : current.loading
                      ? 'Cargando...'
                      : 'Sin datos'}
                </p>
              </div>
              {current.data?.risk_state && (
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${RISK_COLORS[current.data.risk_state]}`}
                >
                  Riesgo {formatRiskState(current.data.risk_state)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-200">
              {current.data?.explanation ??
                (current.loading ? 'Calculando señal cuantitativa...' : 'Sin narrativa.')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(exposures ?? (['conservador', 'balanceado', 'agresivo'] as ProfileKey[])).map(
              (item) =>
                typeof item === 'string' ? (
                  <ProfileCard key={item} profile={item} base={0} final={0} />
                ) : (
                  <ProfileCard
                    key={item.profile}
                    profile={item.profile}
                    base={item.base}
                    final={item.final}
                  />
                ),
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Exposicion final ultima 24h
                </h3>
                <p className="text-xs uppercase tracking-wide text-slate-400/80">
                  Ajustada por freno on-chain
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              {history.loading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Cargando serie historica...
                </div>
              ) : historyDataset.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={historyDataset}>
                    <defs>
                      {(Object.keys(PROFILE_LABELS) as ProfileKey[]).map((key) => (
                        <linearGradient
                          key={key}
                          id={`gradient-${key}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={PROFILE_COLORS[key]} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={PROFILE_COLORS[key]} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      interval={historyDataset.length > 12 ? 3 : 1}
                    />
                    <YAxis
                      stroke="#64748b"
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    {(Object.keys(PROFILE_LABELS) as ProfileKey[]).map((key) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={PROFILE_COLORS[key]}
                        strokeWidth={2}
                        fill={`url(#gradient-${key})`}
                        dot={false}
                        name={PROFILE_LABELS[key]}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No hay datos historicos disponibles.
                </div>
              )}
            </div>
          </div>
      </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-white">Metricas cuantitativas</h3>
            <p className="mt-2 text-sm text-slate-300/80">
              Probabilidad de barra alcista (p_hat) y senal bruta en rango [-1, 1].
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400/80">p_hat</p>
                <p className="text-xl font-semibold text-white">
                  {current.data?.p_hat?.toFixed(3) ?? '--'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400/80">senal</p>
                <p className="text-xl font-semibold text-white">
                  {current.data?.signal?.toFixed(3) ?? '--'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400/80">
                  Volatilidad estimada
                </p>
                <p className="text-xl font-semibold text-white">
                  {formatPercentage(current.data?.vol_est ?? 0, 1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400/80">
                  Riesgo on-chain
                </p>
                <p className="text-xl font-semibold text-white">
                  {formatPercentage(current.data?.onchain_risk ?? 0, 1)}
                </p>
              </div>
              </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-white">Perp metrics (Binance)</h3>
            <p className="mt-2 text-sm text-slate-300/80">
              Funding, open interest y basis para ajustar la exposicion sugerida.
            </p>
            {current.loading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando metricas perp...</p>
            ) : current.data?.perp_metrics ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400/80">
                    Funding rate
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {(current.data.perp_metrics.fundingRate * 10000).toFixed(2)} bps
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400/80">
                    Cambio OI (1h)
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {formatPercentage(current.data.perp_metrics.openInterestChange ?? 0, 2)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400/80">
                    Open interest
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {current.data.perp_metrics.openInterest.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400/80">Basis</p>
                  <p className="text-xl font-semibold text-white">
                    {formatPercentage(current.data.perp_metrics.basis ?? 0, 2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No hay metricas perp disponibles.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-white">Backtest</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400/80">
              Periodo {backtest.data?.period ?? '--'}
            </p>
            <BacktestHighlights
              sharpe={backtest.data?.sharpe}
              cagr={backtest.data?.cagr}
              maxDrawdown={backtest.data?.max_drawdown}
            />
            <p className="mt-4 text-xs text-slate-400/80">
              Equity final: {formatPercentage((backtest.data?.equity_end ?? 0) / 100 - 1, 1)} vs.
              inicio {backtest.data?.equity_start ?? 0}.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-xs text-amber-100">
            {disclaimer}
          </div>
        </aside>
      </div>
    </section>
  );
};
