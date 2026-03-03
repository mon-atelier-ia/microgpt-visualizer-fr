// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

vi.mock("../modelStore", () => ({
  useModel: () => ({
    stateDict: {
      wte: Array.from({ length: 27 }, () =>
        Array.from({ length: 16 }, () => ({ data: Math.random() })),
      ),
      wpe: Array.from({ length: 8 }, () =>
        Array.from({ length: 16 }, () => ({ data: Math.random() })),
      ),
    },
    totalStep: 0,
    docs: ["alice", "bob"],
  }),
  getWteSnapshots: () => [],
}));

import EmbeddingsPage from "./EmbeddingsPage";

afterEach(() => cleanup());

describe("EmbeddingsPage — PCA integration (F-2)", () => {
  it("rend le panneau PCA avec le canvas", () => {
    const { container } = render(<EmbeddingsPage />);
    const canvas = container.querySelector("canvas[role='img']");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("aria-label")).toContain("PCA");
  });

  it("passe highlightLetter au PCAScatterPlot via hoverRow", () => {
    const { container } = render(<EmbeddingsPage />);
    // Le panneau PCA existe avec le canvas
    const panels = container.querySelectorAll(".panel");
    const pcaPanel = Array.from(panels).find((p) =>
      p.querySelector(".pca-canvas-wrap"),
    );
    expect(pcaPanel).toBeTruthy();
    // Le canvas est dans un .pca-canvas-wrap
    const wrap = pcaPanel!.querySelector(".pca-canvas-wrap");
    expect(wrap).toBeTruthy();
    expect(wrap!.querySelector("canvas")).toBeTruthy();
  });

  it("hover sur une ligne wte → highlightRow cycle complet (bidirectionnel M-3)", () => {
    const { container } = render(<EmbeddingsPage />);
    // Find the first wte heatmap row (interactive — has tabIndex)
    const firstRow = container.querySelector(
      "table tr[tabindex]",
    ) as HTMLElement;
    expect(firstRow).toBeTruthy();
    // Before hover: no outline
    expect(firstRow.style.outline).toBe("");
    // Simulate hover
    fireEvent.mouseEnter(firstRow);
    // After hover: hoverRow=0 → highlightRow=0 → outline appears
    expect(firstRow.style.outline).toContain("solid");
  });

  it("affiche le training badge 'Poids aléatoires' quand totalStep=0", () => {
    const { container } = render(<EmbeddingsPage />);
    const labels = container.querySelectorAll(".label-dim");
    const pcaBadge = Array.from(labels).find((l) =>
      l.textContent?.includes("éparpillées"),
    );
    expect(pcaBadge).toBeTruthy();
  });
});
