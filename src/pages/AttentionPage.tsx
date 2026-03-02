import { useState, useMemo, memo } from "react";
import {
  gptForward,
  tokenize,
  tokenLabel,
  BOS,
  N_LAYER,
  N_HEAD,
  HEAD_DIM,
  BLOCK_SIZE,
} from "../engine/model";
import type { ForwardTrace } from "../engine/model";
import type { Value } from "../engine/autograd";
import { useModel } from "../modelStore";
import PageSection from "../components/PageSection";
import Term from "../components/Term";
import { VectorBar } from "../components/Heatmap";
import AttnMatrix from "../components/AttnMatrix";
import BertVizView, { HEAD_COLORS } from "../components/BertVizView";
import { classifyHead } from "../utils/classifyHead";
import { headExplanation } from "../utils/headExplanation";

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

  const traces = useMemo(() => {
    const keys: Value[][][] = Array.from({ length: N_LAYER }, () => []);
    const vals: Value[][][] = Array.from({ length: N_LAYER }, () => []);
    const result: ForwardTrace[] = [];
    for (let pos = 0; pos < n; pos++) {
      const { trace } = gptForward(tokens[pos], pos, keys, vals, model, true);
      result.push(trace!);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model is mutable: identity detects reset, totalStep detects training
  }, [tokens, n, model, model.totalStep]);

  const matrix = useMemo(
    () => buildAttnMatrix(traces, selectedHead),
    [traces, selectedHead],
  );

  const allHeadMatrices = useMemo(
    () => Array.from({ length: N_HEAD }, (_, h) => buildAttnMatrix(traces, h)),
    [traces],
  );

  const displayLabels = tokenLabels.slice(0, n);
  const safePos = Math.min(selectedPos, n - 1);
  const trace = traces[safePos];

  return (
    <PageSection id="attention" title="4. Attention">
      <p className="page-desc">
        Découvre comment les <Term id="token" />s communiquent entre eux. L'
        <Term id="attention" /> est le seul endroit du modèle où un token peut
        regarder les tokens passés pour décider quoi prédire.
      </p>

      {/* ── Panneau 1 : Pourquoi l'attention ? ── */}
      <div className="panel">
        <div className="panel-title">Pourquoi l'attention ?</div>
        <div className="explain">
          À l'étape 3, tu as fait passer un seul token dans le modèle.
          L'attention affichait <b>[1.0]</b> — le token ne regardait que
          lui-même, car il n'y avait personne d'autre.
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

      {/* ── Panneau 2 : Une séquence complète ── */}
      <div className="panel">
        <div className="panel-title">Une séquence complète</div>
        <div className="explain">
          Quand le modèle lit un nom, il traite les tokens{" "}
          <b>un par un, de gauche à droite</b>. À chaque nouvelle position, il
          garde en mémoire les tokens déjà vus (leur clé K et leur valeur V)
          dans un <b>cache</b>. Choisis un nom et sélectionne une position pour
          observer l'attention.
        </div>

        <label htmlFor="attention-name-input" className="sr-only">
          Nom à analyser
        </label>
        <input
          id="attention-name-input"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSelectedPos(0);
          }}
          placeholder="Tape un nom..."
          maxLength={14}
        />

        <div className="token-flow token-flow--animated">
          {tokens.slice(0, n).map((t, i) => {
            const label = tokenLabel(t);
            const isBos = t === BOS;
            return (
              <span key={i} className="d-contents">
                {i > 0 && (
                  <span
                    className="arrow-sym"
                    style={{ animationDelay: `${i * 80 + 60}ms` }}
                  >
                    →
                  </span>
                )}
                <div
                  className={`token-box ${isBos ? "bos" : ""} ${i === safePos ? "token-box--selected" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="char">{label}</span>
                  <span className="id">id: {t}</span>
                </div>
              </span>
            );
          })}
        </div>

        {/* Sélecteur de position (comme ForwardPassPage) */}
        <div className="controls mt-8">
          <span className="label-dim">Position :</span>
          {displayLabels.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`btn btn-toggle btn-toggle--char ${i === safePos ? "" : "btn-secondary"}`}
              onClick={() => setSelectedPos(i)}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="label-dim mt-4">
          Position {safePos} — le token « {displayLabels[safePos]} » voit{" "}
          {safePos === 0
            ? "uniquement lui-même"
            : `les ${safePos + 1} tokens de 0 à ${safePos}`}
        </div>
      </div>

      {/* ── Panneau 3 : Q, K, V ── */}
      {trace && (
        <div className="panel">
          <div className="panel-title">
            Q, K, V — trois rôles (position {safePos} : «{" "}
            {displayLabels[safePos]} »)
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
            Imagine une salle de classe. Chaque élève (token) a une{" "}
            <b>question</b> qu'il veut poser (Q), une <b>étiquette</b> qui dit
            ce qu'il sait (K) et un <b>cahier</b> avec l'info à partager (V). L'
            <Term id="attention" /> calcule : « à quel point ma question (Q)
            correspond-elle à l'étiquette (K) de chaque token passé ? » Plus ça
            correspond, plus j'écoute son cahier (V).
          </div>
          {/* ANIMATION: highlight séquentiel Q → K → V (étape 3) */}
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
            Ces {N_HEAD * HEAD_DIM} nombres viennent des matrices wq, wk, wv que
            tu as vues à l'étape 3 dans le diagramme de flux.
          </div>
        </div>
      )}

      {/* ── Panneau 4 : La matrice d'attention ── */}
      {traces.length > 0 && (
        <div className="panel">
          <div className="panel-title">
            La matrice d'attention (tête {selectedHead})
          </div>
          <div className="explain">
            Voici ce que le modèle « voit » à travers la tête {selectedHead}.
            Chaque cellule indique <b>combien il écoute</b> le token de cette
            colonne. Les poids totalisent toujours 100 % sur chaque ligne (grâce
            au <Term id="softmax" />
            ). Le tiret « — » en haut à droite, c'est le <b>masque causal</b> :
            le modèle ne peut pas regarder le futur.
          </div>
          <div className="controls mt-8">
            <span className="label-dim">Tête :</span>
            {Array.from({ length: N_HEAD }, (_, h) => (
              <button
                key={h}
                type="button"
                className={`btn btn-toggle ${h === selectedHead ? "" : "btn-secondary"}`}
                onClick={() => setSelectedHead(h)}
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
            💡 Le masque causal rend la génération possible — tu le verras en
            action à l'étape 6 (
            <Term id="generation-autoregressive" />
            ).
          </div>
        </div>
      )}

      {/* ── Panneau 5 : 4 têtes, 4 regards — deux boîtes côte à côte ── */}
      {traces.length > 0 && (
        <div className="panel-row">
          <div className="panel">
            <div className="panel-title">4 têtes, 4 regards différents</div>
            <div className="explain">
              Le modèle a <b>{N_HEAD} têtes</b> d'attention qui travaillent en
              parallèle. Chacune pose une question différente. Après
              l'entraînement (étape 5), elles se spécialisent : l'une regarde
              peut-être le token juste avant, une autre cherche les voyelles,
              une autre le début du nom…
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
              onActiveHeadChange={setActiveHead}
              selectedSrc={safePos}
              onClickSrc={setSelectedPos}
              hoverSrc={hoverSrc}
              onHoverSrc={setHoverSrc}
            />
          </div>

          <div className="panel">
            <div className="panel-title">
              {activeHead === "all"
                ? `Poids d'attention — position ${safePos} « ${displayLabels[safePos]} »`
                : `Poids — Tête ${activeHead} (${classifyHead(allHeadMatrices[activeHead as number])})`}
            </div>
            <div className="explain">
              {activeHead === "all" ? (
                <>
                  Chaque barre montre{" "}
                  <b>combien « {displayLabels[safePos]} » regarde</b> ce token
                  (en %). C'est la moyenne des {N_HEAD} têtes — chacune regarde
                  des choses différentes, le modèle combine leurs points de vue.
                </>
              ) : (
                headExplanation(
                  classifyHead(allHeadMatrices[activeHead as number]),
                  displayLabels[safePos],
                )
              )}
            </div>
            {Array.from({ length: safePos + 1 }, (_, j) => {
              const isAll = activeHead === "all";
              const w = isAll
                ? allHeadMatrices.reduce((s, hw) => s + hw[safePos][j], 0) /
                  N_HEAD
                : allHeadMatrices[activeHead as number][safePos][j];
              const pct = (w * 100).toFixed(1);
              const color = isAll
                ? "var(--cyan)"
                : HEAD_COLORS[activeHead as number];
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
        </div>
      )}

      {/* ── Panneau 6 : Récapitulatif ── */}
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
            Les résultats des {N_HEAD} têtes sont concaténés et projetés
            (matrice wo)
          </li>
          <li>
            Le tout est additionné au vecteur d'entrée (
            <Term id="connexion-residuelle" /> — même si l'attention n'apprend
            rien d'utile, l'information passe quand même)
          </li>
        </ol>
        <div className="explain mt-8">
          <b>
            L'attention est le seul endroit où les tokens communiquent entre
            eux.
          </b>{" "}
          Tout le reste (<Term id="mlp" />, lm_head) travaille sur un seul token
          à la fois.
        </div>
        <div className="explain mt-8">
          À l'étape 5 (Entraînement), tu verras le modèle ajuster les paramètres
          des matrices Q, K, V et wo pour que l'attention apprenne les bons
          motifs. Et à l'étape 6 (Inférence), tu verras le modèle utiliser ce
          mécanisme à chaque nouveau caractère qu'il génère.
        </div>
      </div>
    </PageSection>
  );
});
