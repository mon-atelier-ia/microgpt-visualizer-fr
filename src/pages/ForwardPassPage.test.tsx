// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { withOverrides } from "../test-utils/partialMock";
import { render, screen, cleanup } from "@testing-library/react";
import { mockGptForward } from "../test-utils/fullTraceFixture";

function makeWeightMatrix(rows: number, cols: number) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ data: 0, grad: 0 })),
  );
}

vi.mock("../modelStore", async () => {
  const { createModelStoreMock, createModelMock } =
    await import("../test-utils/modelMock");
  return createModelStoreMock(
    createModelMock({
      stateDict: {
        wte: [],
        wpe: [],
        "layer0.attn_wo": makeWeightMatrix(16, 16),
        "layer0.mlp_fc1": makeWeightMatrix(64, 16),
        "layer0.mlp_fc2": makeWeightMatrix(16, 64),
        lm_head: makeWeightMatrix(27, 16),
      },
    }),
  );
});

vi.mock("../engine/model", (importOriginal) =>
  withOverrides(importOriginal, {
    gptForward: mockGptForward,
  }),
);

import ForwardPassPage from "./ForwardPassPage";

afterEach(() => cleanup());

describe("ForwardPassPage — sélecteurs", () => {
  it("affiche les 26 boutons de tokens (a-z) × 2 sélecteurs", () => {
    render(<ForwardPassPage />);
    const buttons = screen.getAllByRole("button");
    const tokenButtons = buttons.filter(
      (b) => b.textContent?.length === 1 && /^[a-z]$/.test(b.textContent),
    );
    expect(tokenButtons.length).toBe(52);
  });

  it("affiche les 16 boutons de positions (0-15) × 2 sélecteurs", () => {
    render(<ForwardPassPage />);
    const buttons = screen.getAllByRole("button");
    const posButtons = buttons.filter(
      (b) =>
        b.textContent !== null &&
        /^\d+$/.test(b.textContent) &&
        Number(b.textContent) < 16,
    );
    expect(posButtons.length).toBe(32);
  });

  it("affiche le canvas du diagramme NN", () => {
    const { container } = render(<ForwardPassPage />);
    const canvas = container.querySelector('canvas[role="img"]');
    expect(canvas).toBeTruthy();
  });
});
