import 'dotenv/config';

import { backtestStatsSeed } from '@/data/backtest-stats';
import { closeDb, openDatabase } from '@/lib/sqlite';

const db = openDatabase();

const upsertStatement = db.prepare(`
  INSERT INTO "BacktestStat" (
    "asset", "period", "sharpe", "cagr", "maxDrawdown", "trades",
    "equityStart", "equityEnd", "equitySeries", "disclaimer"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT("asset") DO UPDATE SET
    "period" = excluded."period",
    "sharpe" = excluded."sharpe",
    "cagr" = excluded."cagr",
    "maxDrawdown" = excluded."maxDrawdown",
    "trades" = excluded."trades",
    "equityStart" = excluded."equityStart",
    "equityEnd" = excluded."equityEnd",
    "equitySeries" = excluded."equitySeries",
    "disclaimer" = excluded."disclaimer",
    "updatedAt" = CURRENT_TIMESTAMP;
`);

const seed = db.transaction(() => {
  for (const entry of backtestStatsSeed) {
    upsertStatement.run(
      entry.asset,
      entry.period,
      entry.sharpe,
      entry.cagr,
      entry.maxDrawdown,
      entry.trades,
      entry.equityStart,
      entry.equityEnd,
      JSON.stringify(entry.equitySeries),
      entry.disclaimer,
    );
  }
});

try {
  seed();
  console.log('[seed] backtest_stats table populated');
} catch (error) {
  console.error('Failed to seed backtest stats', error);
  process.exitCode = 1;
} finally {
  closeDb();
}
