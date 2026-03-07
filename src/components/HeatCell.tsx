interface Props {
  value: number;
  label: string;
}

export default function HeatCell({ value, label }: Props) {
  return (
    <div
      className="heat-cell"
      style={{
        background: `color-mix(in oklch, var(--heat-cell-bg) ${Math.round(value * 100)}%, transparent)`,
        color: value > 0.3 ? "#fff" : "var(--text-dim)",
      }}
    >
      {label}
    </div>
  );
}
