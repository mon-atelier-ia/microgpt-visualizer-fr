import { useRef, useState } from "react";
import { type ModelState, trainStep, type TrainStepResult, tokenLabel } from "../engine/model";
import LossChart from "../components/LossChart";

interface Props {
  model: ModelState;
  onUpdate: () => void;
  onReset: () => void;
}

export default function TrainingPage({ model, onUpdate, onReset }: Props) {
  const [training, setTraining] = useState(false);
  const [lastResult, setLastResult] = useState<TrainStepResult | null>(null);
  const stopRef = useRef(false);

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
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopRef.current = true;
  };

  return (
    <>
      <h1 className="page-title">4. Entrainement</h1>
      <p className="page-desc">
        A chaque etape : choisir un nom, envoyer ses caracteres un par un, mesurer a quel point les
        predictions sont fausses (loss), puis ajuster tous les parametres pour reduire l'erreur.
        Observe la loss descendre depuis ~3.3 (devinette aleatoire) a mesure que le modele apprend
        les motifs des caracteres.
      </p>

      {/* Controles */}
      <div className="panel">
        <div className="panel-title">Controles</div>
        <div className="controls">
          <button className="btn" onClick={() => runTraining(200)} disabled={training}>
            Entrainer 200 etapes
          </button>
          <button className="btn btn-secondary" onClick={() => runTraining(500)} disabled={training}>
            Entrainer 500
          </button>
          <button className="btn btn-secondary" onClick={() => runTraining(1000)} disabled={training}>
            Entrainer 1000
          </button>
          {training && (
            <button className="btn" style={{ background: "var(--red)" }} onClick={stop}>
              Arreter
            </button>
          )}
          <button className="btn btn-secondary" onClick={onReset} disabled={training}>
            Reinitialiser
          </button>
        </div>
        <div className="controls">
          <span className="stat">
            Etape : <b>{model.totalStep}</b>
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
          La <b>loss</b> mesure a quel point les predictions du modele sont fausses. Plus c'est bas = mieux c'est.<br />
          <span style={{ color: "var(--red)" }}>Ligne rouge pointillee</span> = devinette aleatoire (~3.30 pour 27 tokens).<br />
          <span style={{ color: "var(--green)" }}>Ligne verte</span> = moyenne mobile (tendance lissee).
        </div>
        <LossChart lossHistory={model.lossHistory} />
      </div>

      {/* Detail de la derniere etape */}
      {lastResult && (
        <div className="panel">
          <div className="panel-title">Detail de la derniere etape</div>
          <div className="explain">
            Le modele a vu le nom <b>"{lastResult.doc}"</b> et a essaye de predire chaque caractere suivant.
            Ci-dessous la loss a chaque position — plus la loss est elevee, plus le modele a ete surpris.
          </div>

          {/* Sequence de tokens */}
          <div className="token-flow" style={{ marginTop: 0, marginBottom: 12 }}>
            {lastResult.tokens.map((t, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 && <span className="arrow-sym">→</span>}
                <div className={`token-box ${t === 26 ? "bos" : ""}`} style={{ padding: "4px 6px" }}>
                  <span className="char" style={{ fontSize: 14 }}>{tokenLabel(t)}</span>
                  <span className="id">{t}</span>
                </div>
              </span>
            ))}
          </div>

          {/* Loss par position */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lastResult.perPositionLoss.map((loss, i) => {
              const from = tokenLabel(lastResult.tokens[i]);
              const to = tokenLabel(lastResult.tokens[i + 1]);
              const intensity = Math.min(1, loss / 4);
              return (
                <div
                  key={i}
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
                  <div style={{ color: "var(--red)", fontWeight: "bold", fontSize: 10 }}>
                    loss : {loss.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
            Loss moyenne : {lastResult.loss.toFixed(4)} | Plus la boite est rouge, plus le modele a ete surpris
          </div>
        </div>
      )}

      {/* Ce qui se passe */}
      <div className="panel">
        <div className="panel-title">Que se passe-t-il a chaque etape d'entrainement</div>
        <div className="explain">
          <b>1. Propagation avant :</b> envoyer chaque token dans le modele, obtenir les predictions du token suivant.<br />
          <b>2. Calcul de la loss :</b> mesurer a quel point chaque prediction etait fausse avec <code>-log(P(correct))</code>.<br />
          <b>3. Retropropagation :</b> calculer les gradients — dans quelle direction chacun des {model.params.length} parametres
          doit bouger pour reduire la loss ?<br />
          <b>4. Mise a jour Adam :</b> ajuster chaque parametre d'une petite quantite dans la bonne direction. Le taux
          d'apprentissage commence a 0.01 et decroit lineairement jusqu'a 0.<br /><br />
          Apres suffisamment d'etapes, le modele apprend des motifs comme : apres 'e', 'm' est probable ;
          les noms se terminent souvent par 'a', 'n', 'y' ; etc.
        </div>
      </div>
    </>
  );
}
