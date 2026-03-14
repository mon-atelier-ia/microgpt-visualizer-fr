import { oklchToRgb, rgbToOklch } from "./oklch";

export interface ValToColorOpts {
  alpha: number;
  green: number[];
  red: number[];
  neutral: number[];
}

/**
 * Map a value in [-1, 1] to an RGBA color string.
 * Negative → red, positive → green, near-zero → neutral.
 * Interpolates in oklch space for perceptual uniformity.
 */
export function valToColor(v: number, opts: ValToColorOpts): string {
  const { alpha, green, red, neutral } = opts;
  const t = Math.max(-1, Math.min(1, v));
  const base = t < 0 ? red : green;
  const a = Math.abs(t);

  const neutralLch = rgbToOklch(neutral[0], neutral[1], neutral[2]);
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
