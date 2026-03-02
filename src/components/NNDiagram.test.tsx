// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import NNDiagram from "./NNDiagram";

afterEach(() => cleanup());

function makeProps() {
  return {
    combined: Array(16).fill(0),
    afterAttn: Array(16).fill(0),
    mlpHidden: Array(64).fill(0),
    mlpActiveMask: Array(64).fill(false),
    afterMlp: Array(16).fill(0),
    probs: Array(27).fill(1 / 27),
    weights: {
      attnWo: Array.from({ length: 16 }, () => Array(16).fill(0)),
      mlpFc1: Array.from({ length: 64 }, () => Array(16).fill(0)),
      mlpFc2: Array.from({ length: 16 }, () => Array(64).fill(0)),
      lmHead: Array.from({ length: 27 }, () => Array(16).fill(0)),
    },
  };
}

describe("NNDiagram", () => {
  it("le canvas a role='img' et un aria-label", () => {
    const { container } = render(<NNDiagram {...makeProps()} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("role")).toBe("img");
    expect(canvas!.getAttribute("aria-label")).toContain("réseau");
  });

  it("le bouton Rejouer est présent", () => {
    const { container } = render(<NNDiagram {...makeProps()} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain("Rejouer");
  });
});
