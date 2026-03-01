/**
 * Investigate attention head personalities across multiple training runs.
 * Does NOT modify engine files — rebuilds ModelState with different seeds.
 *
 * Usage: npx tsx scripts/investigate-heads.ts
 */
import { Value } from "../src/engine/autograd";
import { createRng, gaussRandom, shuffle } from "../src/engine/random";
import { NAMES_RAW } from "../src/engine/data";
import {
  gptForward,
  trainStep,
  tokenize,
  tokenLabel,
  N_EMBD,
  N_HEAD,
  N_LAYER,
  BLOCK_SIZE,
  vocabSize,
} from "../src/engine/model";
import type { ModelState, ForwardTrace } from "../src/engine/model";

// ── Replicate makeMatrix (not exported from engine) ──
function makeMatrix(
  nout: number,
  nin: number,
  rng: () => number,
  std = 0.08,
): Value[][] {
  return Array.from({ length: nout }, () =>
    Array.from({ length: nin }, () => new Value(gaussRandom(rng) * std)),
  );
}

// ── Replicate createModel with custom seed ──
function createModelWithSeed(seed: number): ModelState {
  const allDocs = NAMES_RAW.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rng = createRng(seed);
  const docs = [...allDocs];
  shuffle(docs, rng);

  const stateDict: Record<string, Value[][]> = {
    wte: makeMatrix(vocabSize, N_EMBD, rng),
    wpe: makeMatrix(BLOCK_SIZE, N_EMBD, rng),
    lm_head: makeMatrix(vocabSize, N_EMBD, rng),
  };
  for (let i = 0; i < N_LAYER; i++) {
    stateDict[`layer${i}.attn_wq`] = makeMatrix(N_EMBD, N_EMBD, rng);
    stateDict[`layer${i}.attn_wk`] = makeMatrix(N_EMBD, N_EMBD, rng);
    stateDict[`layer${i}.attn_wv`] = makeMatrix(N_EMBD, N_EMBD, rng);
    stateDict[`layer${i}.attn_wo`] = makeMatrix(N_EMBD, N_EMBD, rng);
    stateDict[`layer${i}.mlp_fc1`] = makeMatrix(4 * N_EMBD, N_EMBD, rng);
    stateDict[`layer${i}.mlp_fc2`] = makeMatrix(N_EMBD, 4 * N_EMBD, rng);
  }

  const params: Value[] = [];
  for (const key of Object.keys(stateDict)) {
    for (const row of stateDict[key]) {
      for (const p of row) params.push(p);
    }
  }

  return {
    stateDict,
    params,
    adamM: new Float64Array(params.length),
    adamV: new Float64Array(params.length),
    totalStep: 0,
    lossHistory: [],
    docs,
    rng,
  };
}

// ── Extract attention matrices for a name ──
function extractAttn(
  name: string,
  model: ModelState,
): { matrices: number[][][]; labels: string[] } {
  const tokens = tokenize(name);
  const n = Math.min(BLOCK_SIZE, tokens.length - 1);
  const keys: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const vals: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const traces: ForwardTrace[] = [];

  for (let pos = 0; pos < n; pos++) {
    const { trace } = gptForward(tokens[pos], pos, keys, vals, model, true);
    traces.push(trace!);
  }

  // Build T×T matrix per head
  const matrices: number[][][] = [];
  for (let h = 0; h < N_HEAD; h++) {
    const mat: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = new Array(n).fill(0);
      const weights = traces[i].attnWeights[h];
      for (let j = 0; j < weights.length; j++) row[j] = weights[j];
      mat.push(row);
    }
    matrices.push(mat);
  }

  const labels = tokens.slice(0, n).map((id) => tokenLabel(id));
  return { matrices, labels };
}

// ── Head classifier (the util we're building) ──
type HeadPersonality =
  | "Ancrage"
  | "Précédent"
  | "Écho"
  | "Contexte"
  | "Inconnu";

function classifyHead(matrix: number[][]): {
  personality: HeadPersonality;
  scores: Record<string, number>;
} {
  const T = matrix.length;
  if (T <= 1) return { personality: "Inconnu", scores: {} };

  let bosTotal = 0;
  let selfTotal = 0;
  let prevTotal = 0;
  let nearTotal = 0; // j in [i-2, i-1] but not self
  let entropy = 0;
  let count = 0;

  for (let i = 1; i < T; i++) {
    bosTotal += matrix[i][0];
    selfTotal += matrix[i][i];
    if (i >= 1) prevTotal += matrix[i][i - 1];
    // Near = i-1 and i-2 (not self)
    let near = matrix[i][i - 1];
    if (i >= 2) near += matrix[i][i - 2];
    nearTotal += near;
    // Shannon entropy
    let h = 0;
    for (let j = 0; j <= i; j++) {
      const w = matrix[i][j];
      if (w > 1e-9) h -= w * Math.log2(w);
    }
    entropy += h;
    count++;
  }

  const avgBos = bosTotal / count;
  const avgSelf = selfTotal / count;
  const avgPrev = prevTotal / count;
  const avgNear = nearTotal / count;
  const avgEntropy = entropy / count;

  const scores = {
    bos: +avgBos.toFixed(3),
    self: +avgSelf.toFixed(3),
    prev: +avgPrev.toFixed(3),
    near: +avgNear.toFixed(3),
    entropy: +avgEntropy.toFixed(3),
  };

  // Classification heuristics (order matters)
  if (avgPrev > 0.45) return { personality: "Précédent", scores };
  if (avgBos > 0.25 && avgSelf > 0.15)
    return { personality: "Ancrage", scores };
  if (avgBos > 0.35) return { personality: "Ancrage", scores };
  if (avgNear > 0.5 && avgPrev < 0.45) return { personality: "Écho", scores };
  if (avgEntropy > 1.2) return { personality: "Contexte", scores };
  if (avgSelf > 0.4) return { personality: "Ancrage", scores };

  return { personality: "Inconnu", scores };
}

// ── Main ──
const SEEDS = [42, 123, 7, 2024, 999, 314, 1, 55, 8080, 31337];
const TEST_NAMES_LONG = [
  "elizabeth",
  "alexandra",
  "matthieu",
  "charlotte",
  "benjamin",
  "catherine",
  "maximilien",
];
const TEST_NAMES_SHORT = ["emma", "leo", "ali", "hugo", "lea", "tom", "ana"];
const TRAIN_STEPS = 1000;

console.log(`\n${"═".repeat(70)}`);
console.log(
  `  Investigating head personalities across ${SEEDS.length} training runs`,
);
console.log(`  ${TRAIN_STEPS} training steps each`);
console.log(`  Short names: ${TEST_NAMES_SHORT.join(", ")}`);
console.log(`  Long names:  ${TEST_NAMES_LONG.join(", ")}`);
console.log(`${"═".repeat(70)}\n`);

function runAnalysis(testNames: string[], label: string) {
  const allResults: Record<HeadPersonality, number> = {
    Ancrage: 0,
    Précédent: 0,
    Écho: 0,
    Contexte: 0,
    Inconnu: 0,
  };

  console.log(`\n╔${"═".repeat(68)}╗`);
  console.log(`║  ${label.padEnd(66)}║`);
  console.log(`╚${"═".repeat(68)}╝\n`);

  for (const seed of SEEDS) {
    const model = createModelWithSeed(seed);
    for (let step = 0; step < TRAIN_STEPS; step++)
      trainStep(model, TRAIN_STEPS);

    console.log(
      `── Seed ${seed} (loss: ${model.lossHistory[model.lossHistory.length - 1]?.toFixed(3)}) ──`,
    );

    const headVotes: HeadPersonality[][] = Array.from(
      { length: N_HEAD },
      () => [],
    );
    for (const name of testNames) {
      const { matrices } = extractAttn(name, model);
      for (let h = 0; h < N_HEAD; h++) {
        const { personality } = classifyHead(matrices[h]);
        headVotes[h].push(personality);
      }
    }

    for (let h = 0; h < N_HEAD; h++) {
      const counts: Record<string, number> = {};
      for (const v of headVotes[h]) counts[v] = (counts[v] || 0) + 1;
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const pct = ((winner[1] / testNames.length) * 100).toFixed(0);
      console.log(`  Head ${h}: ${winner[0]} (${pct}%)`);
      allResults[winner[0] as HeadPersonality]++;
    }

    // Detail on first test name
    const { matrices } = extractAttn(testNames[0], model);
    console.log(`  Detail (${testNames[0]}):`);
    for (let h = 0; h < N_HEAD; h++) {
      const { personality, scores } = classifyHead(matrices[h]);
      console.log(
        `    H${h} ${personality}: bos=${scores.bos} self=${scores.self} prev=${scores.prev} ent=${scores.entropy}`,
      );
    }
    console.log();
  }

  console.log(`  SUMMARY ${label}:`);
  const total = SEEDS.length * N_HEAD;
  for (const [name, count] of Object.entries(allResults).sort(
    (a, b) => b[1] - a[1],
  )) {
    if (count > 0) {
      const bar = "█".repeat(Math.round((count / total) * 40));
      console.log(
        `  ${name.padEnd(12)} ${String(count).padStart(3)}/${total}  ${((count / total) * 100).toFixed(1)}%  ${bar}`,
      );
    }
  }
}

runAnalysis(TEST_NAMES_SHORT, "NOMS COURTS (3-4 lettres)");
runAnalysis(TEST_NAMES_LONG, "NOMS LONGS (>6 lettres)");
console.log();
