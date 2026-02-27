interface Props {
  value: number;
  label: string;
}

export default function HeatCell({ value, label }: Props) {
  return (
    <div
      className="heat-cell"
      style={{
        background: `rgba(122, 162, 247, ${value})`,
        color: value > 0.3 ? "#fff" : "var(--text-dim)",
      }}
    >
      {label}
    </div>
  );
}
