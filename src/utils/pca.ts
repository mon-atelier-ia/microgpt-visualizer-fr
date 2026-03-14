/** Cosine similarity between two vectors. */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** Return top-K most similar pairs by cosine in original space. */
export function topSimilarPairs(
  embeddings: number[][],
  topK: number,
): [number, number, number][] {
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < embeddings.length; i++)
    for (let j = i + 1; j < embeddings.length; j++)
      pairs.push([i, j, cosineSim(embeddings[i], embeddings[j])]);
  pairs.sort((a, b) => b[2] - a[2]);
  return pairs.slice(0, topK);
}

/** Power iteration: find dominant eigenvector of symmetric matrix. */
function powerIter(mat: number[][]): { vec: number[]; val: number } {
  const d = mat.length;
  let v = Array.from({ length: d }, (_, k) => Math.sin(k + 1));
  const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  v = v.map((x) => x / norm0);

  for (let iter = 0; iter < 100; iter++) {
    const nv = Array(d).fill(0) as number[];
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++) nv[i] += mat[i][j] * v[j];
    const nm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0)) || 1;
    v = nv.map((x) => x / nm);
  }
  const mv = Array(d).fill(0) as number[];
  for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++) mv[i] += mat[i][j] * v[j];
  const eigenval = v.reduce((s, x, i) => s + x * mv[i], 0);
  return { vec: v, val: eigenval };
}

/** Build covariance matrix from centered data. */
function covarianceMatrix(centered: number[][]): number[][] {
  const d = centered[0].length;
  const n = centered.length;
  const cov = Array.from({ length: d }, () => Array(d).fill(0) as number[]);
  for (const row of centered) {
    for (let i = 0; i < d; i++)
      for (let j = i; j < d; j++) cov[i][j] += row[i] * row[j];
  }
  const denom = n > 1 ? n - 1 : 1;
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      cov[i][j] /= denom;
      cov[j][i] = cov[i][j];
    }
  }
  return cov;
}

/**
 * PCA — Project N vectors of dimension D down to 2D.
 * Uses power iteration on the covariance matrix (no external deps).
 */
export function pca2d(data: number[][]): number[][] {
  const n = data.length;
  if (n === 0) return [];
  const d = data[0].length;
  if (n === 1) return [[0, 0]];

  const mean = Array(d).fill(0) as number[];
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;

  const centered = data.map((row) => row.map((v, j) => v - mean[j]));
  const cov = covarianceMatrix(centered);

  const e1 = powerIter(cov);
  const deflated = cov.map((row, i) =>
    row.map((v, j) => v - e1.val * e1.vec[i] * e1.vec[j]),
  );
  const e2 = powerIter(deflated);

  return centered.map((row) => [
    row.reduce((s, v, j) => s + v * e1.vec[j], 0),
    row.reduce((s, v, j) => s + v * e2.vec[j], 0),
  ]);
}
