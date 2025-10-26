import {
  openbbAssets,
  openbbFlows,
  openbbNarratives,
  openbbMacroHighlights,
} from '@/data/openbb-dashboard';

const formatUsd = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    ...options,
  }).format(value);

const formatPercent = (value: number, digits = 2) =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;

const cardClass =
  'rounded-3xl bg-slate-900/60 border border-white/5 px-6 py-5 flex flex-col gap-3 shadow-lg shadow-slate-950/40';

export function OpenBBDashboard() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-12 text-slate-100 lg:px-6 lg:py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">OpenBB Dash</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Macro + Crypto Intelligence
        </h1>
        <p className="max-w-2xl text-sm text-slate-300/80">
          Consolidado de precios, flujos y narrativas cuantitativas desde OpenBB Research. Los
          datos se actualizan en ciclos horarios empleando APIs públicas y feeds on-chain.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400/80">
          <span className="rounded-full border border-slate-700/60 px-3 py-1">
            Última actualización · {new Intl.DateTimeFormat('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date())}
          </span>
          <span className="rounded-full border border-slate-700/60 px-3 py-1">
            Fuente: OpenBB Terminal · Coingecko · On-chain analytics
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {openbbAssets.map((asset) => (
          <article key={asset.asset} className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">{asset.asset}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  asset.change24h >= 0
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-rose-500/10 text-rose-300'
                }`}
              >
                {formatPercent(asset.change24h)}
              </span>
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatUsd(asset.price, { maximumFractionDigits: asset.price > 1000 ? 0 : 2 })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div>
                <p className="font-medium text-slate-300">Cambio 7d</p>
                <p className={asset.change7d >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {formatPercent(asset.change7d)}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-300">Dominancia</p>
                <p>{formatPercent(asset.dominance, 1)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-300">Volumen 24h</p>
                <p>{formatUsd(asset.volume24h, { maximumFractionDigits: 1 })}B</p>
              </div>
              <div>
                <p className="font-medium text-slate-300">Funding</p>
                <p className={asset.fundingRate >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {formatPercent(asset.fundingRate * 10000, 2)} bps
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Open interest</span>{' '}
              {formatUsd(asset.openInterest, { maximumFractionDigits: 1 })}B
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className={cardClass}>
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Perp / Options Net Flows</h2>
              <p className="text-xs text-slate-400">
                Open interest y variación nominal en exchanges institucionales (USD B).
              </p>
            </div>
          </header>
          <div className="mt-4 divide-y divide-slate-800/80 text-sm">
            {openbbFlows.map((flow) => (
              <div
                key={flow.venue}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3"
              >
                <span className="font-medium text-slate-300">{flow.venue}</span>
                <span className="text-right text-slate-200">
                  {formatUsd(flow.netInflow, { maximumFractionDigits: 2 })}B
                </span>
                <span
                  className={`text-right ${
                    flow.change24h >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {formatPercent(flow.change24h)}
                </span>
                <div className="col-span-3 h-2 rounded-full bg-slate-800/80">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                    style={{ width: `${flow.utilization}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">Utilización {flow.utilization}%</span>
              </div>
            ))}
          </div>
        </div>

        <aside className={cardClass}>
          <h2 className="text-lg font-semibold text-white">Macro highlights</h2>
          <p className="text-xs text-slate-400">
            Señales macro relevantes para la toma de decisiones en cripto.
          </p>
          <div className="mt-4 space-y-3">
            {openbbMacroHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-cyan-200">{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {openbbNarratives.map((narrative) => (
          <article key={narrative.title} className={cardClass}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{narrative.subtitle}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{narrative.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-300/80">{narrative.description}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              {narrative.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-full border border-slate-700/70 px-3 py-1 font-medium text-slate-200"
                >
                  {metric.label}: <span className="text-cyan-300">{metric.value}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
