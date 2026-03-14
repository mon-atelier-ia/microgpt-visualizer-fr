// ── PCA Scatter Plot — dot, tooltip, legend, step-label draw functions ──
import { tokenLabel } from "../engine/model";
import {
  VOWELS,
  DOT_RADIUS,
  BOS_RADIUS,
  PAD,
  dotRgb,
  type RGB,
} from "./pcaScatterPlot.config";
import { projectBounds, type PCADrawContext } from "./pcaScatterPlot.renderer";

// ── Helpers ────────────────────────────────────────────────────────

export function buildLabels(n: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < n; i++) labels.push(tokenLabel(i));
  return labels;
}

// ── Ghost trail ────────────────────────────────────────────────────

export function drawGhosts(d: PCADrawContext, ghostTrail?: number[][][]): void {
  if (!ghostTrail || ghostTrail.length === 0) return;
  const { ctx, labels, w, h, projected } = d;
  const { toSx, toSy } = projectBounds(projected, { w, h });
  const n = labels.length;
  const alphas = [0.25, 0.19, 0.13, 0.07, 0.03];

  for (let gi = 0; gi < ghostTrail.length; gi++) {
    const gp = ghostTrail[gi];
    const ga = alphas[ghostTrail.length - 1 - gi] ?? 0.03;
    for (let di = 0; di < gp.length && di < n; di++) {
      const rgb = dotRgb(labels[di], d.colors);
      ctx.beginPath();
      ctx.arc(
        toSx(gp[di][0]),
        toSy(gp[di][1]),
        DOT_RADIUS * 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${ga})`;
      ctx.fill();
    }
  }
}

// ── Dots ───────────────────────────────────────────────────────────

export function drawDots(d: PCADrawContext): void {
  const { ctx, screenPts, labels, hover, hi, colors } = d;
  const n = labels.length;
  const order = buildDrawOrder(n, hover);

  for (const i of order) {
    const [sx, sy] = screenPts[i];
    const label = labels[i];
    const isBos = label === "BOS";
    let drawR = isBos ? BOS_RADIUS : DOT_RADIUS;
    const isHover = i === hover;
    const isHi = i === hi;
    if (isHover) drawR *= 1.3;

    const rgb = dotRgb(label, colors);
    drawDotShadows(ctx, { sx, sy, drawR, shadowRgb: colors.shadowRgb });
    if (isHover) drawHoverGlow(ctx, { sx, sy, drawR, rgb });
    drawDotFill(ctx, { sx, sy, drawR, rgb });
    if (isHi && !isHover) drawHighlightRing(ctx, { sx, sy, drawR, rgb });
    drawLetterLabel(ctx, {
      sx,
      sy,
      isBos,
      label,
      labelDarkRgb: colors.labelDarkRgb,
      haloRgb: colors.haloRgb,
    });
  }
}

function buildDrawOrder(n: number, hover: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  if (hover >= 0) {
    const idx = order.indexOf(hover);
    if (idx >= 0) {
      order.splice(idx, 1);
      order.push(hover);
    }
  }
  return order;
}

interface DotShadowOpts {
  sx: number;
  sy: number;
  drawR: number;
  shadowRgb: RGB;
}

function drawDotShadows(ctx: CanvasRenderingContext2D, o: DotShadowOpts): void {
  for (let s = 3; s >= 1; s--) {
    ctx.beginPath();
    ctx.arc(o.sx + 2, o.sy + 2.5, o.drawR + s, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${o.shadowRgb[0]},${o.shadowRgb[1]},${o.shadowRgb[2]},${(0.12 / s).toFixed(3)})`;
    ctx.fill();
  }
}

interface GlowOpts {
  sx: number;
  sy: number;
  drawR: number;
  rgb: RGB;
}

function drawHoverGlow(ctx: CanvasRenderingContext2D, o: GlowOpts): void {
  const glow = ctx.createRadialGradient(
    o.sx,
    o.sy,
    o.drawR * 0.8,
    o.sx,
    o.sy,
    o.drawR * 1.5,
  );
  glow.addColorStop(0, `rgba(${o.rgb[0]},${o.rgb[1]},${o.rgb[2]},0.08)`);
  glow.addColorStop(1, `rgba(${o.rgb[0]},${o.rgb[1]},${o.rgb[2]},0)`);
  ctx.beginPath();
  ctx.arc(o.sx, o.sy, o.drawR * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawDotFill(ctx: CanvasRenderingContext2D, o: GlowOpts): void {
  const { sx, sy, drawR, rgb } = o;
  const grad = ctx.createRadialGradient(
    sx - drawR * 0.25,
    sy - drawR * 0.25,
    drawR * 0.1,
    sx,
    sy,
    drawR,
  );
  const bright = `rgba(${Math.min(255, rgb[0] + 50)},${Math.min(255, rgb[1] + 50)},${Math.min(255, rgb[2] + 50)},1)`;
  const base = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
  const dark = `rgba(${Math.max(0, rgb[0] - 30)},${Math.max(0, rgb[1] - 30)},${Math.max(0, rgb[2] - 30)},1)`;
  grad.addColorStop(0, bright);
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, dark);
  ctx.beginPath();
  ctx.arc(sx, sy, drawR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawHighlightRing(ctx: CanvasRenderingContext2D, o: GlowOpts): void {
  ctx.strokeStyle = `rgba(${o.rgb[0]},${o.rgb[1]},${o.rgb[2]},0.6)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(o.sx, o.sy, o.drawR + 4, 0, Math.PI * 2);
  ctx.stroke();
}

interface LabelOpts {
  sx: number;
  sy: number;
  isBos: boolean;
  label: string;
  labelDarkRgb: RGB;
  haloRgb: RGB;
}

function drawLetterLabel(ctx: CanvasRenderingContext2D, o: LabelOpts): void {
  const text = o.isBos ? "\u2295" : o.label;
  ctx.fillStyle = `rgb(${o.labelDarkRgb[0]},${o.labelDarkRgb[1]},${o.labelDarkRgb[2]})`;
  ctx.font = `bold ${o.isBos ? 16 : 12}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = `rgba(${o.haloRgb[0]},${o.haloRgb[1]},${o.haloRgb[2]},0.7)`;
  ctx.lineWidth = 3;
  ctx.strokeText(text, o.sx, o.sy + 0.5);
  ctx.fillText(text, o.sx, o.sy + 0.5);
}

// ── Tooltip ────────────────────────────────────────────────────────

export function drawTooltip(d: PCADrawContext): void {
  const { ctx, hover, screenPts, labels, projected, colors } = d;
  const n = labels.length;
  if (hover < 0 || hover >= n) return;

  const [sx, sy] = screenPts[hover];
  const label = labels[hover];
  const type =
    label === "BOS"
      ? "sp\u00e9cial"
      : VOWELS.has(label)
        ? "voyelle"
        : "consonne";
  const [pcx, pcy] = projected[hover];
  const lines = [
    label === "BOS" ? "BOS (d\u00e9but)" : `"${label}" \u2014 ${type}`,
    `PC1: ${pcx.toFixed(2)}  PC2: ${pcy.toFixed(2)}`,
  ];

  ctx.font = "12px monospace";
  const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const boxW = tw + 16;
  const boxH = lines.length * 18 + 12;
  let bx = sx + 18;
  let by = sy - boxH - 8;
  if (bx + boxW > d.w - 4) bx = sx - boxW - 18;
  if (by < 4) by = sy + 18;

  drawRoundedBox(ctx, {
    bx,
    by,
    boxW,
    boxH,
    fillStyle: colors.surface2,
    strokeRgb: colors.borderRgb,
  });

  ctx.fillStyle = colors.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(lines[0], bx + 8, by + 6);
  ctx.fillStyle = colors.textDim;
  ctx.fillText(lines[1], bx + 8, by + 24);
}

interface BoxOpts {
  bx: number;
  by: number;
  boxW: number;
  boxH: number;
  fillStyle: string;
  strokeRgb: RGB;
}

function drawRoundedBox(ctx: CanvasRenderingContext2D, o: BoxOpts): void {
  const { bx, by, boxW, boxH, strokeRgb } = o;
  const r = 6;
  ctx.fillStyle = o.fillStyle;
  ctx.strokeStyle = `rgba(${strokeRgb[0]},${strokeRgb[1]},${strokeRgb[2]},0.4)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + boxW - r, by);
  ctx.quadraticCurveTo(bx + boxW, by, bx + boxW, by + r);
  ctx.lineTo(bx + boxW, by + boxH - r);
  ctx.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - r, by + boxH);
  ctx.lineTo(bx + r, by + boxH);
  ctx.quadraticCurveTo(bx, by + boxH, bx, by + boxH - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ── Legend & step label ────────────────────────────────────────────

export function drawLegend(d: PCADrawContext): void {
  const { ctx, h, colors } = d;
  const legendY = h - 14;
  const legendItems: [string, RGB][] = [
    ["voyelles", colors.cyanRgb],
    ["consonnes", colors.orangeRgb],
    ["BOS", colors.purpleRgb],
  ];
  ctx.font = "10px monospace";
  ctx.textBaseline = "middle";
  let lx = PAD;
  for (const [lbl, rgb] of legendItems) {
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.beginPath();
    ctx.arc(lx, legendY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.textDim;
    ctx.textAlign = "left";
    ctx.fillText(lbl, lx + 8, legendY);
    lx += ctx.measureText(lbl).width + 24;
  }
}

export function drawStepLabel(d: PCADrawContext, text?: string): void {
  if (!text) return;
  d.ctx.font = "11px monospace";
  d.ctx.fillStyle = d.colors.textDim;
  d.ctx.textAlign = "left";
  d.ctx.textBaseline = "top";
  d.ctx.fillText(text, 12, 10);
}
