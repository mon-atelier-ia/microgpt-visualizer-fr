import { useState, useMemo } from "react";
import { type ModelState, gptForward, uchars, charToId, tokenLabel, N_LAYER, N_HEAD } from "../engine/model";
import { VectorBar } from "../components/Heatmap";

interface Props {
  model: ModelState;
}

export default function ForwardPassPage({ model }: Props) {
  const [char, setChar] = useState("e");
  const [pos, setPos] = useState(0);

  const tokenId = charToId[char] ?? 0;
  const trace = useMemo(() => {
    const keys = Array.from({ length: N_LAYER }, () => [] as any[]);
    const vals = Array.from({ length: N_LAYER }, () => [] as any[]);
    const result = gptForward(tokenId, pos, keys, vals, model, true);
    return result.trace!;
  }, [model, char, pos, model.totalStep]);

  const top5 = trace.probs
    .map((p, i) => ({ id: i, char: tokenLabel(i), prob: p }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 10);
  const maxProb = Math.max(...top5.map((t) => t.prob), 0.01);

  return (
    <>
      <h1 className="page-title">3. Propagation avant</h1>
      <p className="page-desc">
        Observe un token traverser tout le modele. Chaque etape transforme le vecteur de 16 nombres
        jusqu'a obtenir 27 scores de probabilite — un pour chaque caractere suivant possible.
      </p>

      {/* Controles */}
      <div className="panel">
        <div className="panel-title">Choisis l'entree</div>
        <div className="controls">
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Token :</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {uchars.slice(0, 10).map((ch) => (
              <button
                key={ch}
                className={`btn ${ch === char ? "" : "btn-secondary"}`}
                style={{ padding: "3px 8px", minWidth: 28 }}
                onClick={() => setChar(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 12 }}>Position :</span>
          <select
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            style={{
              background: "var(--surface2)", border: "1px solid var(--border-hover)",
              color: "var(--text)", padding: "4px 8px", borderRadius: 4, fontFamily: "inherit",
            }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i} value={i}>pos {i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flux etape par etape */}
      <div className="panel">
        <div className="panel-title">Les donnees traversent le modele</div>
        <div className="explain">
          Chaque boite montre les donnees a cette etape. Les 16 nombres sont transformes a chaque etape.
          Les couleurs montrent les valeurs : <span style={{ color: "var(--red)" }}>negatif</span> a{" "}
          <span style={{ color: "var(--green)" }}>positif</span>.
        </div>

        <div className="flow">
          <div className="flow-step">
            <div className="label">Token '{char}'</div>
            <div className="values">
              wte[{tokenId}]<br />
              Chercher le plongement<br />de ce caractere dans la table
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">Position {pos}</div>
            <div className="values">
              wpe[{pos}]<br />
              Chercher le plongement<br />de cette position dans la table
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">tok + pos</div>
            <div className="values">
              Addition element par element<br />
              Encode maintenant<br />le "quoi" et le "ou"
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">RMSNorm</div>
            <div className="values">
              Normaliser le vecteur<br />
              Maintient les valeurs<br />dans une plage stable
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">Attention</div>
            <div className="values">
              Q = "que cherche-je ?"<br />
              K = "que contiens-je ?"<br />
              V = "qu'ai-je a offrir ?"<br />
              {N_HEAD} tetes, chacune dim {16 / N_HEAD}
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">MLP</div>
            <div className="values">
              Lineaire → ReLU → Lineaire<br />
              Expanse a 64 dims,<br />puis retour a 16<br />
              <span className="highlight">{trace.mlpActiveMask?.filter(Boolean).length}/64 neurones actifs</span>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">Sortie</div>
            <div className="values">
              lm_head : 16 → 27 logits<br />
              softmax → probabilites<br />
              <span className="highlight">Top : '{top5[0]?.char}' {(top5[0]?.prob * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vecteurs detailles */}
      <div className="panel-row">
        <div className="panel">
          <div className="panel-title">Vecteurs intermediaires (16 dims)</div>
          <VectorBar values={trace.tokEmb} label={`Plongement de token : wte['${char}']`} />
          <VectorBar values={trace.posEmb} label={`Plongement de position : wpe[${pos}]`} />
          <VectorBar values={trace.combined} label="Combine (tok + pos)" />
          <VectorBar values={trace.afterNorm} label="Apres RMSNorm" />
          <VectorBar values={trace.afterAttn || []} label="Apres Attention + Residuel" />
          <VectorBar values={trace.afterMlp || []} label="Apres MLP + Residuel" />
        </div>

        <div className="panel">
          <div className="panel-title">Sortie : probabilites du token suivant</div>
          <div className="explain">
            La prediction du modele pour le caractere qui vient apres <b>'{char}'</b> a la position {pos}.
            Plus la barre est grande = plus probable.
          </div>
          {top5.map((t) => (
            <div className="prob-row" key={t.id}>
              <span className="prob-label" style={t.char === "BOS" ? { color: "var(--red)", fontSize: 10 } : {}}>
                {t.char}
              </span>
              <div className="prob-bar-bg">
                <div
                  className="prob-bar"
                  style={{
                    width: `${(t.prob / maxProb) * 100}%`,
                    background: t.char === "BOS" ? "var(--red)" : "var(--blue)",
                  }}
                />
              </div>
              <span className="prob-val">{(t.prob * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Poids d'attention */}
      {trace.attnWeights && (
        <div className="panel">
          <div className="panel-title">Poids d'attention ({N_HEAD} tetes)</div>
          <div className="explain">
            Chaque tete apprend a se concentrer sur des aspects differents. Puisque c'est le premier
            token, toutes les tetes ont un poids de <b>1.0</b> sur elles-memes (rien d'autre a observer).
            Avec plus de tokens dans la sequence, l'attention serait repartie sur les tokens precedents.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {trace.attnWeights.map((hw, h) => (
              <div key={h}>
                <div style={{ fontSize: 11, color: "var(--purple)", marginBottom: 4 }}>Tete {h}</div>
                <div style={{ display: "flex", gap: 2 }}>
                  {hw.map((w, t) => (
                    <div
                      key={t}
                      style={{
                        width: 28, height: 28, borderRadius: 4,
                        background: `rgba(122, 162, 247, ${w})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, color: w > 0.3 ? "#fff" : "var(--text-dim)",
                      }}
                    >
                      {w.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activation MLP */}
      {trace.mlpHidden && (
        <div className="panel">
          <div className="panel-title">Couche cachee MLP (64 neurones)</div>
          <div className="explain">
            Apres la couche lineaire qui expanse de 16 → 64 dimensions, l'activation <b>ReLU</b> met
            toutes les valeurs negatives a zero. Seuls les neurones "actifs" (verts) laissent passer
            l'information. C'est ainsi que le modele cree des representations non lineaires.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {trace.mlpHidden.map((v, i) => (
              <div
                key={i}
                style={{
                  width: 20, height: 20, borderRadius: 3, fontSize: 6,
                  background: v > 0 ? `rgba(158, 206, 106, ${Math.min(1, v * 2)})` : "var(--surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: v > 0 ? "#fff" : "var(--text-dim)",
                }}
                title={`neurone ${i} : ${v.toFixed(4)} ${v > 0 ? "(actif)" : "(inactif)"}`}
              >
                {v > 0 ? "+" : "·"}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
            {trace.mlpActiveMask.filter(Boolean).length} / 64 neurones actifs apres ReLU
          </div>
        </div>
      )}
    </>
  );
}
