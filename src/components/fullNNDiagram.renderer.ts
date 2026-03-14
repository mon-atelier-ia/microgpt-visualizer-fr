import type { DrawContext } from "./fullNNDiagram.types";
import {
  COLS,
  EDGES,
  ANIM_STAGE_DELAY,
  ANIM_FADE,
  MAX_STAGE,
} from "./fullNNDiagram.config";
import { valToColor } from "../utils/valToColor";
import {
  drawFlowParticlesLayer,
  drawResidualArcs,
  drawNeuronsLayer,
} from "./fullNNDiagram.effects";

// ── Math helpers ─────────────────────────────────────

export function fwdStageP(stage: number, elapsed: number): number {
  const t = (elapsed - stage * ANIM_STAGE_DELAY) / ANIM_FADE;
  return Math.max(0, Math.min(1, t));
}

export function bwdStageP(stage: number, elapsed: number): number {
  const reversed = MAX_STAGE - stage;
  const t = (elapsed - reversed * ANIM_STAGE_DELAY) / ANIM_FADE;
  return Math.max(0, Math.min(1, t));
}

export function edgeAlpha(
  fromN: number,
  toN: number,
  type: "one2one" | "dense",
): number {
  if (type === "one2one") return 0.25;
  const total = fromN * toN;
  if (total > 800) return 0.012;
  if (total > 300) return 0.025;
  return 0.04;
}

// ── Phase indicator ──────────────────────────────────

export function drawPhaseIndicator(dc: DrawContext): void {
  const { ctx, w, phase } = dc;
  if (phase === "idle" || phase === "dormant") return;
  ctx.save();
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "right";
  if (phase === "forward") {
    ctx.fillStyle = dc.greenColor;
    ctx.fillText("→  Forward", w - 12, 14);
  } else if (phase === "pause") {
    ctx.fillStyle = dc.textDimColor;
    ctx.fillText("⋯  Calcul perte", w - 12, 14);
  } else if (phase === "backward") {
    ctx.fillStyle = dc.orangeColor;
    ctx.fillText("←  Backward", w - 12, 14);
  }
  ctx.restore();
}

// ── Section labels ───────────────────────────────────

export function drawSectionLabels(dc: DrawContext): void {
  const { ctx, neurons, colorLookup } = dc;
  const secs: Record<string, { minX: number; maxX: number; color: string }> =
    {};
  COLS.forEach((col, ci) => {
    if (!col.sec) return;
    const cx = neurons[ci]?.[0]?.x ?? 0;
    if (!secs[col.sec])
      secs[col.sec] = { minX: cx, maxX: cx, color: col.color };
    else {
      secs[col.sec].minX = Math.min(secs[col.sec].minX, cx);
      secs[col.sec].maxX = Math.max(secs[col.sec].maxX, cx);
    }
  });
  ctx.textAlign = "center";
  ctx.font = "10px monospace";
  for (const [name, sec] of Object.entries(secs)) {
    const mx = (sec.minX + sec.maxX) / 2;
    const rgb = colorLookup[sec.color] || colorLookup["--text-dim"];
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.7)`;
    ctx.fillText(name, mx, 14);
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sec.minX - 8, 19);
    ctx.lineTo(sec.maxX + 8, 19);
    ctx.stroke();
  }
}

// ── Connections ──────────────────────────────────────

function connColor(dc: DrawContext, avgVal: number, alpha: number): string {
  return valToColor(avgVal, {
    alpha,
    green: dc.greenRgb,
    red: dc.redRgb,
    neutral: dc.bgRgb,
  });
}

function isHovered(
  hover: DrawContext["hover"],
  edge: { from: number; to: number },
  i: number,
): boolean {
  return (
    !!hover &&
    ((hover.col === edge.from && hover.index === i) ||
      (hover.col === edge.to && hover.index === i))
  );
}

interface StrokeOpts {
  edge: { from: number; to: number };
  i: number;
  hov: boolean;
  alpha: number;
}

function one2oneStroke(dc: DrawContext, opts: StrokeOpts): void {
  const { ctx, acts, textRgb } = dc;
  const { edge, i, hov, alpha } = opts;
  ctx.strokeStyle = hov
    ? connColor(
        dc,
        ((acts[edge.from]?.[i] ?? 0) + (acts[edge.to]?.[i] ?? 0)) / 2,
        alpha,
      )
    : `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${alpha})`;
  ctx.lineWidth = hov ? 1.8 : 0.8;
}

function drawOneToOneEdge(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, hover } = dc;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const p = Math.min(dc.fP(COLS[edge.from].stage), dc.fP(COLS[edge.to].stage));
  const baseA = edgeAlpha(fromLayer.length, toLayer.length, edge.type);
  const count = Math.min(fromLayer.length, toLayer.length);
  if (p <= 0.01) return;
  for (let i = 0; i < count; i++) {
    const hov = isHovered(hover, edge, i);
    const alpha = hov ? 0.6 * p : baseA * p;
    if (alpha <= 0.003) continue;
    one2oneStroke(dc, { edge, i, hov, alpha });
    ctx.beginPath();
    ctx.moveTo(fromLayer[i].x, fromLayer[i].y);
    ctx.lineTo(toLayer[i].x, toLayer[i].y);
    ctx.stroke();
  }
  drawBwdOverlay1to1(dc, edgeIdx);
}

function drawBwdOverlay1to1(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, grads, orangeRgb } = dc;
  const bp = Math.min(dc.bP(COLS[edge.from].stage), dc.bP(COLS[edge.to].stage));
  if (bp <= 0 || !grads[edge.from] || !grads[edge.to]) return;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const count = Math.min(fromLayer.length, toLayer.length);

  for (let i = 0; i < count; i++) {
    const gm =
      (Math.abs(grads[edge.from][i] ?? 0) + Math.abs(grads[edge.to][i] ?? 0)) /
      2;
    const ba = 0.35 * bp * (0.3 + gm * 0.7);
    if (ba <= 0.01) continue;
    ctx.strokeStyle = `rgba(${orangeRgb[0]},${orangeRgb[1]},${orangeRgb[2]},${ba})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(neurons[edge.from][i].x, neurons[edge.from][i].y);
    ctx.lineTo(neurons[edge.to][i].x, neurons[edge.to][i].y);
    ctx.stroke();
  }
}

function drawDenseBatch(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, hover, textRgb } = dc;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const p = Math.min(dc.fP(COLS[edge.from].stage), dc.fP(COLS[edge.to].stage));
  const alpha = edgeAlpha(fromLayer.length, toLayer.length, edge.type) * p;
  if (p <= 0.01 || alpha <= 0.003) return;

  ctx.strokeStyle = `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${alpha})`;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let fi = 0; fi < fromLayer.length; fi++) {
    for (let ti = 0; ti < toLayer.length; ti++) {
      if (
        hover &&
        ((hover.col === edge.from && hover.index === fi) ||
          (hover.col === edge.to && hover.index === ti))
      )
        continue;
      ctx.moveTo(fromLayer[fi].x, fromLayer[fi].y);
      ctx.lineTo(toLayer[ti].x, toLayer[ti].y);
    }
  }
  ctx.stroke();
}

function drawDenseHoverFrom(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, acts, hover } = dc;
  if (!hover || hover.col !== edge.from) return;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const p = Math.min(dc.fP(COLS[edge.from].stage), dc.fP(COLS[edge.to].stage));
  if (p <= 0.01) return;
  for (let ti = 0; ti < toLayer.length; ti++) {
    const val =
      ((acts[edge.from]?.[hover.index] ?? 0) + (acts[edge.to]?.[ti] ?? 0)) / 2;
    ctx.strokeStyle = connColor(dc, val, 0.5 * p);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fromLayer[hover.index].x, fromLayer[hover.index].y);
    ctx.lineTo(toLayer[ti].x, toLayer[ti].y);
    ctx.stroke();
  }
}

function drawDenseHoverTo(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, acts, hover } = dc;
  if (!hover || hover.col !== edge.to) return;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const p = Math.min(dc.fP(COLS[edge.from].stage), dc.fP(COLS[edge.to].stage));
  if (p <= 0.01) return;
  for (let fi = 0; fi < fromLayer.length; fi++) {
    const val =
      ((acts[edge.from]?.[fi] ?? 0) + (acts[edge.to]?.[hover.index] ?? 0)) / 2;
    ctx.strokeStyle = connColor(dc, val, 0.5 * p);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fromLayer[fi].x, fromLayer[fi].y);
    ctx.lineTo(toLayer[hover.index].x, toLayer[hover.index].y);
    ctx.stroke();
  }
}

function drawDenseBwd(dc: DrawContext, edgeIdx: number): void {
  const edge = EDGES[edgeIdx];
  const { ctx, neurons, orangeRgb } = dc;
  const fromLayer = neurons[edge.from];
  const toLayer = neurons[edge.to];
  const bp = Math.min(dc.bP(COLS[edge.from].stage), dc.bP(COLS[edge.to].stage));
  if (bp <= 0) return;
  const ba = edgeAlpha(fromLayer.length, toLayer.length, edge.type) * 4 * bp;
  if (ba <= 0.003) return;

  ctx.strokeStyle = `rgba(${orangeRgb[0]},${orangeRgb[1]},${orangeRgb[2]},${ba})`;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let fi = 0; fi < fromLayer.length; fi++) {
    for (let ti = 0; ti < toLayer.length; ti++) {
      ctx.moveTo(fromLayer[fi].x, fromLayer[fi].y);
      ctx.lineTo(toLayer[ti].x, toLayer[ti].y);
    }
  }
  ctx.stroke();
}

function drawDenseEdge(dc: DrawContext, edgeIdx: number): void {
  drawDenseBatch(dc, edgeIdx);
  drawDenseHoverFrom(dc, edgeIdx);
  drawDenseHoverTo(dc, edgeIdx);
  drawDenseBwd(dc, edgeIdx);
}

export function drawConnections(dc: DrawContext): void {
  for (let i = 0; i < EDGES.length; i++) {
    const edge = EDGES[i];
    if (!dc.neurons[edge.from] || !dc.neurons[edge.to]) continue;
    if (edge.type === "one2one") drawOneToOneEdge(dc, i);
    else drawDenseEdge(dc, i);
  }
}

// ── Re-exports from effects ─────────────────────────

export { drawFlowParticlesLayer as drawFlowParticles };
export { drawResidualArcs };
export { drawNeuronsLayer as drawNeurons };
export {
  drawShockwaves,
  drawHeadBrackets,
  drawWinnerHalo,
  drawColumnLabels,
} from "./fullNNDiagram.labels";
