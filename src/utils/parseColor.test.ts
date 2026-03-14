import { describe, expect, it } from "vitest";
import { parseColor } from "./parseColor";

function expectValidRgb(rgb: number[]) {
  for (const ch of rgb) {
    expect(ch).toBeGreaterThanOrEqual(0);
    expect(ch).toBeLessThanOrEqual(255);
  }
}

describe("parseColor", () => {
  it("parse hex 6 caractères", () => {
    expect(parseColor("#67e8f9")).toEqual([103, 232, 249]);
  });

  it("parse rgb()", () => {
    expect(parseColor("rgb(100, 200, 50)")).toEqual([100, 200, 50]);
  });

  it("parse rgba() — ignore alpha", () => {
    expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual([10, 20, 30]);
  });

  it("hex 3 caractères produit NaN (non supporté — CSS computed retourne toujours rgb())", () => {
    const result = parseColor("#fff");
    expect(Number.isNaN(result[2])).toBe(true);
  });

  it("fallback pour chaîne vide", () => {
    expect(parseColor("")).toEqual([128, 128, 128]);
  });

  it("parse oklch() basique", () => {
    // oklch(0.7 0.15 150) ≈ sRGB (76, 184, 106)
    const [r, g, b] = parseColor("oklch(0.7 0.15 150)");
    expect(r).toBeGreaterThanOrEqual(60);
    expect(r).toBeLessThanOrEqual(90);
    expect(g).toBeGreaterThanOrEqual(170);
    expect(g).toBeLessThanOrEqual(200);
    expect(b).toBeGreaterThanOrEqual(90);
    expect(b).toBeLessThanOrEqual(120);
  });

  it("parse oklch() avec espaces variés", () => {
    expectValidRgb(parseColor("oklch(0.5 0.2 30)"));
  });

  it("parse oklch() achromatic (C=0)", () => {
    const [r, g, b] = parseColor("oklch(0.5 0 0)");
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBeGreaterThanOrEqual(95);
    expect(r).toBeLessThanOrEqual(125);
  });

  it("parse oklch() noir (L=0)", () => {
    expect(parseColor("oklch(0 0 0)")).toEqual([0, 0, 0]);
  });

  it("parse oklch() blanc (L=1)", () => {
    const [r, g, b] = parseColor("oklch(1 0 0)");
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it("parse oklch() clamp out-of-gamut", () => {
    expectValidRgb(parseColor("oklch(0.9 0.4 150)"));
  });
});
