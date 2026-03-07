// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import HeatCell from "./HeatCell";

describe("HeatCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<HeatCell value={0.5} label="test" />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(122/);
  });
});
