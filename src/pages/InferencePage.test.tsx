// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { ModelState } from "../engine/model";
import InferencePage from "./InferencePage";

vi.mock("../engine/model", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    generateName: () => ({
      name: "test",
      steps: [
        {
          pos: 0,
          chosenChar: "t",
          chosenId: 20,
          probs: Array(27).fill(1 / 27),
          top5: [{ char: "t", prob: 0.2 }],
        },
      ],
    }),
  };
});

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

describe("InferencePage — gen-name buttons (W-4)", () => {
  it("les noms générés sont des <button> avec type='button'", () => {
    render(<InferencePage model={makeModel()} />);
    // Cliquer Générer 1 pour créer un résultat
    fireEvent.click(screen.getByRole("button", { name: "Générer 1" }));
    const genButtons = document.querySelectorAll("button.gen-name");
    expect(genButtons.length).toBeGreaterThan(0);
    expect(genButtons[0].getAttribute("type")).toBe("button");
  });

  it("le bouton actif a la classe gen-name--active", () => {
    render(<InferencePage model={makeModel()} />);
    fireEvent.click(screen.getByRole("button", { name: "Générer 1" }));
    const active = document.querySelector("button.gen-name--active");
    expect(active).toBeTruthy();
  });
});
