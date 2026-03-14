import { useMemo, useRef } from "react";
import { useModel } from "./modelStore";
import type { ModelState } from "./engine/model";

/**
 * Derive a value from the mutable model, recomputing when the model
 * is reset (new identity) or trained (totalStep changes).
 *
 * The model object from the engine is mutated in place (upstream constraint).
 * React's useMemo would not notice mutations since the reference is stable.
 * This hook uses model identity + totalStep as a version signal so that
 * derived values are recomputed after training or reset, without
 * eslint-disable scattered across every consumer.
 *
 * fn is stored in a ref so callers can pass inline arrows without
 * listing them in deps (same pattern as useEvent / useEffectEvent).
 *
 * @param fn — pure derivation from model (must not mutate)
 * @param deps — additional reactive values (e.g. tokenId, pos)
 */
export function useModelDerived<T>(
  fn: (model: ModelState) => T,
  deps: readonly unknown[] = [],
): T {
  const model = useModel();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  // model — changes on reset (new object)
  // model.totalStep — changes on each training batch (mutation signal)
  // fnRef.current — always latest fn, no stale closure risk
  // eslint-disable-next-line react-hooks/exhaustive-deps -- model is mutable (engine constraint): identity detects reset, totalStep detects training. This is the ONE place this pattern lives.
  return useMemo(() => fnRef.current(model), [model, model.totalStep, ...deps]);
}
