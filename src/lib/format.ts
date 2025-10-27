export function formatUsd(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1_000_000 ? 0 : 2,
  }).format(value);
}

export function formatPercentage(value: number, fractionDigits = 1) {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatRiskLevel(level: 'baja' | 'media' | 'alta') {
  const map = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
  } as const;
  return map[level];
}

export function truncateAddress(address?: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
