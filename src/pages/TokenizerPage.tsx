import { useState, memo } from "react";
import { uchars, BOS, tokenize, tokenLabel, vocabSize } from "../engine/model";
import Term from "../components/Term";
import PageSection from "../components/PageSection";

// R-1: seul TokenizerPage est memo'd (zéro prop).
// Les 4 autres reçoivent modelRef.current (même référence) →
// memo empêcherait les re-renders après training. Requiert fix A-1.
const TokenizerPage = memo(function TokenizerPage() {
  const [input, setInput] = useState("emma");

  const clean = input
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 16);
  const tokens = clean ? tokenize(clean) : [];

  return (
    <PageSection id="tokenizer" title="1. Tokenisation">
      <p className="page-desc">
        Le modèle ne sait pas lire les lettres. Il ne comprend que les nombres.
        Le <Term id="tokeniseur" /> convertit chaque caractère en un{" "}
        <Term id="identifiant" /> numérique, et ajoute un <Term id="token" />{" "}
        spécial <Term id="bos" /> (début/fin de séquence) pour marquer les
        limites de chaque nom.
      </p>

      {/* Correspondance caractère → ID */}
      <div className="panel">
        <div className="panel-title">Correspondance caractère → ID</div>
        <div className="explain">
          Chaque caractère unique du dataset reçoit un{" "}
          <b>
            <Term id="identifiant" />
          </b>{" "}
          numérique. Il y a <b>{uchars.length}</b> caractères (a-z) plus un{" "}
          <Term id="token" /> spécial{" "}
          <b>
            <Term id="bos" />
          </b>{" "}
          (id={BOS}). Taille totale du <Term id="vocabulaire" /> :{" "}
          <b>{vocabSize}</b>.
        </div>
        <div className="char-mapping-scroll">
          {uchars.map((ch, i) => (
            <div key={ch} className="token-box" style={{ cursor: "default" }}>
              <span className="char">{ch}</span>
              <span className="id">{i}</span>
            </div>
          ))}
          <div className="token-box bos" style={{ cursor: "default" }}>
            <span className="char">BOS</span>
            <span className="id">{BOS}</span>
          </div>
        </div>
      </div>

      {/* Tokeniseur interactif */}
      <div className="panel">
        <div className="panel-title">Essaie : tape un nom</div>
        <div className="explain">
          Tape un nom ci-dessous. Observe comment il devient une séquence
          d'identifiants de <Term id="token" />
          s. Le modèle apprend à partir de séquences comme celle-ci — en
          prédisant chaque <Term id="token" /> suivant à partir des précédents.
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

            {/* Ce que le modèle doit apprendre */}
            <div style={{ marginTop: 16 }}>
              <div className="panel-title">
                Ce que le modèle doit apprendre :
              </div>
              <div className="explain">
                À chaque position, le modèle voit le <b>token actuel</b> et doit
                prédire le{" "}
                <b>
                  <Term id="token" /> suivant
                </b>
                . C'est ce qu'on appelle la{" "}
                <b>
                  prédiction du <Term id="token" /> suivant
                </b>{" "}
                — le cœur du fonctionnement de GPT.
              </div>
              <div
                className="controls"
                style={{ marginTop: 8, marginBottom: 0 }}
              >
                {tokens.slice(0, -1).map((t, i) => {
                  const from = tokenLabel(t);
                  const to = tokenLabel(tokens[i + 1]);
                  return (
                    <div key={i} className="token-pair">
                      <span className="text-cyan">{from}</span>
                      <span className="text-dim" style={{ margin: "0 4px" }}>
                        →
                      </span>
                      <span className="text-green">{to}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Détails du vocabulaire */}
      <div className="panel">
        <div className="panel-title">
          Comment fonctionne la tokenisation dans les vrais GPT
        </div>
        <div className="explain">
          Ce micro GPT utilise une tokenisation <b>caractère par caractère</b> —
          chaque lettre est un <Term id="token" />.<br />
          <br />
          Les vrais GPT (comme GPT-4) utilisent une tokenisation{" "}
          <b>par sous-mots</b> (BPE) où des parties de mots courantes comme
          "ing", "tion", "le" deviennent des <Term id="token" />s uniques. Cela
          donne un <Term id="vocabulaire" /> beaucoup plus grand (~50K-100K
          tokens) mais permet au modèle de traiter le texte bien plus
          efficacement.
          <br />
          <br />
          Notre petit <Term id="vocabulaire" /> de <b>{vocabSize}</b> tokens
          suffit pour apprendre des motifs dans les noms !
        </div>
      </div>
    </PageSection>
  );
});

export default TokenizerPage;
