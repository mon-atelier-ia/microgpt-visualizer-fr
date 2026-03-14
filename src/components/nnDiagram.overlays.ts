import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import type { NNDrawContext } from "./nnDiagram.renderer";
import type { ThemeColors } from "./nnDiagram.renderer";
import {
  ATTN_COL,
  HEAD_DIM,
  N_HEAD,
  COL_COLORS,
  LABELS,
} from "./nnDiagram.config";
import type { HoverInfo, NeuronPos } from "./nnDiagram.config";
import { valToColor } from "../utils/valToColor";

// ── Draw head brackets ───────────────────────────────────────────────

export function drawHeadBrackets(dc: NNDrawContext, colors: ThemeColors): void {
  const { ctx, neurons, fwdP } = dc;
  const attnLayer = neurons[ATTN_COL];
  if (!attnLayer || attnLayer.length !== 16) return;

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

    ctx.strokeStyle = colors.purpleColor;
    ctx.globalAlpha = bracketAlpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bracketX, top);
    ctx.lineTo(bracketX + bracketW, top);
    ctx.lineTo(bracketX + bracketW, bot);
    ctx.lineTo(bracketX, bot);
    ctx.stroke();

    ctx.fillStyle = colors.purpleColor;
    ctx.fillText("H" + hp, bracketX + bracketW + 3, midY + 3);
    ctx.globalAlpha = 1;
  }
}

// ── Draw labels ──────────────────────────────────────────────────────

export function drawLabels(dc: NNDrawContext, colors: ThemeColors): void {
  const { ctx, neurons, layers, h } = dc;

  ctx.textAlign = "center";
  ctx.font = "11px monospace";
  const labelY = h - 12;

  for (let li = 0; li < layers.length; li++) {
    if (!neurons[li] || neurons[li].length === 0) continue;
    const x = neurons[li][0].x;
    const labelText =
      li === layers.length - 1 ? `Probabilités\n(${layers[li]})` : LABELS[li];
    const lines = labelText.split("\n");
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? colors.textColor : colors.textDimColor;
      ctx.fillText(line, x, labelY + i * 14 - (lines.length - 1) * 7);
    });
  }
}

// ── Draw neurons ─────────────────────────────────────────────────────

export function drawNeurons(
  dc: NNDrawContext,
  colors: ThemeColors,
  mlpActiveMask: boolean[],
): void {
  const { ctx, neurons, layers, activations, hover, fwdP } = dc;

  for (let li = 0; li < layers.length; li++) {
    const fP = fwdP(li);
    const layer = neurons[li];
    const colRgb = parseColor(getCssVar(COL_COLORS[li] || "--text"));

    for (let ni = 0; ni < layer.length; ni++) {
      const n = layer[ni];
      const val = activations[li]?.[ni] ?? 0;
      const isMlpInactive = li === 2 && mlpActiveMask && !mlpActiveMask[ni];

      drawGlow({ ctx, n, val, fP, colors });
      drawNeuronCircle({ ctx, n, val, fP, isMlpInactive, colors });
      drawNeuronStroke({
        ctx,
        colRgb,
        fP,
        hover,
        li,
        ni,
        blueColor: colors.blueColor,
      });
    }
  }
}

// ── Glow effect ──────────────────────────────────────────────────────

interface GlowOpts {
  ctx: CanvasRenderingContext2D;
  n: NeuronPos;
  val: number;
  fP: number;
  colors: ThemeColors;
}

function drawGlow(opts: GlowOpts): void {
  const { ctx, n, val, fP, colors } = opts;
  if (fP <= 0.5 || fP >= 1 || Math.abs(val) <= 0.3) return;
  const glowAlpha = (1 - Math.abs(fP - 0.75) * 4) * 0.3;
  if (glowAlpha <= 0) return;

  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = valToColor(val, {
    alpha: glowAlpha,
    green: colors.greenRgb,
    red: colors.redRgb,
    neutral: colors.neutralRgb,
  });
  ctx.fill();
}

// ── Neuron circle fill ───────────────────────────────────────────────

interface NeuronCircleOpts {
  ctx: CanvasRenderingContext2D;
  n: NeuronPos;
  val: number;
  fP: number;
  isMlpInactive: boolean;
  colors: ThemeColors;
}

function drawNeuronCircle(opts: NeuronCircleOpts): void {
  const { ctx, n, val, fP, isMlpInactive, colors } = opts;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  const fillAlpha = fP * (n.r <= 3 ? 1 : 0.85);

  ctx.fillStyle = neuronFillColor({ val, fillAlpha, isMlpInactive, colors });
  ctx.fill();
}

function neuronFillColor(opts: {
  val: number;
  fillAlpha: number;
  isMlpInactive: boolean;
  colors: ThemeColors;
}): string {
  const { val, fillAlpha, isMlpInactive, colors } = opts;
  if (isMlpInactive) {
    const c = colors.neutralRgb;
    return `rgba(${c[0]},${c[1]},${c[2]},${fillAlpha * 0.3})`;
  }
  if (Math.abs(val) < 0.05) {
    const c = colors.textRgb;
    return `rgba(${c[0]},${c[1]},${c[2]},${fillAlpha * 0.15})`;
  }
  return valToColor(val, {
    alpha: fillAlpha,
    green: colors.greenRgb,
    red: colors.redRgb,
    neutral: colors.neutralRgb,
  });
}

// ── Neuron stroke ────────────────────────────────────────────────────

interface NeuronStrokeOpts {
  ctx: CanvasRenderingContext2D;
  colRgb: number[];
  fP: number;
  hover: HoverInfo | null;
  li: number;
  ni: number;
  blueColor: string;
}

function drawNeuronStroke(opts: NeuronStrokeOpts): void {
  const { ctx, colRgb, fP, hover, li, ni, blueColor } = opts;
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
