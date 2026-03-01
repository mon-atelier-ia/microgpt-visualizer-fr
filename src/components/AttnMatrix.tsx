import HeatCell from "./HeatCell";

interface Props {
  matrix: number[][];
  tokens: string[];
  highlightRow?: number;
  compact?: boolean;
}

/**
 * Heatmap T×T d'une tête d'attention.
 * Le masque causal est implicite : matrix[row][col] === 0 pour col > row.
 */
export default function AttnMatrix({
  matrix,
  tokens,
  highlightRow,
  compact,
}: Props) {
  if (matrix.length === 0) return null;

  const cellClass = compact ? "heat-cell heat-cell--compact" : "heat-cell";

  return (
    <div className={`attn-matrix ${compact ? "attn-matrix--compact" : ""}`}>
      {/* En-tête colonnes */}
      <div className="attn-matrix-row">
        <div className="attn-matrix-label" />
        {tokens.map((tok, c) => (
          <div key={c} className="attn-matrix-col-label">
            {tok}
          </div>
        ))}
      </div>

      {/* Lignes (une par position query) */}
      {matrix.map((row, r) => (
        <div
          key={r}
          className={`attn-matrix-row ${r === highlightRow ? "attn-matrix-row--highlight" : ""}`}
        >
          <div className="attn-matrix-label">{tokens[r]}</div>
          {row.map((w, c) => {
            const masked = c > r;
            if (masked) {
              return (
                <div key={c} className={`${cellClass} heat-cell--masked`}>
                  &mdash;
                </div>
              );
            }
            return <HeatCell key={c} value={w} label={w.toFixed(2)} />;
          })}
        </div>
      ))}
      {/* ANIMATION: matrice se construit ligne par ligne (étape 3) */}
    </div>
  );
}
