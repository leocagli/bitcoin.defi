export type OpenBBAssetSnapshot = {
  asset: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  dominance: number;
};

export type OpenBBFlowSnapshot = {
  venue: string;
  netInflow: number;
  change24h: number;
  utilization: number;
};

export type OpenBBNarrative = {
  title: string;
  subtitle: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
};

export type OpenBBMacroHighlight = {
  label: string;
  value: string;
  detail: string;
};

export const openbbAssets: OpenBBAssetSnapshot[] = [
  {
    asset: 'BTC',
    price: 64321,
    change24h: 1.84,
    change7d: 4.27,
    volume24h: 18.7,
    openInterest: 10.2,
    fundingRate: 0.008,
    dominance: 53.8,
  },
  {
    asset: 'ETH',
    price: 3412,
    change24h: 2.11,
    change7d: 5.62,
    volume24h: 11.4,
    openInterest: 6.1,
    fundingRate: 0.006,
    dominance: 18.1,
  },
  {
    asset: 'SOL',
    price: 182,
    change24h: -0.72,
    change7d: 3.41,
    volume24h: 3.9,
    openInterest: 2.8,
    fundingRate: 0.004,
    dominance: 3.6,
  },
  {
    asset: 'STX',
    price: 2.45,
    change24h: 4.23,
    change7d: 12.18,
    volume24h: 0.81,
    openInterest: 0.23,
    fundingRate: 0.011,
    dominance: 0.6,
  },
];

export const openbbFlows: OpenBBFlowSnapshot[] = [
  {
    venue: 'CME Futures',
    netInflow: 1.82,
    change24h: 0.43,
    utilization: 72,
  },
  {
    venue: 'Binance Perp',
    netInflow: -0.91,
    change24h: -0.37,
    utilization: 64,
  },
  {
    venue: 'Deribit Options',
    netInflow: 0.58,
    change24h: 0.12,
    utilization: 48,
  },
  {
    venue: 'OKX Perp',
    netInflow: -0.37,
    change24h: -0.09,
    utilization: 41,
  },
];

export const openbbNarratives: OpenBBNarrative[] = [
  {
    title: 'BTC Carry Trade',
    subtitle: 'Base positiva y demanda de opciones call',
    description:
      'El diferencial anualizado entre spot y perp se mantiene por encima de 8%, con interés abierto institucional creciendo en CME.',
    metrics: [
      { label: 'Basis 3M', value: '8.4%' },
      { label: 'OI CME', value: '$4.8B' },
      { label: 'Call Skew', value: '+6.1%' },
    ],
  },
  {
    title: 'ETH Restaking Flows',
    subtitle: 'Narrativa de L2 y puntos EigenLayer',
    description:
      'Los depósitos en protocolos de restaking retomaron el ritmo, impulsando la dominancia de ETH y el spread entre staking líquido vs. spot.',
    metrics: [
      { label: 'Restaking TVL', value: '$18.2B' },
      { label: 'Premium LST', value: '0.42%' },
      { label: 'Staking Net', value: '+63k ETH' },
    ],
  },
  {
    title: 'Solana DeFi Rotation',
    subtitle: 'Auge de memecoins y volumen en DEX',
    description:
      'El flujo de traders minoristas migra hacia SOL impulsando fees y actividad en DEX, con funding moderado y oferta en exchanges cayendo.',
    metrics: [
      { label: 'DEX Volume 24h', value: '$1.4B' },
      { label: 'Funding', value: '0.004%' },
      { label: 'Supply on CEX', value: '-2.8%' },
    ],
  },
];

export const openbbMacroHighlights: OpenBBMacroHighlight[] = [
  {
    label: 'DXY',
    value: '103.8',
    detail: 'Debilidad frente a canasta G10, apoya activos de riesgo.',
  },
  {
    label: 'UST 10Y',
    value: '4.21%',
    detail: 'Rendimientos retroceden tras datos de inflación por debajo de lo esperado.',
  },
  {
    label: 'Liquidez global',
    value: '↑ $38B',
    detail: 'Repos de la Fed y balance PBoC sostienen impulso risk-on.',
  },
];
