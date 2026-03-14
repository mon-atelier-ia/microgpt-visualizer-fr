// ── NNDiagram constants, types, and pure helpers ─────────────────────

export const N_HEAD = 4;
export const HEAD_DIM = 4;
export const ATTN_COL = 1;
export const ANIM_LAYER_DELAY = 350;
export const ANIM_FADE_DURATION = 300;
export const DORMANT_ALPHA = 0.15;

export const COL_COLORS: string[] = [
  "--cyan", // Embedding
  "--purple", // Attention
  "--orange", // MLP caché
  "--orange", // MLP sortie
  "--blue", // Logits/Probs
];

export const LABELS = [
  "Embedding\n(16)",
  "Attention\n(4×4 têtes)",
  "MLP caché\n(64)",
  "MLP sortie\n(16)",
  "Probabilités",
];

// ── Types ────────────────────────────────────────────────────────────

export interface NeuronPos {
  x: number;
  y: number;
  r: number;
  head?: number;
}

export interface HoverInfo {
  layer: number;
  index: number;
}

export interface NNDiagramProps {
  combined: number[];
  afterAttn: number[];
  mlpHidden: number[];
  mlpActiveMask: boolean[];
  afterMlp: number[];
  probs: number[];
  weights: {
    attnWo: number[][];
    mlpFc1: number[][];
    mlpFc2: number[][];
    lmHead: number[][];
  };
}

// ── Pure helpers ─────────────────────────────────────────────────────

function computeAttnColumn(opts: {
  x: number;
  count: number;
  maxR: number;
  usableH: number;
  padY: number;
}): NeuronPos[] {
  const { x, count, maxR, usableH, padY } = opts;
  const headGap = maxR * 2.5;
  const spacing = Math.min(usableH / (count + N_HEAD), maxR * 3.5);
  const totalH = spacing * (count - 1) + headGap * (N_HEAD - 1);
  const startY = padY + (usableH - totalH) / 2;
  return Array.from({ length: count }, (_, ni) => {
    const headIndex = Math.floor(ni / HEAD_DIM);
    return {
      x,
      y: startY + ni * spacing + headIndex * headGap,
      r: maxR,
      head: headIndex,
    };
  });
}

export function computePositions(
  w: number,
  h: number,
  layers: number[],
): NeuronPos[][] {
  const padX = Math.min(70, w * 0.08);
  const padY = 36;
  const usableW = w - padX * 2;
  const usableH = h - padY * 2 - 30;
  const nLayers = layers.length;

  return layers.map((count, li) => {
    const x = padX + (li / (nLayers - 1)) * usableW;
    const maxR = count <= 20 ? 7 : count <= 30 ? 5 : 3;

    if (li === ATTN_COL) {
      return computeAttnColumn({ x, count, maxR, usableH, padY });
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

export function forwardProgress(layerIndex: number, elapsed: number): number {
  const layerStart = layerIndex * ANIM_LAYER_DELAY;
  return Math.max(0, Math.min(1, (elapsed - layerStart) / ANIM_FADE_DURATION));
}
