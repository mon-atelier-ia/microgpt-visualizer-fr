import { useState, useMemo, memo } from "react";
import {
  gptForward,
  tokenize,
  tokenLabel,
  N_LAYER,
  N_HEAD,
  BLOCK_SIZE,
} from "../engine/model";
import type { ForwardTrace } from "../engine/model";
import type { Value } from "../engine/autograd";
import { useModel } from "../modelStore";
import { useModelDerived } from "../useModelDerived";
import type { ModelState } from "../engine/model";
import PageSection from "../components/PageSection";
import Term from "../components/Term";
import BertVizView from "../components/BertVizView";
import {
  WeightBarsPanel,
  QKVPanel,
  AttnMatrixPanel,
  WhyAttentionPanel,
  SummaryPanel,
} from "./AttentionPanels";
import { TokenFlowPanel } from "./AttentionTokenFlow";

function buildAttnMatrix(traces: ForwardTrace[], head: number): number[][] {
  const T = traces.length;
  return traces.map((trace) => {
    const row = new Array(T).fill(0);
    const weights = trace.attnWeights[head];
    for (let i = 0; i < weights.length; i++) {
      row[i] = weights[i];
    }
    return row;
  });
}

function computeTraces(tokens: number[], n: number, model: ModelState) {
  const keys: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const vals: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const result: ForwardTrace[] = [];
  for (let pos = 0; pos < n; pos++) {
    const { trace } = gptForward(tokens[pos], pos, keys, vals, model, true);
    result.push(trace!);
  }
  return result;
}

function buildAllHeadMatrices(traces: ForwardTrace[]) {
  return Array.from({ length: N_HEAD }, (_, h) => buildAttnMatrix(traces, h));
}

export default memo(function AttentionPage() {
  const model = useModel();
  const [input, setInput] = useState("emma");
  const [selectedPos, setSelectedPos] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [activeHead, setActiveHead] = useState<number | "all">("all");
  const [hoverSrc, setHoverSrc] = useState<number | null>(null);

  const name = input
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 14);
  const tokens = useMemo(() => (name ? tokenize(name) : []), [name]);
  const tokenLabels = tokens.map((id) => tokenLabel(id));
  const n = Math.min(BLOCK_SIZE, tokens.length - 1);

  const traces = useModelDerived(
    (m) => computeTraces(tokens, n, m),
    [tokens, n],
  );

  const matrix = useMemo(
    () => buildAttnMatrix(traces, selectedHead),
    [traces, selectedHead],
  );
  const allHeadMatrices = useMemo(() => buildAllHeadMatrices(traces), [traces]);

  const displayLabels = tokenLabels.slice(0, n);
  const safePos = Math.min(selectedPos, n - 1);
  const trace = traces[safePos];

  const handleInputChange = (val: string) => {
    setInput(val);
    setSelectedPos(0);
  };

  return (
    <PageSection id="attention" title="4. Attention">
      <p className="page-desc">
        Découvre comment les <Term id="token" />s communiquent entre eux. L'
        <Term id="attention" /> est le seul endroit du modèle où un token peut
        regarder les tokens passés pour décider quoi prédire.
      </p>

      <WhyAttentionPanel />

      <TokenFlowPanel
        tokens={tokens}
        n={n}
        safePos={safePos}
        onSelectPos={setSelectedPos}
        onInputChange={handleInputChange}
        input={input}
        displayLabels={displayLabels}
      />

      {traces.length > 0 && (
        <FourHeadsRow
          model={model}
          allHeadMatrices={allHeadMatrices}
          displayLabels={displayLabels}
          tokens={tokens}
          n={n}
          activeHead={activeHead}
          onActiveHeadChange={setActiveHead}
          safePos={safePos}
          onSelectPos={setSelectedPos}
          hoverSrc={hoverSrc}
          onHoverSrc={setHoverSrc}
        />
      )}

      {trace && (
        <QKVPanel
          trace={trace}
          safePos={safePos}
          displayLabel={displayLabels[safePos]}
        />
      )}

      {traces.length > 0 && (
        <AttnMatrixPanel
          matrix={matrix}
          displayLabels={displayLabels}
          safePos={safePos}
          selectedHead={selectedHead}
          onSelectHead={setSelectedHead}
        />
      )}

      <SummaryPanel />
    </PageSection>
  );
});

/* ── Four heads row (inline to avoid circular deps with BertVizView) ── */

interface FourHeadsRowProps {
  model: ModelState;
  allHeadMatrices: number[][][];
  displayLabels: string[];
  tokens: number[];
  n: number;
  activeHead: number | "all";
  onActiveHeadChange: (h: number | "all") => void;
  safePos: number;
  onSelectPos: (i: number) => void;
  hoverSrc: number | null;
  onHoverSrc: (h: number | null) => void;
}

const FourHeadsRow = memo(function FourHeadsRow({
  model,
  allHeadMatrices,
  displayLabels,
  tokens,
  n,
  activeHead,
  onActiveHeadChange,
  safePos,
  onSelectPos,
  hoverSrc,
  onHoverSrc,
}: FourHeadsRowProps) {
  return (
    <div className="panel-row">
      <div className="panel">
        <div className="panel-title">4 têtes, 4 regards différents</div>
        <div className="explain">
          Le modèle a <b>{N_HEAD} têtes</b> d'attention qui travaillent en
          parallèle. Chacune pose une question différente. Après l'entraînement
          (étape 5), elles se spécialisent : l'une regarde peut-être le token
          juste avant, une autre cherche les voyelles, une autre le début du
          nom…
        </div>
        <div className="label-dim mt-4">
          {model.totalStep === 0
            ? "Poids aléatoires — les têtes se ressemblent. Reviens après avoir entraîné le modèle à l'étape 5 pour voir des motifs apparaître."
            : `Entraîné (${model.totalStep} étapes) — observe comment les têtes ont appris des motifs différents.`}
        </div>
        <BertVizView
          matrices={allHeadMatrices}
          tokens={displayLabels}
          tokenIds={tokens.slice(0, n)}
          activeHead={activeHead}
          onActiveHeadChange={onActiveHeadChange}
          selectedSrc={safePos}
          onClickSrc={onSelectPos}
          hoverSrc={hoverSrc}
          onHoverSrc={onHoverSrc}
        />
      </div>

      <WeightBarsPanel
        activeHead={activeHead}
        allHeadMatrices={allHeadMatrices}
        safePos={safePos}
        displayLabels={displayLabels}
      />
    </div>
  );
});
