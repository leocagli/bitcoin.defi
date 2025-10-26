# bitcoin.defi

bitcoin.defi is a Web3 investing console that combines a risk-managed copy trading hub with two data companions: an AI sizing engine and an OpenBB macro dashboard. The product targets Bitcoin L2 (Stacks) users who want transparent sizing, hedging ideas, and coverage options without promising execution or guaranteed yield.

## Dashboards

- **Home (`/`)** - Marketing hero, KPI tiles, recommended strategies, optimisation playbooks (vol targeting, delta hedging, liquidity routing), and curated Web3 protection and coverage providers.
- **AI Risk Strategy (`/ai`)** - TCN-based probability stub, volatility targeting, on-chain risk brake, and recommended exposure before and after the brake for Conservador, Balanceado, and Agresivo profiles (always including legal disclaimers).
- **OpenBB Macro (`/openbb`)** - Market flows, perp metrics, narratives, and macro highlights sourced from OpenBB research (Coingecko, Binance, on-chain). Lives on its own page so the main landing stays focused on bitcoin.defi.

Use the top navigation to move between dashboards.

## Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion transitions.
- **Wallets**: `@stacks/connect` v8 (Stacks). MetaMask support is optional; disable the extension locally if it spams JSON-RPC errors.
- **Server/Data**: Lightweight SQLite layer via `src/lib/sqlite.ts` (Prisma replaced) plus deterministic mock fallbacks for Coingecko, Binance, OpenBB, and Chainalysis when API keys are missing.
- **Strategy engine**: `strategy-engine/` hosts the TCN stub, volatility targeting, on-chain risk brake, and hourly pipeline orchestrator.
- **Automation**: `scripts/` wraps setup, seeding, ingestion, and cron trigger helpers.

## Prerequisites

- Node.js 20 LTS
- npm 10+
- Git (access to `https://github.com/leocagli/bitcoin.defi.git`)
- Optional: disable unrelated browser wallet extensions during local QA to avoid noisy console errors.

## Environment variables

Create `.env.local` (and mirror in Vercel):

```bash
DATABASE_URL="file:./data/ai-signals.db"
OPENBB_API_KEY=""            # optional; enables live OpenBB integration when present
CHAINALYSIS_API_KEY=""       # optional; otherwise the mock risk score is used
CHAINALYSIS_RISK_ENDPOINT="https://api.chainalysis.com/v0/exchange-flows/{asset}"
CRON_SECRET=""               # shared secret for /api/cron/ai-signal
NEXT_PUBLIC_STACKS_NETWORK="mainnet"
NEXT_PUBLIC_APP_NAME="bitcoin.defi"
```

## One-command local setup

```bash
npm install
npm run setup:auto        # creates SQLite schema, seeds backtests, ingests signals, runs lint
# or:
npm run setup:local       # same as above but keeps `npm run dev` running on port 3000
```

Then visit:

- http://localhost:3000 -> home dashboard
- http://localhost:3000/ai -> AI sizing engine
- http://localhost:3000/openbb -> OpenBB macro dashboard

## npm scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Next.js dev server (default port 3000). |
| `npm run setup:auto` | Bootstrap env, init DB, seed backtests, ingest signals, run lint (headless). |
| `npm run setup:local` | Same as `setup:auto` but finishes by running `npm run dev`. |
| `npm run db:init-sqlite` | Ensures the SQLite schema exists. |
| `npm run db:seed` | Seeds `BacktestStat` with canned research metrics. |
| `npm run signal:ingest` | Runs the hourly AI strategy pipeline for BTC and ETH. |
| `npm run lint` | ESLint check. |

## API surface (AI risk engine)

Every response appends the legal copy: "Backtest historico. Resultados pasados no garantizan rendimientos futuros. No es asesoramiento financiero."

- `GET /api/ai-signal/current?asset=BTC` - Latest probability, raw signal, recommended exposure before and after the on-chain brake plus metadata.
- `GET /api/ai-signal/history?asset=BTC&from=...&to=...` - Chronological hourly snapshots for charting.
- `GET /api/ai-signal/backtest?asset=BTC` - Mocked Sharpe, CAGR, max drawdown, equity curve.
- `GET /api/cron/ai-signal?token=${CRON_SECRET}` - Cron hook used by Vercel (hourly ingest).

## Deployment notes

1. Mirror `.env.local` values into Vercel project settings (DATABASE_URL, CHAINALYSIS_*, CRON_SECRET, optional OPENBB_API_KEY).
2. Vercel cron (configured in `vercel.json`) hits `/api/cron/ai-signal` hourly to ingest fresh snapshots.
3. Manual refresh: `curl https://<vercel-app>/api/cron/ai-signal?token=$CRON_SECRET`.

## Troubleshooting

- MetaMask errors: disable the extension locally if you see "Internal JSON-RPC error". The Stacks connect flow continues to work.
- Empty dashboards: re-run `npm run setup:auto` (or `npm run setup:local`) to recreate the SQLite DB and ingest baseline rows.
- Switching data providers: after swapping mock data for real OpenBB or Chainalysis responses, run `npm run db:seed` and `npm run signal:ingest`.

## Roadmap

- Swap mocks for live OpenBB and Chainalysis integrations when API keys are available.
- Expand the coverage catalogue with live TVL and utilisation feeds.
- Add unit and integration tests for the strategy pipeline, API routes, and UI data hooks.
- Expose ETH strategy outputs alongside BTC on the AI dashboard.
