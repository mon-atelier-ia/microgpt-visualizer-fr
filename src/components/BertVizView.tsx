import { N_HEAD } from "../engine/model";
import { classifyHead } from "../utils/classifyHead";
import "./BertVizView.css";

const BOX_H = 44;
const GAP = 6;
const SVG_W = 180;
const HEADER_H = 22;

export const HEAD_COLORS = [
  "var(--blue)",
  "var(--purple)",
  "var(--cyan)",
  "var(--green)",
] as const;

interface Line {
  h: number;
  i: number;
  j: number;
  w: number;
}

interface ComputeOpts {
  matrices: number[][][];
  isAll: boolean;
  activeHead: number | "all";
}

function computeLines({ matrices, isAll, activeHead }: ComputeOpts): Line[] {
  const T = matrices[0]?.length ?? 0;
  const heads: number[] = isAll
    ? Array.from({ length: N_HEAD }, (_, i) => i)
    : [activeHead as number];
  const lines: Line[] = [];
  for (const h of heads) {
    for (let i = 0; i < T; i++) {
      for (let j = 0; j <= i; j++) {
        const w = matrices[h][i][j];
        if (w >= 0.005) lines.push({ h, i, j, w });
      }
    }
  }
  lines.sort((a, b) => a.w - b.w);
  return lines;
}

function yCenter(i: number): number {
  return i * (BOX_H + GAP) + BOX_H / 2;
}

/* ── Token column ── */

interface TokenColumnProps {
  header: string;
  tokens: string[];
  tokenIds: number[];
  getOpacity: (i: number) => number;
  selectedSrc?: number;
  onInteract?: (pos: number) => void;
  onClick?: (pos: number) => void;
}

function TokenColumn({
  header,
  tokens,
  tokenIds,
  getOpacity,
  selectedSrc,
  onInteract,
  onClick,
}: TokenColumnProps) {
  const interactive = !!onInteract;
  return (
    <div className="bv-column">
      <div className="bv-col-header">{header}</div>
      {tokens.map((tok, i) => (
        <div
          key={i}
          tabIndex={interactive ? 0 : undefined}
          className={`token-box token-box--bv${interactive ? " bv-src" : ""}${tok === "BOS" ? " bos" : ""}${
            interactive && i === selectedSrc ? " token-box--selected" : ""
          }`}
          style={{ opacity: getOpacity(i) }}
          onMouseEnter={interactive ? () => onInteract(i) : undefined}
          onFocus={interactive ? () => onInteract(i) : undefined}
          onClick={onClick ? () => onClick(i) : undefined}
        >
          <span className="char">{tok}</span>
          <span className="id">id: {tokenIds[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Head selector + legend ── */

interface HeadSelectorProps {
  activeHead: number | "all";
  onActiveHeadChange: (head: number | "all") => void;
  headLabels: string[];
}

function HeadSelector({
  activeHead,
  onActiveHeadChange,
  headLabels,
}: HeadSelectorProps) {
  const isAll = activeHead === "all";
  return (
    <>
      <div className="controls mt-8">
        <span className="label-dim">Vue :</span>
        <button
          type="button"
          className={`btn btn-toggle ${isAll ? "" : "btn-secondary"}`}
          onClick={() => onActiveHeadChange("all")}
        >
          Toutes
        </button>
        {Array.from({ length: N_HEAD }, (_, h) => (
          <button
            key={h}
            type="button"
            className={`btn btn-toggle ${activeHead === h ? "" : "btn-secondary"}`}
            onClick={() => onActiveHeadChange(h)}
          >
            <span className="bv-dot" style={{ background: HEAD_COLORS[h] }} />{" "}
            {h}
          </button>
        ))}
      </div>
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
    </>
  );
}

/* ── Main component ── */

interface Props {
  matrices: number[][][];
  tokens: string[];
  tokenIds: number[];
  activeHead: number | "all";
  onActiveHeadChange: (head: number | "all") => void;
  selectedSrc: number;
  onClickSrc: (pos: number) => void;
  hoverSrc: number | null;
  onHoverSrc: (pos: number | null) => void;
}

export default function BertVizView({
  matrices,
  tokens,
  tokenIds,
  activeHead,
  onActiveHeadChange,
  selectedSrc,
  onClickSrc,
  hoverSrc,
  onHoverSrc,
}: Props) {
  const T = tokens.length;
  if (T === 0) return null;

  const headLabels = matrices.map((m) => classifyHead(m));
  const colH = T * (BOX_H + GAP) - GAP;
  const isAll = activeHead === "all";
  const isDim = hoverSrc !== null;

  const lines = computeLines({ matrices, isAll, activeHead });

  const litDst = new Set<number>();
  if (isDim) {
    for (const l of lines) {
      if (l.i === hoverSrc) litDst.add(l.j);
    }
  }

  const cx1 = SVG_W * 0.32;
  const cx2 = SVG_W * 0.68;

  const srcOpacity = (i: number) => (isDim && hoverSrc !== i ? 0.25 : 1);
  const dstOpacity = (i: number) =>
    isDim && !litDst.has(i) && hoverSrc !== i ? 0.25 : 1;

  return (
    <>
      <HeadSelector
        activeHead={activeHead}
        onActiveHeadChange={onActiveHeadChange}
        headLabels={headLabels}
      />

      <div className="bv-container" onMouseLeave={() => onHoverSrc(null)}>
        <TokenColumn
          header="Qui regarde ?"
          tokens={tokens}
          tokenIds={tokenIds}
          getOpacity={srcOpacity}
          selectedSrc={selectedSrc}
          onInteract={onHoverSrc}
          onClick={onClickSrc}
        />

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

        <TokenColumn
          header="Vu avant ?"
          tokens={tokens}
          tokenIds={tokenIds}
          getOpacity={dstOpacity}
        />
      </div>
    </>
  );
}
