import type { RiskProfile } from '@/types/ai-signal';

export type RiskProfileSettings = {
  min: number;
  max: number;
  beta: number;
  targetVol: number;
};

export const DEFAULT_DEADBAND = 0.2;

export const PROFILE_SETTINGS: Record<RiskProfile, RiskProfileSettings> = {
  conservador: {
    min: 0,
    max: 0.3,
    beta: 0.7,
    targetVol: 0.12,
  },
  balanceado: {
    min: 0,
    max: 0.5,
    beta: 0.5,
    targetVol: 0.18,
  },
  agresivo: {
    min: 0,
    max: 1,
    beta: 0.2,
    targetVol: 0.28,
  },
};

const DEFAULT_FLOOR_VOL = 0.02;

export const clipWeight = (weight: number, min: number, max: number): number => {
  if (!Number.isFinite(weight)) {
    return min;
  }
  return Math.max(min, Math.min(max, weight));
};

type SizeByProfileOptions = {
  floorVol?: number;
};

export const sizeByProfile = (
  signal: number,
  volEst: number,
  options?: SizeByProfileOptions,
): Record<RiskProfile, number> => {
  const floorVol = options?.floorVol ?? DEFAULT_FLOOR_VOL;
  const effectiveVol = Math.max(floorVol, Math.abs(volEst));

  return Object.entries(PROFILE_SETTINGS).reduce<Record<RiskProfile, number>>(
    (acc, [profile, settings]) => {
      const rawWeight = (settings.targetVol / effectiveVol) * signal;
      acc[profile as RiskProfile] = Number(
        clipWeight(rawWeight, settings.min, settings.max).toFixed(6),
      );
      return acc;
    },
    {
      conservador: 0,
      balanceado: 0,
      agresivo: 0,
    },
  );
};

export const applyOnchainBrake = (
  baseWeights: Record<RiskProfile, number>,
  onchainRisk: number,
): Record<RiskProfile, number> => {
  return (Object.keys(PROFILE_SETTINGS) as RiskProfile[]).reduce<
    Record<RiskProfile, number>
  >((acc, profile) => {
    const settings = PROFILE_SETTINGS[profile];
    const weight = baseWeights[profile] ?? 0;
    const adjusted = weight * (1 - settings.beta * onchainRisk);
    acc[profile] = Number(
      clipWeight(adjusted, settings.min, settings.max).toFixed(6),
    );
    return acc;
  }, {} as Record<RiskProfile, number>);
};

export const labelFromRisk = (value: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (!Number.isFinite(value) || value < 0.33) {
    return 'LOW';
  }
  if (value < 0.66) {
    return 'MEDIUM';
  }
  return 'HIGH';
};
