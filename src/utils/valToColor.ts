/**
 * Map a value in [-1, 1] to an RGBA color string.
 * Negative → redRgb, positive → greenRgb, near-zero → neutralRgb.
 */
export function valToColor(
  v: number,
  alpha: number,
  greenRgb: number[],
  redRgb: number[],
  neutralRgb: number[],
): string {
  const t = Math.max(-1, Math.min(1, v));
  const base = t < 0 ? redRgb : greenRgb;
  const a = Math.abs(t);
  const r = Math.round(neutralRgb[0] * (1 - a) + base[0] * a);
  const g = Math.round(neutralRgb[1] * (1 - a) + base[1] * a);
  const b = Math.round(neutralRgb[2] * (1 - a) + base[2] * a);
  return `rgba(${r},${g},${b},${alpha})`;
}
