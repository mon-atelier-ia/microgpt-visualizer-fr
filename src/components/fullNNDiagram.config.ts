import type { ColDef, EdgeDef, NeuronPos } from "./fullNNDiagram.types";

const HEAD_DIM = 4;

export const COLS: ColDef[] = [
  {
    n: 16,
    label: "Token\nEmb",
    xFrac: 0.0,
    stage: 0,
    color: "--cyan",
    sec: "Embedding",
  },
  {
    n: 16,
    label: "Pos\nEmb",
    xFrac: 0.04,
    stage: 0,
    color: "--cyan",
    sec: "Embedding",
  },
  { n: 16, label: "Add", xFrac: 0.09, stage: 1, color: "--text", sec: "" },
  { n: 16, label: "Norm", xFrac: 0.13, stage: 1, color: "--text", sec: "" },
  {
    n: 16,
    label: "Norm\n(attn)",
    xFrac: 0.17,
    stage: 2,
    color: "--text",
    sec: "",
  },
  {
    n: 16,
    label: "Q",
    xFrac: 0.22,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "K",
    xFrac: 0.26,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "V",
    xFrac: 0.3,
    stage: 3,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "4 Têtes",
    xFrac: 0.37,
    stage: 4,
    color: "--purple",
    sec: "Attention",
    headGroups: 4,
  },
  {
    n: 16,
    label: "Après\nAttn",
    xFrac: 0.44,
    stage: 5,
    color: "--purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "Norm\n(mlp)",
    xFrac: 0.5,
    stage: 6,
    color: "--text",
    sec: "",
  },
  {
    n: 64,
    label: "MLP\n(×4)",
    xFrac: 0.57,
    stage: 7,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 64,
    label: "ReLU",
    xFrac: 0.64,
    stage: 8,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 16,
    label: "Après\nMLP",
    xFrac: 0.72,
    stage: 9,
    color: "--orange",
    sec: "MLP",
  },
  {
    n: 27,
    label: "Logits",
    xFrac: 0.86,
    stage: 10,
    color: "--blue",
    sec: "Sortie",
  },
  {
    n: 27,
    label: "Probs",
    xFrac: 1.0,
    stage: 11,
    color: "--blue",
    sec: "Sortie",
  },
];

export const EDGES: EdgeDef[] = [
  { from: 0, to: 2, type: "one2one" },
  { from: 1, to: 2, type: "one2one" },
  { from: 2, to: 3, type: "dense" },
  { from: 3, to: 4, type: "dense" },
  { from: 4, to: 5, type: "dense" },
  { from: 4, to: 6, type: "dense" },
  { from: 4, to: 7, type: "dense" },
  { from: 5, to: 8, type: "one2one" },
  { from: 6, to: 8, type: "one2one" },
  { from: 7, to: 8, type: "one2one" },
  { from: 8, to: 9, type: "dense" },
  { from: 9, to: 10, type: "dense" },
  { from: 10, to: 11, type: "dense" },
  { from: 11, to: 12, type: "one2one" },
  { from: 12, to: 13, type: "dense" },
  { from: 13, to: 14, type: "dense" },
  { from: 14, to: 15, type: "dense" },
];

export const RESIDUALS = [
  { from: 3, to: 9, label: "+res₁" },
  { from: 9, to: 13, label: "+res₂" },
];

export const MAX_STAGE = Math.max(...COLS.map((c) => c.stage));
export const DORMANT_ALPHA = 0.06;
export const ANIM_STAGE_DELAY = 180;
export const ANIM_FADE = 250;
export const FWD_DURATION = MAX_STAGE * ANIM_STAGE_DELAY + ANIM_FADE;
export const PAUSE_DURATION = 500;
export const BWD_DURATION = FWD_DURATION;

export const PARTICLE_R = 2;
export const PARTICLE_TRAIL = 3;
export const SHOCKWAVE_PEAK = 0.6;
export const LIGHTNING_BOLTS = 3;
export const LIGHTNING_SEGS = 12;
export const LIGHTNING_REFRESH = 30;

export { HEAD_DIM };

/** Compute neuron positions for all 16 columns. */
export function computePositions(
  w: number,
  h: number,
  sizes: number[],
): NeuronPos[][] {
  const padX = 46;
  const padY = 44;
  const labelH = 32;
  const usableW = w - padX * 2;
  const usableH = h - padY - labelH;

  return COLS.map((col, ci) => {
    const x = padX + col.xFrac * usableW;
    const count = sizes[ci];
    const maxR = count <= 20 ? 6 : count <= 30 ? 4 : 2.5;

    if (col.headGroups) {
      return headGroupPositions({ col, x, count, maxR, padY, usableH });
    }

    const spacing = Math.min(usableH / (count + 1), maxR * 3.5);
    const totalH = spacing * (count - 1);
    const startY = padY + (usableH - totalH) / 2;
    return Array.from({ length: count }, (_, ni) => ({
      x,
      y: startY + ni * spacing,
      r: maxR,
    }));
  });
}

interface HeadGroupOpts {
  col: ColDef;
  x: number;
  count: number;
  maxR: number;
  padY: number;
  usableH: number;
}

function headGroupPositions(opts: HeadGroupOpts): NeuronPos[] {
  const { col, x, count, maxR, padY, usableH } = opts;
  const gs = count / col.headGroups!;
  const sp = maxR * 3;
  const gap = maxR * 5;
  const totalH = (count - 1) * sp + (col.headGroups! - 1) * gap;
  let cy = padY + (usableH - totalH) / 2;
  const res: NeuronPos[] = [];
  for (let g = 0; g < col.headGroups!; g++) {
    for (let gi = 0; gi < gs; gi++) {
      res.push({ x, y: cy, r: maxR });
      cy += sp;
    }
    if (g < col.headGroups! - 1) cy += gap;
  }
  return res;
}
