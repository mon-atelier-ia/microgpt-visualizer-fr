// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import InferencePage from "./InferencePage";

vi.mock("../modelStore", () => ({
  useModel: () => ({
    stateDict: { wte: [], wpe: [] },
    params: [],
    adamM: new Float64Array(0),
    adamV: new Float64Array(0),
    totalStep: 0,
    lossHistory: [],
    docs: ["test"],
    rng: () => 0.5,
  }),
}));

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

describe("InferencePage — label accessible du slider (W-2)", () => {
  it("le range input est associé à un <label> via htmlFor/id", () => {
    render(<InferencePage />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("id")).toBe("temp-slider");
    const label = document.querySelector('label[for="temp-slider"]');
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain("Température");
  });

  it("le range input n'a PAS d'aria-label (évite double annonce)", () => {
    render(<InferencePage />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-label")).toBeNull();
  });

  it("getByLabelText trouve le slider via son label", () => {
    render(<InferencePage />);
    const slider = screen.getByLabelText(/température/i);
    expect(slider.getAttribute("type")).toBe("range");
  });
});

describe("InferencePage — gen-name buttons (W-4)", () => {
  it("les noms générés sont des <button> avec type='button'", () => {
    render(<InferencePage />);
    // Cliquer Générer 1 pour créer un résultat
    fireEvent.click(screen.getByRole("button", { name: "Générer 1" }));
    const genButtons = document.querySelectorAll("button.gen-name");
    expect(genButtons.length).toBeGreaterThan(0);
    expect(genButtons[0].getAttribute("type")).toBe("button");
  });

  it("le bouton actif a la classe gen-name--active", () => {
    render(<InferencePage />);
    fireEvent.click(screen.getByRole("button", { name: "Générer 1" }));
    const active = document.querySelector("button.gen-name--active");
    expect(active).toBeTruthy();
  });
});

describe("InferencePage — stable keys (R-3)", () => {
  it("les résultats générés ont des ids numériques uniques", () => {
    render(<InferencePage />);
    // Générer 10 une première fois
    fireEvent.click(screen.getByRole("button", { name: "Générer 10" }));
    expect(document.querySelectorAll("button.gen-name").length).toBe(10);
    // Générer 10 de plus — aucun doublon de key (React avertirait)
    fireEvent.click(screen.getByRole("button", { name: "Générer 10" }));
    const buttons = document.querySelectorAll("button.gen-name");
    expect(buttons.length).toBe(20);
  });
});
