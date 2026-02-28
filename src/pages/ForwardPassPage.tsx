import { useState, useMemo } from "react";
import {
  gptForward,
  uchars,
  charToId,
  tokenLabel,
  N_LAYER,
  N_HEAD,
} from "../engine/model";
import type { Value } from "../engine/autograd";
import { VectorBar } from "../components/Heatmap";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import ProbabilityBar from "../components/ProbabilityBar";
import HeatCell from "../components/HeatCell";
import NeuronCell from "../components/NeuronCell";
import { useModel } from "../modelStore";
import { memo } from "react";

export default memo(function ForwardPassPage() {
  const model = useModel();
  const [char, setChar] = useState("e");
  const [pos, setPos] = useState(0);

  const tokenId = charToId[char] ?? 0;
  const trace = useMemo(() => {
    const keys = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    const vals = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    const result = gptForward(tokenId, pos, keys, vals, model, true);
    return result.trace!;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model is mutable (engine): identity detects reset, totalStep detects training
  }, [tokenId, pos, model, model.totalStep]);

  const top5 = useMemo(
    () =>
      trace.probs
        .map((p, i) => ({ id: i, char: tokenLabel(i), prob: p }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 10),
    [trace],
  );
  const maxProb = Math.max(...top5.map((t) => t.prob), 0.01);

  return (
    <PageSection id="forward" title="3. Propagation avant">
      <p className="page-desc">
        Observe un <Term id="token" /> traverser tout le modèle. Chaque étape
        transforme le <Term id="vecteur" /> de 16 nombres jusqu'à obtenir 27{" "}
        <Term id="logits" /> convertis en probabilités — un score pour chaque
        caractère suivant possible.
      </p>

      {/* Contrôles */}
      <div className="panel">
        <div className="panel-title">Choisis l'entrée</div>
        <div className="controls">
          <span className="label-dim">Token :</span>
          <div className="controls" style={{ gap: 4, marginBottom: 0 }}>
            {uchars.slice(0, 10).map((ch) => (
              <button
                key={ch}
                className={`btn btn-toggle--sm ${ch === char ? "" : "btn-secondary"}`}
                onClick={() => setChar(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
          <label
            htmlFor="forward-pos"
            className="label-dim"
            style={{ marginLeft: 12 }}
          >
            Position :
          </label>
          <select
            id="forward-pos"
            className="select-native"
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i} value={i}>
                pos {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flux étape par étape */}
      <div className="panel">
        <div className="panel-title">Les données traversent le modèle</div>
        <div className="explain">
          Chaque boîte montre les données à cette étape. Les 16 nombres sont
          transformés à chaque étape. Les couleurs montrent les valeurs :{" "}
          <span className="text-red">négatif</span> à{" "}
          <span className="text-green">positif</span>.
        </div>

        <div className="flow">
          <div className="flow-step">
            <div className="label">Token '{char}'</div>
            <div className="values">
              wte[{tokenId}]<br />
              Chercher le plongement
              <br />
              de ce caractère dans la table
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">Position {pos}</div>
            <div className="values">
              wpe[{pos}]<br />
              Chercher le plongement
              <br />
              de cette position dans la table
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">tok + pos</div>
            <div className="values">
              Addition élément par élément
              <br />
              Encode maintenant
              <br />
              le « quoi » et le « où »
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">
              <Term id="rmsnorm" />
            </div>
            <div className="values">
              Normaliser le vecteur
              <br />
              Maintient les valeurs
              <br />
              dans une plage stable
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">
              <Term id="attention" />
            </div>
            <div className="values">
              Q = "que cherche-je ?"
              <br />
              K = "que contiens-je ?"
              <br />
              V = "qu'ai-je à offrir ?"
              <br />
              {N_HEAD} têtes, chacune dim {16 / N_HEAD}
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">
              <Term id="mlp" />
            </div>
            <div className="values">
              Linéaire → <Term id="relu" /> → Linéaire
              <br />
              Expansé à 64 dims,
              <br />
              puis retour à 16
              <br />
              <span className="highlight">
                {trace.mlpActiveMask?.filter(Boolean).length}/64{" "}
                <Term id="neurone" />s actifs
              </span>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="label">Sortie</div>
            <div className="values">
              lm_head : 16 → 27 <Term id="logits" />
              <br />
              <Term id="softmax" /> → probabilités
              <br />
              <span className="highlight">
                Top : '{top5[0]?.char}' {(top5[0]?.prob * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vecteurs détaillés */}
      <div className="panel-row">
        <div className="panel">
          <div className="panel-title">Vecteurs intermédiaires (16 dims)</div>
          <VectorBar
            values={trace.tokEmb}
            label={`Plongement de token : wte['${char}']`}
          />
          <VectorBar
            values={trace.posEmb}
            label={`Plongement de position : wpe[${pos}]`}
          />
          <VectorBar values={trace.combined} label="Combiné (tok + pos)" />
          <VectorBar values={trace.afterNorm} label="Après RMSNorm" />
          <VectorBar
            values={trace.afterAttn || []}
            label="Après Attention + Résiduel"
          />
          <VectorBar
            values={trace.afterMlp || []}
            label="Après MLP + Résiduel"
          />
        </div>

        <div className="panel">
          <div className="panel-title">
            Sortie : probabilités du <Term id="token" /> suivant
          </div>
          <div className="explain">
            La prédiction du modèle pour le caractère qui vient après{" "}
            <b>'{char}'</b> à la position {pos}. Plus la barre est grande = plus
            probable.
          </div>
          <ProbabilityBar
            items={top5}
            maxProb={maxProb}
            labelStyle={(t) =>
              t.char === "BOS" ? { color: "var(--red)", fontSize: 10 } : {}
            }
          />
        </div>
      </div>

      {/* Poids d'attention */}
      {trace.attnWeights && (
        <div className="panel">
          <div className="panel-title">Poids d'attention ({N_HEAD} têtes)</div>
          <div className="explain">
            Chaque tête apprend à se concentrer sur des aspects différents.
            Puisque c'est le premier token, toutes les têtes ont un poids de{" "}
            <b>1.0</b> sur elles-mêmes (rien d'autre à observer). Avec plus de
            tokens dans la séquence, l'attention serait répartie sur les tokens
            précédents.
          </div>
          <div className="attn-heads">
            {trace.attnWeights.map((hw, h) => (
              <div key={h}>
                <div className="label-dim attn-head-label">Tête {h}</div>
                <div className="attn-head-row">
                  {hw.map((w, t) => (
                    <HeatCell key={t} value={w} label={w.toFixed(2)} />
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
          <div className="panel-title">
            Couche cachée <Term id="mlp" /> (64 <Term id="neurone" />
            s)
          </div>
          <div className="explain">
            Après la couche linéaire qui expanse de 16 → 64{" "}
            <Term id="dimension" />
            s, l'activation{" "}
            <b>
              <Term id="relu" />
            </b>{" "}
            met toutes les valeurs négatives à zéro. Seuls les{" "}
            <Term id="neurone" />s « actifs » (verts) laissent passer
            l'information. C'est ainsi que le modèle crée des représentations
            non linéaires.
          </div>
          <div className="neuron-grid">
            {trace.mlpHidden.map((v, i) => (
              <NeuronCell key={i} value={v} index={i} />
            ))}
          </div>
          <div className="label-dim" style={{ fontSize: 11, marginTop: 4 }}>
            {trace.mlpActiveMask.filter(Boolean).length} / 64{" "}
            <Term id="neurone" />s actifs après <Term id="relu" />
          </div>
        </div>
      )}
    </PageSection>
  );
});
