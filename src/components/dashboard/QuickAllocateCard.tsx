'use client';

import { useState } from 'react';

import { allocateToStrategy } from '@/lib/stacks/copy-trading';
import { useStacks } from '@/components/providers/StacksProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';

const COPY = {
  es: {
    title: 'Ejecutar copy trading',
    description:
      'Envía una orden simple al contrato de copy trading. Requiere wallet conectada y parámetros en unidades enteras.',
    connect: 'Conectar wallet',
    submit: 'Enviar orden',
    amount: 'Monto (ustx)',
    strategyId: 'Estrategia ID',
    multiplier: 'Riesgo (bps)',
    stopLoss: 'Stop loss (bps)',
    autoRebalance: 'Auto rebalance',
    success: 'Orden enviada a tu wallet',
    error: 'Error al preparar la transacción',
  },
  en: {
    title: 'Execute copy trade',
    description:
      'Send a simple order to the copy trading contract. Requires a connected wallet and integer parameters.',
    connect: 'Connect wallet',
    submit: 'Submit order',
    amount: 'Amount (ustx)',
    strategyId: 'Strategy ID',
    multiplier: 'Risk (bps)',
    stopLoss: 'Stop loss (bps)',
    autoRebalance: 'Auto rebalance',
    success: 'Order pushed to your wallet',
    error: 'Failed to prepare transaction',
  },
} as const;

export const QuickAllocateCard = () => {
  const { account, network, signIn } = useStacks();
  const { language } = useLanguage();
  const copy = COPY[language];

  const [strategyId, setStrategyId] = useState(1);
  const [amountUstx, setAmountUstx] = useState(10_000_000);
  const [riskBps, setRiskBps] = useState(100);
  const [stopLossBps, setStopLossBps] = useState(500);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = Boolean(account?.address);

  const handleSubmit = async () => {
    if (!account?.address) {
      await signIn();
      return;
    }
    try {
      await allocateToStrategy({
        network,        strategyId,
        amountUstx: BigInt(amountUstx),
        riskMultiplierBps: riskBps,
        stopLossBps,
        autoRebalance,
      });
      setStatus(copy.success);
    } catch (error) {
      console.error('[quick-allocate] failed', error);
      setStatus(copy.error);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
          <p className="mt-2 text-sm text-slate-300/80">{copy.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400/80">
          {copy.strategyId}
          <input
            type="number"
            min={0}
            value={strategyId}
            onChange={(event) => setStrategyId(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400/80">
          {copy.amount}
          <input
            type="number"
            min={0}
            value={amountUstx}
            onChange={(event) => setAmountUstx(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400/80">
          {copy.multiplier}
          <input
            type="number"
            min={0}
            value={riskBps}
            onChange={(event) => setRiskBps(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400/80">
          {copy.stopLoss}
          <input
            type="number"
            min={0}
            value={stopLossBps}
            onChange={(event) => setStopLossBps(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400/80 sm:col-span-2">
          <input
            type="checkbox"
            checked={autoRebalance}
            onChange={(event) => setAutoRebalance(event.target.checked)}
            className="h-4 w-4 rounded border border-white/20 bg-slate-900 text-sky-500 focus:ring-sky-400"
          />
          {copy.autoRebalance}
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {canSubmit ? copy.submit : copy.connect}
        </button>
        {status && <span className="text-xs text-slate-400/80">{status}</span>}
      </div>
    </div>
  );
};


