'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAiSignal } from '@/lib/hooks/useAiSignal';

const COPY = {
  es: {
    title: 'Precio oracle (Pyth)',
    subtitle: 'Lectura rapida del oraculo de Pyth Network para BTC.',
    loading: 'Cargando precio oracle...',
    noData: 'Sin datos de oracle disponibles.',
    priceLabel: 'Precio spot',
    confidenceLabel: 'Rango confianza',
    updatedLabel: 'Actualizacion',
    sourceLabel: 'Fuente',
    sourceFallback: 'Modelo interno',
  },
  en: {
    title: 'Oracle price (Pyth)',
    subtitle: 'Quick view of the Pyth Network oracle feed for BTC.',
    loading: 'Loading oracle price...',
    noData: 'No oracle snapshot available.',
    priceLabel: 'Spot price',
    confidenceLabel: 'Confidence band',
    updatedLabel: 'Updated at',
    sourceLabel: 'Source',
    sourceFallback: 'Fallback model',
  },
} as const;

const formatUsd = (value?: number): string => {
  if (value === undefined || Number.isNaN(value)) return '--';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

export const PythOracleCard = ({ asset = 'BTC' }: { asset?: string }) => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const { current } = useAiSignal(asset);
  const metrics = current.data?.perp_metrics;

  const oraclePrice = metrics?.oraclePrice;
  const oracleConfidence = metrics?.oracleConfidence;
  const oracleSource = metrics?.oracleSource ?? 'mock';
  const oracleUpdatedAt = metrics?.oracleUpdatedAt;

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
      <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
      <p className="mt-2 text-sm text-slate-300/80">{copy.subtitle}</p>

      {current.loading ? (
        <p className="mt-4 text-sm text-slate-400">{copy.loading}</p>
      ) : !metrics || oraclePrice === undefined ? (
        <p className="mt-4 text-sm text-slate-400">{copy.noData}</p>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-400/80">{copy.priceLabel}</dt>
            <dd className="text-xl font-semibold text-white">{formatUsd(oraclePrice)}</dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-400/80">{copy.confidenceLabel}</dt>
            <dd className="text-xl font-semibold text-white">
              {oracleConfidence !== undefined ? formatUsd(Math.abs(oracleConfidence)) : '--'}
            </dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-400/80">{copy.updatedLabel}</dt>
            <dd className="text-sm font-semibold text-white">
              {oracleUpdatedAt ? new Date(oracleUpdatedAt).toUTCString() : '--'}
            </dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-400/80">{copy.sourceLabel}</dt>
            <dd className="text-sm font-semibold text-white">
              {oracleSource === 'pyth' ? 'Pyth Network' : copy.sourceFallback}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
};
