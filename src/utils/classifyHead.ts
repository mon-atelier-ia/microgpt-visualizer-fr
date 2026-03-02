export type HeadPersonality = "Ancrage" | "Précédent" | "Écho" | "Contexte";

/**
 * Classify an attention head by analyzing its T×T weight matrix.
 * See docs/attention-head-behaviors.md for methodology.
 */
export function classifyHead(matrix: number[][]): HeadPersonality {
  const T = matrix.length;
  if (T <= 1) return "Contexte";

  let bosTotal = 0;
  let selfTotal = 0;
  let prevTotal = 0;
  let nearTotal = 0;
  let count = 0;

  for (let i = 1; i < T; i++) {
    bosTotal += matrix[i][0];
    selfTotal += matrix[i][i];
    prevTotal += matrix[i][i - 1];
    let near = matrix[i][i - 1];
    if (i >= 2) near += matrix[i][i - 2];
    nearTotal += near;
    count++;
  }

  const avgBos = bosTotal / count;
  const avgSelf = selfTotal / count;
  const avgPrev = prevTotal / count;
  const avgNear = nearTotal / count;

  if (avgPrev > 0.45) return "Précédent";
  if (avgBos > 0.25 && avgSelf > 0.15) return "Ancrage";
  if (avgBos > 0.35) return "Ancrage";
  if (avgNear > 0.5 && avgPrev < 0.45) return "Écho";
  if (avgSelf > 0.4) return "Ancrage";
  return "Contexte";
}
