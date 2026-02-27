// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ModelState } from "../engine/model";
import InferencePage from "./InferencePage";

afterEach(() => cleanup());

/** ModelState minimal pour le rendu. */
function makeModel(): ModelState {
  return {
    stateDict: { wte: [], wpe: [] },
    params: [],
    adamM: new Float64Array(0),
    adamV: new Float64Array(0),
    totalStep: 0,
    lossHistory: [],
    docs: ["test"],
    rng: () => 0.5,
  };
}

describe("InferencePage — label accessible du slider (W-2)", () => {
  it("le range input est associé à un <label> via htmlFor/id", () => {
    render(<InferencePage model={makeModel()} />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("id")).toBe("temp-slider");
    const label = document.querySelector('label[for="temp-slider"]');
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain("Température");
  });

  it("le range input n'a PAS d'aria-label (évite double annonce)", () => {
    render(<InferencePage model={makeModel()} />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-label")).toBeNull();
  });

  it("getByLabelText trouve le slider via son label", () => {
    render(<InferencePage model={makeModel()} />);
    const slider = screen.getByLabelText(/température/i);
    expect(slider.getAttribute("type")).toBe("range");
  });
});
