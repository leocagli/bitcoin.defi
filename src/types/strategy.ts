export type RiskLevel = 'baja' | 'media' | 'alta';

export type BacktestPoint = {
  date: string;
  roi: number;
  drawdown: number;
  benchmarkRoi: number;
};

export type RiskGuard = {
  id: string;
  label: string;
  description: string;
  status: 'activo' | 'alerta';
  threshold: string;
  current: string;
};

export type Strategy = {
  id: string;
  name: string;
  leadTrader: {
    name: string;
    avatarUrl: string;
    experience: string;
    riskStyle: string;
  };
  description: string;
  riskLevel: RiskLevel;
  tvlUsd: number;
  followers: number;
  metrics: {
    cagr: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    dailyVolatility: number;
    exposure: number;
  };
  riskGuards: RiskGuard[];
  backtest: BacktestPoint[];
};
