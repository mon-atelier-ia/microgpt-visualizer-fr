/**
 * Partial module mock: keeps the real exports, replaces only `overrides`.
 * Usage: `vi.mock("../engine/model", (orig) => withOverrides(orig, { gptForward: mockGptForward }));`
 */
export async function withOverrides(
  importOriginal: () => Promise<unknown>,
  overrides: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, ...overrides };
}
