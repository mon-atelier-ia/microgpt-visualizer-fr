import { useState } from "react";
import { uchars, BOS, tokenize, tokenLabel, vocabSize } from "../engine/model";

export default function TokenizerPage() {
  const [input, setInput] = useState("emma");

  const clean = input.toLowerCase().replace(/[^a-z]/g, "").slice(0, 16);
  const tokens = clean ? tokenize(clean) : [];

  return (
    <>
      <h1 className="page-title">1. Tokenisation</h1>
      <p className="page-desc">
        Le modele ne sait pas lire les lettres. Il ne comprend que les nombres. Le tokeniseur
        convertit chaque caractere en un identifiant numerique, et ajoute un token special BOS
        (debut/fin de sequence) pour marquer les limites de chaque nom.
      </p>

      {/* Correspondance caractere → ID */}
      <div className="panel">
        <div className="panel-title">Correspondance caractere → ID</div>
        <div className="explain">
          Chaque caractere unique du dataset recoit un <b>identifiant numerique</b>.
          Il y a <b>{uchars.length}</b> caracteres (a-z) plus un token special <b>BOS</b> (id={BOS}).
          Taille totale du vocabulaire : <b>{vocabSize}</b>.
        </div>
        <div className="char-mapping-scroll">
          {uchars.map((ch, i) => (
            <div
              key={ch}
              className="token-box"
              style={{ minWidth: 34, cursor: "default" }}
            >
              <span className="char">{ch}</span>
              <span className="id">{i}</span>
            </div>
          ))}
          <div className="token-box bos" style={{ minWidth: 34, cursor: "default" }}>
            <span className="char">BOS</span>
            <span className="id">{BOS}</span>
          </div>
        </div>
      </div>

      {/* Tokeniseur interactif */}
      <div className="panel">
        <div className="panel-title">Essaie : tape un nom</div>
        <div className="explain">
          Tape un nom ci-dessous. Observe comment il devient une sequence d'identifiants de tokens.
          Le modele apprend a partir de sequences comme celle-ci — en predisant chaque token suivant
          a partir des precedents.
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tape un nom..."
          maxLength={16}
        />

        {clean && (
          <>
            <div className="token-flow">
              {tokens.map((t, i) => {
                const label = tokenLabel(t);
                const isBos = t === BOS;
                return (
                  <span key={i} style={{ display: "contents" }}>
                    {i > 0 && <span className="arrow-sym">→</span>}
                    <div className={`token-box ${isBos ? "bos" : ""}`}>
                      <span className="char">{label}</span>
                      <span className="id">id: {t}</span>
                    </div>
                  </span>
                );
              })}
            </div>

            {/* Ce que le modele doit apprendre */}
            <div style={{ marginTop: 16 }}>
              <div className="panel-title">Ce que le modele doit apprendre :</div>
              <div className="explain">
                A chaque position, le modele voit le <b>token actuel</b> et doit predire
                le <b>token suivant</b>. C'est ce qu'on appelle la <b>prediction du token suivant</b> —
                le coeur du fonctionnement de GPT.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {tokens.slice(0, -1).map((t, i) => {
                  const from = tokenLabel(t);
                  const to = tokenLabel(tokens[i + 1]);
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "4px 10px",
                        background: "var(--surface2)",
                        borderRadius: 6,
                        fontSize: 12,
                        border: "1px solid var(--border-hover)",
                      }}
                    >
                      <span style={{ color: "var(--cyan)" }}>{from}</span>
                      <span style={{ color: "var(--text-dim)", margin: "0 4px" }}>→</span>
                      <span style={{ color: "var(--green)" }}>{to}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details du vocabulaire */}
      <div className="panel">
        <div className="panel-title">Comment fonctionne la tokenisation dans les vrais GPT</div>
        <div className="explain">
          Ce micro GPT utilise une tokenisation <b>caractere par caractere</b> — chaque lettre est un token.<br /><br />
          Les vrais GPT (comme GPT-4) utilisent une tokenisation <b>par sous-mots</b> (BPE) ou des parties de mots
          courantes comme "ing", "tion", "le" deviennent des tokens uniques. Cela donne un vocabulaire
          beaucoup plus grand (~50K-100K tokens) mais permet au modele de traiter le texte bien plus efficacement.<br /><br />
          Notre petit vocabulaire de <b>{vocabSize}</b> tokens suffit pour apprendre des motifs dans les noms !
        </div>
      </div>
    </>
  );
}
