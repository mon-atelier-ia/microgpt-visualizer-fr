interface Props {
  value: number;
  index: number;
}

export default function NeuronCell({ value, index }: Props) {
  const active = value > 0;
  return (
    <div
      className="neuron-cell"
      style={{
        background: active
          ? `color-mix(in oklch, var(--neuron-active-bg) ${Math.round(Math.min(1, value * 2) * 100)}%, transparent)`
          : "var(--surface2)",
        color: active ? "var(--bg)" : "var(--text-dim)",
      }}
      title={`neurone ${index} : ${value.toFixed(4)} ${active ? "(actif)" : "(inactif)"}`}
    >
      {active ? "+" : "·"}
    </div>
  );
}
