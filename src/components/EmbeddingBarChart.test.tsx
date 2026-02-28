// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import EmbeddingBarChart from "./EmbeddingBarChart";

afterEach(() => cleanup());

describe("EmbeddingBarChart", () => {
  it("shows empty state when values is null", () => {
    render(<EmbeddingBarChart values={null} label={null} charStats={null} />);
    expect(screen.getByText(/survole une lettre/i)).toBeTruthy();
  });

  it("shows label, stats, and bars when values provided", () => {
    const values = Array.from({ length: 16 }, (_, i) => (i - 8) * 0.1);
    render(
      <EmbeddingBarChart
        values={values}
        label="'e'"
        charStats={{
          nameCount: 42,
          totalNames: 50,
          pct: "84%",
          topFollowers: ["r", "n"],
          topPreceders: ["l", "i"],
        }}
      />,
    );
    expect(screen.getByText(/embedding de/i)).toBeTruthy();
    expect(screen.getByText(/42\/50/)).toBeTruthy();
    expect(screen.getByText(/Avant/)).toBeTruthy();
    expect(screen.getByText(/Après/)).toBeTruthy();
  });

  it("shows BOS message when label is BOS", () => {
    render(<EmbeddingBarChart values={[0.1]} label="BOS" charStats={null} />);
    expect(screen.getByText(/token spécial/i)).toBeTruthy();
  });

  it("renders correct number of bars", () => {
    const { container } = render(
      <EmbeddingBarChart
        values={Array(16).fill(0.1)}
        label="'a'"
        charStats={null}
      />,
    );
    expect(container.querySelectorAll(".barchart-bar").length).toBe(16);
  });
});
