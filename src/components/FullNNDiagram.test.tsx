// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import FullNNDiagram from "./FullNNDiagram";

afterEach(() => cleanup());

const emptyProps = {
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
};

describe("FullNNDiagram", () => {
  it("renders a canvas with role=img and descriptive aria-label", () => {
    render(<FullNNDiagram {...emptyProps} />);
    const canvas = screen.getByRole("img");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.getAttribute("aria-label")).toContain("16 couches");
  });

  it("renders a Rejouer button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /rejouer/i })).toBeTruthy();
  });

  it("renders a backward toggle button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /backward/i })).toBeTruthy();
  });
});
