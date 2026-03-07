import { oklchToRgb } from "./oklch";

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
