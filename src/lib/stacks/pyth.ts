import { hexToBytes } from '@stacks/common';
import { bufferCV, cvToJSON, fetchCallReadOnlyFunction } from '@stacks/transactions';

import {
  getStacksEnvironment,
  getStacksNetwork,
  type NetworkEnvironment,
} from './network';

const CACHE_TTL_MS = 60_000;
const DEFAULT_OPTIONAL_FUNCTION = 'get-price';
const DEFAULT_SENDER =
  process.env.PYTH_SENDER_ADDRESS ?? 'SP000000000000000000002Q6VF78';

const DEFAULT_FEED_IDS: Record<string, string> = {
  BTC: '0xe62df6c8b6684ffaa80fe627f9a339b0a8e7f0ede1bba9c0b566b0b6c3f0961a',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
};

type CacheEntry = {
  expiresAt: number;
  data?: OraclePriceSample;
};

const priceCache = new Map<string, CacheEntry>();

export type OraclePriceSample = {
  asset: string;
  feedId: string;
  price: number;
  conf: number;
  expo: number;
  normalizedPrice: number;
  publishTime: number;
  updatedAtIso: string;
  source: 'pyth';
};

const resolveContractAddress = (env: NetworkEnvironment): string | undefined => {
  if (process.env.PYTH_CONTRACT_ADDRESS) return process.env.PYTH_CONTRACT_ADDRESS;
  if (env === 'testnet' && process.env.PYTH_CONTRACT_ADDRESS_TESTNET) {
    return process.env.PYTH_CONTRACT_ADDRESS_TESTNET;
  }
  if (env === 'mainnet' && process.env.PYTH_CONTRACT_ADDRESS_MAINNET) {
    return process.env.PYTH_CONTRACT_ADDRESS_MAINNET;
  }
  return undefined;
};

const resolveContractName = (): string =>
  process.env.PYTH_CONTRACT_NAME ?? 'pyth-oracle-v1';

const resolveFunctionName = (): string =>
  process.env.PYTH_CONTRACT_FUNCTION ?? DEFAULT_OPTIONAL_FUNCTION;

const resolveFeedId = (asset: string): string | undefined => {
  const envKey = `PYTH_FEED_ID_${asset.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey] as string;
  return DEFAULT_FEED_IDS[asset.toUpperCase()];
};

const sanitiseHex = (value: string): string => {
  return value.startsWith('0x') || value.startsWith('0X')
    ? value.slice(2)
    : value;
};

const toCacheKey = (asset: string, feedId: string, env: NetworkEnvironment) =>
  `${env}:${asset}:${feedId}`;

const parseOracleTuple = (raw: unknown): OraclePriceSample | undefined => {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('value' in raw) ||
    typeof raw.value !== 'object'
  ) {
    return undefined;
  }

  const tuple =
    // @ts-expect-error -- cvToJSON typing is generic; runtime structure validated below
    (raw.value?.value ?? raw.value) ?? undefined;
  if (!tuple || typeof tuple !== 'object') {
    return undefined;
  }

  const getNumber = (key: string): number | undefined => {
    const entry = tuple[key] ?? tuple[key.replace(/-/g, '_')];
    if (!entry || typeof entry !== 'object' || !('value' in entry)) return undefined;
    const value = Number(entry.value);
    return Number.isFinite(value) ? value : undefined;
  };

  const feedId =
    typeof tuple.feed_id?.value === 'string'
      ? tuple.feed_id.value
      : undefined;

  const price = getNumber('price');
  const conf = getNumber('conf') ?? 0;
  const expo = getNumber('expo');
  const publishTime =
    getNumber('publish_time') ?? getNumber('publish-time') ?? getNumber('timestamp');

  if (
    price === undefined ||
    expo === undefined ||
    publishTime === undefined
  ) {
    return undefined;
  }

  const power = Number.isFinite(expo) ? Math.pow(10, expo) : 1;
  return {
    asset: 'UNKNOWN',
    feedId: feedId ?? 'unknown',
    price,
    conf,
    expo,
    normalizedPrice: price * power,
    publishTime,
    updatedAtIso: new Date(publishTime * 1000).toISOString(),
    source: 'pyth' as const,
  };
};

export const getLatestPythPrice = async (
  asset: string,
  envOverride?: NetworkEnvironment,
): Promise<OraclePriceSample | undefined> => {
  const feedId = resolveFeedId(asset);
  if (!feedId) {
    return undefined;
  }

  const environment = envOverride ?? getStacksEnvironment();
  const contractAddress = resolveContractAddress(environment);
  if (!contractAddress) {
    return undefined;
  }

  const cacheKey = toCacheKey(asset, feedId, environment);
  const cached = priceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const contractName = resolveContractName();
  const functionName = resolveFunctionName();
  const network = getStacksNetwork(environment);

  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName,
      functionArgs: [bufferCV(hexToBytes(sanitiseHex(feedId)))],
      network,
      senderAddress: DEFAULT_SENDER,
    });

    const parsed = parseOracleTuple(cvToJSON(result));
    if (!parsed) {
      priceCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS });
      return undefined;
    }

    const sample: OraclePriceSample = {
      ...parsed,
      asset,
      feedId,
    };

    priceCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: sample,
    });
    return sample;
  } catch (error) {
    console.error('[pyth] failed to fetch price', {
      asset,
      feedId,
      error,
    });
    priceCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS });
    return undefined;
  }
};
