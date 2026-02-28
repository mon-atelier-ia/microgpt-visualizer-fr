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
        Chaque tête apprend à se concentrer sur des aspects différents. Puisque
        c'est le premier token, toutes les têtes ont un poids de <b>1.0</b> sur
        elles-mêmes (rien d'autre à observer). Avec plus de tokens dans la
        séquence, l'attention serait répartie sur les tokens précédents.
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
