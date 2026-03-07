// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../modelStore", () => ({
  useModel: () => ({ totalStep: 0 }),
}));

vi.mock("../engine/model", () => ({
  N_LAYER: 1,
  gptForward: () => ({
    logits: [],
    trace: {
      tokenId: 0,
      posId: 0,
      tokEmb: new Array(16).fill(0),
      posEmb: new Array(16).fill(0),
      combined: new Array(16).fill(0),
      afterNorm: new Array(16).fill(0),
      preAttnNorm: new Array(16).fill(0),
      q: new Array(16).fill(0),
      k: new Array(16).fill(0),
      v: new Array(16).fill(0),
      attnWeights: Array.from({ length: 4 }, () => [1.0]),
      afterAttn: new Array(16).fill(0),
      preMlpNorm: new Array(16).fill(0),
      mlpHidden: new Array(64).fill(0),
      mlpActiveMask: new Array(64).fill(false),
      afterMlp: new Array(16).fill(0),
      logits: new Array(27).fill(0),
      probs: new Array(27).fill(1 / 27),
    },
  }),
}));

import FullModelPage from "./FullModelPage";

afterEach(() => cleanup());

describe("FullModelPage", () => {
  it("renders the page title", () => {
    render(<FullModelPage />);
    expect(screen.getByText(/modèle complet/i)).toBeTruthy();
  });

  it("renders the FullNNDiagram canvas", () => {
    render(<FullModelPage />);
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("renders the mobile fallback message", () => {
    render(<FullModelPage />);
    expect(screen.getByText(/écran plus large/i)).toBeTruthy();
  });
});
