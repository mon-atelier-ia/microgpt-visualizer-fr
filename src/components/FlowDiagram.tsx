import { N_HEAD } from "../engine/model";
import Term from "./Term";

interface Props {
  char: string;
  pos: number;
  tokenId: number;
  mlpActiveCount: number;
  topChar: string;
  topProbPct: string;
}

export default function FlowDiagram({
  char,
  pos,
  tokenId,
  mlpActiveCount,
  topChar,
  topProbPct,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Les données traversent le modèle</div>
      <div className="explain">
        Chaque boîte montre les données à cette étape. Les 16 nombres sont
        transformés à chaque étape. Les couleurs montrent les valeurs :{" "}
        <span className="text-red">négatif</span> à{" "}
        <span className="text-green">positif</span>.
      </div>

      <div className="flow">
        <div className="flow-step">
          <div className="label">Token '{char}'</div>
          <div className="values">
            wte[{tokenId}]<br />
            Chercher le plongement
            <br />
            de ce caractère dans la table
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">Position {pos}</div>
          <div className="values">
            wpe[{pos}]<br />
            Chercher le plongement
            <br />
            de cette position dans la table
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">tok + pos</div>
          <div className="values">
            Addition élément par élément
            <br />
            Encode maintenant
            <br />
            le « quoi » et le « où »
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">
            <Term id="rmsnorm" />
          </div>
          <div className="values">
            Normaliser le vecteur
            <br />
            Maintient les valeurs
            <br />
            dans une plage stable
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">
            <Term id="attention" />
          </div>
          <div className="values">
            Q = "que cherche-je ?"
            <br />
            K = "que contiens-je ?"
            <br />
            V = "qu'ai-je à offrir ?"
            <br />
            {N_HEAD} têtes, chacune dim {16 / N_HEAD}
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">
            <Term id="mlp" />
          </div>
          <div className="values">
            Linéaire → <Term id="relu" /> → Linéaire
            <br />
            Expansé à 64 dims,
            <br />
            puis retour à 16
            <br />
            <span className="highlight">
              {mlpActiveCount}/64 <Term id="neurone" />s actifs
            </span>
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="label">Sortie</div>
          <div className="values">
            lm_head : 16 → 27 <Term id="logits" />
            <br />
            <Term id="softmax" /> → probabilités
            <br />
            <span className="highlight">
              Top : '{topChar}' {topProbPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
