// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import LossChart from "./LossChart";

afterEach(() => cleanup());

describe("LossChart — accessibilité", () => {
  it("le canvas a role='img' et un aria-label (vide)", () => {
    const { container } = render(<LossChart lossHistory={[]} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("role")).toBe("img");
    expect(canvas!.getAttribute("aria-label")).toContain("en attente");
  });

  it("le aria-label reflète les données quand il y a un historique", () => {
    const { container } = render(<LossChart lossHistory={[3.2, 2.8, 2.5]} />);
    const canvas = container.querySelector("canvas");
    expect(canvas!.getAttribute("aria-label")).toContain("étape 3");
    expect(canvas!.getAttribute("aria-label")).toContain("2.500");
  });
});
