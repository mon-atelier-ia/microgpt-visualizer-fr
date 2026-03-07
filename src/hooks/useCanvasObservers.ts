import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

/**
 * Shared Canvas lifecycle: IO reveal, RO resize, MO theme, re-animate on data, startAnimation.
 * Used by NNDiagram and FullNNDiagram.
 */
export function useCanvasObservers(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  animRef: RefObject<number>,
  phaseRef: RefObject<string>,
  animStartRef: RefObject<number>,
  draw: (timestamp?: number) => void,
): { hasRevealed: boolean; startAnimation: () => void } {
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

  // IntersectionObserver — first reveal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed) return;
    if (typeof IntersectionObserver === "undefined") {
      // jsdom fallback: draw static immediately
      phaseRef.current = "idle";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jsdom-only fallback path, no cascading risk
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
  }, [canvasRef, phaseRef, hasRevealed, startAnimation, draw]);

  // Re-animate on data change (after first reveal)
  useEffect(() => {
    if (!hasRevealed) return;
    startAnimation();
    return () => cancelAnimationFrame(animRef.current);
  }, [hasRevealed, startAnimation, animRef]);

  // ResizeObserver
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

  // MutationObserver — theme change
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

  return { hasRevealed, startAnimation };
}
