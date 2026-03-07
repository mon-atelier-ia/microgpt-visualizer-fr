import { useRef, useState, useCallback, useMemo, memo } from "react";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import { valToColor } from "../utils/valToColor";
import { useCanvasObservers } from "../hooks/useCanvasObservers";
import {
  findClosestNeuron,
  makeTouchHandlers,
} from "../utils/canvasInteraction";
import { tokenLabel } from "../engine/model";

// ── Architecture (16 columns, mirrors model.ts) ─────────────────

interface ColDef {
  n: number;
  label: string;
  xFrac: number;
  stage: number;
  color: string;
  sec: string;
  headGroups?: number;
}

const HEAD_DIM = 4;

const COLS: ColDef[] = [
  {
    n: 16,
    label: "Token\nEmb",
    xFrac: 0.0,
    stage: 0,
    color: "--cyan",
    sec: "Embedding",
  },
  {
    n: 16,
    label: "Pos\nEmb",
    xFrac: 0.04,
    stage: 0,
    color: "--cyan",
    sec: "Embedding",
  },
  { n: 16, label: "Add", xFrac: 0.09, stage: 1, color: "--text", sec: "" },
  { n: 16, label: "Norm", xFrac: 0.13, stage: 1, color: "--text", sec: "" },
  {
    n: 16,
    label: "Norm\n(attn)",
    xFrac: 0.17,
    stage: 2,
    color: "--text",
    sec: "",
  },
  {
    n: 16,
    label: "Q",
    xFrac: 0.22,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "K",
    xFrac: 0.26,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "V",
    xFrac: 0.3,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "4 Têtes",
    xFrac: 0.37,
    stage: 4,
    color: "--purple",
    sec: "Attention",
    headGroups: 4,
  },
  {
    n: 16,
    label: "Après\nAttn",
    xFrac: 0.44,
    stage: 5,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "Norm\n(mlp)",
    xFrac: 0.5,
    stage: 6,
    color: "--text",
    sec: "",
  },
  {
    n: 64,
    label: "MLP\n(×4)",
    xFrac: 0.57,
    stage: 7,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 64,
    label: "ReLU",
    xFrac: 0.64,
    stage: 8,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 16,
    label: "Après\nMLP",
    xFrac: 0.72,
    stage: 9,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 27,
    label: "Logits",
    xFrac: 0.86,
    stage: 10,
    color: "--blue",
    sec: "Sortie",
  },
  {
    n: 27,
    label: "Probs",
    xFrac: 1.0,
    stage: 11,
    color: "--blue",
    sec: "Sortie",
  },
];

interface EdgeDef {
  from: number;
  to: number;
  type: "one2one" | "dense";
}

const EDGES: EdgeDef[] = [
  { from: 0, to: 2, type: "one2one" }, // TokEmb + PosEmb → Add
  { from: 1, to: 2, type: "one2one" },
  { from: 2, to: 3, type: "dense" }, // Add → Norm (rmsnorm)
  { from: 3, to: 4, type: "dense" }, // Norm → Norm(attn) (rmsnorm)
  { from: 4, to: 5, type: "dense" }, // Norm(attn) → Q (linear Wq)
  { from: 4, to: 6, type: "dense" }, // Norm(attn) → K (linear Wk)
  { from: 4, to: 7, type: "dense" }, // Norm(attn) → V (linear Wv)
  { from: 5, to: 8, type: "one2one" }, // Q → Têtes (per-head slice)
  { from: 6, to: 8, type: "one2one" }, // K → Têtes
  { from: 7, to: 8, type: "one2one" }, // V → Têtes
  { from: 8, to: 9, type: "dense" }, // Têtes → Après Attn (linear Wo)
  { from: 9, to: 10, type: "dense" }, // Après Attn → Norm(mlp) (rmsnorm)
  { from: 10, to: 11, type: "dense" }, // Norm(mlp) → MLP (linear fc1)
  { from: 11, to: 12, type: "one2one" }, // MLP → ReLU (element-wise)
  { from: 12, to: 13, type: "dense" }, // ReLU → Après MLP (linear fc2)
  { from: 13, to: 14, type: "dense" }, // Après MLP → Logits (linear lm_head)
  { from: 14, to: 15, type: "dense" }, // Logits → Probs (softmax)
];

const RESIDUALS = [
  { from: 3, to: 9, label: "+res\u2081" }, // Norm → Après Attn (skip attention block)
  { from: 9, to: 13, label: "+res\u2082" }, // Après Attn → Après MLP (skip MLP block)
];

const MAX_STAGE = Math.max(...COLS.map((c) => c.stage));
const DORMANT_ALPHA = 0.06;
const ANIM_STAGE_DELAY = 180;
const ANIM_FADE = 250;
const FWD_DURATION = MAX_STAGE * ANIM_STAGE_DELAY + ANIM_FADE;
const PAUSE_DURATION = 500;
const BWD_DURATION = FWD_DURATION;

// ── Wow effect constants ──────────────────────────────────────────
const PARTICLE_R = 2;
const PARTICLE_TRAIL = 3;
const SHOCKWAVE_PEAK = 0.6;
const LIGHTNING_BOLTS = 3;
const LIGHTNING_SEGS = 12;
const LIGHTNING_REFRESH = 30;

// ── Types ────────────────────────────────────────────────────────

interface NeuronPos {
  x: number;
  y: number;
  r: number;
}

interface HoverInfo {
  col: number;
  index: number;
}

export interface FullNNDiagramProps {
  tokEmb: number[];
  posEmb: number[];
  combined: number[];
  afterNorm: number[];
  preAttnNorm: number[];
  q: number[];
  k: number[];
  v: number[];
  attnWeights: number[][];
  afterAttn: number[];
  preMlpNorm: number[];
  mlpHidden: number[];
  mlpActiveMask: boolean[];
  afterMlp: number[];
  logits: number[];
  probs: number[];
}

// ── Pure helpers ─────────────────────────────────────────────────

function computePositions(
  w: number,
  h: number,
  sizes: number[],
): NeuronPos[][] {
  const padX = 46;
  const padY = 44;
  const labelH = 32;
  const usableW = w - padX * 2;
  const usableH = h - padY - labelH;

  return COLS.map((col, ci) => {
    const x = padX + col.xFrac * usableW;
    const count = sizes[ci];
    const maxR = count <= 20 ? 6 : count <= 30 ? 4 : 2.5;

    if (col.headGroups) {
      const gs = count / col.headGroups;
      const sp = maxR * 3;
      const gap = maxR * 5;
      const totalH = (count - 1) * sp + (col.headGroups - 1) * gap;
      let cy = padY + (usableH - totalH) / 2;
      const res: NeuronPos[] = [];
      for (let g = 0; g < col.headGroups; g++) {
        for (let gi = 0; gi < gs; gi++) {
          res.push({ x, y: cy, r: maxR });
          cy += sp;
        }
        if (g < col.headGroups - 1) cy += gap;
      }
      return res;
    }

    const spacing = Math.min(usableH / (count + 1), maxR * 3.5);
    const totalH = spacing * (count - 1);
    const startY = padY + (usableH - totalH) / 2;
    return Array.from({ length: count }, (_, ni) => ({
      x,
      y: startY + ni * spacing,
      r: maxR,
    }));
  });
}

function fwdStageP(stage: number, elapsed: number): number {
  const t = (elapsed - stage * ANIM_STAGE_DELAY) / ANIM_FADE;
  return Math.max(0, Math.min(1, t));
}

function bwdStageP(stage: number, elapsed: number): number {
  const reversed = MAX_STAGE - stage;
  const t = (elapsed - reversed * ANIM_STAGE_DELAY) / ANIM_FADE;
  return Math.max(0, Math.min(1, t));
}

function edgeAlpha(
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

// ── Wow effect helpers (DRY) ──────────────────────────────────────

function jitter(seed: number): number {
  const s = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1; // -1 to 1
}

function lerpXY(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  t: number,
): { x: number; y: number } {
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
}

function evalQuadBezier(
  x1: number,
  y1: number,
  cpX: number,
  cpY: number,
  x2: number,
  y2: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cpX + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cpY + t * t * y2,
  };
}

function drawFlowParticles(
  ctx: CanvasRenderingContext2D,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  progress: number,
  rgb: number[],
  reverse: boolean,
): void {
  const dir = reverse ? 1 - progress : progress;
  for (let p = 0; p < 2; p++) {
    const head = (dir + p * 0.15) % 1;
    // Main particle
    const pos = lerpXY(fx, fy, tx, ty, head);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PARTICLE_R, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.7)`;
    ctx.fill();
    // Trail dots
    for (let d = 1; d <= PARTICLE_TRAIL; d++) {
      const tt = head - d * 0.04 * (reverse ? -1 : 1);
      if (tt < 0 || tt > 1) continue;
      const tp = lerpXY(fx, fy, tx, ty, tt);
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, PARTICLE_R * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.3 - d * 0.08})`;
      ctx.fill();
    }
  }
}

// ── Component ────────────────────────────────────────────────────

const FullNNDiagram = memo(function FullNNDiagram(props: FullNNDiagramProps) {
  const {
    tokEmb,
    posEmb,
    combined,
    afterNorm,
    preAttnNorm,
    q,
    k,
    v,
    attnWeights,
    afterAttn,
    preMlpNorm,
    mlpHidden,
    mlpActiveMask,
    afterMlp,
    logits,
    probs,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<NeuronPos[][]>([]);
  const animRef = useRef(0);
  const hoverRef = useRef<HoverInfo | null>(null);
  const phaseRef = useRef<string>("dormant");
  const animStartRef = useRef(0);
  const showBackwardRef = useRef(false);
  const [showBackward, setShowBackward] = useState(false);

  // ── Column activations ─────────────────────────────────────

  const columnActivations = useMemo(() => {
    // Column 7: Per-head attention output = Σ_t attnWeights[h][t] × V_t
    // For T=1 (gptForward(0, 0, emptyKV)), attnWeights[h] = [1.0], so output = V
    const headOutputs = v.map((vi, i) => {
      const h = Math.floor(i / HEAD_DIM);
      return vi * (attnWeights[h]?.[0] ?? 1);
    });

    return [
      tokEmb, // 0: Token Emb
      posEmb, // 1: Pos Emb
      combined, // 2: Add
      afterNorm, // 3: Norm (initial rmsnorm)
      preAttnNorm, // 4: Norm (pre-attention rmsnorm)
      q, // 5: Q
      k, // 6: K
      v, // 7: V
      headOutputs, // 8: 4 Têtes (per-head attention output)
      afterAttn, // 9: Après Attn
      preMlpNorm, // 10: Norm (pre-MLP rmsnorm)
      mlpHidden, // 11: MLP (×4)
      mlpHidden.map((val, i) => (mlpActiveMask[i] ? val : 0)), // 12: ReLU
      afterMlp, // 13: Après MLP
      logits, // 14: Logits
      probs, // 15: Probs
    ];
  }, [
    tokEmb,
    posEmb,
    combined,
    afterNorm,
    preAttnNorm,
    q,
    k,
    v,
    attnWeights,
    afterAttn,
    preMlpNorm,
    mlpHidden,
    mlpActiveMask,
    afterMlp,
    logits,
    probs,
  ]);

  // Simulated gradients for backward animation (deterministic, scaled by stage)
  const gradients = useMemo(
    () =>
      columnActivations.map((acts, ci) => {
        const scale = (COLS[ci].stage + 1) / (MAX_STAGE + 1);
        return acts.map(
          (val, i) => Math.sin(val * 17.3 + i * 2.7 + ci * 0.91) * scale,
        );
      }),
    [columnActivations],
  );

  // ── Draw ───────────────────────────────────────────────────

  const draw = useCallback(
    (timestamp?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = timestamp || performance.now();
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Phase transitions
      const rawElapsed = now - animStartRef.current;
      const withBwd = showBackwardRef.current;
      if (phaseRef.current === "forward" && rawElapsed > FWD_DURATION + 100) {
        if (withBwd) {
          phaseRef.current = "pause";
          animStartRef.current = now;
        } else {
          phaseRef.current = "idle";
        }
      } else if (phaseRef.current === "pause" && rawElapsed > PAUSE_DURATION) {
        phaseRef.current = "backward";
        animStartRef.current = now;
      } else if (
        phaseRef.current === "backward" &&
        rawElapsed > BWD_DURATION + 200
      ) {
        phaseRef.current = "idle";
      }

      const phase = phaseRef.current;
      const elapsed = now - animStartRef.current;

      function fP(stage: number): number {
        if (phase === "forward") return fwdStageP(stage, elapsed);
        if (phase === "dormant") return DORMANT_ALPHA;
        return 1;
      }
      function bP(stage: number): number {
        if (phase !== "backward") return 0;
        return bwdStageP(stage, elapsed);
      }

      // Read theme colors
      const bgColor = getCssVar("--surface");
      const textColor = getCssVar("--text");
      const textDimColor = getCssVar("--text-dim");
      const greenColor = getCssVar("--green");
      const redColor = getCssVar("--red");
      const orangeColor = getCssVar("--orange");
      const blueColor = getCssVar("--blue");

      const bgRgb = parseColor(bgColor);
      const textRgb = parseColor(textColor);
      const greenRgb = parseColor(greenColor);
      const redRgb = parseColor(redColor);
      const orangeRgb = parseColor(orangeColor);

      const colorLookup: Record<string, number[]> = {
        "--cyan": parseColor(getCssVar("--cyan")),
        "--purple": parseColor(getCssVar("--purple")),
        "--orange": orangeRgb,
        "--blue": parseColor(blueColor),
        "--text": textRgb,
        "--text-dim": parseColor(textDimColor),
      };

      // Compute positions (dynamic sizes for logits/probs columns)
      const acts = columnActivations;
      const sizes = acts.map((a) => a.length);
      neuronsRef.current = computePositions(w, h, sizes);
      const neurons = neuronsRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // ── Phase indicator (top-right) ────────────────────────
      if (phase !== "idle" && phase !== "dormant") {
        ctx.save();
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "right";
        if (phase === "forward") {
          ctx.fillStyle = greenColor;
          ctx.fillText("\u2192  Forward", w - 12, 14);
        } else if (phase === "pause") {
          ctx.fillStyle = textDimColor;
          ctx.fillText("\u22EF  Calcul perte", w - 12, 14);
        } else if (phase === "backward") {
          ctx.fillStyle = orangeColor;
          ctx.fillText("\u2190  Backward", w - 12, 14);
        }
        ctx.restore();
      }

      // ── Section labels (top) ───────────────────────────────
      const secs: Record<
        string,
        { minX: number; maxX: number; color: string }
      > = {};
      COLS.forEach((col, ci) => {
        if (!col.sec) return;
        const cx = neurons[ci]?.[0]?.x ?? 0;
        if (!secs[col.sec]) {
          secs[col.sec] = { minX: cx, maxX: cx, color: col.color };
        } else {
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

      const hover = hoverRef.current;
      const grads = gradients;

      // ── Draw connections ───────────────────────────────────
      for (const edge of EDGES) {
        const fromLayer = neurons[edge.from];
        const toLayer = neurons[edge.to];
        if (!fromLayer || !toLayer) continue;

        const p = Math.min(fP(COLS[edge.from].stage), fP(COLS[edge.to].stage));
        const bp = Math.min(bP(COLS[edge.from].stage), bP(COLS[edge.to].stage));
        const baseA = edgeAlpha(fromLayer.length, toLayer.length, edge.type);

        if (edge.type === "one2one") {
          const count = Math.min(fromLayer.length, toLayer.length);
          for (let i = 0; i < count; i++) {
            const from = fromLayer[i];
            const to = toLayer[i];
            let alpha = baseA * p;
            let lw = 0.8;
            let colored = false;

            if (hover) {
              if (
                (hover.col === edge.from && hover.index === i) ||
                (hover.col === edge.to && hover.index === i)
              ) {
                alpha = 0.6 * p;
                lw = 1.8;
                colored = true;
              }
            }

            if (p > 0.01 && alpha > 0.003) {
              ctx.strokeStyle = colored
                ? valToColor(
                    ((acts[edge.from]?.[i] ?? 0) + (acts[edge.to]?.[i] ?? 0)) /
                      2,
                    alpha,
                    greenRgb,
                    redRgb,
                    bgRgb,
                  )
                : `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${alpha})`;
              ctx.lineWidth = lw;
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
            }

            // Backward overlay (orange)
            if (bp > 0 && grads[edge.from] && grads[edge.to]) {
              const gm =
                (Math.abs(grads[edge.from][i] ?? 0) +
                  Math.abs(grads[edge.to][i] ?? 0)) /
                2;
              const ba = 0.35 * bp * (0.3 + gm * 0.7);
              if (ba > 0.01) {
                ctx.strokeStyle = `rgba(${orangeRgb[0]},${orangeRgb[1]},${orangeRgb[2]},${ba})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
              }
            }
          }
        } else {
          // Dense: batch non-hovered connections
          const alpha = baseA * p;
          if (p > 0.01 && alpha > 0.003) {
            ctx.strokeStyle = `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            for (let fi = 0; fi < fromLayer.length; fi++) {
              for (let ti = 0; ti < toLayer.length; ti++) {
                if (hover) {
                  if (
                    (hover.col === edge.from && hover.index === fi) ||
                    (hover.col === edge.to && hover.index === ti)
                  )
                    continue;
                }
                ctx.moveTo(fromLayer[fi].x, fromLayer[fi].y);
                ctx.lineTo(toLayer[ti].x, toLayer[ti].y);
              }
            }
            ctx.stroke();
          }

          // Dense: hovered connections (colored, on top)
          if (hover && p > 0.01) {
            if (hover.col === edge.from) {
              for (let ti = 0; ti < toLayer.length; ti++) {
                const val =
                  ((acts[edge.from]?.[hover.index] ?? 0) +
                    (acts[edge.to]?.[ti] ?? 0)) /
                  2;
                ctx.strokeStyle = valToColor(
                  val,
                  0.5 * p,
                  greenRgb,
                  redRgb,
                  bgRgb,
                );
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(fromLayer[hover.index].x, fromLayer[hover.index].y);
                ctx.lineTo(toLayer[ti].x, toLayer[ti].y);
                ctx.stroke();
              }
            } else if (hover.col === edge.to) {
              for (let fi = 0; fi < fromLayer.length; fi++) {
                const val =
                  ((acts[edge.from]?.[fi] ?? 0) +
                    (acts[edge.to]?.[hover.index] ?? 0)) /
                  2;
                ctx.strokeStyle = valToColor(
                  val,
                  0.5 * p,
                  greenRgb,
                  redRgb,
                  bgRgb,
                );
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(fromLayer[fi].x, fromLayer[fi].y);
                ctx.lineTo(toLayer[hover.index].x, toLayer[hover.index].y);
                ctx.stroke();
              }
            }
          }

          // Dense backward overlay (orange batch)
          if (bp > 0) {
            const ba = baseA * 4 * bp;
            if (ba > 0.003) {
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
          }
        }
      }

      // ── Effects 1 & 5: Forward particles / Backward cascade ─
      {
        const isFwd = phase === "forward";
        const isBwd = phase === "backward";
        if (isFwd || isBwd) {
          const duration = isFwd ? FWD_DURATION : BWD_DURATION;
          const progress = Math.min(1, elapsed / duration);
          const stageP = isFwd ? fP : bP;
          const reverse = isBwd;
          for (const edge of EDGES) {
            const fromL = neurons[edge.from];
            const toL = neurons[edge.to];
            if (!fromL || !toL) continue;
            const ep = Math.min(
              stageP(COLS[edge.from].stage),
              stageP(COLS[edge.to].stage),
            );
            if (ep < 0.1) continue;
            const rgb = isFwd
              ? colorLookup[COLS[edge.to].color] || textRgb
              : orangeRgb;
            const count = Math.min(fromL.length, toL.length);
            for (let i = 0; i < count; i += 4) {
              drawFlowParticles(
                ctx,
                fromL[i].x,
                fromL[i].y,
                toL[i].x,
                toL[i].y,
                progress,
                rgb,
                reverse,
              );
            }
          }
        }
      }

      // ── Residual arcs (Bézier, dashed) ─────────────────────
      const purpleRgb = colorLookup["--purple"];
      for (const res of RESIDUALS) {
        const p = Math.min(fP(COLS[res.from].stage), fP(COLS[res.to].stage));
        if (p < 0.01) continue;

        const fN = neurons[res.from];
        const tN = neurons[res.to];
        if (!fN?.[0] || !tN?.[0]) continue;

        const x1 = fN[0].x;
        const x2 = tN[0].x;
        const y1 = fN[0].y - fN[0].r - 2;
        const y2 = tN[0].y - tN[0].r - 2;
        const cpX = (x1 + x2) / 2;
        const cpY = Math.min(y1, y2) - 30;

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.5 * p})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flash pulse during forward animation (O-1) + Effect 4: Lightning
        if (phase === "forward") {
          const toP = fwdStageP(COLS[res.to].stage, elapsed);
          if (toP > 0 && toP < 1) {
            const flash = Math.sin(toP * Math.PI) * 0.6;
            if (flash > 0.05) {
              // Dimmed base flash
              ctx.setLineDash([]);
              ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${flash * 0.3})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(cpX, cpY, x2, y2);
              ctx.stroke();
              // Lightning bolts
              const timeSeed = Math.floor(now / LIGHTNING_REFRESH);
              for (let b = 0; b < LIGHTNING_BOLTS; b++) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                for (let s = 1; s <= LIGHTNING_SEGS; s++) {
                  const t = s / LIGHTNING_SEGS;
                  const pt = evalQuadBezier(x1, y1, cpX, cpY, x2, y2, t);
                  const j = jitter(timeSeed * 7 + b * 13 + s * 37) * 5;
                  ctx.lineTo(pt.x, pt.y + j);
                }
                ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${flash * 0.5})`;
                ctx.lineWidth = 1.5 - b * 0.3;
                ctx.stroke();
              }
            }
          }
        }

        // Label
        const midX = cpX;
        const midY = 0.25 * y1 + 0.5 * cpY + 0.25 * y2;
        ctx.fillStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.7 * p})`;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(res.label, midX, midY - 2);
      }

      // ── Draw neurons ───────────────────────────────────────
      for (let ci = 0; ci < COLS.length; ci++) {
        const p = fP(COLS[ci].stage);
        const bp2 = bP(COLS[ci].stage);
        const layer = neurons[ci];
        if (!layer) continue;

        const colRgb = colorLookup[COLS[ci].color] || textRgb;

        for (let ni = 0; ni < layer.length; ni++) {
          const n = layer[ni];
          const val = acts[ci]?.[ni] ?? 0;
          const grad = grads[ci]?.[ni] ?? 0;

          // Forward glow
          if (p > 0.5 && p < 1 && Math.abs(val) > 0.3) {
            const ga = (1 - Math.abs(p - 0.75) * 4) * 0.3;
            if (ga > 0) {
              ctx.beginPath();
              ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
              ctx.fillStyle = valToColor(val, ga, greenRgb, redRgb, bgRgb);
              ctx.fill();
            }
          }

          // Backward glow (orange)
          if (bp2 > 0.3 && bp2 < 1 && Math.abs(grad) > 0.2) {
            const ga = (1 - Math.abs(bp2 - 0.65) * 3) * 0.35 * Math.abs(grad);
            if (ga > 0) {
              ctx.beginPath();
              ctx.arc(n.x, n.y, n.r * 2.8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${orangeRgb[0]},${orangeRgb[1]},${orangeRgb[2]},${ga})`;
              ctx.fill();
            }
          }

          // Neuron circle
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          const fa = p * 0.85;
          if (Math.abs(val) < 0.05) {
            ctx.fillStyle = `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${fa * 0.12})`;
          } else {
            ctx.fillStyle = valToColor(val, fa, greenRgb, redRgb, bgRgb);
          }
          ctx.fill();

          // Stroke
          const isHov = hover?.col === ci && hover?.index === ni;
          const sa = 0.3 + p * 0.4;
          ctx.strokeStyle = isHov
            ? blueColor
            : `rgba(${colRgb[0]},${colRgb[1]},${colRgb[2]},${sa})`;
          ctx.lineWidth = isHov ? 2.5 : 0.8;
          ctx.stroke();

          // Backward ring (orange)
          if (bp2 > 0) {
            const ra = bp2 * 0.9 * Math.min(1, Math.abs(grad) + 0.3);
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${orangeRgb[0]},${orangeRgb[1]},${orangeRgb[2]},${ra})`;
            ctx.lineWidth = 1.5 + Math.abs(grad) * 2;
            ctx.stroke();
          }
        }
      }

      // ── Effect 2: Shockwave per stage ─────────────────────
      if (phase === "forward") {
        for (let ci = 0; ci < COLS.length; ci++) {
          const sp = fP(COLS[ci].stage);
          if (sp <= 0 || sp >= SHOCKWAVE_PEAK) continue;
          const layer = neurons[ci];
          if (!layer?.length) continue;
          const cx = layer[0].x;
          const cy = (layer[0].y + layer[layer.length - 1].y) / 2;
          const frac = sp / SHOCKWAVE_PEAK;
          const radius = 10 + frac * 40;
          const alpha = Math.sin(frac * Math.PI) * 0.35;
          const lw = 2.5 - frac * 2;
          const sRgb = colorLookup[COLS[ci].color] || textRgb;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${sRgb[0]},${sRgb[1]},${sRgb[2]},${alpha})`;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }

      // ── Head brackets (H0–H3 on column 6) ─────────────────
      const headsCol = 8;
      const hp = fP(COLS[headsCol].stage);
      if (hp > 0.1 && neurons[headsCol]) {
        const hNeurons = neurons[headsCol];
        ctx.font = "9px monospace";
        ctx.textAlign = "right";
        for (let g = 0; g < 4; g++) {
          const first = hNeurons[g * 4];
          const last = hNeurons[g * 4 + 3];
          if (!first || !last) continue;
          const bx = first.x - first.r - 5;
          ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.35 * hp})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(bx, first.y);
          ctx.lineTo(bx - 3, first.y);
          ctx.lineTo(bx - 3, last.y);
          ctx.lineTo(bx, last.y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.5 * hp})`;
          ctx.fillText("H" + g, bx - 5, (first.y + last.y) / 2 + 3);
        }
      }

      // ── Effect 3: Probs finale (winner halo + label) ──────
      {
        const probsP = fP(11);
        if (probsP > 0.9) {
          const probsLayer = neurons[15];
          const probsActs = acts[15];
          if (probsLayer && probsActs && probsActs.length > 0) {
            let maxI = 0;
            let maxV = probsActs[0];
            for (let i = 1; i < probsActs.length; i++) {
              if (probsActs[i] > maxV) {
                maxV = probsActs[i];
                maxI = i;
              }
            }
            const winner = probsLayer[maxI];
            if (winner) {
              const blueRgb = colorLookup["--blue"];
              const pct = Math.round(maxV * 100);
              // Pulsing halo (forward) or static halo (idle/pause)
              const pulse =
                phase === "forward"
                  ? 0.35 + 0.15 * Math.sin(now * 0.006)
                  : 0.35;
              const haloR = winner.r * 3;
              ctx.beginPath();
              ctx.arc(winner.x, winner.y, haloR, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},${pulse})`;
              ctx.fill();
              // Character label
              ctx.font = "bold 11px monospace";
              ctx.textAlign = "left";
              ctx.fillStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},0.9)`;
              ctx.fillText(
                `${tokenLabel(maxI)}: ${pct}%`,
                winner.x + haloR + 4,
                winner.y + 4,
              );
            }
          }
        }
      }

      // ── Column labels (bottom) ─────────────────────────────
      ctx.textAlign = "center";
      ctx.font = "10px monospace";
      const labelY = h - 10;
      for (let ci = 0; ci < COLS.length; ci++) {
        if (!neurons[ci]?.[0]) continue;
        const x = neurons[ci][0].x;
        const lines = COLS[ci].label.split("\n");
        const rgb = colorLookup[COLS[ci].color] || textRgb;
        lines.forEach((line, i) => {
          const a = i === 0 ? 0.9 : 0.55;
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
          ctx.fillText(line, x, labelY + i * 12 - (lines.length - 1) * 6);
        });
      }

      // Continue animation
      if (phase !== "idle" && phase !== "dormant") {
        // eslint-disable-next-line react-hooks/immutability -- rAF self-reference is safe (callback invoked after declaration)
        animRef.current = requestAnimationFrame(draw);
      }
    },
    [columnActivations, gradients],
  );

  const { startAnimation } = useCanvasObservers(
    canvasRef,
    animRef,
    phaseRef,
    animStartRef,
    draw,
  );

  // ── Hover detection ────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const result = findClosestNeuron(e, canvas, neuronsRef.current);
      const closest: HoverInfo | null = result
        ? { col: result.group, index: result.index }
        : null;
      const changed =
        JSON.stringify(closest) !== JSON.stringify(hoverRef.current);
      hoverRef.current = closest;
      if (changed && phaseRef.current === "idle") draw();
    },
    [draw],
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    if (phaseRef.current === "idle") draw();
  }, [draw]);

  const handleToggleBackward = useCallback(() => {
    setShowBackward((prev) => {
      const next = !prev;
      showBackwardRef.current = next;
      return next;
    });
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Diagramme du réseau de neurones complet — 16 couches avec connexions résiduelles"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...makeTouchHandlers(handleMouseMove, handleMouseLeave)}
      />
      <div className="full-nn-controls">
        <button
          type="button"
          className="btn btn-secondary nn-replay"
          onClick={startAnimation}
        >
          ▶ Rejouer
        </button>
        <button
          type="button"
          className="btn btn-secondary nn-replay"
          onClick={handleToggleBackward}
        >
          {showBackward ? "Masquer le backward" : "Voir le backward"}
        </button>
      </div>
    </>
  );
});

export default FullNNDiagram;
