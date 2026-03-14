import { tokenLabel, type TrainStepResult } from "../engine/model";
import Term from "../components/Term";
import LossChart from "../components/LossChart";
import LossCell from "../components/LossCell";
import { memo } from "react";

/* ── Training controls ─────────────────────────────── */

interface TrainingControlsProps {
  training: boolean;
  totalStep: number;
  lastResult: TrainStepResult | null;
  onTrain: (steps: number) => void;
  onStop: () => void;
  onReset: () => void;
}

export const TrainingControls = memo(function TrainingControls({
  training,
  totalStep,
  lastResult,
  onTrain,
  onStop,
  onReset,
}: TrainingControlsProps) {
  return (
    <div className="panel">
      <div className="panel-title">Contrôles</div>
      <div className="controls">
        <button
          type="button"
          className="btn"
          onClick={() => onTrain(200)}
          disabled={training}
        >
          Entraîner 200 étapes
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onTrain(500)}
          disabled={training}
        >
          Entraîner 500
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onTrain(1000)}
          disabled={training}
        >
          Entraîner 1000
        </button>
        {training && (
          <button type="button" className="btn btn--danger" onClick={onStop}>
            Arrêter
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReset}
          disabled={training}
        >
          Réinitialiser
        </button>
      </div>
      <div className="controls">
        <span className="stat">
          Étape : <b>{totalStep}</b>
        </span>
        <span className="stat">
          Loss : <b>{lastResult ? lastResult.loss.toFixed(4) : "—"}</b>
        </span>
        <span className="stat">
          LR : <b>{lastResult ? lastResult.lr.toFixed(6) : "0.010000"}</b>
        </span>
        <span className="stat">
          Nom : <b>{lastResult?.doc ?? "—"}</b>
        </span>
      </div>
    </div>
  );
});

/* ── Loss chart panel ──────────────────────────────── */

interface LossChartPanelProps {
  lossHistory: number[];
}

export const LossChartPanel = memo(function LossChartPanel({
  lossHistory,
}: LossChartPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">Loss au fil du temps</div>
      <div className="explain">
        La{" "}
        <b>
          <Term id="loss" />
        </b>{" "}
        mesure à quel point les prédictions du modèle sont fausses. Plus c'est
        bas = mieux c'est.
        <br />
        <span className="text-red">Ligne rouge pointillée</span> = devinette
        aléatoire (~3,30 pour 27 <Term id="token" />
        s).
        <br />
        <span className="text-green">Ligne verte</span> ={" "}
        <Term id="moyenne-mobile" /> (tendance lissée).
      </div>
      <LossChart lossHistory={lossHistory} />
    </div>
  );
});

/* ── Step detail panel ─────────────────────────────── */

interface StepDetailProps {
  result: TrainStepResult;
}

export const StepDetail = memo(function StepDetail({
  result,
}: StepDetailProps) {
  return (
    <div className="panel">
      <div className="panel-title">Détail de la dernière étape</div>
      <div className="explain">
        Le modèle a vu le nom <b>"{result.doc}"</b> et a essayé de prédire
        chaque caractère suivant. Ci-dessous la <Term id="loss" /> à chaque
        position — plus elle est élevée, plus le modèle a été surpris.
      </div>

      <div className="token-flow mt-0-mb-12">
        {result.tokens.map((t, i) => (
          <span key={`${i}-${t}`} className="d-contents">
            {i > 0 && <span className="arrow-sym">→</span>}
            <div
              className={`token-box token-box--compact ${t === 26 ? "bos" : ""}`}
            >
              <span className="char">{tokenLabel(t)}</span>
              <span className="id">{t}</span>
            </div>
          </span>
        ))}
      </div>

      <div className="controls controls--snug">
        {result.perPositionLoss.map((loss, i) => (
          <LossCell
            key={`${i}-${result.tokens[i]}-${result.tokens[i + 1]}`}
            loss={loss}
            from={tokenLabel(result.tokens[i])}
            to={tokenLabel(result.tokens[i + 1])}
          />
        ))}
      </div>
      <div className="label-dim mt-8">
        Loss moyenne : {result.loss.toFixed(4)} | Plus la boîte est rouge, plus
        le modèle a été surpris
      </div>
    </div>
  );
});

/* ── Training explanation panel ────────────────────── */

interface TrainingExplanationProps {
  paramCount: number;
}

export const TrainingExplanation = memo(function TrainingExplanation({
  paramCount,
}: TrainingExplanationProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        Que se passe-t-il à chaque étape d'entraînement
      </div>
      <div className="explain">
        <b>1. Propagation avant :</b> envoyer chaque <Term id="token" /> dans le
        modèle, obtenir les prédictions du token suivant.
        <br />
        <b>
          2. Calcul de la <Term id="loss" /> :
        </b>{" "}
        mesurer à quel point chaque prédiction était fausse avec{" "}
        <code>-log(P(correct))</code>.<br />
        <b>
          3. <Term id="retropropagation" /> :
        </b>{" "}
        calculer les <Term id="gradient" />s — dans quelle direction chacun des{" "}
        {paramCount} <Term id="parametre" />s doit bouger pour réduire la loss ?
        <br />
        <b>
          4. Mise à jour <Term id="adam" /> :
        </b>{" "}
        ajuster chaque paramètre d'une petite quantité dans la bonne direction.
        Le <Term id="taux-apprentissage" /> commence à 0,01 et décroît
        linéairement jusqu'à 0.
        <br />
        <br />
        Après suffisamment d'étapes, le modèle apprend des motifs comme : après
        'e', 'm' est probable ; les noms se terminent souvent par 'a', 'n', 'y'
        ; etc.
      </div>
    </div>
  );
});
