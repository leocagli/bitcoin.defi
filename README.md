# bitcoin.defi

bitcoin.defi is a web3 dashboard focused on risk managed copy trading over Bitcoin L2 (Stacks). The project bundles three dashboards: the core copy trading hub, an AI driven sizing engine, and a macro flow console powered by OpenBB.

## Dashboards

- **Home (/)** – Hero + overview metrics, highlighted strategies, optimisation insights (vol targeting, delta hedging, liquidity routing) and a catalogue of Web3 coverage/insurance protocols.
- **AI Risk Strategy (/ai)** – Hourly TCN probability model, volatility targeting, on-chain risk brake, and recommended exposure by risk profile (Conservador/Balanceado/Agresivo).
- **OpenBB Macro (/openbb)** – Pricing, flows, narratives and macro highlights consolidated from OpenBB research (Coingecko, Binance Futures, on-chain feeds). 

Use the top navigation bar to switch between dashboards.

## Tech stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4.
- **State/UI**: Framer Motion, custom hooks, client components.
- **Web3**: @stacks/connect (v8 connect API), @stacks/network.
- **Data**: Custom SQLite wrapper with deterministic fallbacks (Coingecko/Binance mocks) – see src/lib/sqlite.ts.

## npm scripts

| Script | Description |
| ------ | ----------- |
| 
pm run dev | Start the Next.js dev server (defaults to port 3000). |
| 
pm run setup:auto | Bootstraps env, creates SQLite schema, seeds backtests, ingests signals and runs lint (no dev server). |
| 
pm run setup:local | Same as above but ends running 
pm run dev. |
| 
pm run db:init-sqlite | Ensures the SQLite schema exists. |
| 
pm run db:seed | Populates the BacktestStat table with mock research data. |
| 
pm run signal:ingest | Generates hourly AI signal snapshots for BTC/ETH. |
| 
pm run lint | ESLint check. |

## Environment variables

`
DATABASE_URL="file:./data/ai-signals.db"
OPENBB_API_KEY=            # optional (future real integration)
CHAINALYSIS_API_KEY=       # optional, otherwise fallback risk score is used
CHAINALYSIS_RISK_ENDPOINT="https://api.chainalysis.com/v0/exchange-flows/{asset}"
CRON_SECRET=               # token to trigger /api/cron/ai-signal manually
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_APP_NAME=bitcoin.defi
`

## Local bootstrap

1. 
pm install
2. 
pm run setup:auto (or 
pm run setup:local if you want the dev server running at the end).
3. Visit http://localhost:3000 for the home dashboard, /ai for the sizing engine, /openbb for macro flows.

## API endpoints (AI risk engine)

All responses include the legal disclaimer string.

- GET /api/ai-signal/current?asset=BTC – latest snapshot (probability, signal, recommended exposure before/after brake, perp metrics).
- GET /api/ai-signal/history?asset=BTC&from=...&to=... – chronological hourly snapshots for charting.
- GET /api/ai-signal/backtest?asset=BTC – mocked backtest stats (Sharpe, CAGR, max drawdown, equity curve).

## Project structure

`
src/
  app/            # routing (/, /ai, /openbb, api routes)
  components/    # UI building blocks (home dashboard, AI blocks, OpenBB panels, navigation, wallet)
  data/          # mock datasets (strategies, risk insights, OpenBB snapshots)
  lib/           # utilities (format helpers, sqlite wrapper)
  strategy-engine/ # TCN placeholder, risk mapper, on-chain brake, pipeline orchestrator
  types/         # shared TypeScript types
scripts/         # CLI helpers (setup, seeding, ingestion)
data/            # SQLite file output (git ignored)
`

## Roadmap ideas

- Replace fallbacks with live OpenBB / Chainalysis feeds using API keys.
- Expand coverage catalogue with real-time status (insurance TVL, utilization).
- Add automated tests (unit + integration) for the AI pipeline and API responses.
- Deploy to Vercel with cron hitting /api/cron/ai-signal hourly.
