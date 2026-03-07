// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseColor } from "./parseColor";

/** Calculate relative luminance per WCAG 2.1. */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate contrast ratio between two colors. */
function contrastRatio(
  c1: [number, number, number],
  c2: [number, number, number],
): number {
  const l1 = relativeLuminance(...c1);
  const l2 = relativeLuminance(...c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA contrast (4.5:1 text, 3:1 large/UI)", () => {
  // Dark theme pairs — values from styles.css
  const darkBg = parseColor("oklch(0.208 0.004 106.7)");
  const darkText = parseColor("oklch(0.834 0.015 84.6)");
  const darkTextDim = parseColor("oklch(0.654 0.021 90.6)");
  const darkSurface = parseColor("oklch(0.251 0.004 106.7)");

  it("dark: --text sur --bg >= 4.5:1", () => {
    expect(contrastRatio(darkText, darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark: --text-dim sur --bg >= 3:1", () => {
    expect(contrastRatio(darkTextDim, darkBg)).toBeGreaterThanOrEqual(3);
  });

  it("dark: --text sur --surface >= 4.5:1", () => {
    expect(contrastRatio(darkText, darkSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark: --text-dim sur --surface >= 3:1", () => {
    expect(contrastRatio(darkTextDim, darkSurface)).toBeGreaterThanOrEqual(3);
  });

  // Light theme pairs
  const lightBg = parseColor("oklch(0.959 0.01 81.8)");
  const lightText = parseColor("oklch(0.285 0.009 88.8)");
  const lightTextDim = parseColor("oklch(0.509 0.014 79.7)");
  const lightSurface = parseColor("oklch(0.994 0.007 88.6)");

  it("light: --text sur --bg >= 4.5:1", () => {
    expect(contrastRatio(lightText, lightBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("light: --text-dim sur --bg >= 3:1", () => {
    expect(contrastRatio(lightTextDim, lightBg)).toBeGreaterThanOrEqual(3);
  });

  it("light: --text sur --surface >= 4.5:1", () => {
    expect(contrastRatio(lightText, lightSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("light: --text-dim sur --surface >= 3:1", () => {
    expect(contrastRatio(lightTextDim, lightSurface)).toBeGreaterThanOrEqual(3);
  });
});
