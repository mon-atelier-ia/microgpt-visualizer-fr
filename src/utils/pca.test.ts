import { describe, expect, it } from "vitest";
import { pca2d, cosineSim, topSimilarPairs } from "./pca";

describe("cosineSim", () => {
  it("retourne 1 pour des vecteurs identiques", () => {
    expect(cosineSim([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("retourne ~0 pour des vecteurs orthogonaux", () => {
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("topSimilarPairs", () => {
  it("retourne les paires triées par similarité décroissante", () => {
    const emb = [
      [1, 0],
      [0.9, 0.1],
      [0, 1],
    ]; // 0↔1 très similaires
    const pairs = topSimilarPairs(emb, 2);
    expect(pairs[0][0]).toBe(0);
    expect(pairs[0][1]).toBe(1);
    expect(pairs[0][2]).toBeGreaterThan(0.9);
  });
});

describe("pca2d", () => {
  it("retourne [] pour un tableau vide", () => {
    expect(pca2d([])).toEqual([]);
  });

  it("retourne N points 2D pour N vecteurs d'entrée", () => {
    // M-5: deterministic data (not Math.random)
    const data = Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) => Math.sin(i * 7 + j * 3)),
    );
    const result = pca2d(data);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveLength(2);
  });

  it("projette des données 2D triviales sans perte", () => {
    const data = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [-1, 0, 0, 0],
      [0, -1, 0, 0],
    ];
    const result = pca2d(data);
    const xs = result.map((p) => p[0]);
    const ys = result.map((p) => p[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.5);
  });

  it("gère un seul point sans crash", () => {
    const result = pca2d([[1, 2, 3]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    expect(result[0][0]).toBeCloseTo(0);
    expect(result[0][1]).toBeCloseTo(0);
  });

  it("centre les données (moyenne projetée ≈ 0)", () => {
    // M-5: deterministic data (not Math.random)
    const data = Array.from({ length: 20 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) => Math.sin(i * 13 + j * 7) * 10 - 5),
    );
    const result = pca2d(data);
    const meanX = result.reduce((s, p) => s + p[0], 0) / result.length;
    const meanY = result.reduce((s, p) => s + p[1], 0) / result.length;
    expect(meanX).toBeCloseTo(0, 5);
    expect(meanY).toBeCloseTo(0, 5);
  });
});
