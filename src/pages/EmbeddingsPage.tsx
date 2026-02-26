import { useState } from "react";
import { type ModelState, uchars, N_EMBD, BLOCK_SIZE, charToId } from "../engine/model";
import Heatmap, { VectorBar } from "../components/Heatmap";

interface Props {
  model: ModelState;
}

export default function EmbeddingsPage({ model }: Props) {
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [selectedChar, setSelectedChar] = useState("e");

  const wte = model.stateDict.wte;
  const wpe = model.stateDict.wpe;
  const wteLabels = [...uchars, "BOS"];
  const wpeLabels = Array.from({ length: BLOCK_SIZE }, (_, i) => `p${i}`);

  const charId = charToId[selectedChar] ?? 0;
  const tokEmb = wte[charId].map((v) => v.data);
  const posEmb = wpe[0].map((v) => v.data); // position 0
  const combined = tokEmb.map((t, i) => t + posEmb[i]);

  return (
    <>
      <h1 className="page-title">2. Plongements (Embeddings)</h1>
      <p className="page-desc">
        Le modele represente chaque token et chaque position comme une liste de 16 nombres (un "vecteur").
        Ces nombres sont les parametres apprenables du modele — ils commencent aleatoires et sont ajustes
        pendant l'entrainement.
      </p>

      {/* WTE */}
      <div className="panel">
        <div className="panel-title">wte — Plongements de tokens</div>
        <div className="explain">
          <b>wte</b> signifie "Word Token Embeddings" (plongements de tokens). C'est un tableau
          avec <b>{wte.length} lignes</b> (une par token) et <b>{N_EMBD} colonnes</b> (la dimension
          du plongement).<br /><br />
          Chaque ligne represente comment le modele "voit" ce caractere. C'est la representation interne
          de chaque lettre pour le modele. <b>Survole une ligne</b> pour la mettre en evidence.<br /><br />
          Couleurs : <span style={{ color: "var(--red)" }}>rouge = negatif</span>,{" "}
          <span style={{ color: "var(--text-dim)" }}>sombre = proche de zero</span>,{" "}
          <span style={{ color: "var(--green)" }}>vert = positif</span>.
          Pour l'instant ces valeurs sont <b>aleatoires</b> — apres l'entrainement, les lettres similaires
          auront des motifs similaires.
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
          <b>wpe</b> signifie "Word Position Embeddings" (plongements de positions). Il indique
          au modele <b>ou</b> se trouve un token dans la sequence. Position 0 = premier caractere,
          position 1 = deuxieme, etc.<br /><br />
          Sans cela, le modele ne pourrait pas distinguer "ab" de "ba" — les deux ont les memes
          caracteres ! Le plongement de position est <b>additionne</b> au plongement de token.
        </div>
        <Heatmap matrix={wpe} rowLabels={wpeLabels} colCount={N_EMBD} />
      </div>

      {/* Interactif : comment ils se combinent */}
      <div className="panel">
        <div className="panel-title">Comment wte + wpe se combinent</div>
        <div className="explain">
          Quand le modele traite un token, il cherche <code>wte[id_token]</code> et <code>wpe[position]</code>,
          puis les <b>additionne element par element</b>. Le resultat est un vecteur unique qui encode
          a la fois <b>quel</b> caractere et <b>ou</b> il se trouve.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {uchars.map((ch) => (
            <button
              key={ch}
              className={`btn ${ch === selectedChar ? "" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: 14, minWidth: 32 }}
              onClick={() => setSelectedChar(ch)}
            >
              {ch}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "var(--purple)", marginBottom: 8 }}>
          '{selectedChar}' a la position 0 :
        </div>

        <VectorBar values={tokEmb} label={`wte['${selectedChar}'] (plongement de token)`} />
        <div style={{ fontSize: 14, color: "var(--text-dim)", textAlign: "center", margin: "4px 0" }}>+</div>
        <VectorBar values={posEmb} label="wpe[0] (plongement de position)" />
        <div style={{ fontSize: 14, color: "var(--text-dim)", textAlign: "center", margin: "4px 0" }}>=</div>
        <VectorBar values={combined} label="combine (entree du modele)" />
      </div>
    </>
  );
}
