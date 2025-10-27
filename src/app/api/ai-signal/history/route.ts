import { NextResponse } from 'next/server';

import { getAiSignalHistory } from '@/lib/ai-signal-store';

type HistoryParams = {
  asset: string;
  from?: string;
  to?: string;
};

const parseParams = (request: Request): HistoryParams => {
  const { searchParams } = new URL(request.url);
  const asset = (searchParams.get('asset') ?? 'BTC').toUpperCase();
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  return { asset, from, to };
};

export const GET = async (request: Request) => {
  const { asset, from, to } = parseParams(request);
  const history = await getAiSignalHistory(asset, from, to);

  return NextResponse.json({
    asset,
    count: history.length,
    snapshots: history.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      p_hat: snapshot.pHat,
      signal: snapshot.signal,
      vol_est: snapshot.volEst,
      onchain_risk: snapshot.onchainRisk,
      onchain_risk_label: snapshot.onchainRiskLabel,
      recommended_exposure_base: {
        conservador: snapshot.wNextConservador,
        balanceado: snapshot.wNextBalanceado,
        agresivo: snapshot.wNextAgresivo,
      },
      recommended_exposure_final: {
        conservador: snapshot.finalWConservador,
        balanceado: snapshot.finalWBalanceado,
        agresivo: snapshot.finalWAgresivo,
      },
      explanation: snapshot.explanation,
      disclaimer: snapshot.disclaimer,
    })),
  });
};
