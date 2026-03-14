import { useState, useMemo, memo } from "react";
import {
  gptForward,
  uchars,
  charToId,
  tokenLabel,
  N_LAYER,
  BLOCK_SIZE,
} from "../engine/model";
import type { ModelState } from "../engine/model";
import type { Value } from "../engine/autograd";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import ProbabilityBar from "../components/ProbabilityBar";
import FlowDiagram from "../components/FlowDiagram";
import VectorsPanel from "../components/VectorsPanel";
import NNDiagram from "../components/NNDiagram";
import MLPActivationPanel from "../components/MLPActivationPanel";
import { useModelDerived } from "../useModelDerived";

function CharPosSelector({
  char,
  pos,
  onCharChange,
  onPosChange,
}: {
  char: string;
  pos: number;
  onCharChange: (ch: string) => void;
  onPosChange: (p: number) => void;
}) {
  return (
    <>
      <div className="controls">
        <span className="label-dim">Token :</span>
        {uchars.map((ch) => (
          <button
            key={ch}
            className={`btn btn-toggle btn-toggle--char ${ch === char ? "" : "btn-secondary"}`}
            onClick={() => onCharChange(ch)}
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
            onClick={() => onPosChange(i)}
          >
            {i}
          </button>
        ))}
      </div>
    </>
  );
}

function ProbabilityPanel({
  char,
  pos,
  top5,
  maxProb,
}: {
  char: string;
  pos: number;
  top5: { id: number; char: string; prob: number }[];
  maxProb: number;
}) {
  return (
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
  );
}

function NNDiagramPanel({
  trace,
  weights,
}: {
  trace: ReturnType<typeof gptForward>["trace"] & {};
  weights: {
    attnWo: number[][];
    mlpFc1: number[][];
    mlpFc2: number[][];
    lmHead: number[][];
  };
}) {
  return (
    <div className="panel">
      <div className="panel-title">Le réseau en action</div>
      <div className="explain">
        Voici le modèle complet. Chaque cercle est un neurone, chaque trait une
        connexion pondérée. Les couleurs montrent les activations réelles : vert
        = positif, rouge = négatif. Survole un neurone pour voir ses connexions.
        Change le token ou la position pour observer comment les activations
        changent.
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
      <p className="page-desc">
        💡 Les connexions autour du MLP (16→64→16) apparaissent plus denses que
        les autres sections (16→16). C'est normal : le MLP a 4× plus de
        connexions réelles (1 024 vs 256). Chaque trait est une vraie connexion
        pondérée — le diagramme les montre toutes fidèlement.
      </p>
    </div>
  );
}

function computeForwardTrace(tokenId: number, pos: number, model: ModelState) {
  const keys = Array.from({ length: N_LAYER }, () => [] as Value[][]);
  const vals = Array.from({ length: N_LAYER }, () => [] as Value[][]);
  return gptForward(tokenId, pos, keys, vals, model, true).trace!;
}

function computeTop(probs: number[], n: number) {
  return probs
    .map((p, i) => ({ id: i, char: tokenLabel(i), prob: p }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, n);
}

function extractWeights(sd: Record<string, Value[][]>) {
  const extract = (key: string) =>
    sd[key].map((row: Value[]) => row.map((v: Value) => v.data));
  return {
    attnWo: extract("layer0.attn_wo"),
    mlpFc1: extract("layer0.mlp_fc1"),
    mlpFc2: extract("layer0.mlp_fc2"),
    lmHead: extract("lm_head"),
  };
}

export default memo(function ForwardPassPage() {
  const [char, setChar] = useState("e");
  const [pos, setPos] = useState(0);

  const tokenId = charToId[char] ?? 0;
  const trace = useModelDerived(
    (m) => computeForwardTrace(tokenId, pos, m),
    [tokenId, pos],
  );

  const top5 = useMemo(() => computeTop(trace.probs, 10), [trace]);
  const maxProb = Math.max(...top5.map((t) => t.prob), 0.01);

  const weights = useModelDerived((m) => extractWeights(m.stateDict));

  return (
    <PageSection id="forward" title="3. Propagation">
      <p className="page-desc">
        Observe un <Term id="token" /> traverser tout le modèle. Chaque étape
        transforme le <Term id="vecteur" /> de 16 nombres jusqu'à obtenir 27{" "}
        <Term id="logits" /> convertis en probabilités — un score pour chaque
        caractère suivant possible.
      </p>

      <div className="panel">
        <div className="panel-title">Choisis l'entrée</div>
        <CharPosSelector
          char={char}
          pos={pos}
          onCharChange={setChar}
          onPosChange={setPos}
        />
      </div>

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
        <ProbabilityPanel char={char} pos={pos} top5={top5} maxProb={maxProb} />
      </div>

      <FlowDiagram
        char={char}
        pos={pos}
        tokenId={tokenId}
        mlpActiveCount={trace.mlpActiveMask?.filter(Boolean).length ?? 0}
        topChar={top5[0]?.char ?? "?"}
        topProbPct={(top5[0]?.prob * 100).toFixed(0)}
      />

      <div className="panel">
        <CharPosSelector
          char={char}
          pos={pos}
          onCharChange={setChar}
          onPosChange={setPos}
        />
      </div>

      <NNDiagramPanel trace={trace} weights={weights} />

      {trace.mlpHidden && (
        <MLPActivationPanel
          mlpHidden={trace.mlpHidden}
          mlpActiveMask={trace.mlpActiveMask}
        />
      )}
    </PageSection>
  );
});
