// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import Term from "./Term";
import TermProvider from "./TermProvider";
import { GLOSSARY } from "../data/glossary";

/** Helper : rend un Term dans son TermProvider. */
function renderTerm(id: string) {
  return render(
    <TermProvider>
      <Term id={id} />
    </TermProvider>,
  );
}

beforeEach(() => {
  cleanup();
});

describe("Term — rendu de base", () => {
  it("affiche le label du glossaire pour un id valide", () => {
    renderTerm("token");
    expect(screen.getByText("token")).toBeTruthy();
  });

  it("affiche l'id brut si la clé n'existe pas dans le glossaire", () => {
    renderTerm("inexistant");
    expect(screen.getByText("inexistant")).toBeTruthy();
  });

  it("a la classe .term et tabIndex=0", () => {
    renderTerm("bos");
    const el = screen.getByText("BOS");
    expect(el.classList.contains("term")).toBe(true);
    expect(el.getAttribute("tabindex")).toBe("0");
  });

  it("n'affiche pas de tooltip par défaut", () => {
    renderTerm("token");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("Term — tooltip au focus/hover", () => {
  it("affiche le tooltip au focus", () => {
    renderTerm("token");
    const term = screen.getByText("token");
    fireEvent.focus(term);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain(GLOSSARY.token.short);
  });

  it("masque le tooltip au blur (après délai)", async () => {
    vi.useFakeTimers();
    renderTerm("logits");
    const term = screen.getByText("logits");
    fireEvent.focus(term);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.blur(term);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByRole("tooltip")).toBeNull();
    vi.useRealTimers();
  });

  it("masque le tooltip avec Escape", () => {
    renderTerm("bos");
    const term = screen.getByText("BOS");
    fireEvent.focus(term);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(term, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("Term — aria-describedby", () => {
  it("lie le terme au tooltip via aria-describedby quand visible", () => {
    renderTerm("vecteur");
    const term = screen.getByText("vecteur");
    expect(term.getAttribute("aria-describedby")).toBeNull();
    fireEvent.focus(term);
    const tipId = term.getAttribute("aria-describedby");
    expect(tipId).toBeTruthy();
    const tooltip = document.getElementById(tipId!);
    expect(tooltip).toBeTruthy();
    expect(tooltip!.getAttribute("role")).toBe("tooltip");
  });

  it("produit des IDs uniques pour deux instances du même terme", () => {
    render(
      <TermProvider>
        <Term id="token" />
        <Term id="token" />
      </TermProvider>,
    );
    const terms = screen.getAllByText("token");
    expect(terms).toHaveLength(2);
    fireEvent.focus(terms[0]);
    fireEvent.focus(terms[1]);
    const id0 = terms[0].getAttribute("aria-describedby");
    const id1 = terms[1].getAttribute("aria-describedby");
    expect(id0).toBeTruthy();
    expect(id1).toBeTruthy();
    expect(id0).not.toBe(id1);
  });
});

describe("Term — lien « En savoir plus »", () => {
  it("affiche le lien pour un terme Tier 2 (avec long)", () => {
    renderTerm("loss");
    fireEvent.focus(screen.getByText("loss"));
    expect(screen.getByText("En savoir plus")).toBeTruthy();
  });

  it("n'affiche pas le lien pour un terme Tier 1 (sans long)", () => {
    renderTerm("logits");
    fireEvent.focus(screen.getByText("logits"));
    expect(screen.queryByText("En savoir plus")).toBeNull();
  });
});

describe("Term — aucun <dialog> dans le composant", () => {
  it("ne rend pas de <dialog> dans le span du terme", () => {
    renderTerm("loss");
    const term = screen.getByText("loss");
    expect(term.querySelector("dialog")).toBeNull();
  });
});
