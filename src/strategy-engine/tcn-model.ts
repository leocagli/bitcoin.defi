type TcnConfig = {
  bias?: number;
  scale?: number;
};

export class TCNModel {
  private readonly config: TcnConfig;

  constructor(config?: TcnConfig) {
    this.config = config ?? {};
  }

  predictProba(window64x12: number[][]): number {
    if (!Array.isArray(window64x12) || window64x12.length === 0) {
      return 0.5;
    }

    const flatValues = window64x12.flatMap((row) => row ?? []);
    if (flatValues.length === 0) {
      return 0.5;
    }

    const mean =
      flatValues.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0) /
      flatValues.length;

    const adjusted = (mean + (this.config.bias ?? 0)) * (this.config.scale ?? 1);
    const clipped = Math.max(-20, Math.min(20, adjusted));
    const probability = 1 / (1 + Math.exp(-clipped));
    return Number(probability.toFixed(6));
  }
}
