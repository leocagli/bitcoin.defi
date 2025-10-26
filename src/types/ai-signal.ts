export type RiskProfile = 'conservador' | 'balanceado' | 'agresivo';

export type PerpMetrics = {
  asset: string;
  fundingRate: number;
  openInterestChange: number;
  openInterest: number;
  basis: number;
  hourlyVolume: number;
  timestamp: string;
};

export type AiSignalBase = {
  timestamp: string;
  asset: string;
  pHat: number;
  signal: number;
  volEst: number;
  onchainRisk: number;
  onchainRiskLabel: 'LOW' | 'MEDIUM' | 'HIGH';
  wNextConservador: number;
  wNextBalanceado: number;
  wNextAgresivo: number;
  finalWConservador: number;
  finalWBalanceado: number;
  finalWAgresivo: number;
};

export type AiSignalSnapshot = AiSignalBase & {
  explanation: string;
  disclaimer: string;
  perpMetrics?: {
    fundingRate: number;
    openInterestChange: number;
    openInterest: number;
    basis: number;
    hourlyVolume: number;
  };
};

export type BacktestSeriesPoint = {
  t: string;
  equity: number;
};

export type BacktestStat = {
  asset: string;
  period: string;
  sharpe: number;
  cagr: number;
  maxDrawdown: number;
  trades: number;
  equityStart: number;
  equityEnd: number;
  equitySeries: BacktestSeriesPoint[];
  disclaimer: string;
};
