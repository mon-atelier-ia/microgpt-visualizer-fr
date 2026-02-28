import { useState } from "react";
import { uchars, N_EMBD, BLOCK_SIZE, charToId } from "../engine/model";
import Heatmap, { VectorBar } from "../components/Heatmap";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import { useModel } from "../modelStore";

export default function EmbeddingsPage() {
  const model = useModel();
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [selectedChar, setSelectedChar] = useState("e");

  const wte = model.stateDict.wte;
  const wpe = model.stateDict.wpe;
  const wteLabels = [...uchars, "BOS"];
  const wpeLabels = Array.from({ length: BLOCK_SIZE }, (_, i) => `p${i}`);

  const charId = charToId[selectedChar] ?? 0;
  const tokEmb = wte[charId].map((v) => v.data);
  const posEmb = wpe[0].map((v) => v.data);
  const combined = tokEmb.map((t, i) => t + posEmb[i]);

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
          <b>Survole une ligne</b> pour la mettre en évidence.
          <br />
          <br />
          Couleurs : <span className="text-red">rouge = négatif</span>,{" "}
          <span className="text-dim">sombre = proche de zéro</span>,{" "}
          <span className="text-green">vert = positif</span>. Pour l'instant ces
          valeurs sont <b>aléatoires</b> — après l'entraînement, les lettres
          similaires auront des motifs similaires.
        </div>
        <Heatmap
          matrix={wte}
          rowLabels={wteLabels}
          colCount={N_EMBD}
          highlightRow={hoverRow ?? undefined}
          onHoverRow={setHoverRow}
        />
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
          deux ont les mêmes caractères ! Le <Term id="plongement" /> de
          position est <b>additionné</b> au <Term id="plongement" /> de token.
        </div>
        <Heatmap matrix={wpe} rowLabels={wpeLabels} colCount={N_EMBD} />
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
              className={`btn btn-toggle ${ch === selectedChar ? "" : "btn-secondary"}`}
              style={{ fontSize: 14, minWidth: 32 }}
              onClick={() => setSelectedChar(ch)}
            >
              {ch}
            </button>
          ))}
        </div>

        <div
          className="label-dim"
          style={{ fontSize: 13, color: "var(--purple)", marginBottom: 8 }}
        >
          '{selectedChar}' à la position 0 :
        </div>

        <VectorBar
          values={tokEmb}
          label={`wte['${selectedChar}'] (plongement de token)`}
        />
        <div className="vector-divider">+</div>
        <VectorBar values={posEmb} label="wpe[0] (plongement de position)" />
        <div className="vector-divider">=</div>
        <VectorBar values={combined} label="combiné (entrée du modèle)" />
      </div>
    </PageSection>
  );
}
