import { useCallback, useRef } from "react";
import { Value } from "../engine/autograd";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import { valToColor } from "../utils/valToColor";

const DISPLAY_DECIMALS = 2;
const TOOLTIP_DECIMALS = 4;

interface Props {
  matrix: Value[][];
  rowLabels: string[];
  colCount: number;
  highlightRow?: number;
  onHoverRow?: (row: number | null) => void;
}

export default function Heatmap({
  matrix,
  rowLabels,
  colCount,
  highlightRow,
  onHoverRow,
}: Props) {
  const rowsRef = useRef<(HTMLTableRowElement | null)[]>([]);

  // Read theme palette for heatmap colors — no memo (getCssVar is cheap,
  // must re-read on every render to react to theme toggle)
  const neg = parseColor(getCssVar("--red"));
  const pos = parseColor(getCssVar("--green"));
  const neutral = parseColor(getCssVar("--surface2"));
  const text = getCssVar("--vector-text");
  const palette = { neg, pos, neutral, text };

  // Roving tabindex: Arrow Up/Down/Home/End to navigate rows (W-1)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, r: number) => {
      let next = r;
      switch (e.key) {
        case "ArrowDown":
          next = Math.min(r + 1, matrix.length - 1);
          break;
        case "ArrowUp":
          next = Math.max(r - 1, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = matrix.length - 1;
          break;
        default:
          return;
      }
      if (next !== r) {
        e.preventDefault();
        rowsRef.current[next]?.focus();
      }
    },
    [matrix.length],
  );

  return (
    <div className="heatmap-wrap">
      <table
        className="heatmap"
        aria-label={`Tableau ${rowLabels.length} lignes × ${colCount} colonnes`}
      >
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: colCount }, (_, c) => (
              <th key={c}>d{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, r) => (
            <tr
              key={r}
              ref={(el) => {
                rowsRef.current[r] = el;
              }}
              tabIndex={
                onHoverRow ? (r === (highlightRow ?? 0) ? 0 : -1) : undefined
              }
              onKeyDown={onHoverRow ? (e) => handleKeyDown(e, r) : undefined}
              onMouseEnter={() => onHoverRow?.(r)}
              onMouseLeave={() => onHoverRow?.(null)}
              onFocus={() => onHoverRow?.(r)}
              onBlur={() => onHoverRow?.(null)}
              style={
                highlightRow === r
                  ? { outline: "2px solid var(--blue)" }
                  : undefined
              }
            >
              <td className="row-label">{rowLabels[r]}</td>
              {row.slice(0, colCount).map((cell, c) => {
                const v = cell.data;
                const bg = valToColor(
                  v / 0.3,
                  1,
                  palette.pos,
                  palette.neg,
                  palette.neutral,
                );
                return (
                  <td
                    key={c}
                    style={{
                      background: bg,
                      color: palette.text,
                    }}
                    title={`${rowLabels[r]} dim${c}: ${v.toFixed(TOOLTIP_DECIMALS)}`}
                  >
                    {v.toFixed(DISPLAY_DECIMALS)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {onHoverRow && (
        <div className="label-dim heatmap-kbd-hint">
          <kbd>↑</kbd>
          <kbd>↓</kbd> naviguer · <kbd>Début</kbd>
          <kbd>Fin</kbd> extrémités
        </div>
      )}
    </div>
  );
}

export function VectorBar({
  values,
  label,
}: {
  values: number[];
  label?: string;
}) {
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  const neg = parseColor(getCssVar("--red"));
  const pos = parseColor(getCssVar("--green"));
  const neutral = parseColor(getCssVar("--surface2"));
  const text = getCssVar("--vector-text");
  return (
    <div>
      {label && <div className="label-dim vector-bar-label">{label}</div>}
      <div className="vector-display">
        {values.map((v, i) => (
          <div
            key={i}
            className="vector-cell"
            style={{
              background: valToColor(v / (maxAbs * 0.8), 1, pos, neg, neutral),
              color: text,
            }}
            title={`dim${i}: ${v.toFixed(TOOLTIP_DECIMALS)}`}
          >
            {v.toFixed(DISPLAY_DECIMALS)}
          </div>
        ))}
      </div>
    </div>
  );
}
