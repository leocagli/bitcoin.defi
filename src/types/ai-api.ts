export type RiskState = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecommendedExposure = {
  conservador: number;
  balanceado: number;
  agresivo: number;
};

export type CurrentAiSignalResponse = {
  asset: string;
  timestamp: string;
  p_hat: number;
  signal: number;
  vol_est: number;
  onchain_risk: number;
  risk_state: RiskState;
  recommended_exposure_base: RecommendedExposure;
  recommended_exposure_final: RecommendedExposure;
  explanation: string;
  disclaimer: string;
  perp_metrics?: {
    fundingRate: number;
    openInterestChange: number;
    openInterest: number;
    basis: number;
    hourlyVolume: number;
    timestamp?: string;
    oraclePrice?: number;
    oracleConfidence?: number;
    oracleSource?: 'pyth' | 'mock';
    oracleUpdatedAt?: string;
  };
};

export type HistorySnapshot = {
  timestamp: string;
  p_hat: number;
  signal: number;
  vol_est: number;
  onchain_risk: number;
  onchain_risk_label: RiskState;
  recommended_exposure_base: RecommendedExposure;
  recommended_exposure_final: RecommendedExposure;
  explanation: string;
  disclaimer: string;
};

export type HistoryResponse = {
  asset: string;
  count: number;
  snapshots: HistorySnapshot[];
};

export type BacktestPoint = {
  t: string;
  equity: number;
};

export type BacktestResponse = {
  asset: string;
  period: string;
  sharpe: number;
  cagr: number;
  max_drawdown: number;
  trades: number;
  equity_start: number;
  equity_end: number;
  equity_curve: BacktestPoint[];
  disclaimer: string;
};
