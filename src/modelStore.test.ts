// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resetModel, notifyModelUpdate, useModel } from "./modelStore";
import { renderHook, act } from "@testing-library/react";

// Re-import to access internal state via the hook
describe("modelStore", () => {
  it("useModel returns a model with expected shape", () => {
    const { result } = renderHook(() => useModel());
    const model = result.current;
    expect(model).toBeTruthy();
    expect(model.stateDict).toBeTruthy();
    expect(model.stateDict.wte).toBeTruthy();
    expect(model.params.length).toBeGreaterThan(0);
    expect(model.totalStep).toBe(0);
    expect(Array.isArray(model.lossHistory)).toBe(true);
  });

  it("resetModel creates a fresh model (totalStep=0)", () => {
    const { result } = renderHook(() => useModel());
    // Mutate to simulate training
    result.current.totalStep = 42;
    // Reset
    act(() => resetModel());
    expect(result.current.totalStep).toBe(0);
  });

  it("resetModel with datasetId switches dataset", () => {
    const { result } = renderHook(() => useModel());
    const paramsBefore = result.current.params.length;
    act(() => resetModel("prenoms"));
    // Different dataset may produce same param count but model is fresh
    expect(result.current.totalStep).toBe(0);
    expect(result.current.params.length).toBe(paramsBefore);
    // Reset back to default
    act(() => resetModel("names"));
  });

  it("notifyModelUpdate triggers re-render", () => {
    const renderCount = { value: 0 };
    renderHook(() => {
      useModel();
      renderCount.value++;
    });
    const before = renderCount.value;
    act(() => notifyModelUpdate());
    expect(renderCount.value).toBeGreaterThan(before);
  });

  it("subscribe/unsubscribe: no listener leak", () => {
    const { unmount } = renderHook(() => useModel());
    // After unmount, notifyModelUpdate should not crash
    unmount();
    act(() => notifyModelUpdate());
    // No assertion needed — if listeners leaked, this would error or call stale setState
  });
});
