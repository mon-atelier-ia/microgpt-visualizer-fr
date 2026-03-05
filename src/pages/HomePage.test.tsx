// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("renders the pitch and Commencer button", () => {
    const onStart = vi.fn();
    render(<HomePage onStart={onStart} />);
    expect(screen.getByText(/cerveau artificiel/i)).toBeTruthy();
    const btns = screen.getAllByRole("button", { name: /commencer/i });
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onStart when Commencer is clicked", () => {
    const onStart = vi.fn();
    const { container } = render(<HomePage onStart={onStart} />);
    const startBtn = container.querySelector(".home-start-btn")!;
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("displays the 8-step journey overview", () => {
    const onStart = vi.fn();
    const { container } = render(<HomePage onStart={onStart} />);
    const steps = container.querySelectorAll(".home-step");
    expect(steps.length).toBe(8);
  });
});
