export interface ColDef {
  n: number;
  label: string;
  xFrac: number;
  stage: number;
  color: string;
  sec: string;
  headGroups?: number;
}

export interface EdgeDef {
  from: number;
  to: number;
  type: "one2one" | "dense";
}

export interface NeuronPos {
  x: number;
  y: number;
  r: number;
}

export interface HoverInfo {
  col: number;
  index: number;
}

export interface FullNNDiagramProps {
  tokEmb: number[];
  posEmb: number[];
  combined: number[];
  afterNorm: number[];
  preAttnNorm: number[];
  q: number[];
  k: number[];
  v: number[];
  attnWeights: number[][];
  afterAttn: number[];
  preMlpNorm: number[];
  mlpHidden: number[];
  mlpActiveMask: boolean[];
  afterMlp: number[];
  logits: number[];
  probs: number[];
}

/** Shared drawing context passed to all renderer functions. */
export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  now: number;
  neurons: NeuronPos[][];
  acts: number[][];
  grads: number[][];
  phase: string;
  elapsed: number;
  fP: (stage: number) => number;
  bP: (stage: number) => number;
  hover: HoverInfo | null;
  // Pre-parsed CSS colors
  bgRgb: number[];
  textRgb: number[];
  greenRgb: number[];
  redRgb: number[];
  orangeRgb: number[];
  purpleRgb: number[];
  colorLookup: Record<string, number[]>;
  // Raw CSS strings
  bgColor: string;
  greenColor: string;
  blueColor: string;
  orangeColor: string;
  textDimColor: string;
}
