import { getMarketWindow, getPerpMetrics, getRecentPrices } from '@/datasources';
import type { AiSignalBase, PerpMetrics, RiskProfile } from '@/types/ai-signal';

import { fetchOnchainRisk } from './onchain-risk';
import {
  DEFAULT_DEADBAND,
  applyOnchainBrake,
  labelFromRisk,
  sizeByProfile,
} from './risk-mapper';
import { TCNModel } from './tcn-model';
import { realizedVolatility } from './volatility';

export type StrategyStepOptions = {
  lookback?: number;
  featureCount?: number;
  now?: Date;
};

export type StrategyStepResult = AiSignalBase & {
  baseWeights: Record<RiskProfile, number>;
  finalWeights: Record<RiskProfile, number>;
  perpMetrics: PerpMetrics;
};

const toIsoString = (value?: Date): string => (value ?? new Date()).toISOString();

const applyDeadband = (signal: number, tau = DEFAULT_DEADBAND): number => {
  return Math.abs(signal) < tau ? 0 : signal;
};

export const runStrategyStep = async (
  asset = 'BTC',
  options?: StrategyStepOptions,
): Promise<StrategyStepResult> => {
  const lookback = options?.lookback ?? 64;
  const featureCount = options?.featureCount ?? 12;
  const now = options?.now;

  const [window, pricesWindow] = await Promise.all([
    getMarketWindow(asset, {
      lookback,
      featureCount,
    }),
    getRecentPrices(asset, {
      lookback,
    }),
  ]);

  const model = new TCNModel();
  const pHat = model.predictProba(window);
  const rawSignal = 2 * pHat - 1;
  const signal = Number(applyDeadband(rawSignal).toFixed(6));

  const volEst = realizedVolatility(pricesWindow);
  const baseWeights = sizeByProfile(signal, volEst);

  const onchainRisk = await fetchOnchainRisk(asset);
  const finalWeights = applyOnchainBrake(baseWeights, onchainRisk);
  const riskLabel = labelFromRisk(onchainRisk);

  const perpMetrics = await getPerpMetrics(asset);

  return {
    timestamp: toIsoString(now),
    asset,
    pHat,
    signal,
    volEst,
    onchainRisk,
    onchainRiskLabel: riskLabel,
    wNextConservador: baseWeights.conservador,
    wNextBalanceado: baseWeights.balanceado,
    wNextAgresivo: baseWeights.agresivo,
    finalWConservador: finalWeights.conservador,
    finalWBalanceado: finalWeights.balanceado,
    finalWAgresivo: finalWeights.agresivo,
    baseWeights,
    finalWeights,
    perpMetrics,
  };
};
