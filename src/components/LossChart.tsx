import { useEffect, useRef, useCallback } from "react";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";

interface Props {
  lossHistory: number[];
}

export default function LossChart({ lossHistory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(lossHistory);
  dataRef.current = lossHistory;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom — no canvas support
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const data = dataRef.current;

    // Read theme colors from CSS variables
    const colSurface2 = getCssVar("--surface2");
    const colBorder = getCssVar("--border");
    const colTextDim = getCssVar("--text-dim");
    const colBlue = getCssVar("--blue");
    const colGreen = getCssVar("--green");
    const colRed = getCssVar("--red");
    const blueRgb = parseColor(colBlue);
    const redRgb = parseColor(colRed);

    ctx.fillStyle = colSurface2;
    ctx.fillRect(0, 0, W, H);

    if (data.length === 0) {
      ctx.fillStyle = colTextDim;
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Clique sur « Entraîner » pour commencer", W / 2, H / 2);
      return;
    }

    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    const minLoss = Math.min(...data) * 0.95;
    const maxLoss = Math.max(...data) * 1.02;

    // Grid
    ctx.strokeStyle = colBorder;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = colTextDim;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      const val = maxLoss - ((maxLoss - minLoss) * i) / 4;
      ctx.fillText(val.toFixed(2), pad.left - 6, y + 4);
    }

    // Raw loss line
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},0.27)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / Math.max(1, data.length - 1)) * pw;
      const y = pad.top + (1 - (data[i] - minLoss) / (maxLoss - minLoss)) * ph;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Moving average
    if (data.length > 10) {
      ctx.beginPath();
      ctx.strokeStyle = colGreen;
      ctx.lineWidth = 2;
      const ws = Math.min(20, Math.floor(data.length / 3));
      for (let i = ws; i < data.length; i++) {
        const avg = data.slice(i - ws, i).reduce((a, b) => a + b, 0) / ws;
        const x = pad.left + (i / (data.length - 1)) * pw;
        const y = pad.top + (1 - (avg - minLoss) / (maxLoss - minLoss)) * ph;
        if (i === ws) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Random baseline
    const vocabSize = 27;
    const randomLoss = Math.log(vocabSize);
    if (randomLoss >= minLoss && randomLoss <= maxLoss) {
      const y =
        pad.top + (1 - (randomLoss - minLoss) / (maxLoss - minLoss)) * ph;
      ctx.strokeStyle = `rgba(${redRgb[0]},${redRgb[1]},${redRgb[2]},0.27)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colRed;
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillText("aléatoire (3.30)", pad.left + 4, y - 4);
    }

    // Labels
    ctx.fillStyle = colTextDim;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Étape ${data.length}`, W / 2, H - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = colBlue;
    ctx.fillText("raw", W - pad.right, pad.top - 6);
    ctx.fillStyle = colGreen;
    ctx.fillText("avg", W - pad.right - 40, pad.top - 6);
  }, []);

  // Redraw on data change
  useEffect(() => {
    draw();
  }, [draw, lossHistory, lossHistory.length]);

  // ResizeObserver — redraw on container resize (same pattern as NNDiagram)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, [draw]);

  // MutationObserver — redraw on theme change (same pattern as NNDiagram)
  useEffect(() => {
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, [draw]);

  const label =
    lossHistory.length === 0
      ? "Courbe de loss — en attente d'entraînement"
      : `Courbe de loss — étape ${lossHistory.length}, dernière valeur ${lossHistory[lossHistory.length - 1].toFixed(3)}`;

  return (
    <canvas ref={canvasRef} className="chart" role="img" aria-label={label} />
  );
}
