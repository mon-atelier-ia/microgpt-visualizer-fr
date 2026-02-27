import { useEffect, useRef, useState } from "react";
import {
  type ModelState,
  trainStep,
  type TrainStepResult,
  tokenLabel,
} from "../engine/model";
import LossChart from "../components/LossChart";
import Term from "../components/Term";
import PageSection from "../components/PageSection";

interface Props {
  model: ModelState;
  onUpdate: () => void;
  onReset: () => void;
}

export default function TrainingPage({ model, onUpdate, onReset }: Props) {
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

    const targetSteps = model.totalStep + steps;
    let done = 0;

    const tick = () => {
      if (stopRef.current || done >= steps) {
        setTraining(false);
        onUpdate();
        return;
      }

      const batch = Math.min(5, steps - done);
      let result: TrainStepResult | null = null;
      for (let i = 0; i < batch; i++) {
        result = trainStep(model, targetSteps);
        done++;
      }
      if (result) setLastResult(result);
      onUpdate();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    stopRef.current = true;
    cancelAnimationFrame(rafRef.current);
  };

  return (
    <PageSection id="training" title="4. Entraînement">
      <p className="page-desc">
        À chaque étape : choisir un nom, envoyer ses caractères un par un,
        mesurer à quel point les prédictions sont fausses (<Term id="loss" />
        ), puis ajuster tous les <Term id="parametre" />s pour réduire l'erreur.
        Observe la <Term id="loss" /> descendre depuis ~3,3 (devinette
        aléatoire) à mesure que le modèle apprend les motifs des caractères.
      </p>

      {/* Contrôles */}
      <div className="panel">
        <div className="panel-title">Contrôles</div>
        <div className="controls">
          <button
            className="btn"
            onClick={() => runTraining(200)}
            disabled={training}
          >
            Entraîner 200 étapes
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runTraining(500)}
            disabled={training}
          >
            Entraîner 500
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runTraining(1000)}
            disabled={training}
          >
            Entraîner 1000
          </button>
          {training && (
            <button className="btn btn--danger" onClick={stop}>
              Arrêter
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={onReset}
            disabled={training}
          >
            Réinitialiser
          </button>
        </div>
        <div className="controls">
          <span className="stat">
            Étape : <b>{model.totalStep}</b>
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

      {/* Courbe de loss */}
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
          <span style={{ color: "var(--red)" }}>Ligne rouge pointillée</span> =
          devinette aléatoire (~3,30 pour 27 <Term id="token" />
          s).
          <br />
          <span style={{ color: "var(--green)" }}>Ligne verte</span> ={" "}
          <Term id="moyenne-mobile" /> (tendance lissée).
        </div>
        <LossChart lossHistory={model.lossHistory} />
      </div>

      {/* Détail de la dernière étape */}
      {lastResult && (
        <div className="panel">
          <div className="panel-title">Détail de la dernière étape</div>
          <div className="explain">
            Le modèle a vu le nom <b>"{lastResult.doc}"</b> et a essayé de
            prédire chaque caractère suivant. Ci-dessous la <Term id="loss" /> à
            chaque position — plus elle est élevée, plus le modèle a été
            surpris.
          </div>

          {/* Séquence de tokens */}
          <div
            className="token-flow"
            style={{ marginTop: 0, marginBottom: 12 }}
          >
            {lastResult.tokens.map((t, i) => (
              <span key={`${i}-${t}`} style={{ display: "contents" }}>
                {i > 0 && <span className="arrow-sym">→</span>}
                <div
                  className={`token-box ${t === 26 ? "bos" : ""}`}
                  style={{ padding: "4px 6px" }}
                >
                  <span className="char" style={{ fontSize: 14 }}>
                    {tokenLabel(t)}
                  </span>
                  <span className="id">{t}</span>
                </div>
              </span>
            ))}
          </div>

          {/* Loss par position */}
          <div className="controls" style={{ gap: 6, marginBottom: 0 }}>
            {lastResult.perPositionLoss.map((loss, i) => {
              const from = tokenLabel(lastResult.tokens[i]);
              const to = tokenLabel(lastResult.tokens[i + 1]);
              const intensity = Math.min(1, loss / 4);
              return (
                <div
                  key={`${i}-${from}-${to}`}
                  style={{
                    padding: "6px 10px",
                    background: `rgba(247, 118, 142, ${intensity * 0.3})`,
                    border: `1px solid rgba(247, 118, 142, ${intensity * 0.5})`,
                    borderRadius: 6,
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--cyan)" }}>{from}</span>
                    <span style={{ color: "var(--text-dim)" }}> → </span>
                    <span style={{ color: "var(--green)" }}>{to}</span>
                  </div>
                  <div
                    style={{
                      color: "var(--red)",
                      fontWeight: "bold",
                      fontSize: 10,
                    }}
                  >
                    loss : {loss.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="label-dim" style={{ fontSize: 11, marginTop: 8 }}>
            Loss moyenne : {lastResult.loss.toFixed(4)} | Plus la boîte est
            rouge, plus le modèle a été surpris
          </div>
        </div>
      )}

      {/* Ce qui se passe */}
      <div className="panel">
        <div className="panel-title">
          Que se passe-t-il à chaque étape d'entraînement
        </div>
        <div className="explain">
          <b>1. Propagation avant :</b> envoyer chaque <Term id="token" /> dans
          le modèle, obtenir les prédictions du token suivant.
          <br />
          <b>
            2. Calcul de la <Term id="loss" /> :
          </b>{" "}
          mesurer à quel point chaque prédiction était fausse avec{" "}
          <code>-log(P(correct))</code>.<br />
          <b>
            3. <Term id="retropropagation" /> :
          </b>{" "}
          calculer les <Term id="gradient" />s — dans quelle direction chacun
          des {model.params.length} <Term id="parametre" />s doit bouger pour
          réduire la loss ?<br />
          <b>
            4. Mise à jour <Term id="adam" /> :
          </b>{" "}
          ajuster chaque paramètre d'une petite quantité dans la bonne
          direction. Le <Term id="taux-apprentissage" /> commence à 0,01 et
          décroît linéairement jusqu'à 0.
          <br />
          <br />
          Après suffisamment d'étapes, le modèle apprend des motifs comme :
          après 'e', 'm' est probable ; les noms se terminent souvent par 'a',
          'n', 'y' ; etc.
        </div>
      </div>
    </PageSection>
  );
}
