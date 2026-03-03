import { describe, expect, it } from "vitest";
import { parseColor } from "./parseColor";

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
});
