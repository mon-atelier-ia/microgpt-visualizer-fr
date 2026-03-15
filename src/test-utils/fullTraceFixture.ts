/**
 * Shared trace fixture for FullNNDiagram and FullModelPage tests.
 */
export const EMPTY_TRACE_PROPS = {
  tokEmb: new Array(16).fill(0),
  posEmb: new Array(16).fill(0),
  combined: new Array(16).fill(0),
  afterNorm: new Array(16).fill(0),
  preAttnNorm: new Array(16).fill(0),
  q: new Array(16).fill(0),
  k: new Array(16).fill(0),
  v: new Array(16).fill(0),
  attnWeights: Array.from({ length: 4 }, () => [1.0]),
  afterAttn: new Array(16).fill(0),
  preMlpNorm: new Array(16).fill(0),
  mlpHidden: new Array(64).fill(0),
  mlpActiveMask: new Array(64).fill(false),
  afterMlp: new Array(16).fill(0),
  logits: new Array(27).fill(0),
  probs: new Array(27).fill(1 / 27),
} as const;

/** Mock gptForward that returns EMPTY_TRACE_PROPS as trace */
export function mockGptForward() {
  return {
    logits: Array.from({ length: 27 }, () => ({ data: 0 })),
    trace: {
      tokenId: 0,
      posId: 0,
      ...EMPTY_TRACE_PROPS,
    },
  };
}
