import { useRef, useCallback, memo } from "react";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import { valToColor } from "../utils/valToColor";
import { useCanvasObservers } from "../hooks/useCanvasObservers";
import {
  findClosestNeuron,
  makeTouchHandlers,
} from "../utils/canvasInteraction";
import "./NNDiagram.css";

// ── Config ──────────────────────────────────────────────────────────
const N_HEAD = 4;
const HEAD_DIM = 4;
const ATTN_COL = 1;
const ANIM_LAYER_DELAY = 350;
const ANIM_FADE_DURATION = 300;
const DORMANT_ALPHA = 0.15;

const COL_COLORS: string[] = [
  "--cyan", // Embedding
  "--purple", // Attention
  "--orange", // MLP caché
  "--orange", // MLP sortie
  "--blue", // Logits/Probs
];

const LABELS = [
  "Embedding\n(16)",
  "Attention\n(4×4 têtes)",
  "MLP caché\n(64)",
  "MLP sortie\n(16)",
  "Probabilités",
];

// ── Types ───────────────────────────────────────────────────────────
interface NeuronPos {
  x: number;
  y: number;
  r: number;
  head?: number;
}

interface HoverInfo {
  layer: number;
  index: number;
}

export interface NNDiagramProps {
  combined: number[];
  afterAttn: number[];
  mlpHidden: number[];
  mlpActiveMask: boolean[];
  afterMlp: number[];
  probs: number[];
  weights: {
    attnWo: number[][];
    mlpFc1: number[][];
    mlpFc2: number[][];
    lmHead: number[][];
  };
}

// ── Pure helpers ────────────────────────────────────────────────────

function computePositions(
  w: number,
  h: number,
  layers: number[],
): NeuronPos[][] {
  const padX = Math.min(70, w * 0.08);
  const padY = 36;
  const usableW = w - padX * 2;
  const usableH = h - padY * 2 - 30;
  const nLayers = layers.length;

  return layers.map((count, li) => {
    const x = padX + (li / (nLayers - 1)) * usableW;
    const maxR = count <= 20 ? 7 : count <= 30 ? 5 : 3;

    if (li === ATTN_COL) {
      const headGap = maxR * 2.5;
      const spacing = Math.min(usableH / (count + N_HEAD), maxR * 3.5);
      const totalH = spacing * (count - 1) + headGap * (N_HEAD - 1);
      const startY = padY + (usableH - totalH) / 2;
      return Array.from({ length: count }, (_, ni) => {
        const headIndex = Math.floor(ni / HEAD_DIM);
        return {
          x,
          y: startY + ni * spacing + headIndex * headGap,
          r: maxR,
          head: headIndex,
        };
      });
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

function forwardProgress(layerIndex: number, elapsed: number): number {
  const layerStart = layerIndex * ANIM_LAYER_DELAY;
  return Math.max(0, Math.min(1, (elapsed - layerStart) / ANIM_FADE_DURATION));
}

// ── Component ───────────────────────────────────────────────────────
const NNDiagram = memo(function NNDiagram({
  combined,
  afterAttn,
  mlpHidden,
  mlpActiveMask,
  afterMlp,
  probs,
  weights,
}: NNDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<NeuronPos[][]>([]);
  const animRef = useRef(0);
  const hoverRef = useRef<HoverInfo | null>(null);
  const phaseRef = useRef<string>("dormant");
  const animStartRef = useRef(0);

  const layers = [16, 16, 64, 16, probs.length];
  const activations = [combined, afterAttn, mlpHidden, afterMlp, probs];

  // Weight matrices per layer pair (li → li+1)
  const weightMatrices = [
    weights.attnWo,
    weights.mlpFc1,
    weights.mlpFc2,
    weights.lmHead,
  ];

  // Max absolute weight per layer pair (for normalization)
  const maxWeights = weightMatrices.map((mat) => {
    let mx = 0;
    for (const row of mat) {
      for (const v of row) {
        const abs = Math.abs(v);
        if (abs > mx) mx = abs;
      }
    }
    return mx || 1;
  });

  // ── Draw function ───────────────────────────────────────────────
  const draw = useCallback(
    (timestamp?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = timestamp || performance.now();
      const elapsed = now - animStartRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Read theme colors
      const bgColor = getCssVar("--surface");
      const textColor = getCssVar("--text");
      const textDimColor = getCssVar("--text-dim");
      const greenColor = getCssVar("--green");
      const redColor = getCssVar("--red");
      const purpleColor = getCssVar("--purple");
      const blueColor = getCssVar("--blue");

      const textRgb = parseColor(textColor);
      const greenRgb = parseColor(greenColor);
      const redRgb = parseColor(redColor);
      const neutralRgb = parseColor(bgColor);

      // Phase transitions
      const forwardDuration =
        (layers.length - 1) * ANIM_LAYER_DELAY + ANIM_FADE_DURATION;
      if (phaseRef.current === "forward" && elapsed > forwardDuration + 100) {
        phaseRef.current = "idle";
      }

      // Per-layer forward progress (dormant = 0.06 → ghost outlines)
      function fwdP(li: number): number {
        if (phaseRef.current === "idle") return 1;
        if (phaseRef.current === "dormant") return DORMANT_ALPHA;
        return forwardProgress(li, elapsed);
      }

      // Compute neuron positions
      neuronsRef.current = computePositions(w, h, layers);
      const neurons = neuronsRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // Phase indicator
      if (phaseRef.current === "forward") {
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = greenColor;
        ctx.fillText("→  Propagation avant", w / 2, 18);
      }

      const hover = hoverRef.current;

      // ── Draw connections ──────────────────────────────────────
      for (let li = 0; li < layers.length - 1; li++) {
        const fromLayer = neurons[li];
        const toLayer = neurons[li + 1];
        const wMat = weightMatrices[li];
        const maxW = maxWeights[li];
        const fwdConn = Math.min(fwdP(li), fwdP(li + 1));
        // Dense layers (16×64 = 1024 lines) have 4× more overlapping lines
        // than sparse layers (16×16 = 256). Each semi-transparent line
        // accumulates alpha where it crosses others, making dense sections
        // appear brighter. densityScale reduces per-line alpha proportionally
        // to compensate — but individual MLP lines remain fainter at the
        // edges where fewer lines overlap. This is a geometric trade-off
        // inherent to drawing all real connections faithfully.
        const density = fromLayer.length * toLayer.length;
        const densityScale = Math.min(1, 256 / density);

        for (let fi = 0; fi < fromLayer.length; fi++) {
          for (let ti = 0; ti < toLayer.length; ti++) {
            const from = fromLayer[fi];
            const to = toLayer[ti];

            // Weight-based alpha
            const wVal =
              wMat[ti] && wMat[ti][fi] !== undefined ? wMat[ti][fi] : 0;
            const wNorm = Math.abs(wVal) / maxW;
            // In dormant/idle, skip densityScale so all layers look uniform
            const useDensity =
              phaseRef.current === "forward" ? densityScale : 1;
            let alpha = (0.02 + wNorm * 0.08) * fwdConn * useDensity;
            let lineWidth = 0.5 + wNorm * 1.5;

            // Hover highlight
            if (hover) {
              const isFrom = hover.layer === li && hover.index === fi;
              const isTo = hover.layer === li + 1 && hover.index === ti;
              if (isFrom || isTo) {
                alpha = Math.max(alpha, 0.4 * fwdConn);
                lineWidth = Math.max(lineWidth, 1.2);
              } else if (hover.layer === ATTN_COL) {
                const hoveredHead = Math.floor(hover.index / HEAD_DIM);
                if (
                  (li === ATTN_COL &&
                    Math.floor(fi / HEAD_DIM) === hoveredHead) ||
                  (li + 1 === ATTN_COL &&
                    Math.floor(ti / HEAD_DIM) === hoveredHead)
                ) {
                  alpha = Math.max(alpha, 0.15 * fwdConn);
                  lineWidth = Math.max(lineWidth, 0.8);
                }
              }
            }

            if (alpha > 0.01) {
              // Hovered connections: color by activation (green/red)
              const isHoverConn =
                hover &&
                ((hover.layer === li && hover.index === fi) ||
                  (hover.layer === li + 1 && hover.index === ti));
              if (isHoverConn) {
                const fromVal = activations[li]?.[fi] ?? 0;
                const toVal = activations[li + 1]?.[ti] ?? 0;
                ctx.strokeStyle = valToColor(
                  (fromVal + toVal) / 2,
                  alpha,
                  greenRgb,
                  redRgb,
                  neutralRgb,
                );
              } else {
                ctx.strokeStyle = `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${alpha})`;
              }
              ctx.lineWidth = lineWidth;
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
            }
          }
        }
      }

      // ── Draw neurons ──────────────────────────────────────────
      for (let li = 0; li < layers.length; li++) {
        const fP = fwdP(li);
        const layer = neurons[li];
        const colColorVar = COL_COLORS[li] || "--text";
        const colRgb = parseColor(getCssVar(colColorVar));

        for (let ni = 0; ni < layer.length; ni++) {
          const n = layer[ni];
          const val = activations[li]?.[ni] ?? 0;

          // MLP hidden: inactive neurons are dimmed
          const isMlpInactive = li === 2 && mlpActiveMask && !mlpActiveMask[ni];

          // Forward glow
          if (fP > 0.5 && fP < 1 && Math.abs(val) > 0.3) {
            const glowAlpha = (1 - Math.abs(fP - 0.75) * 4) * 0.3;
            if (glowAlpha > 0) {
              ctx.beginPath();
              ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
              ctx.fillStyle = valToColor(
                val,
                glowAlpha,
                greenRgb,
                redRgb,
                neutralRgb,
              );
              ctx.fill();
            }
          }

          // Neuron circle
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          const fillAlpha = fP * 0.85;
          if (isMlpInactive) {
            ctx.fillStyle = `rgba(${neutralRgb[0]},${neutralRgb[1]},${neutralRgb[2]},${fillAlpha * 0.3})`;
          } else if (Math.abs(val) < 0.05) {
            ctx.fillStyle = `rgba(${textRgb[0]},${textRgb[1]},${textRgb[2]},${fillAlpha * 0.15})`;
          } else {
            ctx.fillStyle = valToColor(
              val,
              fillAlpha,
              greenRgb,
              redRgb,
              neutralRgb,
            );
          }
          ctx.fill();

          // Stroke
          const strokeAlpha = 0.3 + fP * 0.4;
          const isHovered = hover && hover.layer === li && hover.index === ni;
          if (isHovered) {
            ctx.strokeStyle = blueColor;
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = `rgba(${colRgb[0]},${colRgb[1]},${colRgb[2]},${strokeAlpha})`;
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      }

      // ── Attention head brackets (H0–H3) ───────────────────────
      const attnLayer = neurons[ATTN_COL];
      if (attnLayer && attnLayer.length === 16) {
        const bracketAlpha = fwdP(ATTN_COL) * 0.6;
        const bracketX = attnLayer[0].x + attnLayer[0].r + 8;
        const bracketW = 5;

        ctx.font = "9px monospace";
        ctx.textAlign = "left";

        for (let hp = 0; hp < N_HEAD; hp++) {
          const first = attnLayer[hp * HEAD_DIM];
          const last = attnLayer[hp * HEAD_DIM + HEAD_DIM - 1];
          const top = first.y - first.r;
          const bot = last.y + last.r;
          const midY = (top + bot) / 2;

          ctx.strokeStyle = purpleColor;
          ctx.globalAlpha = bracketAlpha;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bracketX, top);
          ctx.lineTo(bracketX + bracketW, top);
          ctx.lineTo(bracketX + bracketW, bot);
          ctx.lineTo(bracketX, bot);
          ctx.stroke();

          ctx.fillStyle = purpleColor;
          ctx.fillText("H" + hp, bracketX + bracketW + 3, midY + 3);
          ctx.globalAlpha = 1;
        }
      }

      // ── Column labels ─────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.font = "11px monospace";
      const labelY = h - 12;
      for (let li = 0; li < layers.length; li++) {
        if (!neurons[li] || neurons[li].length === 0) continue;
        const x = neurons[li][0].x;
        const labelText =
          li === layers.length - 1
            ? `Probabilités\n(${layers[li]})`
            : LABELS[li];
        const lines = labelText.split("\n");
        lines.forEach((line, i) => {
          ctx.fillStyle = i === 0 ? textColor : textDimColor;
          ctx.fillText(line, x, labelY + i * 14 - (lines.length - 1) * 7);
        });
      }

      // Continue animation
      if (phaseRef.current === "forward") {
        animRef.current = requestAnimationFrame(draw);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activations/weights are derived arrays that change with props
    [combined, afterAttn, mlpHidden, mlpActiveMask, afterMlp, probs, weights],
  );

  const { startAnimation } = useCanvasObservers(
    canvasRef,
    animRef,
    phaseRef,
    animStartRef,
    draw,
  );

  // ── Hover detection ──────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const result = findClosestNeuron(e, canvas, neuronsRef.current);
      const closest: HoverInfo | null = result
        ? { layer: result.group, index: result.index }
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

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Diagramme du réseau de neurones — 5 couches avec activations et connexions"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...makeTouchHandlers(handleMouseMove, handleMouseLeave)}
      />
      <button
        type="button"
        className="btn btn-secondary nn-replay"
        onClick={startAnimation}
      >
        ▶ Rejouer
      </button>
    </>
  );
});

export default NNDiagram;
