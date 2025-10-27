import { getDb } from '@/lib/sqlite';
import type { AiSignalBase, AiSignalSnapshot } from '@/types/ai-signal';
import type { StrategyStepResult } from '@/strategy-engine';
import { runStrategyStep } from '@/strategy-engine';

const DISCLAIMER_COPY =
  'Backtest historico. Resultados pasados no garantizan rendimientos futuros. No es asesoramiento financiero.';

type AiSignalRow = {
  timestamp: string;
  asset: string;
  pHat: number;
  signal: number;
  volEst: number;
  onchainRisk: number;
  onchainRiskLabel: string;
  wNextConservador: number;
  wNextBalanceado: number;
  wNextAgresivo: number;
  finalWConservador: number;
  finalWBalanceado: number;
  finalWAgresivo: number;
  explanation?: string | null;
  disclaimer?: string | null;
  perpMetrics?: string | null;
};

type BacktestStatRow = {
  asset: string;
  period: string;
  sharpe: number;
  cagr: number;
  maxDrawdown: number;
  trades: number;
  equityStart: number;
  equityEnd: number;
  equitySeries: string;
  disclaimer: string;
};

const buildNarrative = (snapshot: AiSignalBase): string => {
  const skew =
    snapshot.signal > 0.25
      ? 'alcista moderada'
      : snapshot.signal < -0.25
        ? 'bajista controlada'
        : 'neutral tactica';

  const reduction = snapshot.finalWBalanceado < snapshot.wNextBalanceado;
  const onchainNote = reduction
    ? 'Observamos presion de flujo on-chain y aplicamos reduccion automatica de exposicion.'
    : 'Los flujos on-chain se mantienen estables y no frenan la senal cuantitativa.';

  return `Senal cuantitativa ${skew} para ${snapshot.asset}. ${onchainNote}`;
};

const rowToSnapshot = (row: AiSignalRow): AiSignalSnapshot => {
  const base: AiSignalBase = {
    timestamp: new Date(row.timestamp).toISOString(),
    asset: row.asset,
    pHat: row.pHat,
    signal: row.signal,
    volEst: row.volEst,
    onchainRisk: row.onchainRisk,
    onchainRiskLabel: row.onchainRiskLabel as AiSignalBase['onchainRiskLabel'],
    wNextConservador: row.wNextConservador,
    wNextBalanceado: row.wNextBalanceado,
    wNextAgresivo: row.wNextAgresivo,
    finalWConservador: row.finalWConservador,
    finalWBalanceado: row.finalWBalanceado,
    finalWAgresivo: row.finalWAgresivo,
  };

  return {
    ...base,
    explanation: row.explanation ?? buildNarrative(base),
    disclaimer: row.disclaimer ?? DISCLAIMER_COPY,
    perpMetrics: row.perpMetrics ? JSON.parse(row.perpMetrics) : undefined,
  };
};

const toBaseSnapshot = (result: StrategyStepResult): AiSignalBase => ({
  timestamp: result.timestamp,
  asset: result.asset,
  pHat: result.pHat,
  signal: result.signal,
  volEst: result.volEst,
  onchainRisk: result.onchainRisk,
  onchainRiskLabel: result.onchainRiskLabel,
  wNextConservador: result.wNextConservador,
  wNextBalanceado: result.wNextBalanceado,
  wNextAgresivo: result.wNextAgresivo,
  finalWConservador: result.finalWConservador,
  finalWBalanceado: result.finalWBalanceado,
  finalWAgresivo: result.finalWAgresivo,
});

const persistStrategyResult = (result: StrategyStepResult, explanation?: string): AiSignalSnapshot => {
  const db = getDb();
  const baseSnapshot = toBaseSnapshot(result);
  const explanationCopy = explanation ?? buildNarrative(baseSnapshot);

  const statement = db.prepare(`
    INSERT INTO "AiSignal" (
      "timestamp", "asset", "pHat", "signal", "volEst", "onchainRisk", "onchainRiskLabel",
      "wNextConservador", "wNextBalanceado", "wNextAgresivo",
      "finalWConservador", "finalWBalanceado", "finalWAgresivo",
      "explanation", "disclaimer", "perpMetrics"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT("timestamp") DO UPDATE SET
      "asset" = excluded."asset",
      "pHat" = excluded."pHat",
      "signal" = excluded."signal",
      "volEst" = excluded."volEst",
      "onchainRisk" = excluded."onchainRisk",
      "onchainRiskLabel" = excluded."onchainRiskLabel",
      "wNextConservador" = excluded."wNextConservador",
      "wNextBalanceado" = excluded."wNextBalanceado",
      "wNextAgresivo" = excluded."wNextAgresivo",
      "finalWConservador" = excluded."finalWConservador",
      "finalWBalanceado" = excluded."finalWBalanceado",
      "finalWAgresivo" = excluded."finalWAgresivo",
      "explanation" = excluded."explanation",
      "disclaimer" = excluded."disclaimer",
      "perpMetrics" = excluded."perpMetrics";
  `);

  statement.run(
    baseSnapshot.timestamp,
    baseSnapshot.asset,
    baseSnapshot.pHat,
    baseSnapshot.signal,
    baseSnapshot.volEst,
    baseSnapshot.onchainRisk,
    baseSnapshot.onchainRiskLabel,
    baseSnapshot.wNextConservador,
    baseSnapshot.wNextBalanceado,
    baseSnapshot.wNextAgresivo,
    baseSnapshot.finalWConservador,
    baseSnapshot.finalWBalanceado,
    baseSnapshot.finalWAgresivo,
    explanationCopy,
    DISCLAIMER_COPY,
    JSON.stringify(result.perpMetrics ?? null),
  );

  return {
    ...baseSnapshot,
    explanation: explanationCopy,
    disclaimer: DISCLAIMER_COPY,
    perpMetrics: result.perpMetrics ?? undefined,
  };
};

export const generateAndPersistSignal = async (asset: string): Promise<AiSignalSnapshot> => {
  const result = await runStrategyStep(asset);
  return persistStrategyResult(result);
};

export const getLatestAiSignal = async (asset: string): Promise<AiSignalSnapshot> => {
  const db = getDb();
  const statement = db.prepare<[string], AiSignalRow>(`
    SELECT * FROM "AiSignal"
    WHERE "asset" = ?
    ORDER BY "timestamp" DESC
    LIMIT 1
  `);

  const row = statement.get(asset);
  if (row) {
    return rowToSnapshot(row);
  }

  return generateAndPersistSignal(asset);
};

export const getAiSignalHistory = async (
  asset: string,
  from?: string,
  to?: string,
): Promise<AiSignalSnapshot[]> => {
  const db = getDb();
  const conditions = ['"asset" = ?'];
  const params: Array<string | number> = [asset];

  if (from) {
    conditions.push(`"timestamp" >= ?`);
    params.push(new Date(from).toISOString());
  }
  if (to) {
    conditions.push(`"timestamp" <= ?`);
    params.push(new Date(to).toISOString());
  }

  const query = `
    SELECT * FROM "AiSignal"
    WHERE ${conditions.join(' AND ')}
    ORDER BY "timestamp" ASC
  `;

  const statementHistory = db.prepare<(string | number)[], AiSignalRow>(query);
  const rows = statementHistory.all(...params);
  return rows.map(rowToSnapshot);
};

export const getBacktestStat = async (asset: string) => {
  const db = getDb();
  const backtestStatement = db.prepare<[string], BacktestStatRow>(`SELECT * FROM "BacktestStat" WHERE "asset" = ? LIMIT 1`);
  const row = backtestStatement.get(asset);

  if (!row) {
    return undefined;
  }

  return {
    asset: row.asset,
    period: row.period,
    sharpe: row.sharpe,
    cagr: row.cagr,
    maxDrawdown: row.maxDrawdown,
    trades: row.trades,
    equityStart: row.equityStart,
    equityEnd: row.equityEnd,
    equitySeries: JSON.parse(row.equitySeries),
    disclaimer: row.disclaimer,
  };
};

