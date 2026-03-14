// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../modelStore", () => ({
  useModel: () => ({ totalStep: 0 }),
}));

import { EMPTY_TRACE_PROPS } from "../test-utils/fullTraceFixture";

vi.mock("../engine/model", () => ({
  N_LAYER: 1,
  gptForward: () => ({
    logits: [],
    trace: {
      tokenId: 0,
      posId: 0,
      ...EMPTY_TRACE_PROPS,
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
