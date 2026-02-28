import NeuronCell from "./NeuronCell";
import Term from "./Term";

interface Props {
  mlpHidden: number[];
  mlpActiveMask: boolean[];
}

export default function MLPActivationPanel({
  mlpHidden,
  mlpActiveMask,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-title">
        Couche cachée <Term id="mlp" /> (64 <Term id="neurone" />
        s)
      </div>
      <div className="explain">
        Après la couche linéaire qui expanse de 16 → 64 <Term id="dimension" />
        s, l'activation{" "}
        <b>
          <Term id="relu" />
        </b>{" "}
        met toutes les valeurs négatives à zéro. Seuls les <Term id="neurone" />
        s « actifs » (verts) laissent passer l'information. C'est ainsi que le
        modèle crée des représentations non linéaires.
      </div>
      <div className="neuron-grid">
        {mlpHidden.map((v, i) => (
          <NeuronCell key={i} value={v} index={i} />
        ))}
      </div>
      <div className="label-dim" style={{ fontSize: 12, marginTop: 4 }}>
        {mlpActiveMask.filter(Boolean).length} / 64 <Term id="neurone" />s
        actifs après <Term id="relu" />
      </div>
    </div>
  );
}
