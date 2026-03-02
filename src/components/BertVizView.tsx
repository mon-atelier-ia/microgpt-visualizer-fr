import { useState } from "react";
import { N_HEAD } from "../engine/model";
import { classifyHead } from "../utils/classifyHead";
import { headExplanation } from "../utils/headExplanation";

const BOX_H = 44;
const GAP = 6;
const SVG_W = 180;
const HEADER_H = 22;
const HEAD_COLORS = [
  "var(--blue)",
  "var(--purple)",
  "var(--cyan)",
  "var(--green)",
] as const;

interface Props {
  matrices: number[][][];
  tokens: string[];
  selectedPos: number;
}

export default function BertVizView({ matrices, tokens, selectedPos }: Props) {
  const [activeHead, setActiveHead] = useState<number | "all">("all");
  const [hoverSrc, setHoverSrc] = useState<number | null>(null);

  const T = tokens.length;
  if (T === 0) return null;

  const headLabels = matrices.map((m) => classifyHead(m));
  const colH = T * (BOX_H + GAP) - GAP;
  const isAll = activeHead === "all";
  const isDim = hoverSrc !== null;

  function yCenter(i: number): number {
    return i * (BOX_H + GAP) + BOX_H / 2;
  }

  const heads: number[] = isAll
    ? Array.from({ length: N_HEAD }, (_, i) => i)
    : [activeHead as number];
  const lines: { h: number; i: number; j: number; w: number }[] = [];
  for (const h of heads) {
    for (let i = 0; i < T; i++) {
      for (let j = 0; j <= i; j++) {
        const w = matrices[h][i][j];
        if (w < 0.005) continue;
        lines.push({ h, i, j, w });
      }
    }
  }
  lines.sort((a, b) => a.w - b.w);

  const litDst = new Set<number>();
  if (isDim) {
    for (const l of lines) {
      if (l.i === hoverSrc) litDst.add(l.j);
    }
  }

  const cx1 = SVG_W * 0.32;
  const cx2 = SVG_W * 0.68;

  return (
    <>
      {/* Sélecteur de tête */}
      <div className="controls mt-8">
        <span className="label-dim">Vue :</span>
        <button
          type="button"
          className={`btn btn-toggle ${isAll ? "" : "btn-secondary"}`}
          onClick={() => setActiveHead("all")}
        >
          Toutes
        </button>
        {Array.from({ length: N_HEAD }, (_, h) => (
          <button
            key={h}
            type="button"
            className={`btn btn-toggle ${activeHead === h ? "" : "btn-secondary"}`}
            onClick={() => setActiveHead(h)}
          >
            <span className="bv-dot" style={{ background: HEAD_COLORS[h] }} />{" "}
            {h}
          </button>
        ))}
      </div>

      {/* Légende personnalités */}
      <div className="bv-legend">
        {Array.from({ length: N_HEAD }, (_, h) => (
          <span key={h} className="bv-legend-item">
            <span
              className="bv-legend-swatch"
              style={{ background: HEAD_COLORS[h] }}
            />
            T{h} : {headLabels[h]}
          </span>
        ))}
      </div>

      {/* BertViz : source ← SVG → destination */}
      <div className="bv-container" onMouseLeave={() => setHoverSrc(null)}>
        <div className="bv-column">
          <div className="bv-col-header">Qui regarde ?</div>
          {tokens.map((tok, i) => (
            <div
              key={i}
              className={`bv-token${tok === "BOS" ? " bv-token--bos" : ""}${
                i === selectedPos ? " bv-token--selected" : ""
              }`}
              style={{ opacity: isDim && hoverSrc !== i ? 0.25 : 1 }}
              onMouseEnter={() => setHoverSrc(i)}
            >
              {tok}
            </div>
          ))}
        </div>

        <svg
          width={SVG_W}
          height={colH}
          className="bv-svg"
          style={{ marginTop: HEADER_H }}
          aria-hidden="true"
        >
          {lines.map((l) => {
            const y1 = yCenter(l.i);
            const y2 = yCenter(l.j);
            const thick = isAll ? 0.8 + l.w * 5 : 1 + l.w * 7;
            const baseAlpha = isAll ? 0.15 + l.w * 0.55 : 0.1 + l.w * 0.9;
            const opacity = isDim
              ? l.i === hoverSrc
                ? baseAlpha
                : 0.04
              : baseAlpha;
            return (
              <path
                key={`${l.h}-${l.i}-${l.j}`}
                d={`M 0 ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${SVG_W} ${y2}`}
                fill="none"
                strokeLinecap="round"
                style={{
                  stroke: HEAD_COLORS[l.h],
                  strokeWidth: thick,
                  opacity,
                }}
              />
            );
          })}
        </svg>

        <div className="bv-column">
          <div className="bv-col-header">Vu avant ?</div>
          {tokens.map((tok, j) => (
            <div
              key={j}
              className={`bv-token${tok === "BOS" ? " bv-token--bos" : ""}`}
              style={{
                opacity: isDim && !litDst.has(j) && hoverSrc !== j ? 0.25 : 1,
              }}
            >
              {tok}
            </div>
          ))}
        </div>
      </div>

      {/* Explication (tête unique sélectionnée) */}
      {activeHead !== "all" && (
        <div className="label-dim mt-4">
          <b>
            Tête {activeHead} ({headLabels[activeHead as number]})
          </b>{" "}
          :{" "}
          {headExplanation(
            headLabels[activeHead as number],
            tokens[selectedPos],
          )}
        </div>
      )}
    </>
  );
}
