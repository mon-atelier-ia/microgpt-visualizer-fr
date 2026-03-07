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

/** Convert sRGB (0-255) to oklch [L, C, H]. */
function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(a * a + bVal * bVal);
  const H = ((Math.atan2(bVal, a) * 180) / Math.PI + 360) % 360;

  return [L, C, H];
}

/** Convert oklch to clamped sRGB [r, g, b] (0-255). */
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [
    clampByte(linearToSrgb(lr)),
    clampByte(linearToSrgb(lg)),
    clampByte(linearToSrgb(lb)),
  ];
}

function srgbToLinear(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function clampByte(v: number): number {
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
