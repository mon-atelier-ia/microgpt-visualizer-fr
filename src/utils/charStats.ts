export interface CharStats {
  nameCount: number;
  totalNames: number;
  pct: string;
  topFollowers: string[];
  topPreceders: string[];
}

export function computeCharStats(docs: string[]): Map<string, CharStats> {
  if (docs.length === 0) return new Map();

  const namesWith = new Map<string, Set<number>>();
  const after = new Map<string, Map<string, number>>();
  const before = new Map<string, Map<string, number>>();

  docs.forEach((name, idx) => {
    const chars = name.toLowerCase().split("");
    const seen = new Set<string>();
    chars.forEach((ch, i) => {
      if (!seen.has(ch)) {
        seen.add(ch);
        if (!namesWith.has(ch)) namesWith.set(ch, new Set());
        namesWith.get(ch)!.add(idx);
      }
      if (i < chars.length - 1) {
        const next = chars[i + 1];
        if (!after.has(ch)) after.set(ch, new Map());
        const fc = after.get(ch)!;
        fc.set(next, (fc.get(next) ?? 0) + 1);
      }
      if (i > 0) {
        const prev = chars[i - 1];
        if (!before.has(ch)) before.set(ch, new Map());
        const pc = before.get(ch)!;
        pc.set(prev, (pc.get(prev) ?? 0) + 1);
      }
    });
  });

  const topN = (m: Map<string, number> | undefined): string[] =>
    m
      ? [...m.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([c]) => c)
      : [];

  const result = new Map<string, CharStats>();
  for (const [ch, names] of namesWith) {
    result.set(ch, {
      nameCount: names.size,
      totalNames: docs.length,
      pct: `${Math.round((names.size / docs.length) * 100)}%`,
      topFollowers: topN(after.get(ch)),
      topPreceders: topN(before.get(ch)),
    });
  }
  return result;
}
