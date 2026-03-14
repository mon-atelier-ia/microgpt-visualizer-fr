import { useRef, useState, useCallback, useMemo } from "react";
import { useCanvasObservers } from "../hooks/useCanvasObservers";
import {
  findClosestNeuron,
  makeTouchHandlers,
} from "../utils/canvasInteraction";
import type {
  FullNNDiagramProps,
  NeuronPos,
  HoverInfo,
} from "./fullNNDiagram.types";
import type { FrameRefs } from "./fullNNDiagram.orchestrator";
import {
  buildActivations,
  buildGradients,
  drawFrame,
} from "./fullNNDiagram.orchestrator";

export { makeTouchHandlers };

// ── Hover hook ───────────────────────────────────────

interface NNHoverOpts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  neuronsRef: React.RefObject<NeuronPos[][]>;
  hoverRef: React.RefObject<HoverInfo | null>;
  phaseRef: React.RefObject<string>;
  draw: () => void;
}

export function useNNHover(opts: NNHoverOpts) {
  const { canvasRef, neuronsRef, hoverRef, phaseRef, draw } = opts;
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const result = findClosestNeuron(e, canvas, neuronsRef.current);
      const closest: HoverInfo | null = result
        ? { col: result.group, index: result.index }
        : null;
      if (JSON.stringify(closest) !== JSON.stringify(hoverRef.current)) {
        hoverRef.current = closest;
        if (phaseRef.current === "idle") draw();
      }
    },
    [canvasRef, neuronsRef, hoverRef, phaseRef, draw],
  );
  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    if (phaseRef.current === "idle") draw();
  }, [hoverRef, phaseRef, draw]);
  return { handleMouseMove, handleMouseLeave };
}

// ── Draw hook ────────────────────────────────────────

interface DrawCallbackOpts {
  frameRefs: FrameRefs;
  animRef: React.RefObject<number>;
  data: { acts: number[][]; grads: number[][] };
}

function useFullNNDrawCallback(opts: DrawCallbackOpts) {
  const { frameRefs, animRef, data } = opts;
  const drawRef = useRef<(t?: number) => void>(() => {});
  const draw = useCallback(
    (ts?: number) => {
      if (drawFrame(frameRefs, data, ts)) {
        animRef.current = requestAnimationFrame((t) => drawRef.current(t));
      }
    },
    [frameRefs, animRef, data],
  );
  drawRef.current = draw;
  return draw;
}

// ── Main hook ────────────────────────────────────────

export function useFullNNDraw(props: FullNNDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<NeuronPos[][]>([]);
  const animRef = useRef(0);
  const hoverRef = useRef<HoverInfo | null>(null);
  const phaseRef = useRef<string>("dormant");
  const animStartRef = useRef(0);
  const showBackwardRef = useRef(false);
  const [showBackward, setShowBackward] = useState(false);
  const acts = useMemo(() => buildActivations(props), [props]);
  const grads = useMemo(() => buildGradients(acts), [acts]);

  const fr: FrameRefs = {
    canvasRef,
    neuronsRef,
    phaseRef,
    animStartRef,
    showBackwardRef,
    hoverRef,
  };

  const draw = useFullNNDrawCallback({
    frameRefs: fr,
    animRef,
    data: { acts, grads },
  });

  const { startAnimation } = useCanvasObservers({
    canvasRef,
    animRef,
    phaseRef,
    animStartRef,
    draw,
  });

  const handlers = useNNHover({
    canvasRef,
    neuronsRef,
    hoverRef,
    phaseRef,
    draw,
  });
  const toggle = useCallback(
    () =>
      setShowBackward((p) => {
        showBackwardRef.current = !p;
        return !p;
      }),
    [],
  );

  return {
    canvasRef,
    startAnimation,
    ...handlers,
    handleToggleBackward: toggle,
    showBackward,
  };
}
