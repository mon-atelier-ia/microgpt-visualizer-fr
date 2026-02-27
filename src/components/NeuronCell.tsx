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
          ? `rgba(158, 206, 106, ${Math.min(1, value * 2)})`
          : "var(--surface2)",
        color: active ? "#fff" : "var(--text-dim)",
      }}
      title={`neurone ${index} : ${value.toFixed(4)} ${active ? "(actif)" : "(inactif)"}`}
    >
      {active ? "+" : "·"}
    </div>
  );
}
