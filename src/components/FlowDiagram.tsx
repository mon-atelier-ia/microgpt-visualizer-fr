import { N_HEAD } from "../engine/model";
import type { ReactNode } from "react";
import Term from "./Term";
import "./FlowDiagram.css";

interface StepConfig {
  label: ReactNode;
  values: ReactNode;
}

interface Props {
  char: string;
  pos: number;
  tokenId: number;
  mlpActiveCount: number;
  topChar: string;
  topProbPct: string;
}

function buildSteps(props: Props): StepConfig[] {
  const { char, pos, tokenId, mlpActiveCount, topChar, topProbPct } = props;
  return [
    {
      label: <>Token '{char}'</>,
      values: (
        <>
          wte[{tokenId}]<br />
          Chercher le plongement
          <br />
          de ce caractère dans la table
        </>
      ),
    },
    {
      label: <>Position {pos}</>,
      values: (
        <>
          wpe[{pos}]<br />
          Chercher le plongement
          <br />
          de cette position dans la table
        </>
      ),
    },
    {
      label: <>tok + pos</>,
      values: (
        <>
          Addition élément par élément
          <br />
          Encode maintenant
          <br />
          le « quoi » et le « où »
        </>
      ),
    },
    {
      label: <Term id="rmsnorm" />,
      values: (
        <>
          Normaliser le vecteur
          <br />
          Maintient les valeurs
          <br />
          dans une plage stable
        </>
      ),
    },
    {
      label: <Term id="attention" />,
      values: (
        <>
          Q = "que cherche-je ?"
          <br />
          K = "que contiens-je ?"
          <br />
          V = "qu'ai-je à offrir ?"
          <br />
          {N_HEAD} têtes, chacune dim {16 / N_HEAD}
        </>
      ),
    },
    {
      label: <Term id="mlp" />,
      values: (
        <>
          Linéaire → <Term id="relu" /> → Linéaire
          <br />
          Expansé à 64 dims,
          <br />
          puis retour à 16
          <br />
          <span className="highlight">
            {mlpActiveCount}/64 <Term id="neurone" />s actifs
          </span>
        </>
      ),
    },
    {
      label: <>Sortie</>,
      values: (
        <>
          lm_head : 16 → 27 <Term id="logits" />
          <br />
          <Term id="softmax" /> → probabilités
          <br />
          <span className="highlight">
            Top : '{topChar}' {topProbPct}%
          </span>
        </>
      ),
    },
  ];
}

export default function FlowDiagram(props: Props) {
  const steps = buildSteps(props);

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
        {steps.map((step, i) => (
          <div key={i} className="d-contents">
            {i > 0 && <div className="flow-arrow">→</div>}
            <div className="flow-step">
              <div className="label">{step.label}</div>
              <div className="values">{step.values}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
