import type { BacktestStat } from '@/types/ai-signal';

const disclaimer =
  'Backtest historico. Resultados pasados no garantizan rendimientos futuros. No es asesoramiento financiero.';

const buildEquitySeries = (start: string, increments: number[]): { t: string; equity: number }[] => {
  const baseDate = new Date(start);
  return increments.map((increment, index) => {
    const date = new Date(baseDate);
    date.setUTCMonth(baseDate.getUTCMonth() + index);
    return {
      t: date.toISOString(),
      equity: Number((100 * (1 + increment)).toFixed(4)),
    };
  });
};

export const backtestStatsSeed: BacktestStat[] = [
  {
    asset: 'BTC',
    period: '2022-2024',
    sharpe: 3.18,
    cagr: 0.297,
    maxDrawdown: 0.0134,
    trades: 184,
    equityStart: 100,
    equityEnd: 189.4,
    equitySeries: buildEquitySeries('2023-01-01T00:00:00Z', [
      0,
      0.018,
      0.034,
      0.057,
      0.079,
      0.103,
      0.127,
      0.163,
      0.192,
      0.223,
      0.256,
      0.289,
      0.324,
      0.362,
      0.394,
      0.432,
      0.466,
      0.498,
      0.533,
      0.565,
      0.594,
      0.621,
      0.648,
      0.694,
      0.734,
      0.781,
      0.823,
      0.872,
      0.894,
    ]),
    disclaimer,
  },
  {
    asset: 'ETH',
    period: '2022-2024',
    sharpe: 2.84,
    cagr: 0.254,
    maxDrawdown: 0.0198,
    trades: 176,
    equityStart: 100,
    equityEnd: 171.2,
    equitySeries: buildEquitySeries('2023-01-01T00:00:00Z', [
      0,
      0.014,
      0.029,
      0.041,
      0.058,
      0.077,
      0.094,
      0.118,
      0.139,
      0.161,
      0.188,
      0.211,
      0.236,
      0.264,
      0.289,
      0.318,
      0.347,
      0.369,
      0.392,
      0.416,
      0.443,
      0.467,
      0.489,
      0.514,
      0.536,
      0.559,
      0.582,
      0.606,
      0.639,
    ]),
    disclaimer,
  },
];
