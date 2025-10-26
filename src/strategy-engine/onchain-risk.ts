const RISK_CACHE_TTL_MS = 5 * 60_000;

type CacheEntry = {
  value: number;
  expiry: number;
};

const riskCache = new Map<string, CacheEntry>();

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const computeFallbackRisk = (asset: string): number => {
  const hash = asset
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 11), 0);
  const oscillation = Math.sin(Date.now() / 3_600_000 + hash * 0.001);
  const normalized = 0.35 + oscillation * 0.2;
  return Number(clamp01(normalized).toFixed(4));
};

const parseChainalysisRisk = (payload: unknown): number | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const directRisk = (payload as { risk?: unknown }).risk;
  if (typeof directRisk === 'number' && Number.isFinite(directRisk)) {
    return clamp01(directRisk);
  }

  const nestedData = (payload as { data?: unknown }).data;
  if (nestedData && typeof nestedData === 'object') {
    const nestedRisk = (nestedData as { risk?: unknown }).risk;
    if (typeof nestedRisk === 'number' && Number.isFinite(nestedRisk)) {
      return clamp01(nestedRisk);
    }
    const inflow = (nestedData as { inflow?: unknown }).inflow;
    const baseline = (nestedData as { baseline?: unknown }).baseline;
    if (typeof inflow === 'number' && typeof baseline === 'number' && baseline > 0) {
      return clamp01(inflow / (baseline * 3));
    }
  }

  const metrics = (payload as { metrics?: unknown }).metrics;
  if (metrics && typeof metrics === 'object') {
    const inflow = (metrics as { inflow?: unknown }).inflow;
    const baseline = (metrics as { baseline?: unknown }).baseline;
    if (typeof inflow === 'number' && typeof baseline === 'number' && baseline > 0) {
      return clamp01(inflow / (baseline * 3));
    }
  }

  return null;
};

const fetchChainalysisRisk = async (asset: string): Promise<number | null> => {
  const apiKey = process.env.CHAINALYSIS_API_KEY;
  const endpointTemplate = process.env.CHAINALYSIS_RISK_ENDPOINT;

  if (!apiKey || !endpointTemplate) {
    return null;
  }

  const endpoint = endpointTemplate.replace('{asset}', asset.toLowerCase());

  const response = await fetch(endpoint, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Chainalysis risk endpoint failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const parsed = parseChainalysisRisk(payload);
  return parsed;
};

export const fetchOnchainRisk = async (asset: string): Promise<number> => {
  const cached = riskCache.get(asset);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.value;
  }

  try {
    const remoteRisk = await fetchChainalysisRisk(asset);
    if (remoteRisk !== null) {
      riskCache.set(asset, { value: Number(remoteRisk.toFixed(4)), expiry: now + RISK_CACHE_TTL_MS });
      return Number(remoteRisk.toFixed(4));
    }
  } catch (error) {
    console.warn('[onchain-risk] Chainalysis request failed, using fallback', error);
  }

  const fallback = computeFallbackRisk(asset);
  riskCache.set(asset, { value: fallback, expiry: now + RISK_CACHE_TTL_MS });
  return fallback;
};
