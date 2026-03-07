// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import NeuronCell from "./NeuronCell";

describe("NeuronCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<NeuronCell value={0.5} index={0} />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(158/);
  });
});
