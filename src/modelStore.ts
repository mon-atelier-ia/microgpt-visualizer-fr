import { useSyncExternalStore } from "react";
import { createModel, type ModelState } from "./engine/model";
import { getDataset, DEFAULT_DATASET_ID } from "./datasets";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentDatasetId = DEFAULT_DATASET_ID;
let model: ModelState = createModel(getDataset(currentDatasetId).words);

// ── wte Snapshots (visualization concern, not engine) ──
export interface WteSnapshot {
  step: number;
  wte: number[][]; // vocabSize × N_EMBD (copied values, not Value references)
}

let wteSnapshots: WteSnapshot[] = [];
export const SNAPSHOT_INTERVAL = 50;

/** Push a deep copy of current wte embeddings. */
export function pushWteSnapshot(state: ModelState) {
  const snap: number[][] = state.stateDict.wte.map((row) =>
    row.map((v) => v.data),
  );
  // Immutable append: the array identity changes, so React snapshots see it
  wteSnapshots = [...wteSnapshots, { step: state.totalStep, wte: snap }];
}

/**
 * Get all snapshots (for PCA animation). Returns shallow copy to avoid memo bypass.
 * INVARIANT: callers of pushWteSnapshot must call notifyModelUpdate() after,
 * so that components re-render and read the updated snapshot list.
 */
export function getWteSnapshots(): WteSnapshot[] {
  return [...wteSnapshots];
}

/**
 * Immutable view of the store, re-created on every emit.
 * The engine mutates `model` in place (upstream constraint), so its reference
 * never changes during training. The snapshot's identity does: derived values
 * can use `useMemo(..., [snapshot])` with honest dependencies.
 */
export interface ModelSnapshot {
  readonly model: ModelState;
  readonly wteSnapshots: readonly WteSnapshot[];
}

let snapshot: ModelSnapshot = { model, wteSnapshots };

function emit() {
  snapshot = { model, wteSnapshots };
  for (const fn of listeners) fn();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ModelSnapshot {
  return snapshot;
}

/** Reset model, optionally with a new dataset. */
export function resetModel(datasetId?: string) {
  if (datasetId !== undefined) currentDatasetId = datasetId;
  model = createModel(getDataset(currentDatasetId).words);
  wteSnapshots = [];
  emit();
}

/** Notify React that the model was mutated in-place (e.g. after trainStep). */
export function notifyModelUpdate() {
  emit();
}

/** Non-reactive getter for use in event handlers (not render path). */
export function getModelTotalStep(): number {
  return model.totalStep;
}

/** Hook: subscribe to the store. Identity changes on every training step or reset. */
export function useModelSnapshot(): ModelSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Hook: subscribe to the model store. Re-renders when the model changes. */
export function useModel(): ModelState {
  return useModelSnapshot().model;
}
