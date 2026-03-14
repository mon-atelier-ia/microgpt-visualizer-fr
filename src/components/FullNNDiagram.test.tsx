// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import FullNNDiagram from "./FullNNDiagram";
import { EMPTY_TRACE_PROPS } from "../test-utils/fullTraceFixture";

afterEach(() => cleanup());

const emptyProps = EMPTY_TRACE_PROPS;

describe("FullNNDiagram", () => {
  it("renders a canvas with role=img and descriptive aria-label", () => {
    render(<FullNNDiagram {...emptyProps} />);
    const canvas = screen.getByRole("img");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.getAttribute("aria-label")).toContain("16 couches");
  });

  it("renders a Rejouer button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /rejouer/i })).toBeTruthy();
  });

  it("renders a backward toggle button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /backward/i })).toBeTruthy();
  });
});
