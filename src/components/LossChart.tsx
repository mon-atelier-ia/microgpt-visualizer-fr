import { useEffect, useRef, useCallback } from "react";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";

interface Props {
  lossHistory: number[];
}

interface ChartLayout {
  pad: { top: number; right: number; bottom: number; left: number };
  pw: number;
  ph: number;
  minLoss: number;
  maxLoss: number;
  W: number;
  H: number;
}

function computeLayout(W: number, H: number, data: number[]): ChartLayout {
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  return {
    pad,
    pw: W - pad.left - pad.right,
    ph: H - pad.top - pad.bottom,
    minLoss: Math.min(...data) * 0.95,
    maxLoss: Math.max(...data) * 1.02,
    W,
    H,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, l: ChartLayout) {
  const colBorder = getCssVar("--border");
  const colTextDim = getCssVar("--text-dim");
  ctx.strokeStyle = colBorder;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = l.pad.top + (l.ph * i) / 4;
    ctx.beginPath();
    ctx.moveTo(l.pad.left, y);
    ctx.lineTo(l.W - l.pad.right, y);
    ctx.stroke();
    ctx.fillStyle = colTextDim;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    const val = l.maxLoss - ((l.maxLoss - l.minLoss) * i) / 4;
    ctx.fillText(val.toFixed(2), l.pad.left - 6, y + 4);
  }
}

function drawRawLine(
  ctx: CanvasRenderingContext2D,
  data: number[],
  l: ChartLayout,
) {
  const blueRgb = parseColor(getCssVar("--blue"));
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},0.27)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < data.length; i++) {
    const x = l.pad.left + (i / Math.max(1, data.length - 1)) * l.pw;
    const y =
      l.pad.top + (1 - (data[i] - l.minLoss) / (l.maxLoss - l.minLoss)) * l.ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawMovingAvg(
  ctx: CanvasRenderingContext2D,
  data: number[],
  l: ChartLayout,
) {
  if (data.length <= 10) return;
  ctx.beginPath();
  ctx.strokeStyle = getCssVar("--green");
  ctx.lineWidth = 2;
  const ws = Math.min(20, Math.floor(data.length / 3));
  for (let i = ws; i < data.length; i++) {
    const avg = data.slice(i - ws, i).reduce((a, b) => a + b, 0) / ws;
    const x = l.pad.left + (i / (data.length - 1)) * l.pw;
    const y =
      l.pad.top + (1 - (avg - l.minLoss) / (l.maxLoss - l.minLoss)) * l.ph;
    if (i === ws) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBaseline(ctx: CanvasRenderingContext2D, l: ChartLayout) {
  const randomLoss = Math.log(27);
  if (randomLoss < l.minLoss || randomLoss > l.maxLoss) return;
  const colRed = getCssVar("--red");
  const redRgb = parseColor(colRed);
  const y =
    l.pad.top + (1 - (randomLoss - l.minLoss) / (l.maxLoss - l.minLoss)) * l.ph;
  ctx.strokeStyle = `rgba(${redRgb[0]},${redRgb[1]},${redRgb[2]},0.27)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(l.pad.left, y);
  ctx.lineTo(l.W - l.pad.right, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = colRed;
  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillText("aléatoire (3.30)", l.pad.left + 4, y - 4);
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  data: number[],
  l: ChartLayout,
) {
  const colTextDim = getCssVar("--text-dim");
  ctx.fillStyle = colTextDim;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Étape ${data.length}`, l.W / 2, l.H - 6);
  ctx.textAlign = "right";
  ctx.fillStyle = getCssVar("--blue");
  ctx.fillText("raw", l.W - l.pad.right, l.pad.top - 6);
  ctx.fillStyle = getCssVar("--green");
  ctx.fillText("avg", l.W - l.pad.right - 40, l.pad.top - 6);
}

export default function LossChart({ lossHistory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(lossHistory);
  dataRef.current = lossHistory;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const data = dataRef.current;
    ctx.fillStyle = getCssVar("--surface2");
    ctx.fillRect(0, 0, W, H);

    if (data.length === 0) {
      ctx.fillStyle = getCssVar("--text-dim");
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Clique sur « Entraîner » pour commencer", W / 2, H / 2);
      return;
    }

    const layout = computeLayout(W, H, data);
    drawGrid(ctx, layout);
    drawRawLine(ctx, data, layout);
    drawMovingAvg(ctx, data, layout);
    drawBaseline(ctx, layout);
    drawLabels(ctx, data, layout);
  }, []);

  useEffect(() => {
    draw();
  }, [draw, lossHistory, lossHistory.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, [draw]);

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
