import { describe, it, expect } from "vitest";
import { Value } from "./autograd";
import {
  tokenize,
  tokenLabel,
  BOS,
  vocabSize,
  charToId,
  createModel,
  gptForward,
  softmax,
  trainStep,
  N_EMBD,
  N_LAYER,
} from "./model";

describe("model — smoke tests", () => {
  it("tokenize round-trip: 'ab' → [BOS, id_a, id_b, BOS]", () => {
    const tokens = tokenize("ab");
    expect(tokens).toEqual([BOS, charToId["a"], charToId["b"], BOS]);
    expect(tokens.map(tokenLabel)).toEqual(["BOS", "a", "b", "BOS"]);
  });

  it("softmax sums to ~1.0", () => {
    const logits = [1, 2, 3, 4, 5].map((v) => new Value(v));
    const probs = softmax(logits);
    const sum = probs.reduce((acc, p) => acc + p.data, 0);
    expect(sum).toBeCloseTo(1.0, 6);
    // All probabilities are positive
    probs.forEach((p) => expect(p.data).toBeGreaterThan(0));
  });

  it("createModel produces expected param count (4192)", () => {
    const model = createModel(["abc", "def"]);
    // wte: 27*16 + wpe: 16*16 + lm_head: 27*16
    // + 1 layer * (wq: 16*16 + wk: 16*16 + wv: 16*16 + wo: 16*16 + fc1: 64*16 + fc2: 16*64)
    // = 432 + 256 + 432 + 256 + 256 + 256 + 256 + 1024 + 1024 = 4192
    expect(model.params.length).toBe(4192);
    expect(model.adamM.length).toBe(4192);
    expect(model.adamV.length).toBe(4192);
    expect(model.totalStep).toBe(0);
    expect(model.lossHistory).toEqual([]);
  });

  it("gptForward produces vocabSize logits and valid trace", () => {
    const model = createModel(["test"]);
    const keys = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    const vals = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    const { logits, trace } = gptForward(0, 0, keys, vals, model, true);

    expect(logits).toHaveLength(vocabSize);
    logits.forEach((l) => expect(typeof l.data).toBe("number"));

    // Trace fields
    expect(trace).toBeDefined();
    expect(trace!.tokEmb).toHaveLength(N_EMBD);
    expect(trace!.posEmb).toHaveLength(N_EMBD);
    expect(trace!.probs).toHaveLength(vocabSize);
    // Probs sum to ~1
    const probSum = trace!.probs.reduce((a, b) => a + b, 0);
    expect(probSum).toBeCloseTo(1.0, 4);
  });

  it("trainStep decreases loss over 20 steps", () => {
    const model = createModel(["emma", "anna"]);
    const losses: number[] = [];
    for (let i = 0; i < 20; i++) {
      const result = trainStep(model, 200);
      losses.push(result.loss);
    }
    expect(model.totalStep).toBe(20);
    expect(model.lossHistory).toHaveLength(20);
    // Average of last 5 should be clearly lower than first 5
    const earlyAvg = losses.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const lateAvg = losses.slice(15, 20).reduce((a, b) => a + b, 0) / 5;
    expect(lateAvg).toBeLessThan(earlyAvg);
  });
});
