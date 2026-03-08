import "./LossCell.css";

interface Props {
  loss: number;
  from: string;
  to: string;
}

export default function LossCell({ loss, from, to }: Props) {
  const intensity = Math.min(1, loss / 4);
  return (
    <div
      className="loss-cell"
      style={{
        background: `color-mix(in oklch, var(--loss-bg) ${Math.round(intensity * 30)}%, transparent)`,
        border: `1px solid color-mix(in oklch, var(--loss-bg) ${Math.round(intensity * 50)}%, transparent)`,
      }}
    >
      <div>
        <span className="text-cyan">{from}</span>
        <span className="text-dim"> → </span>
        <span className="text-green">{to}</span>
      </div>
      <div className="loss-cell__value">loss : {loss.toFixed(3)}</div>
    </div>
  );
}
