// ── PCA Scatter Plot — Canvas rendering functions ──────────────────
import { topSimilarPairs } from "../utils/pca";
import { parseColor } from "../utils/parseColor";
import { getCssVar } from "../utils/getCssVar";
import {
  VOWELS,
  PAD,
  CONSTELLATION_K,
  sameType,
} from "./pcaScatterPlot.config";

// Re-export draw functions so consumers keep a single import source
export {
  buildLabels,
  drawGhosts,
  drawDots,
  drawTooltip,
  drawLegend,
  drawStepLabel,
} from "./pcaScatterPlot.draw";

// ── Types ──────────────────────────────────────────────────────────

type RGB = [number, number, number];

export interface PCADrawContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  projected: number[][];
  screenPts: number[][];
  labels: string[];
  hover: number;
  hi: number;
  totalStep: number;
  embData: number[][];
  colors: PCAColors;
}

interface PCAColors {
  bg: string;
  border: string;
  textDim: string;
  surface2: string;
  text: string;
  labelDarkRgb: RGB;
  haloRgb: RGB;
  borderRgb: RGB;
  cyanRgb: RGB;
  orangeRgb: RGB;
  purpleRgb: RGB;
  shadowRgb: RGB;
  glowRgb: RGB;
}

export interface PCADrawOpts {
  overrideProjected?: number[][];
  overrideEmb?: number[][];
  stepLabelText?: string;
  ghostTrail?: number[][][];
}

// ── Helpers ────────────────────────────────────────────────────────

export function projectBounds(
  projected: number[][],
  dims: { w: number; h: number },
) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [px, py] of projected) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  const { w, h } = dims;
  const toSx = (px: number) => PAD + ((px - minX) / rx) * (w - 2 * PAD);
  const toSy = (py: number) => PAD + ((maxY - py) / ry) * (h - 2 * PAD);
  return { toSx, toSy };
}

function dotRgb(
  ch: string,
  c: { cyanRgb: RGB; orangeRgb: RGB; purpleRgb: RGB },
): RGB {
  if (ch === "BOS") return c.purpleRgb;
  if (VOWELS.has(ch)) return c.cyanRgb;
  return c.orangeRgb;
}

export function readColors(): PCAColors {
  const bg = getCssVar("--surface");
  const border = getCssVar("--border");
  const surface2 = getCssVar("--surface2") || bg;
  return {
    bg,
    border,
    textDim: getCssVar("--text-dim"),
    surface2,
    text: getCssVar("--text"),
    labelDarkRgb: parseColor(getCssVar("--bg")),
    haloRgb: parseColor(surface2),
    borderRgb: parseColor(border),
    cyanRgb: parseColor(getCssVar("--cyan")),
    orangeRgb: parseColor(getCssVar("--orange")),
    purpleRgb: parseColor(getCssVar("--purple")),
    shadowRgb: parseColor(getCssVar("--dot-shadow")),
    glowRgb: parseColor(getCssVar("--vignette-glow")),
  };
}

// ── Draw sub-functions ─────────────────────────────────────────────

export function drawBackground(d: PCADrawContext): void {
  d.ctx.fillStyle = d.colors.bg;
  d.ctx.fillRect(0, 0, d.w, d.h);
}

export function drawVignette(d: PCADrawContext): void {
  const { ctx, w, h, colors } = d;
  const cx = w / 2,
    cy = h / 2;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const { glowRgb, shadowRgb } = colors;

  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.35);
  g1.addColorStop(0, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0.025)`);
  g1.addColorStop(1, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0)`);
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  const g2 = ctx.createRadialGradient(
    cx,
    cy,
    minDim * 0.3,
    cx,
    cy,
    maxDim * 0.65,
  );
  g2.addColorStop(0, `rgba(${shadowRgb[0]},${shadowRgb[1]},${shadowRgb[2]},0)`);
  g2.addColorStop(
    1,
    `rgba(${shadowRgb[0]},${shadowRgb[1]},${shadowRgb[2]},0.35)`,
  );
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
}

export function drawAxes(d: PCADrawContext): void {
  const { ctx, w, h, screenPts, colors } = d;
  const { borderRgb } = colors;
  const { toSx, toSy } = projectBounds(d.projected, { w, h });

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = `rgba(${borderRgb[0]},${borderRgb[1]},${borderRgb[2]},0.3)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(PAD, toSy(0));
  ctx.lineTo(w - PAD, toSy(0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toSx(0), PAD);
  ctx.lineTo(toSx(0), h - PAD);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "11px monospace";
  ctx.fillStyle = colors.textDim;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("PC1", w - PAD + 30, toSy(0));
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("PC2", toSx(0), PAD - 18);

  void screenPts; // consumed by other layers
}

export function drawConstellationLines(d: PCADrawContext): void {
  const { ctx, embData, labels, screenPts, hover, hi, totalStep, colors } = d;
  const n = labels.length;
  const pairs = topSimilarPairs(embData, Math.min(CONSTELLATION_K, n * 3));
  if (pairs.length === 0) return;

  const maxSim = pairs[0][2];
  const minSim = pairs[pairs.length - 1][2];
  const simRange = maxSim - minSim || 1;

  for (const [a, b, sim] of pairs) {
    const strength = (sim - minSim) / simRange;
    const lineStyle = constellationStyle({
      a,
      b,
      hover,
      hi,
      totalStep,
      strength,
      labels,
      colors,
    });
    ctx.strokeStyle = `rgba(${lineStyle.rgb[0]},${lineStyle.rgb[1]},${lineStyle.rgb[2]},${lineStyle.alpha})`;
    ctx.lineWidth = lineStyle.lineW;
    ctx.beginPath();
    ctx.moveTo(screenPts[a][0], screenPts[a][1]);
    ctx.lineTo(screenPts[b][0], screenPts[b][1]);
    ctx.stroke();
  }
}

interface ConstellationStyleOpts {
  a: number;
  b: number;
  hover: number;
  hi: number;
  totalStep: number;
  strength: number;
  labels: string[];
  colors: PCAColors;
}

function constellationStyle(o: ConstellationStyleOpts) {
  const { a, b, hover, hi, strength, labels, colors } = o;
  const isHoverLine = hover >= 0 && (a === hover || b === hover);
  const isHighlightLine = hi >= 0 && (a === hi || b === hi);

  if (isHoverLine) {
    return {
      rgb: dotRgb(labels[hover], colors),
      alpha: 0.55 + strength * 0.35,
      lineW: 1.5 + strength * 2.0,
    };
  }
  if (isHighlightLine) {
    return {
      rgb: dotRgb(labels[hi], colors),
      alpha: 0.35 + strength * 0.25,
      lineW: 1.0 + strength * 1.5,
    };
  }
  const rgb = blendedLineRgb(a, b, { labels, colors });
  if (o.totalStep > 0) {
    return { rgb, alpha: 0.15 + strength * 0.45, lineW: 0.8 + strength * 2.0 };
  }
  return { rgb, alpha: 0.08 + strength * 0.18, lineW: 0.5 + strength * 0.8 };
}

interface BlendOpts {
  labels: string[];
  colors: PCAColors;
}

function blendedLineRgb(a: number, b: number, o: BlendOpts): RGB {
  const same = sameType(o.labels[a], o.labels[b]);
  if (same) return dotRgb(o.labels[a], o.colors);
  const ra = dotRgb(o.labels[a], o.colors);
  const rb = dotRgb(o.labels[b], o.colors);
  return [
    Math.round((ra[0] + rb[0]) / 2),
    Math.round((ra[1] + rb[1]) / 2),
    Math.round((ra[2] + rb[2]) / 2),
  ];
}
