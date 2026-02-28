// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { computeCharStats } from "./charStats";

const docs = ["emma", "lea", "pierre", "anna", "lena"];

describe("computeCharStats", () => {
  const stats = computeCharStats(docs);

  it("has entry for each unique char in corpus", () => {
    expect(stats.has("e")).toBe(true);
    expect(stats.has("z")).toBe(false);
  });

  it("counts name frequency correctly", () => {
    const e = stats.get("e")!;
    expect(e.nameCount).toBe(4);
    expect(e.totalNames).toBe(5);
    expect(e.pct).toBe("80%");
  });

  it("returns top followers sorted by frequency", () => {
    const e = stats.get("e")!;
    expect(e.topFollowers.length).toBeGreaterThan(0);
    expect(e.topFollowers.length).toBeLessThanOrEqual(3);
  });

  it("returns top preceders", () => {
    const n = stats.get("n")!;
    expect(n.topPreceders.length).toBeGreaterThan(0);
  });

  it("handles empty docs", () => {
    expect(computeCharStats([]).size).toBe(0);
  });
});
