import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import { valToColor } from "../utils/valToColor";
import type { NeuronPos, HoverInfo } from "./nnDiagram.config";
import { ATTN_COL, HEAD_DIM } from "./nnDiagram.config";

// ── Draw context shared across sub-functions ─────────────────────────

export interface NNDrawContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  neurons: NeuronPos[][];
  layers: number[];
  activations: number[][];
  weightMatrices: number[][][];
  maxWeights: number[];
  hover: HoverInfo | null;
  fwdP: (li: number) => number;
  phase: string;
}

export interface ThemeColors {
  textRgb: number[];
  greenRgb: number[];
  redRgb: number[];
  neutralRgb: number[];
  textColor: string;
  textDimColor: string;
  greenColor: string;
  purpleColor: string;
  blueColor: string;
  bgColor: string;
}

// ── Theme color reading ──────────────────────────────────────────────

export function readThemeColors(): ThemeColors {
  const bgColor = getCssVar("--surface");
  const textColor = getCssVar("--text");
  const textDimColor = getCssVar("--text-dim");
  const greenColor = getCssVar("--green");
  const redColor = getCssVar("--red");
  const purpleColor = getCssVar("--purple");
  const blueColor = getCssVar("--blue");
  return {
    textRgb: parseColor(textColor),
    greenRgb: parseColor(greenColor),
    redRgb: parseColor(redColor),
    neutralRgb: parseColor(bgColor),
    textColor,
    textDimColor,
    greenColor,
    purpleColor,
    blueColor,
    bgColor,
  };
}

// ── Connection style helper ──────────────────────────────────────────

interface ConnStyle {
  alpha: number;
  lineWidth: number;
}

interface ConnStyleOpts {
  wNorm: number;
  fwdConn: number;
  useDensity: number;
  hover: HoverInfo | null;
  li: number;
  fi: number;
  ti: number;
}

function baseConnStyle(opts: ConnStyleOpts): ConnStyle {
  const { wNorm, fwdConn, useDensity } = opts;
  return {
    alpha: (0.02 + wNorm * 0.08) * fwdConn * useDensity,
    lineWidth: 0.5 + wNorm * 1.5,
  };
}

function boostForDirectHover(style: ConnStyle, fwdConn: number): ConnStyle {
  return {
    alpha: Math.max(style.alpha, 0.4 * fwdConn),
    lineWidth: Math.max(style.lineWidth, 1.2),
  };
}

function boostForHeadHover(style: ConnStyle, fwdConn: number): ConnStyle {
  return {
    alpha: Math.max(style.alpha, 0.15 * fwdConn),
    lineWidth: Math.max(style.lineWidth, 0.8),
  };
}

interface ConnIndices {
  li: number;
  fi: number;
  ti: number;
}

function isDirectHover(hover: HoverInfo, idx: ConnIndices): boolean {
  return (
    (hover.layer === idx.li && hover.index === idx.fi) ||
    (hover.layer === idx.li + 1 && hover.index === idx.ti)
  );
}

function isHeadHover(hover: HoverInfo, idx: ConnIndices): boolean {
  if (hover.layer !== ATTN_COL) return false;
  const hHead = Math.floor(hover.index / HEAD_DIM);
  const fromMatch =
    idx.li === ATTN_COL && Math.floor(idx.fi / HEAD_DIM) === hHead;
  const toMatch =
    idx.li + 1 === ATTN_COL && Math.floor(idx.ti / HEAD_DIM) === hHead;
  return fromMatch || toMatch;
}

function connectionStyle(opts: ConnStyleOpts): ConnStyle {
  const { hover, li, fi, ti, fwdConn } = opts;
  const style = baseConnStyle(opts);
  if (!hover) return style;
  const idx: ConnIndices = { li, fi, ti };
  if (isDirectHover(hover, idx)) return boostForDirectHover(style, fwdConn);
  if (isHeadHover(hover, idx)) return boostForHeadHover(style, fwdConn);
  return style;
}

// ── Draw connections ─────────────────────────────────────────────────

export function drawConnections(dc: NNDrawContext, colors: ThemeColors): void {
  const { neurons, layers, hover, fwdP, phase } = dc;

  for (let li = 0; li < layers.length - 1; li++) {
    const fromLayer = neurons[li];
    const toLayer = neurons[li + 1];
    const wMat = dc.weightMatrices[li];
    const maxW = dc.maxWeights[li];
    const fwdConn = Math.min(fwdP(li), fwdP(li + 1));
    const density = fromLayer.length * toLayer.length;
    const densityScale = Math.min(1, 256 / density);
    const useDensity = phase === "forward" ? densityScale : 1;

    for (let fi = 0; fi < fromLayer.length; fi++) {
      for (let ti = 0; ti < toLayer.length; ti++) {
        drawOneConnection({
          dc,
          colors,
          li,
          fi,
          ti,
          wMat,
          maxW,
          fwdConn,
          useDensity,
          hover,
        });
      }
    }
  }
}

// ── Single connection ────────────────────────────────────────────────

interface OneConnOpts {
  dc: NNDrawContext;
  colors: ThemeColors;
  li: number;
  fi: number;
  ti: number;
  wMat: number[][];
  maxW: number;
  fwdConn: number;
  useDensity: number;
  hover: HoverInfo | null;
}

function drawOneConnection(opts: OneConnOpts): void {
  const { dc, colors, li, fi, ti, wMat, maxW, fwdConn, useDensity, hover } =
    opts;
  const { ctx, neurons } = dc;
  const from = neurons[li][fi];
  const to = neurons[li + 1][ti];

  const wNorm = Math.abs(wMat[ti]?.[fi] ?? 0) / maxW;
  const style = connectionStyle({
    wNorm,
    fwdConn,
    useDensity,
    hover,
    li,
    fi,
    ti,
  });
  if (style.alpha <= 0.01) return;

  ctx.strokeStyle = connColor({ dc, colors, style, li, fi, ti, hover });
  ctx.lineWidth = style.lineWidth;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

// ── Connection color ─────────────────────────────────────────────────

function connColor(opts: {
  dc: NNDrawContext;
  colors: ThemeColors;
  style: ConnStyle;
  li: number;
  fi: number;
  ti: number;
  hover: HoverInfo | null;
}): string {
  const { dc, colors, style, li, fi, ti, hover } = opts;
  const isHoverConn =
    hover &&
    ((hover.layer === li && hover.index === fi) ||
      (hover.layer === li + 1 && hover.index === ti));

  if (isHoverConn) {
    const fromVal = dc.activations[li]?.[fi] ?? 0;
    const toVal = dc.activations[li + 1]?.[ti] ?? 0;
    return valToColor((fromVal + toVal) / 2, {
      alpha: style.alpha,
      green: colors.greenRgb,
      red: colors.redRgb,
      neutral: colors.neutralRgb,
    });
  }
  const t = colors.textRgb;
  return `rgba(${t[0]},${t[1]},${t[2]},${style.alpha})`;
}
