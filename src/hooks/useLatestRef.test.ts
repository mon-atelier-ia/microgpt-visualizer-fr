// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLatestRef } from "./useLatestRef";

describe("useLatestRef", () => {
  it("holds the initial value after mount", () => {
    const { result } = renderHook(() => useLatestRef(1));
    expect(result.current.current).toBe(1);
  });

  it("holds the latest committed value after a rerender", () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: "a" },
    });
    rerender({ v: "b" });
    expect(result.current.current).toBe("b");
  });

  it("keeps the same ref object across renders", () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: 0 },
    });
    const first = result.current;
    rerender({ v: 1 });
    expect(result.current).toBe(first);
  });
});
