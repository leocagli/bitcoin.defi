import { NextResponse } from 'next/server';

import { getLatestAiSignal } from '@/lib/ai-signal-store';

const parseAsset = (request: Request): string => {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset');
  return asset ? asset.toUpperCase() : 'BTC';
};

export const GET = async (request: Request) => {
  const asset = parseAsset(request);
  const snapshot = await getLatestAiSignal(asset);

  return NextResponse.json({
    asset: snapshot.asset,
    timestamp: snapshot.timestamp,
    p_hat: snapshot.pHat,
    signal: snapshot.signal,
    vol_est: snapshot.volEst,
    onchain_risk: snapshot.onchainRisk,
    risk_state: snapshot.onchainRiskLabel,
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
    perp_metrics: snapshot.perpMetrics,
  });
};
