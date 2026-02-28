// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TokenizerPage from "./TokenizerPage";

afterEach(() => cleanup());

describe("TokenizerPage — accessibilité", () => {
  it("le champ texte est associé à un <label> via htmlFor/id", () => {
    render(<TokenizerPage />);
    const input = screen.getByLabelText(/nom à tokeniser/i);
    expect(input.getAttribute("type")).toBe("text");
  });

  it("le label est visuellement masqué (sr-only)", () => {
    render(<TokenizerPage />);
    const label = document.querySelector('label[for="tokenizer-input"]');
    expect(label).toBeTruthy();
    expect(label!.classList.contains("sr-only")).toBe(true);
  });
});
