/**
 * Shared linear neuron position computation for NN diagram configs.
 */
interface LinearPositionOpts {
  count: number;
  x: number;
  maxR: number;
  padY: number;
  usableH: number;
}

interface NeuronPos {
  x: number;
  y: number;
  r: number;
}

export function computeLinearPositions(opts: LinearPositionOpts): NeuronPos[] {
  const { count, x, maxR, padY, usableH } = opts;
  const spacing = Math.min(usableH / (count + 1), maxR * 3.5);
  const totalH = spacing * (count - 1);
  const startY = padY + (usableH - totalH) / 2;
  return Array.from({ length: count }, (_, ni) => ({
    x,
    y: startY + ni * spacing,
    r: maxR,
  }));
}
