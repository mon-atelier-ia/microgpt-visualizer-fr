import { oklchToRgb, rgbToOklch } from "./oklch";

/**
 * Map a value in [-1, 1] to an RGBA color string.
 * Negative → redRgb, positive → greenRgb, near-zero → neutralRgb.
 * Interpolates in oklch space for perceptual uniformity.
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

  const neutralLch = rgbToOklch(neutralRgb[0], neutralRgb[1], neutralRgb[2]);
  const baseLch = rgbToOklch(base[0], base[1], base[2]);

  const L = neutralLch[0] * (1 - a) + baseLch[0] * a;
  const C = neutralLch[1] * (1 - a) + baseLch[1] * a;

  // Hue interpolation: shorter arc; if neutral is achromatic, take base hue
  let H: number;
  if (neutralLch[1] < 0.001) {
    H = baseLch[2];
  } else if (baseLch[1] < 0.001) {
    H = neutralLch[2];
  } else {
    let diff = baseLch[2] - neutralLch[2];
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    H = neutralLch[2] + diff * a;
  }

  const [r, g, b] = oklchToRgb(L, C, H);
  return `rgba(${r},${g},${b},${alpha})`;
}
