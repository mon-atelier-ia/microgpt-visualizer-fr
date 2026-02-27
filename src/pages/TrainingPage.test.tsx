// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ModelState } from "../engine/model";

// Mock trainStep pour éviter d'exécuter le vrai modèle
vi.mock("../engine/model", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    trainStep: vi.fn(() => ({
      loss: 1.5,
      lr: 0.01,
      doc: "test",
      tokens: [26, 0, 26],
      perPositionLoss: [1.5, 1.0],
    })),
  };
});

// Mock LossChart car canvas.getContext('2d') retourne null dans jsdom
vi.mock("../components/LossChart", () => ({
  default: () => <div data-testid="loss-chart" />,
}));

// Import APRÈS les mocks
import TrainingPage from "./TrainingPage";

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

describe("TrainingPage — cleanup rAF au démontage (C-6)", () => {
  it("appelle cancelAnimationFrame au démontage pendant l'entraînement", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockReturnValue(42);

    const { unmount } = render(
      <TrainingPage model={makeModel()} onUpdate={vi.fn()} onReset={vi.fn()} />,
    );

    // Lancer l'entraînement
    fireEvent.click(screen.getByText("Entraîner 200 étapes"));
    expect(rafSpy).toHaveBeenCalled();

    // Démonter pendant l'entraînement → doit annuler le rAF
    unmount();
    expect(cancelSpy).toHaveBeenCalledWith(42);

    cancelSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it("le bouton Arrêter appelle cancelAnimationFrame", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockReturnValue(99);

    render(
      <TrainingPage model={makeModel()} onUpdate={vi.fn()} onReset={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Entraîner 200 étapes"));

    // Le bouton Arrêter doit apparaître et annuler le rAF
    fireEvent.click(screen.getByText("Arrêter"));
    expect(cancelSpy).toHaveBeenCalledWith(99);

    cancelSpy.mockRestore();
    rafSpy.mockRestore();
  });
});
