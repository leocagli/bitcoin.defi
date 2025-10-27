import { NextResponse } from 'next/server';

import { getBacktestStat } from '@/lib/ai-signal-store';

const parseAsset = (request: Request): string => {
  const { searchParams } = new URL(request.url);
  return (searchParams.get('asset') ?? 'BTC').toUpperCase();
};

export const GET = async (request: Request) => {
  const asset = parseAsset(request);
  const stat = await getBacktestStat(asset);

  if (!stat) {
    return NextResponse.json(
      {
        error: 'Asset not found',
        disclaimer:
          'Backtest historico. Resultados pasados no garantizan rendimientos futuros. No es asesoramiento financiero.',
      },
      { status: 404 },
    );
  }

  const equityCurve = Array.isArray(stat.equitySeries)
    ? (stat.equitySeries as Array<Record<string, unknown>>).map((point) => ({
        t: String(point.t ?? point.timestamp ?? ''),
        equity: Number(point.equity ?? point.value ?? 0),
      }))
    : [];

  return NextResponse.json({
    asset: stat.asset,
    period: stat.period,
    sharpe: stat.sharpe,
    cagr: stat.cagr,
    max_drawdown: stat.maxDrawdown,
    trades: stat.trades,
    equity_start: stat.equityStart,
    equity_end: stat.equityEnd,
    equity_curve: equityCurve,
    disclaimer: stat.disclaimer,
  });
};
