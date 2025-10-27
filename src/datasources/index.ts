import type { PerpMetrics } from '@/types/ai-signal';

const DEFAULT_LOOKBACK = 64;
const DEFAULT_FEATURES = 12;
const DEFAULT_FREQUENCY_MINUTES = 60;

const CACHE_TTL_MS = 60_000;

type MarketWindowOptions = {
  lookback?: number;
  featureCount?: number;
  frequencyMinutes?: number;
};

type RecentPriceOptions = {
  lookback?: number;
};

type MarketContextKey = `${string}:${number}:${number}`;

type MarketPoint = {
  time: number;
  price: number;
  volume: number;
};

type FundingPoint = {
  time: number;
  rate: number;
};

type OpenInterestPoint = {
  time: number;
  value: number;
};

type MarketContext = {
  window: number[][];
  prices: number[];
  perpMetrics: PerpMetrics;
  generatedAt: number;
};

type AssetMetadata = {
  coingeckoId: string;
  coingeckoKey: string;
  binanceSymbol: string;
  finvizCode: string;
  pythAsset: string;
};

const ASSET_METADATA: Record<string, AssetMetadata> = {
  BTC: {
    coingeckoId: 'bitcoin',
    coingeckoKey: 'btc',
    binanceSymbol: 'BTCUSDT',
    finvizCode: 'BTC',
    pythAsset: 'BTC',
  },
  ETH: {
    coingeckoId: 'ethereum',
    coingeckoKey: 'eth',
    binanceSymbol: 'ETHUSDT',
    finvizCode: 'ETH',
    pythAsset: 'ETH',
  },
};

const requestCache = new Map<string, { data: unknown; expiry: number }>();
const contextCache = new Map<MarketContextKey, MarketContext>();

type PythModule = typeof import('@/lib/stacks/pyth');

let pythModulePromise: Promise<PythModule> | null = null;

const loadPythModule = async (): Promise<PythModule | null> => {
  if (!pythModulePromise) {
    pythModulePromise = import('@/lib/stacks/pyth');
  }
  try {
    return await pythModulePromise;
  } catch (error) {
    pythModulePromise = null;
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[datasource] Failed to load Pyth module', error);
    }
    return null;
  }
};

const fetchOracleSample = async (asset: string) => {
  try {
    const module = await loadPythModule();
    if (!module) return undefined;
    const sample = await module.getLatestPythPrice(asset);
    return sample ?? undefined;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[datasource] Pyth oracle request failed', error);
    }
    return undefined;
  }
};

const deterministicRandom = (seed: string, index: number): number => {
  const hash = seed
    .split('')
    .reduce((acc, char, charIndex) => acc + char.charCodeAt(0) * (charIndex + 1), 0);
  const value = Math.sin(hash + index * 11.17) * 10000;
  return value - Math.floor(value);
};

const buildMockMarketSeries = (
  asset: string,
  length: number,
  frequencyMinutes: number,
  basePrice?: number,
): MarketPoint[] => {
  const series: MarketPoint[] = [];
  const fallbackBase = 100 + deterministicRandom(`${asset}:price-base`, 0) * 20;
  let price = Number.isFinite(basePrice) && (basePrice ?? 0) > 0 ? (basePrice as number) : fallbackBase;
  const now = Date.now();
  for (let index = 0; index < length; index += 1) {
    const timestamp = now - (length - index) * frequencyMinutes * 60 * 1000;
    const drift = 0.002 * Math.sin(index / 6);
    const noise = (deterministicRandom(`${asset}:price`, index) - 0.5) * 0.02;
    price *= 1 + drift + noise;
    const volumeBase = 1_500_000 + 600_000 * deterministicRandom(`${asset}:volume`, index);
    series.push({
      time: timestamp,
      price: Number(price.toFixed(2)),
      volume: Number(volumeBase.toFixed(2)),
    });
  }
  return series;
};

const buildMockFundingRates = (asset: string, limit: number): FundingPoint[] => {
  const baseTime = Date.now() - limit * 8 * 60 * 60 * 1000;
  return Array.from({ length: limit }).map((_, index) => ({
    time: baseTime + index * 8 * 60 * 60 * 1000,
    rate: Number(((deterministicRandom(`${asset}:funding`, index) - 0.5) * 0.0002).toFixed(6)),
  }));
};

const buildMockOpenInterestHistory = (asset: string, limit: number): OpenInterestPoint[] => {
  const baseTime = Date.now() - limit * 60 * 60 * 1000;
  const baseValue = 75_000 + deterministicRandom(`${asset}:oi-base`, 0) * 5_000;
  return Array.from({ length: limit }).map((_, index) => {
    const variation = (deterministicRandom(`${asset}:oi`, index) - 0.5) * 1_500;
    return {
      time: baseTime + index * 60 * 60 * 1000,
      value: Number((baseValue + variation).toFixed(3)),
    };
  });
};

const buildMockOpenInterestSnapshot = (asset: string) => {
  const variation = (deterministicRandom(`${asset}:oi-snapshot`, 1) - 0.5) * 1_000;
  return {
    openInterest: (78_000 + variation).toFixed(3),
    time: Date.now(),
  };
};

const buildMockPremiumIndex = (asset: string) => {
  const baseIndex = 100_000 + deterministicRandom(`${asset}:index`, 2) * 5_000;
  const basis = (deterministicRandom(`${asset}:basis`, 3) - 0.5) * 0.004;
  const markPrice = baseIndex * (1 + basis);
  return {
    markPrice: markPrice.toFixed(6),
    indexPrice: baseIndex.toFixed(6),
    lastFundingRate: ((deterministicRandom(`${asset}:funding-rate`, 4) - 0.5) * 0.0002).toFixed(6),
    time: Date.now(),
  };
};

const buildMockDominance = (asset: string): number => {
  const key = asset.toUpperCase();
  let base = 0.08;
  if (key.includes('BTC')) {
    base = 0.55;
  } else if (key.includes('ETH')) {
    base = 0.18;
  }
  const noise = (deterministicRandom(`${asset}:dominance`, 5) - 0.5) * 0.02;
  return Math.max(0, Math.min(1, base + noise));
};

const fetchJson = async <T>(
  url: string,
  init?: RequestInit,
  ttlMs = CACHE_TTL_MS,
): Promise<T> => {
  const cached = requestCache.get(url);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'bitcoin.defi/1.0 (ai-risk-managed-strategy)',
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const data = (await response.json()) as T;
  requestCache.set(url, { data, expiry: now + ttlMs });
  return data;
};

const fetchText = async (url: string, ttlMs = CACHE_TTL_MS): Promise<string> => {
  const cached = requestCache.get(url);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.data as string;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'bitcoin.defi/1.0 (ai-risk-managed-strategy)',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const text = await response.text();
  requestCache.set(url, { data: text, expiry: now + ttlMs });
  return text;
};

const resolveAsset = (asset: string): AssetMetadata => {
  const key = asset.toUpperCase();
  const metadata = ASSET_METADATA[key];
  if (!metadata) {
    throw new Error(`Unsupported asset: ${asset}`);
  }
  return metadata;
};

const toHourKey = (timestamp: number): number => Math.floor(timestamp / 3_600_000);

const standardDeviation = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) /
    Math.max(1, values.length - 1);
  return Math.sqrt(variance);
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
};

const fetchCoingeckoMarket = async (
  metadata: AssetMetadata,
  lookback: number,
  frequencyMinutes: number,
) => {
  try {
    const hoursNeeded = lookback + 12;
    const days = Math.max(
      1,
      Math.ceil((hoursNeeded * frequencyMinutes) / (60 * 24)) + 1,
    );
    const url = `https://api.coingecko.com/api/v3/coins/${metadata.coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
    const data = await fetchJson<{
      prices: [number, number][];
      total_volumes: [number, number][];
    }>(url, undefined, 30_000);

    const series: MarketPoint[] = data.prices.map(([time, price], index) => {
      const volumePair = data.total_volumes[index] ?? data.total_volumes[data.total_volumes.length - 1];
      const volume = volumePair ? volumePair[1] : 0;
      return { time, price, volume };
    });

    return series;
  } catch (error) {
    console.warn('[datasource] Coingecko market fetch failed, using fallback', error);
    const oracleSample = await fetchOracleSample(metadata.pythAsset);
    const anchor = oracleSample?.normalizedPrice;
    return buildMockMarketSeries(metadata.binanceSymbol, lookback + 1, frequencyMinutes, anchor);
  }
};

const fetchFundingRates = async (metadata: AssetMetadata, limit: number) => {
  try {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${metadata.binanceSymbol}&limit=${limit}`;
    const data = await fetchJson<
      { fundingTime: number; fundingRate: string; markPrice: string }[]
    >(url);

    return data.map((entry) => ({
      time: entry.fundingTime,
      rate: Number(entry.fundingRate),
    })) satisfies FundingPoint[];
  } catch (error) {
    console.warn('[datasource] Funding rate fetch failed, using fallback', error);
    return buildMockFundingRates(metadata.binanceSymbol, limit);
  }
};

const fetchOpenInterestHistory = async (metadata: AssetMetadata, limit: number) => {
  try {
    const url = `https://fapi.binance.com/futures/data/openInterestHist?symbol=${metadata.binanceSymbol}&period=1h&limit=${limit}`;
    const data = await fetchJson<
      { timestamp: number; sumOpenInterest: string }[]
    >(url);

    return data.map((entry) => ({
      time: entry.timestamp,
      value: Number(entry.sumOpenInterest),
    })) satisfies OpenInterestPoint[];
  } catch (error) {
    console.warn('[datasource] Open interest history fetch failed, using fallback', error);
    return buildMockOpenInterestHistory(metadata.binanceSymbol, limit);
  }
};

const fetchOpenInterestSnapshot = async (metadata: AssetMetadata) => {
  try {
    const url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${metadata.binanceSymbol}`;
    return await fetchJson<{ openInterest: string; time: number }>(url);
  } catch (error) {
    console.warn('[datasource] Open interest snapshot fetch failed, using fallback', error);
    return buildMockOpenInterestSnapshot(metadata.binanceSymbol);
  }
};

const fetchPremiumIndex = async (metadata: AssetMetadata) => {
  try {
    const url = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${metadata.binanceSymbol}`;
    return await fetchJson<{
      markPrice: string;
      indexPrice: string;
      lastFundingRate: string;
      time: number;
    }>(url);
  } catch (error) {
    console.warn('[datasource] Premium index fetch failed, using fallback', error);
    return buildMockPremiumIndex(metadata.binanceSymbol);
  }
};

const fetchDominance = async (metadata: AssetMetadata) => {
  try {
    const url = 'https://api.coingecko.com/api/v3/global';
    const data = await fetchJson<{
      data: {
        market_cap_percentage: Record<string, number>;
      };
    }>(url, undefined, 30_000);
    const dominance = data.data.market_cap_percentage[metadata.coingeckoKey] ?? 0;
    return dominance / 100;
  } catch (error) {
    console.warn('[datasource] Global dominance fetch failed, using fallback', error);
    return buildMockDominance(metadata.binanceSymbol);
  }
};

const fetchFinvizPerformance = async (metadata: AssetMetadata) => {
  try {
    const html = await fetchText('https://finviz.com/crypto_performance.ashx?v=110', 300_000);
    const match = html.match(/var performance = (\{[\s\S]*?\});/);
    if (!match) {
      return 0;
    }
    const performanceMap = JSON.parse(match[1]) as Record<string, number>;
    const key = metadata.finvizCode;
    const value = performanceMap[key];
    return Number.isFinite(value) ? value / 100 : 0;
  } catch (error) {
    console.warn('[datasource] Finviz performance fetch failed', error);
    return 0;
  }
};

const buildMarketContext = async (
  asset: string,
  lookback: number,
  featureCount: number,
  frequencyMinutes: number,
): Promise<MarketContext> => {
  const metadata = resolveAsset(asset);
  const cacheKey: MarketContextKey = `${metadata.binanceSymbol}:${lookback}:${frequencyMinutes}`;
  const cached = contextCache.get(cacheKey);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return cached;
  }

  const [
    marketSeries,
    fundingSeries,
    openInterestSeries,
    openInterestSnapshot,
    premiumIndex,
    dominance,
    finvizPerf,
    oracleSample,
  ] =
    await Promise.all([
      fetchCoingeckoMarket(metadata, lookback, frequencyMinutes),
      fetchFundingRates(metadata, Math.max(lookback, 64)),
      fetchOpenInterestHistory(metadata, Math.max(lookback + 5, 64)),
      fetchOpenInterestSnapshot(metadata),
      fetchPremiumIndex(metadata),
      fetchDominance(metadata),
      fetchFinvizPerformance(metadata),
      fetchOracleSample(metadata.pythAsset),
    ]);

  const targetLength = lookback + 1;
  const marketPoints = marketSeries.slice(-targetLength);
  const prices = marketPoints.map((point) => point.price);
  const volumes = marketPoints.map((point) => point.volume);

  const fundingMap = new Map<number, number>();
  fundingSeries.forEach((point) => fundingMap.set(toHourKey(point.time), point.rate));

  const openInterestMap = new Map<number, number>();
  openInterestSeries.forEach((point) => openInterestMap.set(toHourKey(point.time), point.value));

  const logReturns: number[] = [];
  for (let index = 1; index < prices.length; index += 1) {
    const prev = prices[index - 1];
    const current = prices[index];
    logReturns.push(Math.log(current / prev));
  }

  const averageVolume = average(volumes);
  const volumeStd = standardDeviation(volumes);
  const openInterestValues = [...openInterestMap.values()];
  const openInterestAvg = openInterestValues.length ? average(openInterestValues) : 0;
  const openInterestStd = openInterestValues.length ? standardDeviation(openInterestValues) : 0;

  const fundingSeriesSorted = fundingSeries.sort((a, b) => a.time - b.time);
  const latestFundingRate =
    fundingSeriesSorted[fundingSeriesSorted.length - 1]?.rate ??
    Number(premiumIndex.lastFundingRate) ??
    0;

  const basis =
    Number(premiumIndex.indexPrice) === 0
      ? 0
      : (Number(premiumIndex.markPrice) - Number(premiumIndex.indexPrice)) /
        Number(premiumIndex.indexPrice);

  const window: number[][] = [];

  for (let index = 1; index < marketPoints.length; index += 1) {
    const current = marketPoints[index];
    const previous = marketPoints[index - 1];

    const logReturn = Math.log(current.price / previous.price);
    const simpleReturn = current.price / previous.price - 1;
    const rollingReturnsWindow = logReturns.slice(Math.max(0, index - 12), index);
    const rollingVol = standardDeviation(rollingReturnsWindow) * Math.sqrt(60 / frequencyMinutes);

    const volumeZ =
      volumeStd > 0 ? (current.volume - averageVolume) / volumeStd : 0;

    const hourKey = toHourKey(current.time);
    const fundingRate = fundingMap.get(hourKey) ?? fundingSeriesSorted[fundingSeriesSorted.length - 1]?.rate ?? 0;
    const prevFundingRate = fundingMap.get(hourKey - 1) ?? fundingRate;
    const fundingDelta = fundingRate - prevFundingRate;

    const openInterestValue =
      openInterestMap.get(hourKey) ??
      Number(openInterestSnapshot.openInterest) ??
      openInterestAvg;
    const prevOpenInterestValue = openInterestMap.get(hourKey - 1) ?? openInterestValue;

    const openInterestChange =
      prevOpenInterestValue !== 0
        ? (openInterestValue - prevOpenInterestValue) / prevOpenInterestValue
        : 0;
    const openInterestZ =
      openInterestStd > 0 ? (openInterestValue - openInterestAvg) / openInterestStd : 0;

    const priceMomentumWindow = prices.slice(Math.max(0, index - 6), index);
    const priceMomentumAvg = priceMomentumWindow.length
      ? average(priceMomentumWindow)
      : previous.price;
    const priceMomentum =
      priceMomentumAvg !== 0 ? (current.price - priceMomentumAvg) / priceMomentumAvg : 0;

    const volatilityScaled = rollingVol;
    const fundingScaled = fundingRate;

    const featureVector = [
      Number(logReturn.toFixed(6)),
      Number(simpleReturn.toFixed(6)),
      Number(volatilityScaled.toFixed(6)),
      Number(volumeZ.toFixed(6)),
      Number(fundingScaled.toFixed(6)),
      Number(fundingDelta.toFixed(6)),
      Number(openInterestChange.toFixed(6)),
      Number(openInterestZ.toFixed(6)),
      Number(basis.toFixed(6)),
      Number(dominance.toFixed(6)),
      Number(finvizPerf.toFixed(6)),
      Number(priceMomentum.toFixed(6)),
    ];

    if (featureVector.length > featureCount) {
      window.push(featureVector.slice(0, featureCount));
    } else if (featureVector.length < featureCount) {
      window.push([
        ...featureVector,
        ...Array.from({ length: featureCount - featureVector.length }, () => 0),
      ]);
    } else {
      window.push(featureVector);
    }
  }

  const fallbackPrice = prices.length ? prices[prices.length - 1] : undefined;
  const oracleSource = oracleSample ? ('pyth' as const) : ('mock' as const);
  const oraclePrice = oracleSample?.normalizedPrice ?? fallbackPrice;
  const oracleConfidence = oracleSample
    ? oracleSample.conf * Math.pow(10, oracleSample.expo)
    : undefined;
  const oracleUpdatedAt =
    oracleSample?.updatedAtIso ??
    (marketPoints.length
      ? new Date(marketPoints[marketPoints.length - 1].time).toISOString()
      : undefined);

  const perpMetrics: PerpMetrics = {
    asset,
    fundingRate: Number(latestFundingRate.toFixed(6)),
    openInterestChange: Number(
      (openInterestValues.length > 1
        ? (openInterestValues[openInterestValues.length - 1] -
            openInterestValues[openInterestValues.length - 2]) /
          openInterestValues[openInterestValues.length - 2]
        : 0
      ).toFixed(6),
    ),
    openInterest: Number(Number(openInterestSnapshot.openInterest).toFixed(2)),
    basis: Number(basis.toFixed(6)),
    hourlyVolume: Math.round(marketPoints[marketPoints.length - 1]?.volume ?? 0),
    timestamp: new Date().toISOString(),
    oraclePrice,
    oracleConfidence,
    oracleSource,
    oracleUpdatedAt,
  };

  const context: MarketContext = {
    window: window.slice(-lookback),
    prices: prices.slice(-lookback),
    perpMetrics,
    generatedAt: Date.now(),
  };

  contextCache.set(cacheKey, context);
  return context;
};

export const getMarketWindow = async (
  asset: string,
  options?: MarketWindowOptions,
): Promise<number[][]> => {
  const lookback = options?.lookback ?? DEFAULT_LOOKBACK;
  const featureCount = options?.featureCount ?? DEFAULT_FEATURES;
  const frequencyMinutes = options?.frequencyMinutes ?? DEFAULT_FREQUENCY_MINUTES;
  const context = await buildMarketContext(asset, lookback, featureCount, frequencyMinutes);
  return context.window;
};

export const getRecentPrices = async (
  asset: string,
  options?: number | RecentPriceOptions,
): Promise<number[]> => {
  const lookback =
    typeof options === 'number'
      ? options
      : options?.lookback ?? DEFAULT_LOOKBACK;
  const featureCount = DEFAULT_FEATURES;
  const frequencyMinutes = DEFAULT_FREQUENCY_MINUTES;
  const context = await buildMarketContext(asset, lookback, featureCount, frequencyMinutes);
  return context.prices.slice(-lookback);
};

export const getPerpMetrics = async (
  asset: string,
): Promise<PerpMetrics> => {
  const lookback = DEFAULT_LOOKBACK;
  const featureCount = DEFAULT_FEATURES;
  const frequencyMinutes = DEFAULT_FREQUENCY_MINUTES;
  const context = await buildMarketContext(asset, lookback, featureCount, frequencyMinutes);
  return context.perpMetrics;
};
