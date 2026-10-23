export function normalizeMoodScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > 10) {
    return null;
  }

  return value <= 3 ? value : 1 + ((value - 1) * 2) / 9;
}
