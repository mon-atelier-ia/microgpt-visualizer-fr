import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

export interface CanvasObserverOpts {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  animRef: RefObject<number>;
  phaseRef: RefObject<string>;
  animStartRef: RefObject<number>;
  draw: (timestamp?: number) => void;
}

/**
 * Shared Canvas lifecycle: IO reveal, RO resize, MO theme, re-animate on data, startAnimation.
 * Used by NNDiagram and FullNNDiagram.
 */
export function useCanvasObservers(opts: CanvasObserverOpts): {
  hasRevealed: boolean;
  startAnimation: () => void;
} {
  const { canvasRef, animRef, phaseRef, animStartRef, draw } = opts;
  const [hasRevealed, setHasRevealed] = useState(false);

  const startAnimation = useCallback(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(animRef.current);
    if (prefersReducedMotion) {
      phaseRef.current = "idle";
      draw();
    } else {
      phaseRef.current = "forward";
      animStartRef.current = performance.now();
      animRef.current = requestAnimationFrame(draw);
    }
  }, [animRef, phaseRef, animStartRef, draw]);

  useIOReveal({
    canvasRef,
    phaseRef,
    hasRevealed,
    setHasRevealed,
    startAnimation,
    draw,
  });
  useReAnimate(hasRevealed, startAnimation, animRef);
  useResizeRedraw(canvasRef, phaseRef, draw);
  useThemeRedraw(phaseRef, draw);

  return { hasRevealed, startAnimation };
}

// ── Sub-hooks (each ≤15 lines) ──────────────────────

interface IORevealOpts {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  phaseRef: RefObject<string>;
  hasRevealed: boolean;
  setHasRevealed: (v: boolean) => void;
  startAnimation: () => void;
  draw: (timestamp?: number) => void;
}

function useIOReveal(opts: IORevealOpts) {
  const {
    canvasRef,
    phaseRef,
    hasRevealed,
    setHasRevealed,
    startAnimation,
    draw,
  } = opts;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed) return;
    if (typeof IntersectionObserver === "undefined") {
      phaseRef.current = "idle";
      setHasRevealed(true);
      draw();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          startAnimation();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(canvas);
    return () => io.disconnect();
  }, [canvasRef, phaseRef, hasRevealed, setHasRevealed, startAnimation, draw]);
}

function useReAnimate(
  hasRevealed: boolean,
  startAnimation: () => void,
  animRef: RefObject<number>,
) {
  useEffect(() => {
    if (!hasRevealed) return;
    startAnimation();
    const ref = animRef;
    return () => cancelAnimationFrame(ref.current);
  }, [hasRevealed, startAnimation, animRef]);
}

function useResizeRedraw(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  phaseRef: RefObject<string>,
  draw: (timestamp?: number) => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (phaseRef.current !== "forward") draw();
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [canvasRef, phaseRef, draw]);
}

function useThemeRedraw(
  phaseRef: RefObject<string>,
  draw: (timestamp?: number) => void,
) {
  useEffect(() => {
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      if (phaseRef.current !== "forward") draw();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [phaseRef, draw]);
}
