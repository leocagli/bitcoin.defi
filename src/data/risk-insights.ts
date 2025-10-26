export type OptimizationInsight = {
  id: string;
  title: string;
  description: string;
  recommendations: string[];
  impact: string;
};

export type CoverageProtocol = {
  name: string;
  category: 'On-chain' | 'Seguro' | 'Derivados';
  coverage: string;
  rating: 'Conservador' | 'Balanceado' | 'Agresivo';
  website: string;
  notes: string;
};

export const optimizationInsights: OptimizationInsight[] = [
  {
    id: 'volatility-targeting',
    title: 'Volatility targeting',
    description:
      'Adjust spot and perp exposure based on realized volatility to smooth drawdowns and stabilize Sharpe.',
    recommendations: [
      'Enable adaptive volatility bands (20d and 60d).',
      'Rebalance hourly targeting 15 percent vol.',
      'Layer dynamic hedge trades in perps when implied vol exceeds the 70th percentile.',
    ],
    impact: '+0.8 expected Sharpe / -35% max drawdown',
  },
  {
    id: 'delta-hedging',
    title: 'Delta neutral coverage',
    description:
      'Combine perpetual futures and options to neutralize directional exposure when on-chain flow shows sell pressure.',
    recommendations: [
      'Keep net delta within +/-0.15 during macro events.',
      'Use option spreads to cover tail risk 30 days out.',
      'Prioritise venues with low funding (CME, Deribit) to reduce carry cost.',
    ],
    impact: '-0.6 beta vs BTC / +12% tail risk protection',
  },
  {
    id: 'liquidity-routes',
    title: 'Liquidity and staking routes',
    description:
      'Diversify collateral across Stacks, L2s and yield bearing stablecoins to lower counterparty risk and enhance carry.',
    recommendations: [
      'Allocate 30% to stSTX and LRTs with slashing insurance.',
      'Maintain insured stablecoins (USDC, LUSD) for perp collateral.',
      'Automate rebalances using non-custodial vaults.',
    ],
    impact: '+4.3% base yield / coverage against stable depeg',
  },
];

export const coverageProtocols: CoverageProtocol[] = [
  {
    name: 'Unslashed Finance',
    category: 'Seguro',
    coverage: 'Slashing for staking and exploits in CEX/DeFi venues',
    rating: 'Conservador',
    website: 'https://unslashed.finance',
    notes: 'Tokenised pools with automatic coverage for StxBTC and multi chain LRT staking.',
  },
  {
    name: 'Nexus Mutual',
    category: 'Seguro',
    coverage: 'DeFi protocols, bridges and declared hacks',
    rating: 'Balanceado',
    website: 'https://nexusmutual.io',
    notes: 'Covers vaults and smart contracts used by copy trading strategies.',
  },
  {
    name: 'Etherisc / Chainproof',
    category: 'On-chain',
    coverage: 'Parametric insurance (climate, flight delay, proof of reserves)',
    rating: 'Conservador',
    website: 'https://etherisc.com',
    notes: 'Adds tokenised parametric coverage to real world collateral.',
  },
  {
    name: 'Lyra Finance',
    category: 'Derivados',
    coverage: 'Options based delta/gamma neutral coverage',
    rating: 'Agresivo',
    website: 'https://app.lyra.finance',
    notes: 'Build risk reversals and strangles to defend against extreme moves.',
  },
  {
    name: 'Aevo Options Vaults',
    category: 'Derivados',
    coverage: 'Automated option selling and buying on BTC/ETH',
    rating: 'Balanceado',
    website: 'https://www.aevo.xyz',
    notes: 'Generates covered yield and adjusts delta automatically with vol.',
  },
  {
    name: 'ChainRisk Guard',
    category: 'On-chain',
    coverage: 'Real-time monitoring of whale and bridge flows',
    rating: 'Conservador',
    website: 'https://chainrisk.guard',
    notes: 'Alerts when sell pressure builds so you can reduce exposure or add hedges.',
  },
];
