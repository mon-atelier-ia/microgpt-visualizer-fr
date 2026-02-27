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
        background: `rgba(247, 118, 142, ${intensity * 0.3})`,
        border: `1px solid rgba(247, 118, 142, ${intensity * 0.5})`,
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
