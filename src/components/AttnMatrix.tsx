import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import "./AttentionWeights.css";

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

  const cellClass = compact ? "attn-cell attn-cell--compact" : "attn-cell";
  const blueRgb = parseColor(getCssVar("--blue"));
  const textOnBlue = getCssVar("--bg");
  const textDim = getCssVar("--text-dim");

  return (
    <table
      className={`attn-matrix ${compact ? "attn-matrix--compact" : ""}`}
      aria-label={`Matrice d'attention ${tokens.length}×${tokens.length}`}
    >
      <thead>
        <tr>
          <th className="attn-matrix-label" />
          {tokens.map((tok, c) => (
            <th key={c} className="attn-matrix-col-label">
              {tok}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, r) => (
          <tr
            key={r}
            className={r === highlightRow ? "attn-matrix-row--highlight" : ""}
          >
            <td className="attn-matrix-label">{tokens[r]}</td>
            {row.map((w, c) => {
              const masked = c > r;
              if (masked) {
                return (
                  <td key={c} className={`${cellClass} attn-cell--masked`}>
                    &mdash;
                  </td>
                );
              }
              return (
                <td
                  key={c}
                  className={cellClass}
                  style={{
                    background: `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},${w})`,
                    color: w > 0.3 ? textOnBlue : textDim,
                  }}
                >
                  {w.toFixed(2)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
