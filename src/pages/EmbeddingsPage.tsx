import { useState, useMemo, memo } from "react";
import { uchars, N_EMBD, BLOCK_SIZE, charToId } from "../engine/model";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import { useModel, getWteSnapshots } from "../modelStore";
import { useModelDerived } from "../useModelDerived";
import { computeCharStats } from "../utils/charStats";
import type { Value } from "../engine/autograd";
import { WtePanel, WpePanel, CombinePanel, PCAPanel } from "./EmbeddingsPanels";

function extractData(matrix: Value[][]) {
  return matrix.map((row) => row.map((v) => v.data));
}

export default memo(function EmbeddingsPage() {
  const model = useModel();
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverRowWpe, setHoverRowWpe] = useState<number | null>(null);
  const [selectedChar, setSelectedChar] = useState("e");
  const [selectedPos, setSelectedPos] = useState(0);

  const wte = model.stateDict.wte;
  const wpe = model.stateDict.wpe;
  const wteLabels = [...uchars, "BOS"];
  const wpeLabels = Array.from({ length: BLOCK_SIZE }, (_, i) => `p${i}`);

  const charId = charToId[selectedChar] ?? 0;
  const tokEmb = wte[charId].map((v) => v.data);
  const posEmb = wpe[selectedPos].map((v) => v.data);
  const combined = tokEmb.map((t, i) => t + posEmb[i]);

  const charStats = useMemo(() => computeCharStats(model.docs), [model.docs]);

  const wteData = useModelDerived((m) => extractData(m.stateDict.wte));

  const wteSnapshots = useModelDerived(() => getWteSnapshots());

  const hoveredValues =
    hoverRow !== null ? wte[hoverRow].map((v) => v.data) : null;
  const hoveredLabel = hoverRow !== null ? wteLabels[hoverRow] : null;
  const hoveredStats =
    hoverRow !== null && hoverRow < uchars.length
      ? (charStats.get(uchars[hoverRow]) ?? null)
      : null;

  const hoveredWpeValues =
    hoverRowWpe !== null ? wpe[hoverRowWpe].map((v) => v.data) : null;
  const hoveredWpeLabel = hoverRowWpe !== null ? wpeLabels[hoverRowWpe] : null;

  return (
    <PageSection id="embeddings" title="2. Plongements (Embeddings)">
      <p className="page-desc">
        Le modèle représente chaque <Term id="token" /> et chaque position comme
        un <Term id="vecteur" /> de {N_EMBD} nombres — un{" "}
        <Term id="plongement" />. Ces nombres sont les <Term id="parametre" />s
        apprenables du modèle — ils commencent aléatoires et sont ajustés
        pendant l'entraînement.
      </p>

      <WtePanel
        wte={wte}
        wteLabels={wteLabels}
        hoverRow={hoverRow}
        onHoverRow={setHoverRow}
        hoveredValues={hoveredValues}
        hoveredLabel={hoveredLabel}
        hoveredStats={hoveredStats}
        totalStep={model.totalStep}
      />

      <WpePanel
        wpe={wpe}
        wpeLabels={wpeLabels}
        hoverRowWpe={hoverRowWpe}
        onHoverRowWpe={setHoverRowWpe}
        hoveredWpeValues={hoveredWpeValues}
        hoveredWpeLabel={hoveredWpeLabel}
      />

      <CombinePanel
        selectedChar={selectedChar}
        onSelectChar={setSelectedChar}
        selectedPos={selectedPos}
        onSelectPos={setSelectedPos}
        tokEmb={tokEmb}
        posEmb={posEmb}
        combined={combined}
        wpeLabels={wpeLabels}
      />

      <PCAPanel
        wteData={wteData}
        totalStep={model.totalStep}
        snapshots={wteSnapshots}
        highlightLetter={hoverRow}
        onHoverLetter={setHoverRow}
      />
    </PageSection>
  );
});
