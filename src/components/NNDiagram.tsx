import { useRef, useCallback, memo } from "react";
import { setupCanvas } from "../utils/canvasSetup";
import { useCanvasObservers } from "../hooks/useCanvasObservers";
import {
  findClosestNeuron,
  makeTouchHandlers,
} from "../utils/canvasInteraction";
import type { NeuronPos, HoverInfo, NNDiagramProps } from "./nnDiagram.config";
import {
  ANIM_LAYER_DELAY,
  ANIM_FADE_DURATION,
  DORMANT_ALPHA,
  computePositions,
  forwardProgress,
} from "./nnDiagram.config";
import type { NNDrawContext } from "./nnDiagram.renderer";
import { readThemeColors, drawConnections } from "./nnDiagram.renderer";
import {
  drawNeurons,
  drawHeadBrackets,
  drawLabels,
} from "./nnDiagram.overlays";
import "./NNDiagram.css";

export type { NNDiagramProps };

// ── Max weight computation ───────────────────────────────────────────

function computeMaxWeights(matrices: number[][][]): number[] {
  return matrices.map((mat) => {
    let mx = 0;
    for (const row of mat) {
      for (const v of row) {
        const abs = Math.abs(v);
        if (abs > mx) mx = abs;
      }
    }
    return mx || 1;
  });
}

// ── Canvas setup ─────────────────────────────────────────────────────

// ── Phase helpers ────────────────────────────────────────────────────

function checkPhaseTransition(
  phaseRef: React.MutableRefObject<string>,
  elapsed: number,
  layerCount: number,
): void {
  const dur = (layerCount - 1) * ANIM_LAYER_DELAY + ANIM_FADE_DURATION;
  if (phaseRef.current === "forward" && elapsed > dur + 100) {
    phaseRef.current = "idle";
  }
}

interface PhaseIndicatorOpts {
  ctx: CanvasRenderingContext2D;
  phase: string;
  w: number;
  greenColor: string;
}

function drawPhaseIndicator(opts: PhaseIndicatorOpts): void {
  const { ctx, phase, w, greenColor } = opts;
  if (phase !== "forward") return;
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = greenColor;
  ctx.fillText("→  Propagation avant", w / 2, 18);
}

// ── Build forward progress function ──────────────────────────────────

function makeFwdP(phaseRef: React.MutableRefObject<string>, elapsed: number) {
  return (li: number): number => {
    if (phaseRef.current === "idle") return 1;
    if (phaseRef.current === "dormant") return DORMANT_ALPHA;
    return forwardProgress(li, elapsed);
  };
}

// ── Refs bundle ──────────────────────────────────────────────────────

interface NNRefs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  neuronsRef: React.MutableRefObject<NeuronPos[][]>;
  animRef: React.MutableRefObject<number>;
  hoverRef: React.MutableRefObject<HoverInfo | null>;
  phaseRef: React.MutableRefObject<string>;
  animStartRef: React.MutableRefObject<number>;
}

// ── Draw frame (extracted from callback) ─────────────────────────────

interface FrameData {
  layers: number[];
  activations: number[][];
  weightMatrices: number[][][];
  maxWeights: number[];
  mlpActiveMask: boolean[];
}

function drawFrame(
  refs: NNRefs,
  data: FrameData,
  timestamp: number | undefined,
): boolean {
  const canvas = refs.canvasRef.current;
  if (!canvas) return false;
  const setup = setupCanvas(canvas);
  if (!setup) return false;

  const { ctx, w, h } = setup;
  const now = timestamp || performance.now();
  const elapsed = now - refs.animStartRef.current;
  const colors = readThemeColors();
  checkPhaseTransition(refs.phaseRef, elapsed, data.layers.length);
  const fwdP = makeFwdP(refs.phaseRef, elapsed);

  refs.neuronsRef.current = computePositions(w, h, data.layers);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = colors.bgColor;
  ctx.fillRect(0, 0, w, h);

  drawPhaseIndicator({
    ctx,
    phase: refs.phaseRef.current,
    w,
    greenColor: colors.greenColor,
  });

  const dc: NNDrawContext = {
    ctx,
    w,
    h,
    neurons: refs.neuronsRef.current,
    layers: data.layers,
    activations: data.activations,
    weightMatrices: data.weightMatrices,
    maxWeights: data.maxWeights,
    hover: refs.hoverRef.current,
    fwdP,
    phase: refs.phaseRef.current,
  };

  drawConnections(dc, colors);
  drawNeurons(dc, colors, data.mlpActiveMask);
  drawHeadBrackets(dc, colors);
  drawLabels(dc, colors);

  return refs.phaseRef.current === "forward";
}

// ── Hover hook ───────────────────────────────────────────────────────

interface NNHoverOpts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  neuronsRef: React.MutableRefObject<NeuronPos[][]>;
  hoverRef: React.MutableRefObject<HoverInfo | null>;
  phaseRef: React.MutableRefObject<string>;
  draw: () => void;
}

function useNNHover(opts: NNHoverOpts) {
  const { canvasRef, neuronsRef, hoverRef, phaseRef, draw } = opts;
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
    [canvasRef, neuronsRef, hoverRef, phaseRef, draw],
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    if (phaseRef.current === "idle") draw();
  }, [hoverRef, phaseRef, draw]);

  return { handleMouseMove, handleMouseLeave };
}

// ── Prepare model data from props ────────────────────────────────────

function prepareModelData(props: NNDiagramProps): FrameData {
  const {
    combined,
    afterAttn,
    mlpHidden,
    mlpActiveMask,
    afterMlp,
    probs,
    weights,
  } = props;
  const layers = [16, 16, 64, 16, probs.length];
  const activations = [combined, afterAttn, mlpHidden, afterMlp, probs];
  const weightMatrices = [
    weights.attnWo,
    weights.mlpFc1,
    weights.mlpFc2,
    weights.lmHead,
  ];
  const maxWeights = computeMaxWeights(weightMatrices);
  return { layers, activations, weightMatrices, maxWeights, mlpActiveMask };
}

// ── Component ────────────────────────────────────────────────────────

function useNNDiagramDraw(props: NNDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<NeuronPos[][]>([]);
  const animRef = useRef(0);
  const hoverRef = useRef<HoverInfo | null>(null);
  const phaseRef = useRef<string>("dormant");
  const animStartRef = useRef(0);

  const refs: NNRefs = {
    canvasRef,
    neuronsRef,
    animRef,
    hoverRef,
    phaseRef,
    animStartRef,
  };
  const data = prepareModelData(props);
  const {
    combined,
    afterAttn,
    mlpHidden,
    mlpActiveMask,
    afterMlp,
    probs,
    weights,
  } = props;
  const draw = useCallback(
    (timestamp?: number) => {
      if (drawFrame(refs, data, timestamp))
        animRef.current = requestAnimationFrame(draw);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived arrays
    [combined, afterAttn, mlpHidden, mlpActiveMask, afterMlp, probs, weights],
  );

  const { startAnimation } = useCanvasObservers({
    canvasRef,
    animRef,
    phaseRef,
    animStartRef,
    draw,
  });

  const hover = useNNHover({ canvasRef, neuronsRef, hoverRef, phaseRef, draw });
  return { canvasRef, startAnimation, ...hover };
}

const NNDiagram = memo(function NNDiagram(props: NNDiagramProps) {
  const { canvasRef, startAnimation, handleMouseMove, handleMouseLeave } =
    useNNDiagramDraw(props);
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
