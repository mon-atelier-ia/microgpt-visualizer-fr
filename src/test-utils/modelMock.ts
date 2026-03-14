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
