import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { pca2d } from "../utils/pca";
import type { WteSnapshot } from "../modelStore";
import { HOVER_THRESHOLD } from "./pcaScatterPlot.config";
import {
  projectBounds,
  readColors,
  buildLabels,
  drawBackground,
  drawVignette,
  drawAxes,
  drawConstellationLines,
  drawGhosts,
  drawDots,
  drawTooltip,
  drawLegend,
  drawStepLabel,
  type PCADrawContext,
  type PCADrawOpts,
} from "./pcaScatterPlot.renderer";
import { useStartAnimation } from "./pcaScatterPlot.animation";
import {
  useIntersectionReveal,
  useResizeAndTheme,
  useRedrawOnReveal,
  useResetOnSnapshotChange,
  useCleanupAnimation,
} from "./pcaScatterPlot.hooks";
import "./PCAScatterPlot.css";

// ── Types ──────────────────────────────────────────────────────────

interface PCAScatterPlotProps {
  wteData: number[][];
  totalStep: number;
  snapshots: WteSnapshot[];
  highlightLetter?: number | null;
  onHoverLetter?: (index: number | null) => void;
}

interface AnimState {
  frameId: number;
  fromIdx: number;
  toIdx: number;
  startTime: number;
  ghostTrail: number[][][];
  frameCount: number;
  stepLabel: string;
}

export type { AnimState };

// ── Draw orchestrator ──────────────────────────────────────────────

interface OrchestrateOpts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  projRef: React.RefObject<number[][]>;
  hoverRef: React.RefObject<number>;
  highlightRef: React.RefObject<number>;
  wteData: number[][];
  totalStep: number;
  drawOpts: PCADrawOpts;
}

function setupCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { w: number; h: number } | null {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

function orchestrateDraw(opts: OrchestrateOpts): void {
  const canvas = opts.canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dims = setupCanvas(canvas, ctx);
  if (!dims) return;

  const { w, h } = dims;
  const embData = opts.drawOpts.overrideEmb || opts.wteData;
  const projected = opts.drawOpts.overrideProjected || opts.projRef.current;
  if (projected.length === 0) return;

  const labels = buildLabels(projected.length);
  const { toSx, toSy } = projectBounds(projected, { w, h });
  const screenPts = projected.map(([px, py]) => [toSx(px), toSy(py)]);

  const d: PCADrawContext = {
    ctx,
    w,
    h,
    projected,
    screenPts,
    labels,
    hover: opts.hoverRef.current,
    hi: opts.highlightRef.current,
    totalStep: opts.totalStep,
    embData,
    colors: readColors(),
  };

  drawBackground(d);
  drawVignette(d);
  drawAxes(d);
  drawConstellationLines(d);
  drawGhosts(d, opts.drawOpts.ghostTrail);
  drawDots(d);
  drawTooltip(d);
  drawLegend(d);
  drawStepLabel(d, opts.drawOpts.stepLabelText);
}

// ── Hooks ──────────────────────────────────────────────────────────

function useDrawCallback(opts: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  projRef: React.RefObject<number[][]>;
  hoverRef: React.RefObject<number>;
  highlightRef: React.RefObject<number>;
}) {
  const { canvasRef, projRef, hoverRef, highlightRef } = opts;
  return useCallback(
    (wteData: number[][], totalStep: number) =>
      (drawOpts: PCADrawOpts = {}) => {
        orchestrateDraw({
          canvasRef,
          projRef,
          hoverRef,
          highlightRef,
          wteData,
          totalStep,
          drawOpts,
        });
      },
    [canvasRef, projRef, hoverRef, highlightRef],
  );
}

interface HoverOpts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  projRef: React.RefObject<number[][]>;
  hoverRef: React.MutableRefObject<number>;
  animRef: React.RefObject<AnimState | null>;
  onHoverRef: React.RefObject<((i: number | null) => void) | undefined>;
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>;
}

function useHoverHandlers(opts: HoverOpts) {
  const { canvasRef, projRef, hoverRef, animRef, onHoverRef, drawRef } = opts;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || animRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const projected = projRef.current;
      if (projected.length === 0) return;

      const { toSx, toSy } = projectBounds(projected, {
        w: canvas.clientWidth,
        h: canvas.clientHeight,
      });

      let closest = -1;
      let closestDist = HOVER_THRESHOLD;
      for (let i = 0; i < projected.length; i++) {
        const d = Math.sqrt(
          (mx - toSx(projected[i][0])) ** 2 + (my - toSy(projected[i][1])) ** 2,
        );
        if (d < closestDist) {
          closestDist = d;
          closest = i;
        }
      }

      if (closest !== hoverRef.current) {
        hoverRef.current = closest;
        onHoverRef.current?.(closest >= 0 ? closest : null);
        drawRef.current();
      }
    },
    [canvasRef, projRef, hoverRef, animRef, onHoverRef, drawRef],
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverRef.current !== -1) {
      hoverRef.current = -1;
      onHoverRef.current?.(null);
      drawRef.current();
    }
  }, [hoverRef, onHoverRef, drawRef]);

  return { handleMouseMove, handleMouseLeave };
}

// ── Component ──────────────────────────────────────────────────────

export default function PCAScatterPlot(props: PCAScatterPlotProps) {
  const { wteData, totalStep, snapshots, highlightLetter, onHoverLetter } =
    props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(-1);
  const animRef = useRef<AnimState | null>(null);
  const onHoverRef = useRef(onHoverLetter);
  onHoverRef.current = onHoverLetter;
  const highlightRef = useRef(highlightLetter ?? -1);
  highlightRef.current = highlightLetter ?? -1;
  const [hasRevealed, setHasRevealed] = useState(false);

  const idleProjected = useMemo(() => pca2d(wteData), [wteData]);
  const projRef = useRef(idleProjected);
  projRef.current = idleProjected;

  const makeDraw = useDrawCallback({
    canvasRef,
    projRef,
    hoverRef,
    highlightRef,
  });
  const draw = useMemo(
    () => makeDraw(wteData, totalStep),
    [makeDraw, wteData, totalStep],
  );
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const startAnimation = useStartAnimation(snapshots, animRef, drawRef);
  const handlers = useHoverHandlers({
    canvasRef,
    projRef,
    hoverRef,
    animRef,
    onHoverRef,
    drawRef,
  });

  useIntersectionReveal({ canvasRef, drawRef, hasRevealed, setHasRevealed });
  useResizeAndTheme({ canvasRef, animRef, drawRef });
  useRedrawOnReveal({ hasRevealed, draw, highlightLetter, animRef });
  useResetOnSnapshotChange({ animRef, drawRef, snapshots });
  useCleanupAnimation(animRef);

  return renderCanvas({ canvasRef, handlers, snapshots, startAnimation });
}

// ── Render helper ──────────────────────────────────────────────────

function renderCanvas(opts: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handlers: ReturnType<typeof useHoverHandlers>;
  snapshots: WteSnapshot[];
  startAnimation: () => void;
}) {
  const { canvasRef, handlers, snapshots, startAnimation } = opts;
  const { handleMouseMove, handleMouseLeave } = handlers;
  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Carte PCA des plongements \u2014 projection 2D des 27 vecteurs"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          e.preventDefault();
          handleMouseMove(
            e.touches[0] as unknown as React.MouseEvent<HTMLCanvasElement>,
          );
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          handleMouseMove(
            e.touches[0] as unknown as React.MouseEvent<HTMLCanvasElement>,
          );
        }}
        onTouchEnd={handleMouseLeave}
      />
      {snapshots.length >= 3 && (
        <button
          type="button"
          className="btn btn-secondary pca-replay"
          onClick={startAnimation}
        >
          &#x25b6; Rejouer l&apos;&#x00e9;volution
        </button>
      )}
    </>
  );
}

// unused import guard
void useEffect;
