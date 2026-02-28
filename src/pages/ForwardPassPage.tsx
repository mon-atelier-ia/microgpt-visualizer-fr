import { useState, useMemo } from "react";
import {
  gptForward,
  uchars,
  charToId,
  tokenLabel,
  N_LAYER,
} from "../engine/model";
import type { Value } from "../engine/autograd";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import ProbabilityBar from "../components/ProbabilityBar";
import FlowDiagram from "../components/FlowDiagram";
import VectorsPanel from "../components/VectorsPanel";
import AttentionWeightsPanel from "../components/AttentionWeightsPanel";
import MLPActivationPanel from "../components/MLPActivationPanel";
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
          <div className="controls controls--tight">
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
          <label htmlFor="forward-pos" className="label-dim ml-12">
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

      <FlowDiagram
        char={char}
        pos={pos}
        tokenId={tokenId}
        mlpActiveCount={trace.mlpActiveMask?.filter(Boolean).length ?? 0}
        topChar={top5[0]?.char ?? "?"}
        topProbPct={(top5[0]?.prob * 100).toFixed(0)}
      />

      {/* Vecteurs détaillés + probabilités */}
      <div className="panel-row">
        <VectorsPanel
          char={char}
          pos={pos}
          tokEmb={trace.tokEmb}
          posEmb={trace.posEmb}
          combined={trace.combined}
          afterNorm={trace.afterNorm}
          afterAttn={trace.afterAttn || []}
          afterMlp={trace.afterMlp || []}
        />

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

      {trace.attnWeights && (
        <AttentionWeightsPanel attnWeights={trace.attnWeights} />
      )}

      {trace.mlpHidden && (
        <MLPActivationPanel
          mlpHidden={trace.mlpHidden}
          mlpActiveMask={trace.mlpActiveMask}
        />
      )}
    </PageSection>
  );
});
