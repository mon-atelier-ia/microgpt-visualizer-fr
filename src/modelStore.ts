import { useSyncExternalStore } from "react";
import { createModel, type ModelState } from "./engine/model";
import { getDataset, DEFAULT_DATASET_ID } from "./datasets";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentDatasetId = DEFAULT_DATASET_ID;
let model: ModelState = createModel(getDataset(currentDatasetId).words);
let version = 0;

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
  wteSnapshots.push({ step: state.totalStep, wte: snap });
}

/**
 * Get all snapshots (for PCA animation). Returns shallow copy to avoid memo bypass.
 * INVARIANT: callers of pushWteSnapshot must call notifyModelUpdate() after,
 * so that components re-render and read the updated snapshot list.
 */
export function getWteSnapshots(): WteSnapshot[] {
  return [...wteSnapshots];
}

function emit() {
  version++;
  for (const fn of listeners) fn();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return version;
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

/** Hook: subscribe to the model store. Re-renders when the model changes. */
export function useModel(): ModelState {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return model;
}
