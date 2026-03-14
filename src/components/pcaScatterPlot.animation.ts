// ── PCA Scatter Plot — animation hook ──────────────────────────────
import { useCallback } from "react";
import { pca2d } from "../utils/pca";
import type { WteSnapshot } from "../modelStore";
import { INTERP_MS, GHOST_MAX, easeInOut } from "./pcaScatterPlot.config";
import type { PCADrawOpts } from "./pcaScatterPlot.renderer";
import type { AnimState } from "./PCAScatterPlot";

interface TickContext {
  snapshots: WteSnapshot[];
  animRef: React.MutableRefObject<AnimState | null>;
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>;
}

function animTick(ctx: TickContext, now: number): void {
  const { snapshots, animRef, drawRef } = ctx;
  const anim = animRef.current;
  if (!anim) return;

  const elapsed = now - anim.startTime;
  const t = Math.min(1, elapsed / INTERP_MS);
  const ease = easeInOut(t);

  const interpEmb = interpolateEmb(snapshots, anim, ease);
  const proj = pca2d(interpEmb);
  updateGhostTrail(anim, proj);
  updateStepLabel(anim, snapshots, ease);

  drawRef.current({
    overrideProjected: proj,
    overrideEmb: interpEmb,
    stepLabelText: anim.stepLabel,
    ghostTrail: anim.ghostTrail,
  });

  if (t >= 1) {
    anim.fromIdx++;
    anim.toIdx++;
    if (anim.toIdx >= snapshots.length) {
      animRef.current = null;
      drawRef.current();
      return;
    }
    anim.startTime = performance.now();
  }

  anim.frameId = requestAnimationFrame((n) => animTick(ctx, n));
}

function interpolateEmb(
  snapshots: WteSnapshot[],
  anim: AnimState,
  ease: number,
): number[][] {
  const fromEmb = snapshots[anim.fromIdx].wte;
  const toEmb = snapshots[anim.toIdx].wte;
  return fromEmb.map((row, i) =>
    row.map((v, j) => v + (toEmb[i][j] - v) * ease),
  );
}

function updateGhostTrail(anim: AnimState, proj: number[][]): void {
  anim.frameCount++;
  if (anim.frameCount % 4 === 0) {
    anim.ghostTrail.push(proj.map((p) => [...p]));
    if (anim.ghostTrail.length > GHOST_MAX) anim.ghostTrail.shift();
  }
}

function updateStepLabel(
  anim: AnimState,
  snapshots: WteSnapshot[],
  ease: number,
): void {
  const fromStep = snapshots[anim.fromIdx].step;
  const toStep = snapshots[anim.toIdx].step;
  anim.stepLabel = `\u00c9tape ${Math.round(fromStep + (toStep - fromStep) * ease)}`;
}

export function useStartAnimation(
  snapshots: WteSnapshot[],
  animRef: React.MutableRefObject<AnimState | null>,
  drawRef: React.RefObject<(o?: PCADrawOpts) => void>,
) {
  return useCallback(() => {
    if (snapshots.length < 3) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      drawRef.current();
      return;
    }

    if (animRef.current) cancelAnimationFrame(animRef.current.frameId);

    animRef.current = {
      frameId: 0,
      fromIdx: 0,
      toIdx: 1,
      startTime: performance.now(),
      ghostTrail: [],
      frameCount: 0,
      stepLabel: `\u00c9tape ${snapshots[0].step}`,
    };

    const ctx: TickContext = { snapshots, animRef, drawRef };
    animRef.current.frameId = requestAnimationFrame((n) => animTick(ctx, n));
  }, [snapshots, animRef, drawRef]);
}
