// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createModelMock } from "../test-utils/modelMock";
import { mockGptForward } from "../test-utils/fullTraceFixture";

vi.mock("../modelStore", () => ({
  useModel: () => createModelMock(),
}));

vi.mock("../engine/model", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, gptForward: mockGptForward };
});

import AttentionPage from "./AttentionPage";

afterEach(() => cleanup());

describe("AttentionPage", () => {
  it("renders the page title", () => {
    render(<AttentionPage />);
    expect(screen.getByRole("heading", { name: /attention/i })).toBeTruthy();
  });

  it("renders the input field for name analysis", () => {
    render(<AttentionPage />);
    const input = screen.getByLabelText(/nom à analyser/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute("value")).toBe("emma");
  });

  it("renders position selector buttons", () => {
    render(<AttentionPage />);
    const buttons = screen.getAllByRole("button");
    const posButtons = buttons.filter(
      (b) =>
        b.classList.contains("btn-toggle--char") &&
        b.textContent !== null &&
        /^\d+$/.test(b.textContent),
    );
    expect(posButtons.length).toBeGreaterThan(0);
  });

  it("renders the BertViz head selector", () => {
    render(<AttentionPage />);
    expect(screen.getByText("Toutes")).toBeTruthy();
  });

  it("renders the attention matrix table", () => {
    render(<AttentionPage />);
    const table = screen.getByRole("table");
    expect(table).toBeTruthy();
    expect(table.getAttribute("aria-label")).toContain("5×5");
  });
});
