// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ForwardPassPage from "./ForwardPassPage";

vi.mock("../modelStore", () => ({
  useModel: () => ({
    stateDict: { wte: [], wpe: [] },
    params: [],
    adamM: new Float64Array(0),
    adamV: new Float64Array(0),
    totalStep: 0,
    lossHistory: [],
    docs: ["test"],
    rng: () => 0.5,
  }),
}));

vi.mock("../engine/model", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    gptForward: () => ({
      logits: Array.from({ length: 27 }, () => ({ data: 0 })),
      trace: {
        tokenId: 0,
        posId: 0,
        tokEmb: Array(16).fill(0),
        posEmb: Array(16).fill(0),
        combined: Array(16).fill(0),
        afterNorm: Array(16).fill(0),
        q: Array(16).fill(0),
        k: Array(16).fill(0),
        v: Array(16).fill(0),
        attnWeights: [[1]],
        afterAttn: Array(16).fill(0),
        mlpHidden: Array(64).fill(0),
        mlpActiveMask: Array(64).fill(false),
        afterMlp: Array(16).fill(0),
        logits: Array(27).fill(0),
        probs: Array(27).fill(1 / 27),
      },
    }),
  };
});

afterEach(() => cleanup());

describe("ForwardPassPage — accessibilité", () => {
  it("le select de position est associé à un <label> via htmlFor/id", () => {
    render(<ForwardPassPage />);
    const label = document.querySelector('label[for="forward-pos"]');
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain("Position");
    const select = document.getElementById("forward-pos");
    expect(select).toBeTruthy();
    expect(select!.tagName).toBe("SELECT");
  });
});
