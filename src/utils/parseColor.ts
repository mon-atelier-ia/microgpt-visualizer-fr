/**
 * Parse a CSS color string (#hex, rgb(), rgba(), or oklch()) into [r, g, b].
 * oklch values are converted to sRGB and clamped to 0-255.
 */
export function parseColor(c: string): [number, number, number] {
  // #hex (6 digits)
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  // oklch(L C H)
  const oklchMatch = c.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (oklchMatch) {
    return oklchToRgb(
      Number(oklchMatch[1]),
      Number(oklchMatch[2]),
      Number(oklchMatch[3]),
    );
  }

  // rgb() / rgba()
  const m = c.match(/(\d+)/g);
  return m
    ? ([Number(m[0]), Number(m[1]), Number(m[2])] as [number, number, number])
    : [128, 128, 128];
}

/** Convert oklch(L, C, H) to clamped sRGB [r, g, b] (0-255). */
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  // oklch → oklab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // oklab → linear sRGB (via LMS)
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

function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function clampByte(v: number): number {
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
