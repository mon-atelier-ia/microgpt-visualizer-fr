// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

afterEach(() => cleanup());

function ThrowingChild() {
  throw new Error("test crash");
}

describe("ErrorBoundary (A-2)", () => {
  it("rend les enfants quand il n'y a pas d'erreur", () => {
    render(
      <ErrorBoundary>
        <p>OK</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("OK")).toBeTruthy();
  });

  it("attrape les erreurs et affiche le message FR", () => {
    // Suppress console.error from ErrorBoundary + React
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/quelque chose s'est mal passé/i)).toBeTruthy();
    vi.restoreAllMocks();
  });

  it("affiche un bouton Recharger qui réinitialise l'état", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: "Recharger" })).toBeTruthy();
    vi.restoreAllMocks();
  });
});
