import type { DrawContext } from "./fullNNDiagram.types";
import {
  COLS,
  EDGES,
  RESIDUALS,
  PARTICLE_R,
  PARTICLE_TRAIL,
  LIGHTNING_BOLTS,
  LIGHTNING_SEGS,
  LIGHTNING_REFRESH,
  FWD_DURATION,
  BWD_DURATION,
} from "./fullNNDiagram.config";
import { valToColor } from "../utils/valToColor";
import { fwdStageP } from "./fullNNDiagram.renderer";

interface Point {
  x: number;
  y: number;
}

function lerpXY(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function evalQuadBezier(
  curve: { p1: Point; cp: Point; p2: Point },
  t: number,
): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * curve.p1.x + 2 * mt * t * curve.cp.x + t * t * curve.p2.x,
    y: mt * mt * curve.p1.y + 2 * mt * t * curve.cp.y + t * t * curve.p2.y,
  };
}

function jitter(seed: number): number {
  const s = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

// ── Flow particles ───────────────────────────────────

interface ParticleOpts {
  ctx: CanvasRenderingContext2D;
  from: Point;
  to: Point;
  progress: number;
  rgb: number[];
  reverse: boolean;
}

function drawParticle(opts: ParticleOpts): void {
  const { ctx, from, to, rgb, reverse } = opts;
  const dir = reverse ? 1 - opts.progress : opts.progress;
  for (let p = 0; p < 2; p++) {
    const head = (dir + p * 0.15) % 1;
    const pos = lerpXY(from, to, head);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PARTICLE_R, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.7)`;
    ctx.fill();
    for (let d = 1; d <= PARTICLE_TRAIL; d++) {
      const tt = head - d * 0.04 * (reverse ? -1 : 1);
      if (tt < 0 || tt > 1) continue;
      const tp = lerpXY(from, to, tt);
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, PARTICLE_R * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.3 - d * 0.08})`;
      ctx.fill();
    }
  }
}

interface ParticleLayerState {
  progress: number;
  stageP: (s: number) => number;
  isFwd: boolean;
  rgb: (edge: { to: number }) => number[];
}

function getParticleState(dc: DrawContext): ParticleLayerState | null {
  const { phase, elapsed } = dc;
  const isFwd = phase === "forward";
  const isBwd = phase === "backward";
  if (!isFwd && !isBwd) return null;
  const duration = isFwd ? FWD_DURATION : BWD_DURATION;
  return {
    progress: Math.min(1, elapsed / duration),
    stageP: isFwd ? dc.fP : dc.bP,
    isFwd,
    rgb: (edge) =>
      isFwd ? dc.colorLookup[COLS[edge.to].color] || dc.textRgb : dc.orangeRgb,
  };
}

export function drawFlowParticlesLayer(dc: DrawContext): void {
  const state = getParticleState(dc);
  if (!state) return;
  const { neurons } = dc;
  for (const edge of EDGES) {
    const fromL = neurons[edge.from];
    const toL = neurons[edge.to];
    if (!fromL || !toL) continue;
    const ep = Math.min(
      state.stageP(COLS[edge.from].stage),
      state.stageP(COLS[edge.to].stage),
    );
    if (ep < 0.1) continue;
    const rgb = state.rgb(edge);
    const count = Math.min(fromL.length, toL.length);
    for (let i = 0; i < count; i += 4) {
      drawParticle({
        ctx: dc.ctx,
        from: fromL[i],
        to: toL[i],
        progress: state.progress,
        rgb,
        reverse: !state.isFwd,
      });
    }
  }
}

// ── Residual arcs + lightning ────────────────────────

function drawLightning(
  dc: DrawContext,
  curve: { p1: Point; cp: Point; p2: Point },
  toCol: number,
): void {
  const { ctx, elapsed, now, purpleRgb } = dc;
  const toP = fwdStageP(COLS[toCol].stage, elapsed);
  if (toP <= 0 || toP >= 1) return;
  const flash = Math.sin(toP * Math.PI) * 0.6;
  if (flash <= 0.05) return;

  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${flash * 0.3})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(curve.p1.x, curve.p1.y);
  ctx.quadraticCurveTo(curve.cp.x, curve.cp.y, curve.p2.x, curve.p2.y);
  ctx.stroke();

  const timeSeed = Math.floor(now / LIGHTNING_REFRESH);
  for (let b = 0; b < LIGHTNING_BOLTS; b++) {
    ctx.beginPath();
    ctx.moveTo(curve.p1.x, curve.p1.y);
    for (let s = 1; s <= LIGHTNING_SEGS; s++) {
      const t = s / LIGHTNING_SEGS;
      const pt = evalQuadBezier(curve, t);
      ctx.lineTo(pt.x, pt.y + jitter(timeSeed * 7 + b * 13 + s * 37) * 5);
    }
    ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${flash * 0.5})`;
    ctx.lineWidth = 1.5 - b * 0.3;
    ctx.stroke();
  }
}

export function drawResidualArcs(dc: DrawContext): void {
  const { ctx, neurons, purpleRgb, phase } = dc;

  for (const res of RESIDUALS) {
    const p = Math.min(dc.fP(COLS[res.from].stage), dc.fP(COLS[res.to].stage));
    if (p < 0.01) continue;
    const fN = neurons[res.from];
    const tN = neurons[res.to];
    if (!fN?.[0] || !tN?.[0]) continue;

    const x1 = fN[0].x,
      x2 = tN[0].x;
    const y1 = fN[0].y - fN[0].r - 2,
      y2 = tN[0].y - tN[0].r - 2;
    const curve = {
      p1: { x: x1, y: y1 },
      cp: { x: (x1 + x2) / 2, y: Math.min(y1, y2) - 30 },
      p2: { x: x2, y: y2 },
    };

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.5 * p})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(curve.cp.x, curve.cp.y, x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (phase === "forward") drawLightning(dc, curve, res.to);

    const midY = 0.25 * y1 + 0.5 * curve.cp.y + 0.25 * y2;
    ctx.fillStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.7 * p})`;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(res.label, curve.cp.x, midY - 2);
  }
}

// ── Neurons ──────────────────────────────────────────

interface NeuronDrawOpts {
  ci: number;
  ni: number;
  fwdP: number;
  bwdP: number;
  colRgb: number[];
}

function neuronFillStyle(dc: DrawContext, val: number, fa: number): string {
  if (Math.abs(val) < 0.05)
    return `rgba(${dc.textRgb[0]},${dc.textRgb[1]},${dc.textRgb[2]},${fa * 0.12})`;
  return valToColor(val, {
    alpha: fa,
    green: dc.greenRgb,
    red: dc.redRgb,
    neutral: dc.bgRgb,
  });
}

function drawBwdRing(
  dc: DrawContext,
  opts: { n: { x: number; y: number; r: number }; grad: number; bp2: number },
): void {
  if (opts.bp2 <= 0) return;
  const ra = opts.bp2 * 0.9 * Math.min(1, Math.abs(opts.grad) + 0.3);
  dc.ctx.beginPath();
  dc.ctx.arc(opts.n.x, opts.n.y, opts.n.r + 2, 0, Math.PI * 2);
  dc.ctx.strokeStyle = `rgba(${dc.orangeRgb[0]},${dc.orangeRgb[1]},${dc.orangeRgb[2]},${ra})`;
  dc.ctx.lineWidth = 1.5 + Math.abs(opts.grad) * 2;
  dc.ctx.stroke();
}

export function drawSingleNeuron(dc: DrawContext, opts: NeuronDrawOpts): void {
  const { ctx, neurons, acts, grads, hover, blueColor } = dc;
  const { ci, ni, fwdP: p, bwdP: bp2, colRgb } = opts;
  const n = neurons[ci][ni];
  const val = acts[ci]?.[ni] ?? 0;
  const grad = grads[ci]?.[ni] ?? 0;

  drawNeuronGlow(dc, { n, val, p });
  drawNeuronBwdGlow(dc, { n, grad, bp2 });

  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  ctx.fillStyle = neuronFillStyle(dc, val, p * 0.85);
  ctx.fill();

  const isHov = hover?.col === ci && hover?.index === ni;
  ctx.strokeStyle = isHov
    ? blueColor
    : `rgba(${colRgb[0]},${colRgb[1]},${colRgb[2]},${0.3 + p * 0.4})`;
  ctx.lineWidth = isHov ? 2.5 : 0.8;
  ctx.stroke();

  drawBwdRing(dc, { n, grad, bp2 });
}

function drawNeuronGlow(
  dc: DrawContext,
  opts: { n: { x: number; y: number; r: number }; val: number; p: number },
): void {
  const { n, val, p } = opts;
  if (p <= 0.5 || p >= 1 || Math.abs(val) <= 0.3) return;
  const ga = (1 - Math.abs(p - 0.75) * 4) * 0.3;
  if (ga <= 0) return;
  dc.ctx.beginPath();
  dc.ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
  dc.ctx.fillStyle = valToColor(val, {
    alpha: ga,
    green: dc.greenRgb,
    red: dc.redRgb,
    neutral: dc.bgRgb,
  });
  dc.ctx.fill();
}

function drawNeuronBwdGlow(
  dc: DrawContext,
  opts: { n: { x: number; y: number; r: number }; grad: number; bp2: number },
): void {
  const { n, grad, bp2 } = opts;
  if (bp2 <= 0.3 || bp2 >= 1 || Math.abs(grad) <= 0.2) return;
  const ga = (1 - Math.abs(bp2 - 0.65) * 3) * 0.35 * Math.abs(grad);
  if (ga <= 0) return;
  dc.ctx.beginPath();
  dc.ctx.arc(n.x, n.y, n.r * 2.8, 0, Math.PI * 2);
  dc.ctx.fillStyle = `rgba(${dc.orangeRgb[0]},${dc.orangeRgb[1]},${dc.orangeRgb[2]},${ga})`;
  dc.ctx.fill();
}

export function drawNeuronsLayer(dc: DrawContext): void {
  const { neurons, colorLookup, textRgb } = dc;
  for (let ci = 0; ci < COLS.length; ci++) {
    const layer = neurons[ci];
    if (!layer) continue;
    const colRgb = colorLookup[COLS[ci].color] || textRgb;
    const fwdP = dc.fP(COLS[ci].stage);
    const bwdP = dc.bP(COLS[ci].stage);
    for (let ni = 0; ni < layer.length; ni++) {
      drawSingleNeuron(dc, { ci, ni, fwdP, bwdP, colRgb });
    }
  }
}
