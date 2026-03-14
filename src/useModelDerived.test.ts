// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useModelDerived } from "./useModelDerived";
import { resetModel, notifyModelUpdate, useModel } from "./modelStore";

describe("useModelDerived", () => {
  it("derives a value from the model", () => {
    const { result } = renderHook(() =>
      useModelDerived((m) => m.stateDict.wte.length),
    );
    expect(result.current).toBe(27); // 26 chars + BOS
  });

  it("recomputes when model is mutated and notified", () => {
    const { result: modelResult } = renderHook(() => useModel());
    const { result } = renderHook(() => useModelDerived((m) => m.totalStep));
    expect(result.current).toBe(0);

    act(() => {
      modelResult.current.totalStep = 42;
      notifyModelUpdate();
    });
    expect(result.current).toBe(42);

    act(() => resetModel());
  });

  it("recomputes when model is reset (new identity)", () => {
    const { result: modelResult } = renderHook(() => useModel());
    const { result } = renderHook(() => useModelDerived((m) => m.totalStep));

    act(() => {
      modelResult.current.totalStep = 100;
      notifyModelUpdate();
    });
    expect(result.current).toBe(100);

    act(() => resetModel());
    expect(result.current).toBe(0);
  });

  it("recomputes when extra deps change", () => {
    let multiplier = 1;
    const { result, rerender } = renderHook(() =>
      useModelDerived((m) => m.stateDict.wte.length * multiplier, [multiplier]),
    );
    expect(result.current).toBe(27);

    multiplier = 2;
    rerender();
    expect(result.current).toBe(54);
  });

  it("uses latest fn via ref (no stale closure)", () => {
    let offset = 0;
    const { result, rerender } = renderHook(() =>
      useModelDerived((m) => m.totalStep + offset, [offset]),
    );
    expect(result.current).toBe(0);

    offset = 10;
    rerender();
    expect(result.current).toBe(10);
  });
});
