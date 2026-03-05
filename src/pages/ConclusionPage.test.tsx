// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConclusionPage from "./ConclusionPage";

describe("ConclusionPage", () => {
  it("renders the comparison table with 8 rows", () => {
    const { container } = render(<ConclusionPage />);
    expect(screen.getByRole("table")).toBeTruthy();
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(8);
  });

  it("renders the Aller plus loin section with Karpathy link", () => {
    render(<ConclusionPage />);
    const links = screen.getAllByRole("link", { name: /guide officiel/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].getAttribute("href")).toContain("karpathy.github.io");
  });

  it("has motivating intro text about fondations", () => {
    const { container } = render(<ConclusionPage />);
    const desc = container.querySelector(".page-desc")!;
    expect(desc.textContent).toContain("fondations");
  });
});
