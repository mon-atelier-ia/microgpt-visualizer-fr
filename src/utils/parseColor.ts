import { oklchToRgb } from "./oklch";

// CSS Color 4 §9.4: oklch( L C H [/ A]? ), each of L C H a number,
// a percentage or `none`; H may carry an angle unit. Minifiers rewrite
// the authored form (Lightning CSS: `oklch(50.2% .128 22.9)`).
const OKLCH_RE = /oklch\(\s*(\S+?)\s+(\S+?)\s+([^\s/)]+)\s*(?:\/\s*[^)]*)?\)/;
const PERCENT_REF = { l: 1, c: 0.4 }; // 100% = 1.0 for L, 0.4 for C
const ANGLE_TO_DEG: Record<string, number> = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 0.9,
  turn: 360,
};

function parseComponent(token: string, percentRef: number): number {
  if (token === "none") return 0;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * percentRef;
  return parseFloat(token);
}

function parseHue(token: string): number {
  if (token === "none") return 0;
  const unit = /[a-z]+$/.exec(token)?.[0];
  return parseFloat(token) * (unit ? (ANGLE_TO_DEG[unit] ?? NaN) : 1);
}

function parseOklch(c: string): [number, number, number] | null {
  const m = OKLCH_RE.exec(c);
  if (!m) return null;
  return [
    parseComponent(m[1], PERCENT_REF.l),
    parseComponent(m[2], PERCENT_REF.c),
    parseHue(m[3]),
  ];
}

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

  const oklch = parseOklch(c);
  if (oklch) return oklchToRgb(...oklch);

  // rgb() / rgba()
  const m = c.match(/(\d+)/g);
  return m
    ? ([Number(m[0]), Number(m[1]), Number(m[2])] as [number, number, number])
    : [128, 128, 128];
}
