import type { DrawContext } from "./fullNNDiagram.types";
import { COLS, SHOCKWAVE_PEAK } from "./fullNNDiagram.config";
import { tokenLabel } from "../engine/model";

export function drawShockwaves(dc: DrawContext): void {
  if (dc.phase !== "forward") return;
  const { ctx, neurons, colorLookup, textRgb } = dc;
  for (let ci = 0; ci < COLS.length; ci++) {
    const sp = dc.fP(COLS[ci].stage);
    if (sp <= 0 || sp >= SHOCKWAVE_PEAK) continue;
    const layer = neurons[ci];
    if (!layer?.length) continue;
    const cx = layer[0].x;
    const cy = (layer[0].y + layer[layer.length - 1].y) / 2;
    const frac = sp / SHOCKWAVE_PEAK;
    const radius = 10 + frac * 40;
    const alpha = Math.sin(frac * Math.PI) * 0.35;
    const sRgb = colorLookup[COLS[ci].color] || textRgb;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${sRgb[0]},${sRgb[1]},${sRgb[2]},${alpha})`;
    ctx.lineWidth = 2.5 - frac * 2;
    ctx.stroke();
  }
}

export function drawHeadBrackets(dc: DrawContext): void {
  const headsCol = 8;
  const hp = dc.fP(COLS[headsCol].stage);
  if (hp <= 0.1 || !dc.neurons[headsCol]) return;
  const { ctx, purpleRgb } = dc;
  const hNeurons = dc.neurons[headsCol];
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  for (let g = 0; g < 4; g++) {
    const first = hNeurons[g * 4];
    const last = hNeurons[g * 4 + 3];
    if (!first || !last) continue;
    const bx = first.x - first.r - 5;
    ctx.strokeStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.35 * hp})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx, first.y);
    ctx.lineTo(bx - 3, first.y);
    ctx.lineTo(bx - 3, last.y);
    ctx.lineTo(bx, last.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(${purpleRgb[0]},${purpleRgb[1]},${purpleRgb[2]},${0.5 * hp})`;
    ctx.fillText("H" + g, bx - 5, (first.y + last.y) / 2 + 3);
  }
}

export function drawWinnerHalo(dc: DrawContext): void {
  const probsP = dc.fP(11);
  if (probsP <= 0.9) return;
  const { ctx, neurons, acts, colorLookup, phase, now } = dc;
  const probsLayer = neurons[15];
  const probsActs = acts[15];
  if (!probsLayer || !probsActs || probsActs.length === 0) return;

  let maxI = 0;
  let maxV = probsActs[0];
  for (let i = 1; i < probsActs.length; i++) {
    if (probsActs[i] > maxV) {
      maxV = probsActs[i];
      maxI = i;
    }
  }
  const winner = probsLayer[maxI];
  if (!winner) return;
  const blueRgb = colorLookup["--blue"];
  const pulse =
    phase === "forward" ? 0.35 + 0.15 * Math.sin(now * 0.006) : 0.35;
  const haloR = winner.r * 3;
  ctx.beginPath();
  ctx.arc(winner.x, winner.y, haloR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},${pulse})`;
  ctx.fill();
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgba(${blueRgb[0]},${blueRgb[1]},${blueRgb[2]},0.9)`;
  ctx.fillText(
    `${tokenLabel(maxI)}: ${Math.round(maxV * 100)}%`,
    winner.x + haloR + 4,
    winner.y + 4,
  );
}

export function drawColumnLabels(dc: DrawContext): void {
  const { ctx, h, neurons, colorLookup, textRgb } = dc;
  ctx.textAlign = "center";
  ctx.font = "10px monospace";
  const labelY = h - 10;
  for (let ci = 0; ci < COLS.length; ci++) {
    if (!neurons[ci]?.[0]) continue;
    const x = neurons[ci][0].x;
    const lines = COLS[ci].label.split("\n");
    const rgb = colorLookup[COLS[ci].color] || textRgb;
    lines.forEach((line, i) => {
      const a = i === 0 ? 0.9 : 0.55;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
      ctx.fillText(line, x, labelY + i * 12 - (lines.length - 1) * 6);
    });
  }
}
