import { N_HEAD } from "../engine/model";
import HeatCell from "./HeatCell";

interface Props {
  attnWeights: number[][];
}

export default function AttentionWeightsPanel({ attnWeights }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Poids d'attention ({N_HEAD} têtes)</div>
      <div className="explain">
        Ici, un seul token passe dans le modèle — il n'a personne à qui « parler
        ». Résultat : chaque tête met tout le poids (<b>1.0</b>) sur lui-même.
        Pas très intéressant…
      </div>
      <div className="explain" style={{ marginTop: 8 }}>
        💡 Reviens après avoir exploré l'<b>étape 4 — Attention</b> pour voir ce
        qui se passe quand plusieurs tokens se parlent entre eux : les poids se
        répartissent et chaque tête regarde des choses différentes !
      </div>
      <div className="attn-heads">
        {attnWeights.map((hw, h) => (
          <div key={h}>
            <div className="label-dim attn-head-label">Tête {h}</div>
            <div className="attn-head-row">
              {hw.map((w, t) => (
                <HeatCell key={t} value={w} label={w.toFixed(2)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
