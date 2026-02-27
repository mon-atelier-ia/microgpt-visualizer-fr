// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Heatmap from "./Heatmap";
import { Value } from "../engine/autograd";

afterEach(() => cleanup());

/** Crée une matrice Value[][] minimale pour les tests. */
function makeMatrix(rows: number, cols: number): Value[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => new Value(r * 0.1 - c * 0.05)),
  );
}

const MATRIX = makeMatrix(4, 2);
const LABELS = ["a", "b", "c", "d"];

describe("Heatmap — accessibilité clavier (W-1)", () => {
  it("a un aria-label descriptif sur le <table>", () => {
    render(<Heatmap matrix={MATRIX} rowLabels={LABELS} colCount={2} />);
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-label")).toContain("4 lignes");
    expect(table.getAttribute("aria-label")).toContain("2 colonnes");
  });

  it("une seule ligne a tabIndex=0 quand onHoverRow est passé (roving tabindex)", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    const tabIndices = Array.from(rows).map((r) => r.getAttribute("tabindex"));
    expect(tabIndices.filter((t) => t === "0")).toHaveLength(1);
    expect(tabIndices.filter((t) => t === "-1")).toHaveLength(3);
  });

  it("aucun tabIndex si onHoverRow absent", () => {
    const { container } = render(
      <Heatmap matrix={MATRIX} rowLabels={LABELS} colCount={2} />,
    );
    const rows = container.querySelectorAll("tbody tr");
    Array.from(rows).forEach((r) => {
      expect(r.getAttribute("tabindex")).toBeNull();
    });
  });

  it("onFocus déclenche onHoverRow avec l'index de la ligne", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    fireEvent.focus(rows[2]);
    expect(onHover).toHaveBeenCalledWith(2);
  });

  it("onBlur déclenche onHoverRow(null)", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    fireEvent.focus(rows[0]);
    fireEvent.blur(rows[0]);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("ArrowDown déplace le focus à la ligne suivante", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    (rows[0] as HTMLElement).focus();
    fireEvent.keyDown(rows[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[1]);
  });

  it("ArrowUp déplace le focus à la ligne précédente", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    (rows[2] as HTMLElement).focus();
    fireEvent.keyDown(rows[2], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[1]);
  });

  it("Home → première ligne, End → dernière ligne", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    (rows[2] as HTMLElement).focus();
    fireEvent.keyDown(rows[2], { key: "Home" });
    expect(document.activeElement).toBe(rows[0]);
    fireEvent.keyDown(rows[0], { key: "End" });
    expect(document.activeElement).toBe(rows[3]);
  });

  it("ArrowUp sur la première ligne = pas de mouvement", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    (rows[0] as HTMLElement).focus();
    fireEvent.keyDown(rows[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("ArrowDown sur la dernière ligne = pas de mouvement", () => {
    const onHover = vi.fn();
    const { container } = render(
      <Heatmap
        matrix={MATRIX}
        rowLabels={LABELS}
        colCount={2}
        onHoverRow={onHover}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    (rows[3] as HTMLElement).focus();
    fireEvent.keyDown(rows[3], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[3]);
  });
});
