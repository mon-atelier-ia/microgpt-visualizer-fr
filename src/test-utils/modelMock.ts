/**
 * Shared mock factory for `useModel()` in test files.
 * Usage: `vi.mock("../modelStore", () => ({ useModel: () => createModelMock() }));`
 */
export function createModelMock(overrides: Record<string, unknown> = {}) {
  return {
    stateDict: { wte: [], wpe: [] },
    params: [],
    adamM: new Float64Array(0),
    adamV: new Float64Array(0),
    totalStep: 0,
    lossHistory: [],
    docs: ["test"],
    rng: () => 0.5,
    ...overrides,
  };
}

/**
 * Shared mock factory for the whole `modelStore` module (read hooks only).
 * Usage: `vi.mock("../modelStore", async () => (await import("../test-utils/modelMock")).createModelStoreMock());`
 * The snapshot is created once so its identity is stable across renders, like the real store.
 */
export function createModelStoreMock(model: object = createModelMock()) {
  const snapshot = { model, wteSnapshots: [] };
  return {
    useModel: () => model,
    useModelSnapshot: () => snapshot,
    getWteSnapshots: () => [],
  };
}
