// ── PCA Scatter Plot — small effect hooks ──────────────────────────
import { useEffect } from "react";
import type { WteSnapshot } from "../modelStore";
import type { PCADrawOpts } from "./pcaScatterPlot.renderer";
import type { AnimState } from "./PCAScatterPlot";
import { IO_THRESHOLD } from "./pcaScatterPlot.config";

// ── Intersection reveal ────────────────────────────────────────────

interface RevealOpts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>;
  hasRevealed: boolean;
  setHasRevealed: (v: boolean) => void;
}

export function useIntersectionReveal(opts: RevealOpts) {
  const { canvasRef, drawRef, hasRevealed, setHasRevealed } = opts;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed) return;
    if (typeof IntersectionObserver === "undefined") {
      setHasRevealed(true);
      drawRef.current();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          io.disconnect();
        }
      },
      { threshold: IO_THRESHOLD },
    );
    io.observe(canvas);
    return () => io.disconnect();
  }, [canvasRef, drawRef, hasRevealed, setHasRevealed]);
}

// ── Resize + theme observer ────────────────────────────────────────

export function useResizeAndTheme(opts: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  animRef: React.RefObject<AnimState | null>;
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>;
}) {
  const { canvasRef, animRef, drawRef } = opts;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cbs: (() => void)[] = [];

    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      const ro = new ResizeObserver(() => {
        if (!animRef.current) drawRef.current();
      });
      ro.observe(canvas.parentElement);
      cbs.push(() => ro.disconnect());
    }

    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        if (!animRef.current) drawRef.current();
      });
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      cbs.push(() => mo.disconnect());
    }

    return () => cbs.forEach((fn) => fn());
  }, [canvasRef, animRef, drawRef]);
}

// ── Redraw on reveal ───────────────────────────────────────────────

export function useRedrawOnReveal(opts: {
  hasRevealed: boolean;
  draw: (o?: PCADrawOpts) => void;
  highlightLetter: number | null | undefined;
  animRef: React.RefObject<AnimState | null>;
}) {
  const { hasRevealed, draw, highlightLetter, animRef } = opts;
  useEffect(() => {
    if (hasRevealed && !animRef.current) draw();
  }, [hasRevealed, draw, highlightLetter, animRef]);
}

// ── Reset on snapshot change ───────────────────────────────────────

export function useResetOnSnapshotChange(opts: {
  animRef: React.MutableRefObject<AnimState | null>;
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>;
  snapshots: WteSnapshot[];
}) {
  const { animRef, drawRef, snapshots } = opts;
  useEffect(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current.frameId);
      animRef.current = null;
      drawRef.current();
    }
  }, [snapshots, animRef, drawRef]);
}

// ── Cleanup animation on unmount ───────────────────────────────────

export function useCleanupAnimation(
  animRef: React.RefObject<AnimState | null>,
) {
  useEffect(() => {
    const ref = animRef;
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current.frameId);
    };
  }, [animRef]);
}
