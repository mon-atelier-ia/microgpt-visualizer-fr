import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { pca2d, topSimilarPairs } from "../utils/pca";
import { parseColor } from "../utils/parseColor";
import { getCssVar } from "../utils/getCssVar";
import { tokenLabel } from "../engine/model";
import type { WteSnapshot } from "../modelStore";

// ── Config ──────────────────────────────────────────────────────────
const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const DOT_RADIUS = 12;
const BOS_RADIUS = 15;
const PAD = 50;
const INTERP_MS = 200;
const GHOST_MAX = 5;
const CONSTELLATION_K = 80;
const HOVER_THRESHOLD = 30;
const IO_THRESHOLD = 0.3; // IntersectionObserver reveal threshold

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function sameType(a: string, b: string): boolean {
  if (a === "BOS" || b === "BOS") return a === b;
  return VOWELS.has(a) === VOWELS.has(b);
}

/** Compute axis bounds + screen coordinate mappers for projected PCA data. (H-1 DRY) */
function projectBounds(projected: number[][], w: number, h: number) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [px, py] of projected) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  const toSx = (px: number) => PAD + ((px - minX) / rx) * (w - 2 * PAD);
  const toSy = (py: number) => PAD + ((maxY - py) / ry) * (h - 2 * PAD);
  return { toSx, toSy };
}

// ── Props ───────────────────────────────────────────────────────────
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

export default function PCAScatterPlot({
  wteData,
  totalStep,
  snapshots,
  highlightLetter,
  onHoverLetter,
}: PCAScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(-1);
  const animRef = useRef<AnimState | null>(null);
  const onHoverRef = useRef(onHoverLetter);
  onHoverRef.current = onHoverLetter;
  // C-1: highlightLetter in ref — avoids draw/observer recreation on hover
  const highlightRef = useRef(highlightLetter ?? -1);
  highlightRef.current = highlightLetter ?? -1;
  const [hasRevealed, setHasRevealed] = useState(false);

  // Cache idle PCA projection — recomputed only when wteData changes
  const idleProjected = useMemo(() => pca2d(wteData), [wteData]);
  const projRef = useRef(idleProjected);
  projRef.current = idleProjected;

  // ── draw ─────────────────────────────────────────────────────────
  const draw = useCallback(
    (
      overrideProjected?: number[][],
      overrideEmb?: number[][],
      stepLabelText?: string,
      ghostTrail?: number[][][],
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // CSS vars
      const bgColor = getCssVar("--surface");
      const borderColor = getCssVar("--border");
      const textDimColor = getCssVar("--text-dim");
      const cyanColor = getCssVar("--cyan");
      const orangeColor = getCssVar("--orange");
      const purpleColor = getCssVar("--purple");
      const surface2Color = getCssVar("--surface2") || bgColor;
      const textColor = getCssVar("--text");

      const labelDarkRgb = parseColor(getCssVar("--bg"));
      const haloRgb = parseColor(surface2Color);
      const borderRgb = parseColor(borderColor);
      const cyanRgb = parseColor(cyanColor);
      const orangeRgb = parseColor(orangeColor);
      const purpleRgb = parseColor(purpleColor);
      const shadowRgb = parseColor(getCssVar("--dot-shadow"));
      const glowRgb = parseColor(getCssVar("--vignette-glow"));

      const embData = overrideEmb || wteData;
      const projected = overrideProjected || projRef.current;
      const n = projected.length;
      if (n === 0) return;

      // Labels
      const labels: string[] = [];
      for (let i = 0; i < n; i++) labels.push(tokenLabel(i));

      function dotRgb(ch: string): [number, number, number] {
        if (ch === "BOS") return purpleRgb;
        if (VOWELS.has(ch)) return cyanRgb;
        return orangeRgb;
      }

      // H-1: DRY bounds computation
      const { toSx, toSy } = projectBounds(projected, w, h);
      const screenPts = projected.map(([px, py]) => [toSx(px), toSy(py)]);

      const hi = highlightRef.current; // C-1: read from ref, not closure
      const hover = hoverRef.current;

      // ── Layer 1: Background ───────────────────────────────────────
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // ── Layer 2: Vignette (atmosphere — matches playground-pca.html) ─
      const cx = w / 2,
        cy = h / 2;
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.35);
      g1.addColorStop(
        0,
        `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0.025)`,
      );
      g1.addColorStop(1, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0)`);
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(
        cx,
        cy,
        minDim * 0.3,
        cx,
        cy,
        maxDim * 0.65,
      );
      g2.addColorStop(
        0,
        `rgba(${shadowRgb[0]},${shadowRgb[1]},${shadowRgb[2]},0)`,
      );
      g2.addColorStop(
        1,
        `rgba(${shadowRgb[0]},${shadowRgb[1]},${shadowRgb[2]},0.35)`,
      );
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // ── Layer 3: Axes ─────────────────────────────────────────────
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = `rgba(${borderRgb[0]},${borderRgb[1]},${borderRgb[2]},0.3)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(PAD, toSy(0));
      ctx.lineTo(w - PAD, toSy(0));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toSx(0), PAD);
      ctx.lineTo(toSx(0), h - PAD);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Layer 4: Constellation lines ──────────────────────────────
      const pairs = topSimilarPairs(embData, Math.min(CONSTELLATION_K, n * 3));
      if (pairs.length > 0) {
        const maxSim = pairs[0][2];
        const minSim = pairs[pairs.length - 1][2];
        const simRange = maxSim - minSim || 1;

        for (const [a, b, sim] of pairs) {
          const strength = (sim - minSim) / simRange;
          const same = sameType(labels[a], labels[b]);
          let lrgb: [number, number, number];
          if (same) {
            lrgb = dotRgb(labels[a]);
          } else {
            const ra = dotRgb(labels[a]),
              rb = dotRgb(labels[b]);
            lrgb = [
              Math.round((ra[0] + rb[0]) / 2),
              Math.round((ra[1] + rb[1]) / 2),
              Math.round((ra[2] + rb[2]) / 2),
            ];
          }

          const isHoverLine = hover >= 0 && (a === hover || b === hover);
          const isHighlightLine = hi >= 0 && (a === hi || b === hi);
          let alpha: number, lineW: number;

          if (isHoverLine) {
            lrgb = dotRgb(labels[hover]);
            alpha = 0.55 + strength * 0.35;
            lineW = 1.5 + strength * 2.0;
          } else if (isHighlightLine) {
            lrgb = dotRgb(labels[hi]);
            alpha = 0.35 + strength * 0.25;
            lineW = 1.0 + strength * 1.5;
          } else if (totalStep > 0) {
            alpha = 0.15 + strength * 0.45;
            lineW = 0.8 + strength * 2.0;
          } else {
            alpha = 0.08 + strength * 0.18;
            lineW = 0.5 + strength * 0.8;
          }

          ctx.strokeStyle = `rgba(${lrgb[0]},${lrgb[1]},${lrgb[2]},${alpha})`;
          ctx.lineWidth = lineW;
          ctx.beginPath();
          ctx.moveTo(screenPts[a][0], screenPts[a][1]);
          ctx.lineTo(screenPts[b][0], screenPts[b][1]);
          ctx.stroke();
        }
      }

      // ── Layer 5: Ghost trails ─────────────────────────────────────
      if (ghostTrail && ghostTrail.length > 0) {
        const alphas = [0.25, 0.19, 0.13, 0.07, 0.03];
        for (let gi = 0; gi < ghostTrail.length; gi++) {
          const gp = ghostTrail[gi];
          const ga = alphas[ghostTrail.length - 1 - gi] ?? 0.03;
          for (let di = 0; di < gp.length && di < n; di++) {
            const rgb = dotRgb(labels[di]);
            const gsx = toSx(gp[di][0]);
            const gsy = toSy(gp[di][1]);
            ctx.beginPath();
            ctx.arc(gsx, gsy, DOT_RADIUS * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${ga})`;
            ctx.fill();
          }
        }
      }

      // Build draw order (hovered last)
      const order = Array.from({ length: n }, (_, i) => i);
      if (hover >= 0) {
        const idx = order.indexOf(hover);
        if (idx >= 0) {
          order.splice(idx, 1);
          order.push(hover);
        }
      }

      for (const i of order) {
        const [sx, sy] = screenPts[i];
        const label = labels[i];
        const isBos = label === "BOS";
        let drawR = isBos ? BOS_RADIUS : DOT_RADIUS;
        const isHover = i === hover;
        const isHi = i === hi;
        if (isHover) drawR *= 1.3;

        const rgb = dotRgb(label);

        // ── Layer 6: Dot shadows ────────────────────────────────────
        for (let s = 3; s >= 1; s--) {
          ctx.beginPath();
          ctx.arc(sx + 2, sy + 2.5, drawR + s, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${shadowRgb[0]},${shadowRgb[1]},${shadowRgb[2]},${(0.12 / s).toFixed(3)})`;
          ctx.fill();
        }

        // ── Layer 7: Hover glow ─────────────────────────────────────
        if (isHover) {
          const glow = ctx.createRadialGradient(
            sx,
            sy,
            drawR * 0.8,
            sx,
            sy,
            drawR * 1.5,
          );
          glow.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.08)`);
          glow.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, drawR * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // ── Layer 8: Dot fill ───────────────────────────────────────
        const grad = ctx.createRadialGradient(
          sx - drawR * 0.25,
          sy - drawR * 0.25,
          drawR * 0.1,
          sx,
          sy,
          drawR,
        );
        const bright = `rgba(${Math.min(255, rgb[0] + 50)},${Math.min(255, rgb[1] + 50)},${Math.min(255, rgb[2] + 50)},1)`;
        const base = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
        const dark = `rgba(${Math.max(0, rgb[0] - 30)},${Math.max(0, rgb[1] - 30)},${Math.max(0, rgb[2] - 30)},1)`;
        grad.addColorStop(0, bright);
        grad.addColorStop(0.5, base);
        grad.addColorStop(1, dark);
        ctx.beginPath();
        ctx.arc(sx, sy, drawR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // ── Layer 9: Highlight ring ─────────────────────────────────
        if (isHi && !isHover) {
          ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, drawR + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // ── Layer 10: Letter labels ─────────────────────────────────
        ctx.fillStyle = `rgb(${labelDarkRgb[0]},${labelDarkRgb[1]},${labelDarkRgb[2]})`;
        ctx.font = `bold ${isBos ? 16 : 12}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Halo for readability on colored dots
        ctx.strokeStyle = `rgba(${haloRgb[0]},${haloRgb[1]},${haloRgb[2]},0.7)`;
        ctx.lineWidth = 3;
        ctx.strokeText(isBos ? "⊕" : label, sx, sy + 0.5);
        ctx.fillText(isBos ? "⊕" : label, sx, sy + 0.5);
      }

      // ── Layer 11: Axis labels ─────────────────────────────────────
      ctx.font = "11px monospace";
      ctx.fillStyle = textDimColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("PC1", w - PAD + 30, toSy(0));
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("PC2", toSx(0), PAD - 18);

      // ── Layer 12: Tooltip ─────────────────────────────────────────
      if (hover >= 0 && hover < n) {
        const [sx, sy] = screenPts[hover];
        const label = labels[hover];
        const type =
          label === "BOS"
            ? "spécial"
            : VOWELS.has(label)
              ? "voyelle"
              : "consonne";
        const [pcx, pcy] = projected[hover];
        const lines = [
          label === "BOS" ? "BOS (début)" : `"${label}" — ${type}`,
          `PC1: ${pcx.toFixed(2)}  PC2: ${pcy.toFixed(2)}`,
        ];

        ctx.font = "12px monospace";
        const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const boxW = tw + 16;
        const boxH = lines.length * 18 + 12;
        let bx = sx + 18;
        let by = sy - boxH - 8;
        if (bx + boxW > w - 4) bx = sx - boxW - 18;
        if (by < 4) by = sy + 18;

        ctx.fillStyle = surface2Color;
        ctx.strokeStyle = `rgba(${borderRgb[0]},${borderRgb[1]},${borderRgb[2]},0.4)`;
        ctx.lineWidth = 1;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + boxW - r, by);
        ctx.quadraticCurveTo(bx + boxW, by, bx + boxW, by + r);
        ctx.lineTo(bx + boxW, by + boxH - r);
        ctx.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - r, by + boxH);
        ctx.lineTo(bx + r, by + boxH);
        ctx.quadraticCurveTo(bx, by + boxH, bx, by + boxH - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(lines[0], bx + 8, by + 6);
        ctx.fillStyle = textDimColor;
        ctx.fillText(lines[1], bx + 8, by + 24);
      }

      // ── Layer 13: Legend ────────────────────────────────────────────
      const legendY = h - 14;
      const legendItems: [string, [number, number, number]][] = [
        ["voyelles", cyanRgb],
        ["consonnes", orangeRgb],
        ["BOS", purpleRgb],
      ];
      ctx.font = "10px monospace";
      ctx.textBaseline = "middle";
      let lx = PAD;
      for (const [lbl, rgb2] of legendItems) {
        ctx.fillStyle = `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`;
        ctx.beginPath();
        ctx.arc(lx, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = textDimColor;
        ctx.textAlign = "left";
        ctx.fillText(lbl, lx + 8, legendY);
        lx += ctx.measureText(lbl).width + 24;
      }

      // ── Layer 14: Step label ───────────────────────────────────────
      if (stepLabelText) {
        ctx.font = "11px monospace";
        ctx.fillStyle = textDimColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(stepLabelText, 12, 10);
      }
    },
    [wteData, totalStep], // C-1: removed highlightLetter (now in ref)
  );

  // Stable draw ref for observers & event handlers (avoids recreation)
  const drawRef = useRef(draw);
  drawRef.current = draw;

  // ── Animation (16D interpolation → pca2d each frame) ────────────
  const startAnimation = useCallback(() => {
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
      stepLabel: `Étape ${snapshots[0].step}`,
    };

    const tick = (now: number) => {
      const anim = animRef.current;
      if (!anim) return;

      const elapsed = now - anim.startTime;
      const t = Math.min(1, elapsed / INTERP_MS);
      const ease = easeInOut(t);

      // Interpolate embeddings in 16D (organic particle movement)
      const fromEmb = snapshots[anim.fromIdx].wte;
      const toEmb = snapshots[anim.toIdx].wte;
      const interpEmb = fromEmb.map((row, i) =>
        row.map((v, j) => v + (toEmb[i][j] - v) * ease),
      );

      // Recompute PCA on interpolated 16D data (axes rotate naturally)
      const proj = pca2d(interpEmb);

      // Ghost trail
      anim.frameCount++;
      if (anim.frameCount % 4 === 0) {
        anim.ghostTrail.push(proj.map((p) => [...p]));
        if (anim.ghostTrail.length > GHOST_MAX) anim.ghostTrail.shift();
      }

      // Step label
      const fromStep = snapshots[anim.fromIdx].step;
      const toStep = snapshots[anim.toIdx].step;
      anim.stepLabel = `Étape ${Math.round(fromStep + (toStep - fromStep) * ease)}`;

      // Use interpolated embeddings for constellation lines too
      drawRef.current(proj, interpEmb, anim.stepLabel, anim.ghostTrail);

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

      anim.frameId = requestAnimationFrame(tick);
    };

    animRef.current.frameId = requestAnimationFrame(tick);
  }, [snapshots]);

  // ── Hover ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || animRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const projected = projRef.current;
      const n = projected.length;
      if (n === 0) return;

      // H-1: DRY bounds computation
      const { toSx, toSy } = projectBounds(
        projected,
        canvas.clientWidth,
        canvas.clientHeight,
      );

      let closest = -1;
      let closestDist = HOVER_THRESHOLD;
      for (let i = 0; i < n; i++) {
        const sx = toSx(projected[i][0]);
        const sy = toSy(projected[i][1]);
        const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
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
    [], // stable — reads from refs only
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverRef.current !== -1) {
      hoverRef.current = -1;
      onHoverRef.current?.(null);
      drawRef.current();
    }
  }, []); // stable

  // ── Effects ───────────────────────────────────────────────────────

  // IntersectionObserver — first reveal (same pattern as NNDiagram)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed) return;
    if (typeof IntersectionObserver === "undefined") {
      // jsdom fallback: draw static immediately
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
  }, [hasRevealed]);

  // Draw on reveal + data change + highlight change
  useEffect(() => {
    if (hasRevealed && !animRef.current) draw();
  }, [hasRevealed, draw, highlightLetter]);

  // C-1: Observers in stable effect (created once, use drawRef)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      ro = new ResizeObserver(() => {
        if (!animRef.current) drawRef.current();
      });
      ro.observe(canvas.parentElement);
    }

    let mo: MutationObserver | undefined;
    if (typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(() => {
        if (!animRef.current) drawRef.current();
      });
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    return () => {
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);

  // F-2: Cancel in-flight animation when snapshots change (e.g. dataset reset)
  useEffect(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current.frameId);
      animRef.current = null;
      drawRef.current();
    }
  }, [snapshots]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current.frameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Carte PCA des plongements — projection 2D des 27 vecteurs"
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
          ▶ Rejouer l'évolution
        </button>
      )}
    </>
  );
}
