import { useState, useMemo, memo } from "react";
import {
  gptForward,
  uchars,
  charToId,
  tokenLabel,
  N_LAYER,
  BLOCK_SIZE,
} from "../engine/model";
import type { Value } from "../engine/autograd";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import ProbabilityBar from "../components/ProbabilityBar";
import FlowDiagram from "../components/FlowDiagram";
import VectorsPanel from "../components/VectorsPanel";
import NNDiagram from "../components/NNDiagram";
import MLPActivationPanel from "../components/MLPActivationPanel";
import { useModel } from "../modelStore";

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

  const weights = useMemo(() => {
    const sd = model.stateDict;
    const extract = (key: string) =>
      sd[key].map((row: Value[]) => row.map((v: Value) => v.data));
    return {
      attnWo: extract("layer0.attn_wo"),
      mlpFc1: extract("layer0.mlp_fc1"),
      mlpFc2: extract("layer0.mlp_fc2"),
      lmHead: extract("lm_head"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model is mutable: identity detects reset, totalStep detects training
  }, [model, model.totalStep]);

  const selectorControls = (
    <>
      <div className="controls">
        <span className="label-dim">Token :</span>
        {uchars.map((ch) => (
          <button
            key={ch}
            className={`btn btn-toggle btn-toggle--char ${ch === char ? "" : "btn-secondary"}`}
            onClick={() => setChar(ch)}
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="controls" style={{ marginTop: 8 }}>
        <span className="label-dim">Position :</span>
        {Array.from({ length: BLOCK_SIZE }, (_, i) => (
          <button
            key={i}
            className={`btn btn-toggle btn-toggle--char ${i === pos ? "" : "btn-secondary"}`}
            onClick={() => setPos(i)}
          >
            {i}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <PageSection id="forward" title="3. Propagation">
      <p className="page-desc">
        Observe un <Term id="token" /> traverser tout le modèle. Chaque étape
        transforme le <Term id="vecteur" /> de 16 nombres jusqu'à obtenir 27{" "}
        <Term id="logits" /> convertis en probabilités — un score pour chaque
        caractère suivant possible.
      </p>

      {/* 1. Contrôles */}
      <div className="panel">
        <div className="panel-title">Choisis l'entrée</div>
        {selectorControls}
      </div>

      {/* 2. Vecteurs détaillés + probabilités */}
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

      {/* 3. Diagramme de flux (boîtes abstraites) */}
      <FlowDiagram
        char={char}
        pos={pos}
        tokenId={tokenId}
        mlpActiveCount={trace.mlpActiveMask?.filter(Boolean).length ?? 0}
        topChar={top5[0]?.char ?? "?"}
        topProbPct={(top5[0]?.prob * 100).toFixed(0)}
      />

      {/* 4. Sélecteur dupliqué (proximité avec le diagramme NN) */}
      <div className="panel">{selectorControls}</div>

      {/* 5. NNDiagram — le réseau en action */}
      <div className="panel">
        <div className="panel-title">Le réseau en action</div>
        <div className="explain">
          Voici le modèle complet. Chaque cercle est un neurone, chaque trait
          une connexion pondérée. Les couleurs montrent les activations réelles
          : vert = positif, rouge = négatif. Survole un neurone pour voir ses
          connexions. Change le token ou la position pour observer comment les
          activations changent.
        </div>
        <div className="nn-canvas-wrap">
          <NNDiagram
            combined={trace.combined}
            afterAttn={trace.afterAttn || []}
            mlpHidden={trace.mlpHidden || []}
            mlpActiveMask={trace.mlpActiveMask || []}
            afterMlp={trace.afterMlp || []}
            probs={trace.probs}
            weights={weights}
          />
        </div>
      </div>

      {/* 6. Détail MLP */}
      {trace.mlpHidden && (
        <MLPActivationPanel
          mlpHidden={trace.mlpHidden}
          mlpActiveMask={trace.mlpActiveMask}
        />
      )}
    </PageSection>
  );
});
