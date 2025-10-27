import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import Database from 'better-sqlite3';

let dbInstance: Database.Database | null = null;

export const getDatabasePath = (url = process.env.DATABASE_URL): string => {
  if (!url) {
    throw new Error('DATABASE_URL is not defined. Update your .env.local file.');
  }
  if (!url.startsWith('file:')) {
    throw new Error(`Unsupported DATABASE_URL: ${url}. Expected SQLite connection string (file:...).`);
  }
  const [pathPart] = url.replace('file:', '').split('?');
  if (!pathPart) {
    throw new Error(`Invalid SQLite connection string: ${url}`);
  }
  return resolve(pathPart);
};

export const ensureSchema = (db: Database.Database) => {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS "AiSignal" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "timestamp" DATETIME NOT NULL UNIQUE,
      "asset" TEXT NOT NULL,
      "pHat" REAL NOT NULL,
      "signal" REAL NOT NULL,
      "volEst" REAL NOT NULL,
      "onchainRisk" REAL NOT NULL,
      "onchainRiskLabel" TEXT NOT NULL,
      "wNextConservador" REAL NOT NULL,
      "wNextBalanceado" REAL NOT NULL,
      "wNextAgresivo" REAL NOT NULL,
      "finalWConservador" REAL NOT NULL,
      "finalWBalanceado" REAL NOT NULL,
      "finalWAgresivo" REAL NOT NULL,
      "explanation" TEXT,
      "disclaimer" TEXT,
      "perpMetrics" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS "BacktestStat" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "asset" TEXT NOT NULL UNIQUE,
      "period" TEXT NOT NULL,
      "sharpe" REAL NOT NULL,
      "cagr" REAL NOT NULL,
      "maxDrawdown" REAL NOT NULL,
      "trades" INTEGER NOT NULL,
      "equityStart" REAL NOT NULL,
      "equityEnd" REAL NOT NULL,
      "equitySeries" TEXT NOT NULL,
      "disclaimer" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS "BacktestStat_updatedAt"
    AFTER UPDATE ON "BacktestStat"
    FOR EACH ROW
    BEGIN
      UPDATE "BacktestStat"
      SET "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."id";
    END;
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS "idx_AiSignal_asset_timestamp"
    ON "AiSignal" ("asset", "timestamp");
  `);
};

export const openDatabase = (): Database.Database => {
  const dbPath = getDatabasePath();
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureSchema(db);
  return db;
};

export const getDb = (): Database.Database => {
  if (!dbInstance) {
    dbInstance = openDatabase();
  }
  return dbInstance;
};

export const closeDb = (): void => {
  dbInstance?.close();
  dbInstance = null;
};
