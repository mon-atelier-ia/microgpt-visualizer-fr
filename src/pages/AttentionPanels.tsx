import { memo } from "react";
import type { ForwardTrace } from "../engine/model";
import { N_HEAD, HEAD_DIM } from "../engine/model";
import Term from "../components/Term";
import { VectorBar } from "../components/Heatmap";
import AttnMatrix from "../components/AttnMatrix";
import { HEAD_COLORS } from "../components/BertVizView";
import { classifyHead } from "../utils/classifyHead";
import { headExplanation } from "../utils/headExplanation";

/* ── Weight bars (right side of panel-row) ── */

interface WeightBarsPanelProps {
  activeHead: number | "all";
  allHeadMatrices: number[][][];
  safePos: number;
  displayLabels: string[];
}

interface WeightQuery {
  matrices: number[][][];
  head: number | "all";
  pos: number;
  j: number;
}

function computeWeight({ matrices, head, pos, j }: WeightQuery): number {
  if (head === "all") {
    return matrices.reduce((s, hw) => s + hw[pos][j], 0) / N_HEAD;
  }
  return matrices[head][pos][j];
}

export const WeightBarsPanel = memo(function WeightBarsPanel({
  activeHead,
  allHeadMatrices,
  safePos,
  displayLabels,
}: WeightBarsPanelProps) {
  const isAll = activeHead === "all";
  const color = isAll ? "var(--cyan)" : HEAD_COLORS[activeHead as number];

  return (
    <div className="panel">
      <div className="panel-title">
        {isAll
          ? `Poids d'attention — position ${safePos} « ${displayLabels[safePos]} »`
          : `Poids — Tête ${activeHead} (${classifyHead(allHeadMatrices[activeHead as number])})`}
      </div>
      <div className="explain">
        {isAll ? (
          <>
            Chaque barre montre{" "}
            <b>combien « {displayLabels[safePos]} » regarde</b> ce token (en %).
            C'est la moyenne des {N_HEAD} têtes — chacune regarde des choses
            différentes, le modèle combine leurs points de vue.
          </>
        ) : (
          headExplanation(
            classifyHead(allHeadMatrices[activeHead as number]),
            displayLabels[safePos],
          )
        )}
      </div>
      {Array.from({ length: safePos + 1 }, (_, j) => {
        const w = computeWeight({
          matrices: allHeadMatrices,
          head: activeHead,
          pos: safePos,
          j,
        });
        const pct = (w * 100).toFixed(1);
        return (
          <div key={j} className="bv-weight-row">
            <span className="bv-weight-label">{displayLabels[j]}</span>
            <div className="bv-weight-track">
              <div
                className="bv-weight-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="bv-weight-pct">{pct} %</span>
          </div>
        );
      })}
    </div>
  );
});

/* ── QKV panel ── */

interface QKVPanelProps {
  trace: ForwardTrace;
  safePos: number;
  displayLabel: string;
}

export const QKVPanel = memo(function QKVPanel({
  trace,
  safePos,
  displayLabel,
}: QKVPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        Q, K, V — trois rôles (position {safePos} : « {displayLabel} »)
      </div>
      <div className="explain">
        À chaque position, le token courant est projeté en trois vecteurs de{" "}
        {N_HEAD * HEAD_DIM} nombres :
      </div>
      <ul className="explain" style={{ marginTop: 0, paddingLeft: 24 }}>
        <li>
          <b>Q (Query = question)</b> : « Qu'est-ce que je cherche ? »
        </li>
        <li>
          <b>K (Key = clé)</b> : « Qu'est-ce que je contiens ? »
        </li>
        <li>
          <b>V (Value = valeur)</b> : « Qu'est-ce que j'ai à offrir si on me
          sélectionne ? »
        </li>
      </ul>
      <div className="explain mt-8">
        Imagine une salle de classe. Chaque élève (token) a une <b>question</b>{" "}
        qu'il veut poser (Q), une <b>étiquette</b> qui dit ce qu'il sait (K) et
        un <b>cahier</b> avec l'info à partager (V). L'
        <Term id="attention" /> calcule : « à quel point ma question (Q)
        correspond-elle à l'étiquette (K) de chaque token passé ? » Plus ça
        correspond, plus j'écoute son cahier (V).
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <VectorBar values={trace.q} label="Q (query)" />
        <VectorBar values={trace.k} label="K (key)" />
        <VectorBar values={trace.v} label="V (value)" />
      </div>
      <div className="label-dim mt-4">
        Ces {N_HEAD * HEAD_DIM} nombres viennent des matrices wq, wk, wv que tu
        as vues à l'étape 3 dans le diagramme de flux.
      </div>
    </div>
  );
});

/* ── Attention matrix panel ── */

interface AttnMatrixPanelProps {
  matrix: number[][];
  displayLabels: string[];
  safePos: number;
  selectedHead: number;
  onSelectHead: (h: number) => void;
}

export const AttnMatrixPanel = memo(function AttnMatrixPanel({
  matrix,
  displayLabels,
  safePos,
  selectedHead,
  onSelectHead,
}: AttnMatrixPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        La matrice d'attention (tête {selectedHead})
      </div>
      <div className="explain">
        Voici ce que le modèle « voit » à travers la tête {selectedHead}. Chaque
        cellule indique <b>combien il écoute</b> le token de cette colonne. Les
        poids totalisent toujours 100 % sur chaque ligne (grâce au{" "}
        <Term id="softmax" />
        ). Le tiret « — » en haut à droite, c'est le <b>masque causal</b> : le
        modèle ne peut pas regarder le futur.
      </div>
      <div className="controls mt-8">
        <span className="label-dim">Tête :</span>
        {Array.from({ length: N_HEAD }, (_, h) => (
          <button
            key={h}
            type="button"
            className={`btn btn-toggle ${h === selectedHead ? "" : "btn-secondary"}`}
            onClick={() => onSelectHead(h)}
          >
            {h}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <AttnMatrix
          matrix={matrix}
          tokens={displayLabels}
          highlightRow={safePos}
        />
      </div>
      <div className="explain mt-8">
        Le masque causal rend la génération possible — tu le verras en action à
        l'étape 6 (<Term id="generation-autoregressive" />
        ).
      </div>
    </div>
  );
});

/* ── Why attention panel ── */

export const WhyAttentionPanel = memo(function WhyAttentionPanel() {
  return (
    <div className="panel">
      <div className="panel-title">Pourquoi l'attention ?</div>
      <div className="explain">
        À l'étape 3, tu as fait passer un seul token dans le modèle. L'attention
        affichait <b>[1.0]</b> — le token ne regardait que lui-même, car il n'y
        avait personne d'autre.
      </div>
      <div className="explain mt-8">
        Mais pour prédire le caractère suivant, le modèle a besoin de{" "}
        <b>contexte</b> : après « em », la lettre « m » est probable ; après «
        emm », « a » est probable. Comment le modèle sait-il ce qui est venu
        avant ?
      </div>
      <div className="explain mt-8">
        <b>
          L'attention est le seul endroit où un token peut regarder les tokens
          passés.
        </b>{" "}
        C'est un mécanisme de communication — comme tu l'as vu à l'étape 2,
        chaque token a son propre vecteur de 16 nombres (son{" "}
        <Term id="plongement" />
        ). L'attention utilise ces vecteurs pour décider quels tokens passés
        sont pertinents.
      </div>
    </div>
  );
});

/* ── Summary panel ── */

export const SummaryPanel = memo(function SummaryPanel() {
  return (
    <div className="panel">
      <div className="panel-title">Comment ça s'intègre</div>
      <div className="explain">Récapitulons. Pour chaque token :</div>
      <ol className="explain" style={{ marginTop: 0, paddingLeft: 24 }}>
        <li>Le modèle calcule Q, K, V (3 projections linéaires)</li>
        <li>
          Il compare Q avec toutes les K passées (produit scalaire →{" "}
          <Term id="softmax" />)
        </li>
        <li>Il utilise les poids pour faire une moyenne pondérée des V</li>
        <li>
          Les résultats des {N_HEAD} têtes sont concaténés et projetés (matrice
          wo)
        </li>
        <li>
          Le tout est additionné au vecteur d'entrée (
          <Term id="connexion-residuelle" /> — même si l'attention n'apprend
          rien d'utile, l'information passe quand même)
        </li>
      </ol>
      <div className="explain mt-8">
        <b>
          L'attention est le seul endroit où les tokens communiquent entre eux.
        </b>{" "}
        Tout le reste (<Term id="mlp" />, lm_head) travaille sur un seul token à
        la fois.
      </div>
      <div className="explain mt-8">
        À l'étape 5 (Entraînement), tu verras le modèle ajuster les paramètres
        des matrices Q, K, V et wo pour que l'attention apprenne les bons
        motifs. Et à l'étape 6 (Inférence), tu verras le modèle utiliser ce
        mécanisme à chaque nouveau caractère qu'il génère.
      </div>
    </div>
  );
});
