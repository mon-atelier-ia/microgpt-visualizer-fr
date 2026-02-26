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
      <h1 className="page-title">5. Inférence</h1>
      <p className="page-desc">
        Après l'entraînement, le modèle génère de nouveaux noms qu'il n'a jamais vus. En partant de BOS,
        il prédit le caractère suivant, en échantillonne un, le renvoie en entrée, et répète jusqu'à
        ce que BOS apparaisse à nouveau.
      </p>

      {/* Contrôles */}
      <div className="panel">
        <div className="panel-title">Générer</div>
        {model.totalStep === 0 && (
          <div className="explain" style={{ borderLeftColor: "var(--orange)" }}>
            Le modèle n'a pas encore été entraîné ! Va d'abord dans l'onglet <b>Entraînement</b>
            et entraîne-le pendant au moins 200 étapes. Tu peux quand même générer, mais les résultats
            seront du charabia aléatoire.
          </div>
        )}
        <div className="controls">
          <button className="btn" onClick={() => generate(1)}>
            Générer 1
          </button>
          <button className="btn btn-secondary" onClick={() => generate(10)}>
            Générer 10
          </button>
          <button className="btn btn-secondary" onClick={() => setResults([])}>
            Effacer
          </button>
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 8 }}>
            Température :
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
          La <b>température</b> contrôle l'aléatoire. Basse (0.1) = choisit toujours le caractère
          le plus probable (ennuyeux mais sûr). Haute (2.0) = choix plus aléatoires (créatif mais chaotique).
          Essaie différentes valeurs !
        </div>
      </div>

      {/* Noms générés */}
      <div className="panel">
        <div className="panel-title">Noms générés ({results.length})</div>
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
              Clique sur « Générer » pour créer des noms...
            </span>
          )}
        </div>
      </div>

      {/* Trace étape par étape */}
      {activeTrace && (
        <div className="panel-row">
          <div className="panel">
            <div className="panel-title">
              Trace de génération : « {activeTrace.name} »
            </div>
            <div className="explain">
              Clique sur chaque étape pour voir ce que le modèle « pensait » à cette position.
              Le modèle pioche dans la distribution de probabilités à chaque étape.
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
              Probabilités à la position {step?.pos ?? 0}
            </div>
            <div className="explain">
              Le modèle produit ces probabilités pour le caractère suivant.
              Celui en <span style={{ color: "var(--green)" }}>vert</span> a été échantillonné.
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

      {/* Comment fonctionne l'inférence */}
      <div className="panel">
        <div className="panel-title">Comment fonctionne la génération</div>
        <div className="explain">
          <b>1.</b> Commencer avec le token BOS (signale « début d'un nom »).<br />
          <b>2.</b> L'envoyer dans le modèle → obtenir les probabilités pour les 27 tokens suivants possibles.<br />
          <b>3.</b> <b>Échantillonner</b> un token de cette distribution (la température affecte l'aléatoire).<br />
          <b>4.</b> Si le token échantillonné est BOS → arrêter (fin du nom).<br />
          <b>5.</b> Sinon, renvoyer le token échantillonné en entrée et reprendre à l'étape 2.<br /><br />
          C'est ce qu'on appelle la <b>génération autorégressive</b> — le modèle génère un token à la fois,
          chacun dépendant de tous les tokens précédents. C'est exactement ainsi que fonctionne ChatGPT,
          juste à une échelle bien plus grande.
        </div>
      </div>
    </>
  );
}
