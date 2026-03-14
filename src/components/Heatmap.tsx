import { useCallback, useEffect, useRef, useState } from "react";
import { Value } from "../engine/autograd";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import { valToColor } from "../utils/valToColor";
import "./VectorDisplay.css";
import "./Heatmap.css";

const DISPLAY_DECIMALS = 2;
const TOOLTIP_DECIMALS = 4;

/** Force re-render when data-theme changes (matches Canvas MutationObserver pattern). */
function useThemeSignal() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
}

function useThemePalette() {
  useThemeSignal();
  return {
    neg: parseColor(getCssVar("--red")),
    pos: parseColor(getCssVar("--green")),
    neutral: parseColor(getCssVar("--surface2")),
    text: getCssVar("--vector-text"),
  };
}

interface Props {
  matrix: Value[][];
  rowLabels: string[];
  colCount: number;
  highlightRow?: number;
  onHoverRow?: (row: number | null) => void;
}

function useRovingKeyDown(rowCount: number) {
  const rowsRef = useRef<(HTMLTableRowElement | null)[]>([]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, r: number) => {
      let next = r;
      switch (e.key) {
        case "ArrowDown":
          next = Math.min(r + 1, rowCount - 1);
          break;
        case "ArrowUp":
          next = Math.max(r - 1, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = rowCount - 1;
          break;
        default:
          return;
      }
      if (next !== r) {
        e.preventDefault();
        rowsRef.current[next]?.focus();
      }
    },
    [rowCount],
  );
  return { rowsRef, handleKeyDown };
}

interface CellProps {
  cell: Value;
  rowLabel: string;
  c: number;
  palette: ReturnType<typeof useThemePalette>;
}

function HeatCell({ cell, rowLabel, c, palette }: CellProps) {
  const v = cell.data;
  const bg = valToColor(v / 0.3, {
    alpha: 1,
    green: palette.pos,
    red: palette.neg,
    neutral: palette.neutral,
  });
  return (
    <td
      style={{ background: bg, color: palette.text }}
      title={`${rowLabel} dim${c}: ${v.toFixed(TOOLTIP_DECIMALS)}`}
    >
      {v.toFixed(DISPLAY_DECIMALS)}
    </td>
  );
}

interface RowProps {
  row: Value[];
  r: number;
  colCount: number;
  rowLabel: string;
  highlightRow?: number;
  onHoverRow?: (row: number | null) => void;
  rowsRef: React.RefObject<(HTMLTableRowElement | null)[]>;
  handleKeyDown: (e: React.KeyboardEvent, r: number) => void;
  palette: ReturnType<typeof useThemePalette>;
}

function HeatRow(p: RowProps) {
  const { rowsRef, r } = p;
  return (
    <tr
      ref={(el) => {
        rowsRef.current[r] = el;
      }}
      tabIndex={
        p.onHoverRow ? (p.r === (p.highlightRow ?? 0) ? 0 : -1) : undefined
      }
      onKeyDown={p.onHoverRow ? (e) => p.handleKeyDown(e, p.r) : undefined}
      onMouseEnter={() => p.onHoverRow?.(p.r)}
      onMouseLeave={() => p.onHoverRow?.(null)}
      onFocus={() => p.onHoverRow?.(p.r)}
      onBlur={() => p.onHoverRow?.(null)}
      style={
        p.highlightRow === p.r
          ? { outline: "2px solid var(--blue)" }
          : undefined
      }
    >
      <td className="row-label">{p.rowLabel}</td>
      {p.row.slice(0, p.colCount).map((cell, c) => (
        <HeatCell
          key={c}
          cell={cell}
          rowLabel={p.rowLabel}
          c={c}
          palette={p.palette}
        />
      ))}
    </tr>
  );
}

export default function Heatmap({
  matrix,
  rowLabels,
  colCount,
  highlightRow,
  onHoverRow,
}: Props) {
  const palette = useThemePalette();
  const { rowsRef, handleKeyDown } = useRovingKeyDown(matrix.length);
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
            <HeatRow
              key={r}
              row={row}
              r={r}
              colCount={colCount}
              rowLabel={rowLabels[r]}
              highlightRow={highlightRow}
              onHoverRow={onHoverRow}
              rowsRef={rowsRef}
              handleKeyDown={handleKeyDown}
              palette={palette}
            />
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
  const palette = useThemePalette();
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  return (
    <div>
      {label && <div className="label-dim vector-bar-label">{label}</div>}
      <div className="vector-display">
        {values.map((v, i) => (
          <div
            key={i}
            className="vector-cell"
            style={{
              background: valToColor(v / (maxAbs * 0.8), {
                alpha: 1,
                green: palette.pos,
                red: palette.neg,
                neutral: palette.neutral,
              }),
              color: palette.text,
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
