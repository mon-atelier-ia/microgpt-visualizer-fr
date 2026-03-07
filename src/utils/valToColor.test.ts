// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { valToColor } from "./valToColor";

describe("valToColor", () => {
  const green = [100, 200, 50];
  const red = [200, 50, 50];
  const neutral = [128, 128, 128];

  it("v=0 retourne couleur neutre", () => {
    const result = valToColor(0, 1, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
    const m = result.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeCloseTo(128, -1);
    expect(Number(m![2])).toBeCloseTo(128, -1);
    expect(Number(m![3])).toBeCloseTo(128, -1);
  });

  it("v=1 retourne couleur verte", () => {
    const result = valToColor(1, 0.8, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
    const m = result.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    expect(m).not.toBeNull();
    expect(Number(m![4])).toBeCloseTo(0.8);
  });

  it("v=-1 retourne couleur rouge", () => {
    const result = valToColor(-1, 1, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
  });

  it("clamp v > 1", () => {
    const a = valToColor(1, 1, green, red, neutral);
    const b = valToColor(5, 1, green, red, neutral);
    expect(a).toBe(b);
  });

  it("clamp v < -1", () => {
    const a = valToColor(-1, 1, green, red, neutral);
    const b = valToColor(-5, 1, green, red, neutral);
    expect(a).toBe(b);
  });

  it("alpha is included in output", () => {
    const result = valToColor(0.5, 0.3, green, red, neutral);
    expect(result).toContain(",0.3)");
  });

  it("produces valid RGB values (0-255)", () => {
    for (const v of [-1, -0.5, 0, 0.5, 1]) {
      const result = valToColor(v, 1, green, red, neutral);
      const m = result.match(/rgba\((\d+),(\d+),(\d+)/);
      expect(m).not.toBeNull();
      for (let i = 1; i <= 3; i++) {
        const ch = Number(m![i]);
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});
