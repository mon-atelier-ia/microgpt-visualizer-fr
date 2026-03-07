// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

// Stub HTMLDialogElement.showModal / close (jsdom doesn't implement them)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("Share button + QR code dialog", () => {
  it("renders the share button with accessible label", () => {
    render(<App />);
    const btns = screen.getAllByRole("button", { name: /partager/i });
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("opens the share dialog on click", () => {
    render(<App />);
    const btns = screen.getAllByRole("button", { name: /partager/i });
    fireEvent.click(btns[0]);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it("QR SVG has role=img and aria-label", () => {
    render(<App />);
    const svgs = screen.getAllByRole("img", { name: /qr code/i });
    expect(svgs.length).toBeGreaterThanOrEqual(1);
    expect(svgs[0].tagName.toLowerCase()).toBe("svg");
  });
});
