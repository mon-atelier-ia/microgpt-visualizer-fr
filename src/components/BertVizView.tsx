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
  tokenIds: number[];
}

export default function BertVizView({ matrices, tokens, tokenIds }: Props) {
  const [activeHead, setActiveHead] = useState<number | "all">("all");
  const [hoverSrc, setHoverSrc] = useState<number | null>(null);
  const [clickedPos, setClickedPos] = useState(-1);

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
  const safeClicked = clickedPos >= 0 && clickedPos < T ? clickedPos : -1;

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

      {/* BertViz (source ← SVG → destination) + détail à droite */}
      <div className="bv-row">
        <div className="bv-container" onMouseLeave={() => setHoverSrc(null)}>
          <div className="bv-column">
            <div className="bv-col-header">Qui regarde ?</div>
            {tokens.map((tok, i) => (
              <div
                key={i}
                tabIndex={0}
                className={`token-box token-box--bv bv-src${tok === "BOS" ? " bos" : ""}${
                  i === safeClicked ? " token-box--selected" : ""
                }`}
                style={{ opacity: isDim && hoverSrc !== i ? 0.25 : 1 }}
                onMouseEnter={() => setHoverSrc(i)}
                onFocus={() => setHoverSrc(i)}
                onClick={() => setClickedPos(safeClicked === i ? -1 : i)}
              >
                <span className="char">{tok}</span>
                <span className="id">id: {tokenIds[i]}</span>
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
                className={`token-box token-box--bv${tok === "BOS" ? " bos" : ""}`}
                style={{
                  opacity: isDim && !litDst.has(j) && hoverSrc !== j ? 0.25 : 1,
                }}
              >
                <span className="char">{tok}</span>
                <span className="id">id: {tokenIds[j]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panneau de détail (clic sur un token source) */}
        {safeClicked >= 0 && (
          <div className="bv-detail">
            <div className="bv-detail-title">
              {isAll
                ? `Position ${safeClicked} « ${tokens[safeClicked]} » — moyenne des ${N_HEAD} têtes`
                : `Position ${safeClicked} « ${tokens[safeClicked]} » — Tête ${activeHead} (${headLabels[activeHead as number]})`}
            </div>
            <div className="explain">
              {isAll ? (
                <>
                  Chaque barre montre{" "}
                  <b>combien « {tokens[safeClicked]} » regarde</b> ce token (en
                  %). C'est la moyenne des {N_HEAD} têtes — chacune regarde des
                  choses différentes, le modèle combine leurs points de vue.
                </>
              ) : (
                headExplanation(
                  headLabels[activeHead as number],
                  tokens[safeClicked],
                )
              )}
            </div>
            {Array.from({ length: safeClicked + 1 }, (_, j) => {
              const w = isAll
                ? matrices.reduce((s, hw) => s + hw[safeClicked][j], 0) / N_HEAD
                : matrices[activeHead as number][safeClicked][j];
              const pct = (w * 100).toFixed(1);
              const color = isAll
                ? "var(--cyan)"
                : HEAD_COLORS[activeHead as number];
              return (
                <div key={j} className="bv-weight-row">
                  <span className="bv-weight-label">{tokens[j]}</span>
                  <div className="bv-weight-track">
                    <div
                      className="bv-weight-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="bv-weight-pct">{pct} %</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
