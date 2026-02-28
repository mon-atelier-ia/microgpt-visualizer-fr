import { useSyncExternalStore } from "react";
import { createModel, type ModelState } from "./engine/model";
import { getDataset, DEFAULT_DATASET_ID } from "./datasets";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentDatasetId = DEFAULT_DATASET_ID;
let model: ModelState = createModel(getDataset(currentDatasetId).words);
let version = 0;

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
