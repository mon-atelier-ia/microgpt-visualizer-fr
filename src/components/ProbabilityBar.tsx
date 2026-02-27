import type React from "react";

export interface ProbItem {
  id: number;
  char: string;
  prob: number;
}

interface Props {
  items: ProbItem[];
  maxProb: number;
  labelStyle?: (item: ProbItem) => React.CSSProperties;
  barColor?: (item: ProbItem) => string;
}

export default function ProbabilityBar({
  items,
  maxProb,
  labelStyle,
  barColor,
}: Props) {
  return (
    <>
      {items.map((t) => (
        <div className="prob-row" key={t.id}>
          <span className="prob-label" style={labelStyle?.(t)}>
            {t.char}
          </span>
          <div className="prob-bar-bg">
            <div
              className="prob-bar"
              style={{
                width: `${(t.prob / maxProb) * 100}%`,
                background:
                  barColor?.(t) ??
                  (t.char === "BOS" ? "var(--red)" : "var(--blue)"),
              }}
            />
          </div>
          <span className="prob-val">{(t.prob * 100).toFixed(1)}%</span>
        </div>
      ))}
    </>
  );
}
