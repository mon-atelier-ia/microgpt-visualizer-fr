// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import PageSection from "./PageSection";

afterEach(() => cleanup());

describe("PageSection (W-3)", () => {
  it("rend un <section> avec aria-labelledby", () => {
    render(
      <PageSection id="test" title="Titre test">
        <p>contenu</p>
      </PageSection>,
    );
    const section = screen.getByRole("region");
    expect(section.getAttribute("aria-labelledby")).toBe("page-title-test");
  });

  it("rend un <h1> avec le bon id et titre", () => {
    render(
      <PageSection id="tok" title="1. Tokenisation">
        <p>contenu</p>
      </PageSection>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.id).toBe("page-title-tok");
    expect(heading.textContent).toBe("1. Tokenisation");
  });

  it("rend les enfants à l'intérieur de la section", () => {
    render(
      <PageSection id="x" title="T">
        <div data-testid="child">hello</div>
      </PageSection>,
    );
    const section = screen.getByRole("region");
    expect(section.querySelector("[data-testid='child']")).toBeTruthy();
  });
});
