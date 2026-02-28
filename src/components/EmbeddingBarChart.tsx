import type { CharStats } from "../utils/charStats";

interface Props {
  values: number[] | null;
  label: string | null;
  charStats: CharStats | null;
}

export default function EmbeddingBarChart({ values, label, charStats }: Props) {
  if (!values || !label) {
    return (
      <div className="barchart-container">
        <div className="barchart-empty">Survole une lettre dans le tableau</div>
      </div>
    );
  }

  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  const isBos = label === "BOS";

  return (
    <div className="barchart-container">
      <div className="barchart-title">
        Embedding de <strong>{label}</strong> — {values.length} dimensions
      </div>
      {isBos ? (
        <div className="label-dim">
          Token spécial — marque le début et la fin de chaque nom.
        </div>
      ) : charStats ? (
        <div className="label-dim">
          {charStats.nameCount}/{charStats.totalNames} prénoms ({charStats.pct})
          {charStats.topPreceders.length > 0 && (
            <> · Avant : {charStats.topPreceders.join(", ")}</>
          )}
          {charStats.topFollowers.length > 0 && (
            <> · Après : {charStats.topFollowers.join(", ")}</>
          )}
        </div>
      ) : null}
      <div
        className="barchart"
        role="img"
        aria-label={`${values.length} dimensions de ${label}`}
      >
        <div className="barchart-zero" />
        {values.map((v, i) => (
          <div
            key={i}
            className="barchart-col"
            title={`d${i}: ${v.toFixed(4)}`}
          >
            <div
              className={`barchart-bar ${v >= 0 ? "barchart-bar--pos" : "barchart-bar--neg"}`}
              style={{ height: `${(Math.abs(v) / maxAbs) * 60}px` }}
            />
            <div className="barchart-dim">d{i}</div>
          </div>
        ))}
      </div>
      <div className="barchart-legend label-dim">
        <span>
          <span
            className="barchart-dot"
            style={{ background: "var(--green)" }}
          />{" "}
          positif
        </span>
        <span>
          <span className="barchart-dot" style={{ background: "var(--red)" }} />{" "}
          négatif
        </span>
      </div>
    </div>
  );
}
