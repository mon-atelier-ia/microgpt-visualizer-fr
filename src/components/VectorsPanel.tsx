import { VectorBar } from "./Heatmap";

interface Props {
  char: string;
  pos: number;
  tokEmb: number[];
  posEmb: number[];
  combined: number[];
  afterNorm: number[];
  afterAttn: number[];
  afterMlp: number[];
}

export default function VectorsPanel({
  char,
  pos,
  tokEmb,
  posEmb,
  combined,
  afterNorm,
  afterAttn,
  afterMlp,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Vecteurs intermédiaires (16 dims)</div>
      <VectorBar
        values={tokEmb}
        label={`Plongement de token : wte['${char}']`}
      />
      <VectorBar
        values={posEmb}
        label={`Plongement de position : wpe[${pos}]`}
      />
      <VectorBar values={combined} label="Combiné (tok + pos)" />
      <VectorBar values={afterNorm} label="Après RMSNorm" />
      <VectorBar values={afterAttn} label="Après Attention + Résiduel" />
      <VectorBar values={afterMlp} label="Après MLP + Résiduel" />
    </div>
  );
}
