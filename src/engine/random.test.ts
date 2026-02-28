import { describe, it, expect } from "vitest";
import { createRng } from "./random";

describe("random — smoke tests", () => {
  it("createRng is deterministic: same seed produces same sequence", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
    // All values in [0, 1)
    seq1.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });
});
