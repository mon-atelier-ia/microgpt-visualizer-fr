// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { classifyHead } from "./classifyHead";

/** Build T×T lower-triangular matrix from a per-row generator. */
function buildMatrix(T: number, gen: (i: number) => number[]): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < T; i++) {
    const row = new Array(T).fill(0);
    const weights = gen(i);
    for (let j = 0; j < weights.length && j <= i; j++) row[j] = weights[j];
    m.push(row);
  }
  return m;
}

describe("classifyHead", () => {
  it('returns "Contexte" for single-token matrix', () => {
    expect(classifyHead([[1.0]])).toBe("Contexte");
  });

  it('returns "Précédent" when previous token dominates', () => {
    // Each row i>0: 70% on i-1, 30% spread
    const m = buildMatrix(5, (i) => {
      if (i === 0) return [1.0];
      const row = new Array(i + 1).fill(0.3 / i || 0);
      row[i - 1] = 0.7;
      return row;
    });
    expect(classifyHead(m)).toBe("Précédent");
  });

  it('returns "Ancrage" when BOS and self are strong', () => {
    // Each row i>0: 40% BOS, 30% self, 30% spread
    const m = buildMatrix(5, (i) => {
      if (i === 0) return [1.0];
      const row = new Array(i + 1).fill(0);
      row[0] = 0.4;
      row[i] = 0.3;
      const rest = 0.3 / Math.max(i - 1, 1);
      for (let j = 1; j < i; j++) row[j] = rest;
      return row;
    });
    expect(classifyHead(m)).toBe("Ancrage");
  });

  it('returns "Contexte" when attention is uniformly spread', () => {
    // Uniform attention across all visible positions
    const m = buildMatrix(8, (i) => {
      if (i === 0) return [1.0];
      return new Array(i + 1).fill(1.0 / (i + 1));
    });
    expect(classifyHead(m)).toBe("Contexte");
  });
});
