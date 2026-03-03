// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import PCAScatterPlot from "./PCAScatterPlot";

afterEach(() => cleanup());

function makeProps() {
  return {
    wteData: Array.from({ length: 27 }, () =>
      Array.from({ length: 16 }, () => Math.random()),
    ),
    totalStep: 0,
    snapshots: [] as { step: number; wte: number[][] }[],
    highlightLetter: null as number | null,
    onHoverLetter: undefined as ((index: number | null) => void) | undefined,
  };
}

describe("PCAScatterPlot", () => {
  it("le canvas a role='img' et un aria-label", () => {
    const { container } = render(<PCAScatterPlot {...makeProps()} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("role")).toBe("img");
    expect(canvas!.getAttribute("aria-label")).toContain("PCA");
  });

  it("affiche le bouton play quand ≥3 snapshots existent", () => {
    const props = makeProps();
    props.snapshots = [
      { step: 0, wte: props.wteData },
      { step: 50, wte: props.wteData },
      { step: 100, wte: props.wteData },
    ];
    const { container } = render(<PCAScatterPlot {...props} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain("Rejouer");
  });

  it("n'affiche pas le bouton play avec <3 snapshots", () => {
    const { container } = render(<PCAScatterPlot {...makeProps()} />);
    const btn = container.querySelector("button");
    expect(btn).toBeNull();
  });
});
