import { memo } from "react";
import { uchars, N_EMBD } from "../engine/model";
import Heatmap, { VectorBar } from "../components/Heatmap";
import EmbeddingBarChart from "../components/EmbeddingBarChart";
import Term from "../components/Term";
import PCAScatterPlot from "../components/PCAScatterPlot";
import { getWteSnapshots } from "../modelStore";
import type { Value } from "../engine/autograd";
import type { CharStats } from "../utils/charStats";

/* ── Shared heatmap + bar chart layout ── */

interface HeatmapWithBarsProps {
  matrix: Value[][];
  rowLabels: string[];
  highlightRow: number | undefined;
  onHoverRow: (r: number | null) => void;
  barValues: number[] | null;
  barLabel: string | null;
  charStats?: CharStats | null;
  emptyText?: string;
}

const HeatmapWithBars = memo(function HeatmapWithBars({
  matrix,
  rowLabels,
  highlightRow,
  onHoverRow,
  barValues,
  barLabel,
  charStats,
  emptyText,
}: HeatmapWithBarsProps) {
  return (
    <div className="heatmap-with-bars">
      <div>
        <Heatmap
          matrix={matrix}
          rowLabels={rowLabels}
          colCount={N_EMBD}
          highlightRow={highlightRow}
          onHoverRow={onHoverRow}
        />
      </div>
      <div className="barchart-side">
        <EmbeddingBarChart
          values={barValues}
          label={barLabel}
          charStats={charStats ?? null}
          emptyText={emptyText}
        />
      </div>
    </div>
  );
});

/* ── WTE Panel ── */

interface WtePanelProps {
  wte: Value[][];
  wteLabels: string[];
  hoverRow: number | null;
  onHoverRow: (r: number | null) => void;
  hoveredValues: number[] | null;
  hoveredLabel: string | null;
  hoveredStats: CharStats | null;
  totalStep: number;
}

export const WtePanel = memo(function WtePanel({
  wte,
  wteLabels,
  hoverRow,
  onHoverRow,
  hoveredValues,
  hoveredLabel,
  hoveredStats,
  totalStep,
}: WtePanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">wte — Plongements de tokens</div>
      <div className="label-dim" style={{ marginBottom: 8 }}>
        {totalStep === 0
          ? "Valeurs aléatoires — reviens après avoir entraîné le modèle à l'étape 5 pour voir des motifs apparaître"
          : `Entraîné (${totalStep} étapes) — les lettres similaires développent des motifs proches`}
      </div>
      <div className="explain">
        <b>
          <Term id="wte" />
        </b>{" "}
        signifie "Word Token Embeddings" (<Term id="plongement" />s de tokens).
        C'est un tableau avec <b>{wte.length} lignes</b> (une par{" "}
        <Term id="token" />) et <b>{N_EMBD} colonnes</b> (la{" "}
        <Term id="dimension" /> du plongement).
        <br />
        <br />
        Chaque ligne représente comment le modèle « voit » ce caractère. C'est
        la représentation interne de chaque lettre pour le modèle.{" "}
        <b>Survole une ligne</b> pour voir ses dimensions en barres verticales.
        <br />
        <br />
        Couleurs : <span className="text-red">rouge = négatif</span>,{" "}
        <span className="text-dim">sombre = proche de zéro</span>,{" "}
        <span className="text-green">vert = positif</span>. Pour l'instant ces
        valeurs sont <b>aléatoires</b> — après l'entraînement, les lettres
        similaires auront des motifs similaires.
      </div>
      <HeatmapWithBars
        matrix={wte}
        rowLabels={wteLabels}
        highlightRow={hoverRow ?? undefined}
        onHoverRow={onHoverRow}
        barValues={hoveredValues}
        barLabel={hoveredLabel}
        charStats={hoveredStats}
      />
    </div>
  );
});

/* ── WPE Panel ── */

interface WpePanelProps {
  wpe: Value[][];
  wpeLabels: string[];
  hoverRowWpe: number | null;
  onHoverRowWpe: (r: number | null) => void;
  hoveredWpeValues: number[] | null;
  hoveredWpeLabel: string | null;
}

export const WpePanel = memo(function WpePanel({
  wpe,
  wpeLabels,
  hoverRowWpe,
  onHoverRowWpe,
  hoveredWpeValues,
  hoveredWpeLabel,
}: WpePanelProps) {
  return (
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
        <b>le même quel que soit le token</b> — seule la position compte. Il est
        ensuite <b>additionné</b> au <Term id="plongement" /> de token.{" "}
        <b>Survole une ligne</b> pour voir ses dimensions.
      </div>
      <HeatmapWithBars
        matrix={wpe}
        rowLabels={wpeLabels}
        highlightRow={hoverRowWpe ?? undefined}
        onHoverRow={onHoverRowWpe}
        barValues={hoveredWpeValues}
        barLabel={hoveredWpeLabel}
        emptyText="Survole une position dans le tableau"
      />
    </div>
  );
});

/* ── Combine Panel ── */

interface CombinePanelProps {
  selectedChar: string;
  onSelectChar: (ch: string) => void;
  selectedPos: number;
  onSelectPos: (p: number) => void;
  tokEmb: number[];
  posEmb: number[];
  combined: number[];
  wpeLabels: string[];
}

export const CombinePanel = memo(function CombinePanel({
  selectedChar,
  onSelectChar,
  selectedPos,
  onSelectPos,
  tokEmb,
  posEmb,
  combined,
  wpeLabels,
}: CombinePanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">Comment wte + wpe se combinent</div>
      <div className="explain">
        Quand le modèle traite un <Term id="token" />, il cherche{" "}
        <code>wte[id_token]</code> et <code>wpe[position]</code>, puis les{" "}
        <b>additionne élément par élément</b>. Le résultat est un{" "}
        <Term id="vecteur" /> unique qui encode à la fois <b>quel</b> caractère
        et <b>où</b> il se trouve.
      </div>

      <div className="controls">
        {uchars.map((ch) => (
          <button
            type="button"
            key={ch}
            className={`btn btn-toggle btn-toggle--char ${ch === selectedChar ? "" : "btn-secondary"}`}
            onClick={() => onSelectChar(ch)}
          >
            {ch}
          </button>
        ))}
      </div>

      <div className="controls" style={{ marginTop: 8 }}>
        {wpeLabels.map((label, i) => (
          <button
            type="button"
            key={label}
            className={`btn btn-toggle btn-toggle--char ${i === selectedPos ? "" : "btn-secondary"}`}
            onClick={() => onSelectPos(i)}
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
  );
});

/* ── PCA Panel ── */

interface PCAPanelProps {
  wteData: number[][];
  totalStep: number;
  snapshots: ReturnType<typeof getWteSnapshots>;
  highlightLetter: number | null;
  onHoverLetter: (i: number | null) => void;
}

export const PCAPanel = memo(function PCAPanel({
  wteData,
  totalStep,
  snapshots,
  highlightLetter,
  onHoverLetter,
}: PCAPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        Carte PCA — les <Term id="plongement" />s en 2D
      </div>
      <div className="label-dim" style={{ marginBottom: 8 }}>
        {totalStep === 0
          ? "Valeurs aléatoires — les lettres sont éparpillées au hasard — reviens après avoir entraîné le modèle à l'étape 5 pour voir les regroupements"
          : `Entraîné (${totalStep} étapes) — les lettres similaires se regroupent`}
      </div>
      <div className="explain">
        Chaque lettre est un point dans un espace à 16 <Term id="dimension" />s
        — impossible à visualiser ! On utilise une technique appelée <b>PCA</b>{" "}
        pour condenser ces 16 nombres en 2, en gardant les 2 directions les plus
        informatives. C'est comme projeter l'ombre d'un objet 3D sur un mur : on
        perd du détail, mais la forme générale reste visible.
        <br />
        <br />
        Chaque point correspond à une ligne du tableau wte ci-dessus. Couleurs :{" "}
        <span className="text-cyan">voyelles</span>,{" "}
        <span className="text-orange">consonnes</span>,{" "}
        <span className="label-purple">BOS</span>. <b>Survole</b> une lettre
        pour voir ses coordonnées.
        {snapshots.length >= 3 && (
          <>
            {" "}
            Clique <b>Rejouer</b> pour voir le chemin réel pendant
            l'entraînement.
          </>
        )}
      </div>
      <div className="pca-canvas-wrap">
        <PCAScatterPlot
          wteData={wteData}
          totalStep={totalStep}
          snapshots={snapshots}
          highlightLetter={highlightLetter}
          onHoverLetter={onHoverLetter}
        />
      </div>
    </div>
  );
});
