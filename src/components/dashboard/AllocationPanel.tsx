'use client';

import { useStacks } from '@/components/providers/StacksProvider';
import type { Strategy } from '@/types/strategy';
import { formatUsd, formatPercentage } from '@/lib/format';
import { ChangeEvent, useMemo, useState } from 'react';

type Props = {
  strategy: Strategy;
};

const MIN_DEPOSIT = 250;
const MAX_DEPOSIT = 25_000;

export function AllocationPanel({ strategy }: Props) {
  const { isSignedIn, account, signIn } = useStacks();
  const [amount, setAmount] = useState(1500);
  const [riskMultiplier, setRiskMultiplier] = useState(1);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [copyStopLoss, setCopyStopLoss] = useState(
    Math.abs(strategy.metrics.maxDrawdown),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const estimatedYield = useMemo(() => {
    const base = strategy.metrics.cagr;
    const adjusted = base * riskMultiplier * 0.82;
    return adjusted;
  }, [riskMultiplier, strategy.metrics.cagr]);

  const estimatedMaxDrawdown = useMemo(
    () => Math.abs(strategy.metrics.maxDrawdown) * riskMultiplier,
    [riskMultiplier, strategy.metrics.maxDrawdown],
  );

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(event.target.value));
  };

  const handleMultiplierChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRiskMultiplier(Number(event.target.value));
  };

  const handleStopLossChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCopyStopLoss(Number(event.target.value) / 100);
  };

  const handlePrimaryAction = () => {
    if (!isSignedIn) {
      void signIn();
      return;
    }

    setStatusMessage(
      `Simulación preparada: delegar ${formatUsd(amount)} con ${riskMultiplier.toFixed(1)}x de riesgo. Confirmá en tu wallet.`,
    );
  };

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Configurá tu copy trading
          </h3>
          <p className="mt-1 text-sm text-slate-300/80">
            Replica automáticamente las posiciones del trader con protecciones ajustables.
          </p>
        </div>
        <div className="rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-wide text-slate-300">
          Estás copiando: {strategy.name}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <InputCard
            label="Capital a delegar"
            subtitle={`Mínimo ${formatUsd(MIN_DEPOSIT)} · máximo ${formatUsd(MAX_DEPOSIT)}`}
          >
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={MIN_DEPOSIT}
                max={MAX_DEPOSIT}
                step={250}
                value={amount}
                onChange={handleAmountChange}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
              />
              <span className="w-28 text-right text-base font-semibold text-sky-200">
                {formatUsd(amount)}
              </span>
            </div>
          </InputCard>

          <InputCard
            label="Multiplicador de riesgo"
            subtitle="Replicá la gestión original o amplifícala con límites duros."
          >
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.1}
                value={riskMultiplier}
                onChange={handleMultiplierChange}
                className="h-2 w-full max-w-lg cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-300"
              />
              <span className="text-lg font-semibold text-amber-200">
                {riskMultiplier.toFixed(1)}x
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Estimate
                label="Yield estimado (12m)"
                value={formatPercentage(estimatedYield)}
              />
              <Estimate
                label="Drawdown proyectado"
                value={formatPercentage(-estimatedMaxDrawdown)}
                negative
              />
            </div>
          </InputCard>

          <InputCard
            label="Stop loss de copy"
            subtitle="Cuando el trader active su guardian, podés salir automáticamente."
          >
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={Math.abs(copyStopLoss * 100)}
                onChange={handleStopLossChange}
                className="h-2 w-full max-w-lg cursor-pointer appearance-none rounded-full bg-slate-700 accent-rose-400"
              />
              <span className="text-lg font-semibold text-rose-200">
                {formatPercentage(-copyStopLoss, 1)}
              </span>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoRebalance}
                onChange={() => setAutoRebalance(!autoRebalance)}
                className="size-4 rounded border border-slate-600 bg-slate-900 text-cyan-400 accent-cyan-400"
              />
              Rebalanceo automático en cada rebalance mensual del trader
            </label>
          </InputCard>
        </div>

        <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
          <div>
            <h4 className="text-base font-semibold text-slate-100">
              Resumen de copia
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="Wallet conectada"
                value={account?.address ? account.address : 'No conectada'}
                highlight={!isSignedIn}
              />
              <SummaryRow
                label="Capital delegado"
                value={formatUsd(amount)}
              />
              <SummaryRow
                label="Riesgo relativo"
                value={`${riskMultiplier.toFixed(1)}x del trader`}
              />
              <SummaryRow
                label="Stop loss dinámico"
                value={formatPercentage(-copyStopLoss, 1)}
              />
              <SummaryRow
                label="Auto rebalance"
                value={autoRebalance ? 'Activo' : 'Manual'}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`mt-auto w-full rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              isSignedIn
                ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-300 text-slate-900 hover:brightness-105 focus:ring-sky-200/60'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 focus:ring-slate-600/50'
            }`}
          >
            {isSignedIn ? 'Simular orden en Stacks' : 'Conectá tu wallet para copiar'}
          </button>
          <p className="text-xs text-slate-400">
            La orden genera una transacción de delegación en Stacks. Revisá la
            simulación antes de confirmar en tu wallet Hiro.
          </p>
          {statusMessage ? (
            <p className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InputCard({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
      <p className="text-sm font-semibold text-white">{label}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-300/80">{subtitle}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Estimate({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          negative ? 'text-rose-200' : 'text-emerald-200'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between rounded-xl border border-transparent bg-slate-900/40 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-amber-300' : 'text-slate-100'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
