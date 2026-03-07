import { describe, expect, it } from "vitest";
import { oklchToRgb, rgbToOklch } from "./oklch";

describe("oklch conversions", () => {
  describe("round-trip oklch→RGB→oklch", () => {
    const cases: [string, number, number, number][] = [
      ["gris moyen", 0.5, 0, 0],
      ["rouge saturé", 0.6, 0.15, 30],
      ["vert saturé", 0.7, 0.15, 150],
      ["bleu saturé", 0.5, 0.2, 270],
      ["jaune vif", 0.8, 0.15, 100],
      ["noir", 0, 0, 0],
      ["blanc", 1, 0, 0],
      ["faible chroma", 0.65, 0.02, 90],
    ];

    for (const [name, L, C, H] of cases) {
      it(`${name} (L=${L} C=${C} H=${H})`, () => {
        const [r, g, b] = oklchToRgb(L, C, H);
        const [L2, C2, H2] = rgbToOklch(r, g, b);
        // L precision: sRGB quantization (8-bit) limits round-trip to ~0.01
        expect(L2).toBeCloseTo(L, 1);
        // C precision: achromatic or low-chroma may shift hue (irrelevant)
        if (C > 0.01) {
          expect(C2).toBeCloseTo(C, 1);
          // Hue: only meaningful when chroma > 0
          const hDiff = Math.abs(H2 - H);
          const hDiffNorm = Math.min(hDiff, 360 - hDiff);
          expect(hDiffNorm).toBeLessThan(5);
        }
      });
    }
  });

  describe("parité visuelle hex→oklch (valeurs de styles.css)", () => {
    // Each pair: [original hex RGB, oklch from styles.css]
    // oklchToRgb must produce RGB within ±1 of the original hex
    const palette: [
      string,
      [number, number, number],
      [number, number, number],
    ][] = [
      ["dark --bg", [24, 24, 22], [0.208, 0.004, 106.7]],
      ["dark --surface", [34, 34, 32], [0.251, 0.004, 106.7]],
      ["dark --text", [205, 200, 190], [0.834, 0.015, 84.6]],
      ["dark --text-dim", [149, 144, 130], [0.654, 0.021, 90.6]],
      ["dark --blue", [194, 139, 78], [0.678, 0.103, 67.4]],
      ["dark --green", [138, 170, 107], [0.698, 0.094, 130.4]],
      ["dark --red", [191, 106, 99], [0.619, 0.11, 25.7]],
      ["light --bg", [245, 241, 234], [0.959, 0.01, 81.8]],
      ["light --surface", [255, 253, 248], [0.994, 0.007, 88.6]],
      ["light --text", [44, 42, 37], [0.285, 0.009, 88.8]],
      ["light --green", [82, 122, 52], [0.533, 0.109, 133.6]],
      ["light --red", [160, 64, 64], [0.502, 0.128, 22.9]],
    ];

    for (const [name, hexRgb, lch] of palette) {
      it(`${name}: oklch → RGB ≈ hex original (±1)`, () => {
        const [r, g, b] = oklchToRgb(lch[0], lch[1], lch[2]);
        expect(Math.abs(r - hexRgb[0])).toBeLessThanOrEqual(1);
        expect(Math.abs(g - hexRgb[1])).toBeLessThanOrEqual(1);
        expect(Math.abs(b - hexRgb[2])).toBeLessThanOrEqual(1);
      });
    }
  });
});
