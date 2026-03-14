// ── PCA Scatter Plot — shared constants & helpers ──────────────────

export const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
export const DOT_RADIUS = 12;
export const BOS_RADIUS = 15;
export const PAD = 50;
export const INTERP_MS = 200;
export const GHOST_MAX = 5;
export const CONSTELLATION_K = 80;
export const HOVER_THRESHOLD = 30;
export const IO_THRESHOLD = 0.3;

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function sameType(a: string, b: string): boolean {
  if (a === "BOS" || b === "BOS") return a === b;
  return VOWELS.has(a) === VOWELS.has(b);
}

export type RGB = [number, number, number];

export function dotRgb(
  ch: string,
  c: { cyanRgb: RGB; orangeRgb: RGB; purpleRgb: RGB },
): RGB {
  if (ch === "BOS") return c.purpleRgb;
  if (VOWELS.has(ch)) return c.cyanRgb;
  return c.orangeRgb;
}
