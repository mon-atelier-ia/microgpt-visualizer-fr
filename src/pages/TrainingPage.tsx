import { useEffect, useRef, useState } from "react";
import { trainStep, type TrainStepResult } from "../engine/model";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import {
  useModel,
  notifyModelUpdate,
  resetModel,
  pushWteSnapshot,
  getWteSnapshots,
  SNAPSHOT_INTERVAL,
} from "../modelStore";
import { memo } from "react";
import {
  TrainingControls,
  LossChartPanel,
  StepDetail,
  TrainingExplanation,
} from "./TrainingPanels";

export default memo(function TrainingPage() {
  const model = useModel();
  const [training, setTraining] = useState(false);
  const [lastResult, setLastResult] = useState<TrainStepResult | null>(null);
  const stopRef = useRef(false);
  const rafRef = useRef(0);

  // Cancel rAF on unmount to prevent memory leak (C-6)
  useEffect(() => {
    return () => {
      stopRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const runTraining = (steps: number) => {
    if (training) return;
    setTraining(true);
    stopRef.current = false;

    if (getWteSnapshots().length === 0) {
      pushWteSnapshot(model);
    }

    const targetSteps = model.totalStep + steps;
    let done = 0;

    const tick = () => {
      if (stopRef.current || done >= steps) {
        setTraining(false);
        notifyModelUpdate();
        return;
      }

      const batch = Math.min(5, steps - done);
      let result: TrainStepResult | null = null;
      for (let i = 0; i < batch; i++) {
        result = trainStep(model, targetSteps);
        if (model.totalStep % SNAPSHOT_INTERVAL === 0) {
          pushWteSnapshot(model);
        }
        done++;
      }
      if (result) setLastResult(result);
      notifyModelUpdate();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    stopRef.current = true;
    cancelAnimationFrame(rafRef.current);
  };

  return (
    <PageSection id="training" title="5. Entraînement">
      <p className="page-desc">
        À chaque étape : choisir un nom, envoyer ses caractères un par un,
        mesurer à quel point les prédictions sont fausses (<Term id="loss" />
        ), puis ajuster tous les <Term id="parametre" />s pour réduire l'erreur.
        Observe la <Term id="loss" /> descendre depuis ~3,3 (devinette
        aléatoire) à mesure que le modèle apprend les motifs des caractères.
      </p>

      <TrainingControls
        training={training}
        totalStep={model.totalStep}
        lastResult={lastResult}
        onTrain={runTraining}
        onStop={stop}
        onReset={resetModel}
      />

      <LossChartPanel
        lossHistory={model.lossHistory}
        lossCount={model.lossHistory.length}
      />

      {lastResult && <StepDetail result={lastResult} />}

      <TrainingExplanation paramCount={model.params.length} />
    </PageSection>
  );
});
