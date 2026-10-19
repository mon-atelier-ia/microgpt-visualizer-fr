// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  resetModel,
  notifyModelUpdate,
  useModel,
  useModelSnapshot,
  getModelTotalStep,
  pushWteSnapshot,
  getWteSnapshots,
} from "./modelStore";
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

  it("getModelTotalStep returns current totalStep (non-reactive)", () => {
    const { result } = renderHook(() => useModel());
    expect(getModelTotalStep()).toBe(0);
    result.current.totalStep = 10;
    expect(getModelTotalStep()).toBe(10);
    // Reset back
    act(() => resetModel());
    expect(getModelTotalStep()).toBe(0);
  });

  it("subscribe/unsubscribe: no listener leak", () => {
    const { unmount } = renderHook(() => useModel());
    // After unmount, notifyModelUpdate should not crash
    unmount();
    act(() => notifyModelUpdate());
    // No assertion needed — if listeners leaked, this would error or call stale setState
  });
});

describe("wteSnapshots", () => {
  beforeEach(() => {
    act(() => resetModel());
  });

  it("pushWteSnapshot stores a deep copy (mutation-proof)", () => {
    const { result } = renderHook(() => useModel());
    act(() => {
      pushWteSnapshot(result.current);
    });
    const snaps = getWteSnapshots();
    expect(snaps).toHaveLength(1);
    expect(snaps[0].step).toBe(result.current.totalStep);
    expect(snaps[0].wte).toHaveLength(result.current.stateDict.wte.length);
    // Verify deep copy: mutate the live model, snapshot must be unaffected
    const originalVal = result.current.stateDict.wte[0][0].data;
    result.current.stateDict.wte[0][0].data = originalVal + 999;
    expect(snaps[0].wte[0][0]).toBe(originalVal);
    // Restore to avoid polluting other tests
    result.current.stateDict.wte[0][0].data = originalVal;
  });

  it("resetModel clears snapshots", () => {
    const { result } = renderHook(() => useModel());
    act(() => {
      pushWteSnapshot(result.current);
    });
    expect(getWteSnapshots().length).toBeGreaterThan(0);
    act(() => resetModel());
    expect(getWteSnapshots()).toHaveLength(0);
  });
});

describe("useModelSnapshot", () => {
  beforeEach(() => {
    act(() => resetModel());
  });

  it("exposes the same model as useModel", () => {
    const { result } = renderHook(() => ({
      snap: useModelSnapshot(),
      model: useModel(),
    }));
    expect(result.current.snap.model).toBe(result.current.model);
  });

  it("keeps a stable identity across renders without store change", () => {
    const { result, rerender } = renderHook(() => useModelSnapshot());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("changes identity on in-place mutation + notify (model ref unchanged)", () => {
    const { result } = renderHook(() => useModelSnapshot());
    const before = result.current;
    act(() => {
      before.model.totalStep = 42;
      notifyModelUpdate();
    });
    expect(result.current).not.toBe(before);
    expect(result.current.model).toBe(before.model);
    expect(result.current.model.totalStep).toBe(42);
  });

  it("changes identity and model on reset", () => {
    const { result } = renderHook(() => useModelSnapshot());
    const before = result.current;
    act(() => resetModel());
    expect(result.current).not.toBe(before);
    expect(result.current.model).not.toBe(before.model);
    expect(result.current.model.totalStep).toBe(0);
  });

  it("exposes wte snapshots with a new array identity after push", () => {
    const { result } = renderHook(() => useModelSnapshot());
    const before = result.current.wteSnapshots;
    act(() => {
      pushWteSnapshot(result.current.model);
      notifyModelUpdate();
    });
    expect(result.current.wteSnapshots).not.toBe(before);
    expect(result.current.wteSnapshots).toHaveLength(1);
  });
});
