import { useState, useRef, useCallback } from "react";
import { DEFAULT_DATASET_ID } from "../datasets";
import { resetModel, getModelTotalStep } from "../modelStore";

export function useDatasetManager() {
  const [datasetId, setDatasetId] = useState(DEFAULT_DATASET_ID);
  const [pendingDatasetId, setPendingDatasetId] = useState<string | null>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const handleDatasetChange = useCallback(
    (id: string) => {
      if (id === datasetId) return;
      if (getModelTotalStep() > 0) {
        setPendingDatasetId(id);
        confirmRef.current?.showModal();
        return;
      }
      setDatasetId(id);
      resetModel(id);
    },
    [datasetId],
  );

  const confirmChange = useCallback(() => {
    if (pendingDatasetId) {
      setDatasetId(pendingDatasetId);
      resetModel(pendingDatasetId);
    }
    setPendingDatasetId(null);
    confirmRef.current?.close();
  }, [pendingDatasetId]);

  const cancelChange = useCallback(() => {
    setPendingDatasetId(null);
    confirmRef.current?.close();
  }, []);

  return {
    datasetId,
    confirmRef,
    handleDatasetChange,
    confirmChange,
    cancelChange,
  };
}
