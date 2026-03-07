// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import LossCell from "./LossCell";

describe("LossCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<LossCell loss={2} from="a" to="b" />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(247/);
  });
});
