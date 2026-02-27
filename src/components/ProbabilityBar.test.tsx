// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import ProbabilityBar, { type ProbItem } from "./ProbabilityBar";

afterEach(cleanup);

const items: ProbItem[] = [
  { id: 0, char: "a", prob: 0.6 },
  { id: 1, char: "b", prob: 0.3 },
  { id: 26, char: "BOS", prob: 0.1 },
];

describe("ProbabilityBar", () => {
  it("renders one row per item", () => {
    const { container } = render(
      <ProbabilityBar items={items} maxProb={0.6} />,
    );
    expect(container.querySelectorAll(".prob-row")).toHaveLength(3);
  });

  it("displays character labels and percentages", () => {
    const { container } = render(
      <ProbabilityBar items={items} maxProb={0.6} />,
    );
    const rows = container.querySelectorAll(".prob-row");
    const row0 = within(rows[0] as HTMLElement);
    const row1 = within(rows[1] as HTMLElement);
    const row2 = within(rows[2] as HTMLElement);
    expect(row0.getByText("a")).toBeDefined();
    expect(row0.getByText("60.0%")).toBeDefined();
    expect(row1.getByText("b")).toBeDefined();
    expect(row1.getByText("30.0%")).toBeDefined();
    expect(row2.getByText("BOS")).toBeDefined();
    expect(row2.getByText("10.0%")).toBeDefined();
  });

  it("sets bar width proportional to maxProb", () => {
    const { container } = render(
      <ProbabilityBar items={items} maxProb={0.6} />,
    );
    const bars = container.querySelectorAll(".prob-bar");
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
    expect((bars[1] as HTMLElement).style.width).toBe("50%");
  });

  it("applies default BOS color (red) and blue for others", () => {
    const { container } = render(
      <ProbabilityBar items={items} maxProb={0.6} />,
    );
    const bars = container.querySelectorAll(".prob-bar");
    expect((bars[0] as HTMLElement).style.background).toBe("var(--blue)");
    expect((bars[2] as HTMLElement).style.background).toBe("var(--red)");
  });

  it("applies custom labelStyle callback", () => {
    const { container } = render(
      <ProbabilityBar
        items={items}
        maxProb={0.6}
        labelStyle={(t) => (t.char === "a" ? { color: "green" } : {})}
      />,
    );
    const labels = container.querySelectorAll(".prob-label");
    expect((labels[0] as HTMLElement).style.color).toBe("green");
    expect((labels[1] as HTMLElement).style.color).toBe("");
  });

  it("applies custom barColor callback", () => {
    const { container } = render(
      <ProbabilityBar items={items} maxProb={0.6} barColor={() => "purple"} />,
    );
    const bars = container.querySelectorAll(".prob-bar");
    expect((bars[0] as HTMLElement).style.background).toBe("purple");
    expect((bars[2] as HTMLElement).style.background).toBe("purple");
  });

  it("handles empty items without crashing", () => {
    const { container } = render(<ProbabilityBar items={[]} maxProb={0.01} />);
    expect(container.querySelectorAll(".prob-row")).toHaveLength(0);
  });
});
