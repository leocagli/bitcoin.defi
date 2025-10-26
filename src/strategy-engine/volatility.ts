const MIN_SERIES_LENGTH = 2;
const MIN_VOL = 0.0001;

type VolatilityOptions = {
  frequencyMinutes?: number;
  annualizationFactor?: number;
};

const MINUTES_PER_YEAR = 365 * 24 * 60;

export const realizedVolatility = (
  prices: number[],
  options?: VolatilityOptions,
): number => {
  if (!Array.isArray(prices) || prices.length < MIN_SERIES_LENGTH) {
    return MIN_VOL;
  }

  const frequencyMinutes = options?.frequencyMinutes ?? 60;
  const annualizationFactor =
    options?.annualizationFactor ?? Math.sqrt(MINUTES_PER_YEAR / frequencyMinutes);

  const cleanPrices = prices
    .map((value) => (Number.isFinite(value) && value > 0 ? value : undefined))
    .filter((value): value is number => value !== undefined);

  if (cleanPrices.length < MIN_SERIES_LENGTH) {
    return MIN_VOL;
  }

  const logReturns = [];
  for (let index = 1; index < cleanPrices.length; index += 1) {
    const previous = cleanPrices[index - 1];
    const current = cleanPrices[index];
    logReturns.push(Math.log(current / previous));
  }

  if (logReturns.length === 0) {
    return MIN_VOL;
  }

  const mean =
    logReturns.reduce((acc, value) => acc + value, 0) / logReturns.length;

  const variance =
    logReturns.reduce((acc, value) => acc + (value - mean) ** 2, 0) /
    Math.max(1, logReturns.length - 1);

  const volatility = Math.sqrt(variance) * annualizationFactor;
  return Number(Math.max(MIN_VOL, volatility).toFixed(6));
};
