import { useState, useMemo, memo } from "react";
import { uchars, N_EMBD, BLOCK_SIZE, charToId } from "../engine/model";
import Heatmap, { VectorBar } from "../components/Heatmap";
import EmbeddingBarChart from "../components/EmbeddingBarChart";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import { useModel, getWteSnapshots } from "../modelStore";
import { computeCharStats } from "../utils/charStats";
import PCAScatterPlot from "../components/PCAScatterPlot";

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

  // Dataset stats (recalculated when dataset changes)
  const charStats = useMemo(() => computeCharStats(model.docs), [model.docs]);

  // PCA scatter data (current embeddings as plain numbers)
  const wteData = useMemo(
    () => model.stateDict.wte.map((row) => row.map((v) => v.data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model mutable: identity=reset, totalStep=training
    [model, model.totalStep],
  );
   
  const wteSnapshots = useMemo(
    () => getWteSnapshots(),
    [model, model.totalStep],
  );

  // Bar chart data for hovered row
  const hoveredValues =
    hoverRow !== null ? wte[hoverRow].map((v) => v.data) : null;
  const hoveredLabel = hoverRow !== null ? wteLabels[hoverRow] : null;
  const hoveredStats =
    hoverRow !== null && hoverRow < uchars.length
      ? (charStats.get(uchars[hoverRow]) ?? null)
      : null;

  // Bar chart data for hovered wpe row
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

      {/* WTE */}
      <div className="panel">
        <div className="panel-title">wte — Plongements de tokens</div>
        <div className="label-dim" style={{ marginBottom: 8 }}>
          {model.totalStep === 0
            ? "Valeurs aléatoires — reviens après avoir entraîné le modèle à l'étape 5 pour voir des motifs apparaître"
            : `Entraîné (${model.totalStep} étapes) — les lettres similaires développent des motifs proches`}
        </div>
        <div className="explain">
          <b>
            <Term id="wte" />
          </b>{" "}
          signifie "Word Token Embeddings" (<Term id="plongement" />s de
          tokens). C'est un tableau avec <b>{wte.length} lignes</b> (une par{" "}
          <Term id="token" />) et <b>{N_EMBD} colonnes</b> (la{" "}
          <Term id="dimension" /> du plongement).
          <br />
          <br />
          Chaque ligne représente comment le modèle « voit » ce caractère. C'est
          la représentation interne de chaque lettre pour le modèle.{" "}
          <b>Survole une ligne</b> pour voir ses dimensions en barres
          verticales.
          <br />
          <br />
          Couleurs : <span className="text-red">rouge = négatif</span>,{" "}
          <span className="text-dim">sombre = proche de zéro</span>,{" "}
          <span className="text-green">vert = positif</span>. Pour l'instant ces
          valeurs sont <b>aléatoires</b> — après l'entraînement, les lettres
          similaires auront des motifs similaires.
        </div>
        <div className="heatmap-with-bars">
          <div>
            <Heatmap
              matrix={wte}
              rowLabels={wteLabels}
              colCount={N_EMBD}
              highlightRow={hoverRow ?? undefined}
              onHoverRow={setHoverRow}
            />
          </div>
          <div className="barchart-side">
            <EmbeddingBarChart
              values={hoveredValues}
              label={hoveredLabel}
              charStats={hoveredStats}
            />
          </div>
        </div>
      </div>

      {/* WPE */}
      <div className="panel">
        <div className="panel-title">wpe — Plongements de positions</div>
        <div className="explain">
          <b>
            <Term id="wpe" />
          </b>{" "}
          signifie "Word Position Embeddings" (<Term id="plongement" />s de
          positions). Il indique au modèle <b>où</b> se trouve un{" "}
          <Term id="token" /> dans la séquence. Position 0 = premier caractère,
          position 1 = deuxième, etc.
          <br />
          <br />
          Sans cela, le modèle ne pourrait pas distinguer « ab » de « ba » — les
          deux ont les mêmes caractères ! Contrairement à <Term id="wte" /> (qui
          dépend du caractère), le plongement de position est{" "}
          <b>le même quel que soit le token</b> — seule la position compte. Il
          est ensuite <b>additionné</b> au <Term id="plongement" /> de token.{" "}
          <b>Survole une ligne</b> pour voir ses dimensions.
        </div>
        <div className="heatmap-with-bars">
          <div>
            <Heatmap
              matrix={wpe}
              rowLabels={wpeLabels}
              colCount={N_EMBD}
              highlightRow={hoverRowWpe ?? undefined}
              onHoverRow={setHoverRowWpe}
            />
          </div>
          <div className="barchart-side">
            <EmbeddingBarChart
              values={hoveredWpeValues}
              label={hoveredWpeLabel}
              charStats={null}
              emptyText="Survole une position dans le tableau"
            />
          </div>
        </div>
      </div>

      {/* Interactif : comment ils se combinent */}
      <div className="panel">
        <div className="panel-title">Comment wte + wpe se combinent</div>
        <div className="explain">
          Quand le modèle traite un <Term id="token" />, il cherche{" "}
          <code>wte[id_token]</code> et <code>wpe[position]</code>, puis les{" "}
          <b>additionne élément par élément</b>. Le résultat est un{" "}
          <Term id="vecteur" /> unique qui encode à la fois <b>quel</b>{" "}
          caractère et <b>où</b> il se trouve.
        </div>

        <div className="controls">
          {uchars.map((ch) => (
            <button
              key={ch}
              className={`btn btn-toggle btn-toggle--char ${ch === selectedChar ? "" : "btn-secondary"}`}
              onClick={() => setSelectedChar(ch)}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="controls" style={{ marginTop: 8 }}>
          {wpeLabels.map((label, i) => (
            <button
              key={label}
              className={`btn btn-toggle btn-toggle--char ${i === selectedPos ? "" : "btn-secondary"}`}
              onClick={() => setSelectedPos(i)}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="label-dim label-purple">
          '{selectedChar}' à la position {selectedPos} :
        </div>

        <VectorBar
          values={tokEmb}
          label={`wte['${selectedChar}'] (plongement de token)`}
        />
        <div className="vector-divider">+</div>
        <VectorBar
          values={posEmb}
          label={`wpe[${selectedPos}] (plongement de position)`}
        />
        <div className="vector-divider">=</div>
        <VectorBar values={combined} label="combiné (entrée du modèle)" />
      </div>
      {/* Carte PCA — les plongements en 2D */}
      <div className="panel">
        <div className="panel-title">
          Carte PCA — les <Term id="plongement" />s en 2D
        </div>
        <div className="label-dim" style={{ marginBottom: 8 }}>
          {model.totalStep === 0
            ? "Poids aléatoires — les lettres sont éparpillées au hasard"
            : `Entraîné (${model.totalStep} étapes) — les lettres similaires se regroupent`}
        </div>
        <div className="explain">
          Chaque lettre est un point dans un espace à 16 <Term id="dimension" />
          s — impossible à visualiser ! On utilise une technique appelée{" "}
          <b>PCA</b> pour condenser ces 16 nombres en 2, en gardant les 2
          directions les plus informatives. C'est comme projeter l'ombre d'un
          objet 3D sur un mur : on perd du détail, mais la forme générale reste
          visible.
          <br />
          <br />
          Chaque point correspond à une ligne du tableau wte ci-dessus. Couleurs
          : <span className="text-cyan">voyelles</span>,{" "}
          <span className="text-orange">consonnes</span>,{" "}
          <span className="label-purple">BOS</span>. <b>Survole</b> une lettre
          pour voir ses coordonnées — la ligne correspondante s'éclaire aussi
          dans le tableau.
          {wteSnapshots.length >= 3 && (
            <>
              {" "}
              Clique <b>Rejouer</b> pour voir le chemin réel de chaque lettre
              pendant l'entraînement.
            </>
          )}
        </div>
        <div className="pca-canvas-wrap">
          <PCAScatterPlot
            wteData={wteData}
            totalStep={model.totalStep}
            snapshots={wteSnapshots}
            highlightLetter={hoverRow}
            onHoverLetter={setHoverRow}
          />
        </div>
      </div>
    </PageSection>
  );
});
