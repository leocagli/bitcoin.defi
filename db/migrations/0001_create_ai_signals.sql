-- Schema definition for AI risk-managed strategy module.
CREATE TABLE IF NOT EXISTS ai_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL UNIQUE,
    asset TEXT NOT NULL,
    p_hat REAL NOT NULL,
    signal REAL NOT NULL,
    vol_est REAL NOT NULL,
    onchain_risk REAL NOT NULL,
    onchain_risk_label TEXT NOT NULL,
    w_next_conservador REAL NOT NULL,
    w_next_balanceado REAL NOT NULL,
    w_next_agresivo REAL NOT NULL,
    final_w_conservador REAL NOT NULL,
    final_w_balanceado REAL NOT NULL,
    final_w_agresivo REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS backtest_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    period TEXT NOT NULL,
    sharpe REAL NOT NULL,
    cagr REAL NOT NULL,
    max_drawdown REAL NOT NULL,
    trades INTEGER NOT NULL,
    equity_start REAL NOT NULL,
    equity_end REAL NOT NULL,
    equity_series TEXT NOT NULL,
    disclaimer TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_signals_asset_ts ON ai_signals (asset, timestamp);
