import { useState } from "react";
import { type ModelState, generateName, type InferenceStep, tokenLabel } from "../engine/model";

interface GeneratedResult {
  name: string;
  steps: InferenceStep[];
}

export default function InferencePage({ model }: { model: ModelState }) {
  const [temperature, setTemperature] = useState(5); // x10
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [activeTrace, setActiveTrace] = useState<GeneratedResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const temp = temperature / 10;

  const generate = (count: number) => {
    const newResults: GeneratedResult[] = [];
    for (let i = 0; i < count; i++) {
      newResults.push(generateName(model, temp));
    }
    setResults((prev) => [...newResults, ...prev]);
    if (newResults[0]) {
      setActiveTrace(newResults[0]);
      setActiveStep(0);
    }
  };

  const step = activeTrace?.steps[activeStep];
  const top10 = step
    ? step.probs
        .map((p, i) => ({ id: i, char: tokenLabel(i), prob: p }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 12)
    : [];
  const maxProb = Math.max(...top10.map((t) => t.prob), 0.01);

  return (
    <>
      <h1 className="page-title">5. Inference</h1>
      <p className="page-desc">
        Apres l'entrainement, le modele genere de nouveaux noms qu'il n'a jamais vus. En partant de BOS,
        il predit le caractere suivant, en echantillonne un, le renvoie en entree, et repete jusqu'a
        ce que BOS apparaisse a nouveau.
      </p>

      {/* Controles */}
      <div className="panel">
        <div className="panel-title">Generer</div>
        {model.totalStep === 0 && (
          <div className="explain" style={{ borderLeftColor: "var(--orange)" }}>
            Le modele n'a pas encore ete entraine ! Va d'abord dans l'onglet <b>Entrainement</b>
            et entraine-le pendant au moins 200 etapes. Tu peux quand meme generer, mais les resultats
            seront du charabia aleatoire.
          </div>
        )}
        <div className="controls">
          <button className="btn" onClick={() => generate(1)}>
            Generer 1
          </button>
          <button className="btn btn-secondary" onClick={() => generate(10)}>
            Generer 10
          </button>
          <button className="btn btn-secondary" onClick={() => setResults([])}>
            Effacer
          </button>
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 8 }}>
            Temperature :
          </span>
          <input
            type="range"
            min="1"
            max="20"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span className="stat">
            <b>{temp.toFixed(1)}</b>
          </span>
        </div>
        <div className="explain">
          La <b>temperature</b> controle l'aleatoire. Basse (0.1) = choisit toujours le caractere
          le plus probable (ennuyeux mais sur). Haute (2.0) = choix plus aleatoires (creatif mais chaotique).
          Essaie differentes valeurs !
        </div>
      </div>

      {/* Noms generes */}
      <div className="panel">
        <div className="panel-title">Noms generes ({results.length})</div>
        <div className="gen-names">
          {results.map((r, i) => (
            <span
              key={i}
              className="gen-name"
              style={{
                cursor: "pointer",
                borderColor: activeTrace === r ? "var(--blue)" : undefined,
              }}
              onClick={() => {
                setActiveTrace(r);
                setActiveStep(0);
              }}
            >
              {r.name || "(vide)"}
            </span>
          ))}
          {results.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Clique sur "Generer" pour creer des noms...
            </span>
          )}
        </div>
      </div>

      {/* Trace etape par etape */}
      {activeTrace && (
        <div className="panel-row">
          <div className="panel">
            <div className="panel-title">
              Trace de generation : "{activeTrace.name}"
            </div>
            <div className="explain">
              Clique sur chaque etape pour voir ce que le modele "pensait" a cette position.
              Le modele pioche dans la distribution de probabilites a chaque etape.
            </div>

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {activeTrace.steps.map((s, i) => (
                <button
                  key={i}
                  className={`btn ${i === activeStep ? "" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => setActiveStep(i)}
                >
                  pos {s.pos} :{" "}
                  <span style={{ fontWeight: "bold" }}>{s.chosenChar}</span>
                </button>
              ))}
            </div>

            {step && (
              <div className="trace">
                {activeTrace.steps.map((s, i) => (
                  <div key={i} style={{ opacity: i === activeStep ? 1 : 0.5 }}>
                    <span style={{ color: "var(--text-dim)" }}>pos {s.pos} : </span>
                    <span className="candidates">
                      [{s.top5.map((t) => `${t.char}:${(t.prob * 100).toFixed(0)}%`).join(", ")}]
                    </span>
                    <span style={{ color: "var(--text-dim)" }}> → </span>
                    <span className="picked">'{s.chosenChar}'</span>
                    {s.chosenChar === "BOS" && (
                      <span style={{ color: "var(--red)" }}> FIN</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">
              Probabilites a la position {step?.pos ?? 0}
            </div>
            <div className="explain">
              Le modele produit ces probabilites pour le caractere suivant.
              Celui en <span style={{ color: "var(--green)" }}>vert</span> a ete echantillonne.
            </div>
            {top10.map((t) => (
              <div className="prob-row" key={t.id}>
                <span
                  className="prob-label"
                  style={{
                    color:
                      t.id === step?.chosenId
                        ? "var(--green)"
                        : t.char === "BOS"
                        ? "var(--red)"
                        : "var(--cyan)",
                    fontSize: t.char === "BOS" ? 9 : 13,
                  }}
                >
                  {t.char}
                </span>
                <div className="prob-bar-bg">
                  <div
                    className="prob-bar"
                    style={{
                      width: `${(t.prob / maxProb) * 100}%`,
                      background:
                        t.id === step?.chosenId
                          ? "var(--green)"
                          : t.char === "BOS"
                          ? "var(--red)"
                          : "var(--blue)",
                    }}
                  />
                </div>
                <span className="prob-val">
                  {(t.prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment fonctionne l'inference */}
      <div className="panel">
        <div className="panel-title">Comment fonctionne la generation</div>
        <div className="explain">
          <b>1.</b> Commencer avec le token BOS (signale "debut d'un nom").<br />
          <b>2.</b> L'envoyer dans le modele → obtenir les probabilites pour les 27 tokens suivants possibles.<br />
          <b>3.</b> <b>Echantillonner</b> un token de cette distribution (la temperature affecte l'aleatoire).<br />
          <b>4.</b> Si le token echantillonne est BOS → arreter (fin du nom).<br />
          <b>5.</b> Sinon, renvoyer le token echantillonne en entree et reprendre a l'etape 2.<br /><br />
          C'est ce qu'on appelle la <b>generation autoregressive</b> — le modele genere un token a la fois,
          chacun dependant de tous les tokens precedents. C'est exactement ainsi que fonctionne ChatGPT,
          juste a une echelle bien plus grande.
        </div>
      </div>
    </>
  );
}
