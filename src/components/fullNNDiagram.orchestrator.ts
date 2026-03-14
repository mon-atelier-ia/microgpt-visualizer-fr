import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";
import type {
  FullNNDiagramProps,
  NeuronPos,
  HoverInfo,
  DrawContext,
} from "./fullNNDiagram.types";
import {
  COLS,
  MAX_STAGE,
  DORMANT_ALPHA,
  FWD_DURATION,
  PAUSE_DURATION,
  BWD_DURATION,
  HEAD_DIM,
  computePositions,
} from "./fullNNDiagram.config";
import {
  fwdStageP,
  bwdStageP,
  drawPhaseIndicator,
  drawSectionLabels,
  drawConnections,
  drawFlowParticles,
  drawResidualArcs,
  drawNeurons,
  drawShockwaves,
  drawHeadBrackets,
  drawWinnerHalo,
  drawColumnLabels,
} from "./fullNNDiagram.renderer";

export { computePositions };

import { setupCanvas } from "../utils/canvasSetup";
export { setupCanvas };

// ── Data builders ────────────────────────────────────

export function buildActivations(props: FullNNDiagramProps): number[][] {
  const { v, attnWeights, mlpHidden, mlpActiveMask } = props;
  const ho = v.map(
    (vi, i) => vi * (attnWeights[Math.floor(i / HEAD_DIM)]?.[0] ?? 1),
  );
  return [
    props.tokEmb,
    props.posEmb,
    props.combined,
    props.afterNorm,
    props.preAttnNorm,
    props.q,
    props.k,
    props.v,
    ho,
    props.afterAttn,
    props.preMlpNorm,
    mlpHidden,
    mlpHidden.map((val, i) => (mlpActiveMask[i] ? val : 0)),
    props.afterMlp,
    props.logits,
    props.probs,
  ];
}

export function buildGradients(acts: number[][]): number[][] {
  return acts.map((a, ci) => {
    const scale = (COLS[ci].stage + 1) / (MAX_STAGE + 1);
    return a.map(
      (val, i) => Math.sin(val * 17.3 + i * 2.7 + ci * 0.91) * scale,
    );
  });
}

// ── Phase transitions ────────────────────────────────

interface PhaseRefs {
  phaseRef: React.RefObject<string>;
  animStartRef: React.RefObject<number>;
}

export function transitionPhase(
  refs: PhaseRefs,
  rawElapsed: number,
  opts: { withBwd: boolean; now: number },
): void {
  const { phaseRef, animStartRef } = refs;
  if (phaseRef.current === "forward" && rawElapsed > FWD_DURATION + 100) {
    if (opts.withBwd) {
      phaseRef.current = "pause";
      animStartRef.current = opts.now;
    } else phaseRef.current = "idle";
  } else if (phaseRef.current === "pause" && rawElapsed > PAUSE_DURATION) {
    phaseRef.current = "backward";
    animStartRef.current = opts.now;
  } else if (
    phaseRef.current === "backward" &&
    rawElapsed > BWD_DURATION + 200
  ) {
    phaseRef.current = "idle";
  }
}

// ── Draw context builder ─────────────────────────────

function buildColorLookup(): Record<string, number[]> {
  return {
    "--cyan": parseColor(getCssVar("--cyan")),
    "--purple": parseColor(getCssVar("--purple")),
    "--orange": parseColor(getCssVar("--orange")),
    "--blue": parseColor(getCssVar("--blue")),
    "--text": parseColor(getCssVar("--text")),
    "--text-dim": parseColor(getCssVar("--text-dim")),
  };
}

interface DrawState {
  now: number;
  phase: string;
  elapsed: number;
  neurons: NeuronPos[][];
  acts: number[][];
  grads: number[][];
  hover: HoverInfo | null;
}

export function buildDrawContext(
  setup: { ctx: CanvasRenderingContext2D; w: number; h: number },
  state: DrawState,
): DrawContext {
  const cl = buildColorLookup();
  const fP = (s: number) =>
    state.phase === "forward"
      ? fwdStageP(s, state.elapsed)
      : state.phase === "dormant"
        ? DORMANT_ALPHA
        : 1;
  const bP = (s: number) =>
    state.phase !== "backward" ? 0 : bwdStageP(s, state.elapsed);
  return {
    ...setup,
    now: state.now,
    neurons: state.neurons,
    acts: state.acts,
    grads: state.grads,
    phase: state.phase,
    elapsed: state.elapsed,
    fP,
    bP,
    hover: state.hover,
    bgRgb: parseColor(getCssVar("--surface")),
    textRgb: cl["--text"],
    greenRgb: parseColor(getCssVar("--green")),
    redRgb: parseColor(getCssVar("--red")),
    orangeRgb: cl["--orange"],
    purpleRgb: cl["--purple"],
    colorLookup: cl,
    bgColor: getCssVar("--surface"),
    greenColor: getCssVar("--green"),
    blueColor: getCssVar("--blue"),
    orangeColor: getCssVar("--orange"),
    textDimColor: getCssVar("--text-dim"),
  };
}

// ── Render orchestrator ──────────────────────────────

export function renderAll(dc: DrawContext): void {
  dc.ctx.clearRect(0, 0, dc.w, dc.h);
  dc.ctx.fillStyle = dc.bgColor;
  dc.ctx.fillRect(0, 0, dc.w, dc.h);
  drawPhaseIndicator(dc);
  drawSectionLabels(dc);
  drawConnections(dc);
  drawFlowParticles(dc);
  drawResidualArcs(dc);
  drawNeurons(dc);
  drawShockwaves(dc);
  drawHeadBrackets(dc);
  drawWinnerHalo(dc);
  drawColumnLabels(dc);
}

// ── Draw frame ───────────────────────────────────────

export interface FrameRefs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  neuronsRef: React.RefObject<NeuronPos[][]>;
  phaseRef: React.RefObject<string>;
  animStartRef: React.RefObject<number>;
  showBackwardRef: React.RefObject<boolean>;
  hoverRef: React.RefObject<HoverInfo | null>;
}

export function drawFrame(
  fs: FrameRefs,
  data: { acts: number[][]; grads: number[][] },
  timestamp?: number,
): boolean {
  const canvas = fs.canvasRef.current;
  if (!canvas) return false;
  const setup = setupCanvas(canvas);
  if (!setup) return false;
  const now = timestamp || performance.now();
  transitionPhase(
    { phaseRef: fs.phaseRef, animStartRef: fs.animStartRef },
    now - fs.animStartRef.current,
    { withBwd: fs.showBackwardRef.current, now },
  );
  fs.neuronsRef.current = computePositions(
    setup.w,
    setup.h,
    data.acts.map((a) => a.length),
  );
  renderAll(
    buildDrawContext(setup, {
      now,
      phase: fs.phaseRef.current,
      elapsed: now - fs.animStartRef.current,
      neurons: fs.neuronsRef.current,
      acts: data.acts,
      grads: data.grads,
      hover: fs.hoverRef.current,
    }),
  );
  return fs.phaseRef.current !== "idle" && fs.phaseRef.current !== "dormant";
}
