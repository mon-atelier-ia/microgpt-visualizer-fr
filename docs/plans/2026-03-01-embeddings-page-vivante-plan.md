# EmbeddingsPage Vivante — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static EmbeddingsPage into an interactive learning experience with a bar chart visualization, dataset context stats, and training state awareness.

**Architecture:** Three independent features layered onto the existing EmbeddingsPage: (1) `charStats.ts` pure utility for dataset analytics, (2) `EmbeddingBarChart.tsx` presentation component for bar visualization + stats, (3) integration in EmbeddingsPage with flex layout and training badge. No changes to Heatmap.tsx or engine code.

**Tech Stack:** React 19, TypeScript, CSS transitions (no keyframes needed — bars use `transition: height`), Vitest + @testing-library/react

---

### Task 1: charStats utility — test

**Files:**

- Create: `src/utils/charStats.ts`
- Create: `src/utils/charStats.test.ts`

**Step 1: Write the failing test**

Create `src/utils/charStats.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { computeCharStats } from "./charStats";

const docs = ["emma", "lea", "pierre", "anna", "lena"];

describe("computeCharStats", () => {
  const stats = computeCharStats(docs);

  it("returns a Map with an entry for each unique char", () => {
    expect(stats).toBeInstanceOf(Map);
    expect(stats.has("e")).toBe(true);
    expect(stats.has("z")).toBe(false);
  });

  it("counts frequency correctly", () => {
    const e = stats.get("e")!;
    // 'e' appears in: emma, lea, pierre, lena = 4/5
    expect(e.nameCount).toBe(4);
    expect(e.totalNames).toBe(5);
  });

  it("computes top followers (bigrams)", () => {
    const e = stats.get("e")!;
    // After 'e': in emma→nothing, lea→nothing(end), pierre→(r,nothing), lena→(n)
    // Actually: e→m (emma), nothing(lea end), e→r (pierre pos2→3), e→(end pierre), e→n (lena)
    // topFollowers should be an array of chars sorted by frequency
    expect(Array.isArray(e.topFollowers)).toBe(true);
    expect(e.topFollowers.length).toBeLessThanOrEqual(3);
  });

  it("handles empty docs", () => {
    const empty = computeCharStats([]);
    expect(empty.size).toBe(0);
  });

  it("computes percentage string", () => {
    const e = stats.get("e")!;
    expect(e.pct).toBe("80%");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/charStats.test.ts`
Expected: FAIL — module `./charStats` not found

**Step 3: Write minimal implementation**

Create `src/utils/charStats.ts`:

```ts
export interface CharStats {
  nameCount: number;
  totalNames: number;
  pct: string;
  topFollowers: string[];
  topPreceders: string[];
}

export function computeCharStats(docs: string[]): Map<string, CharStats> {
  const result = new Map<string, CharStats>();
  if (docs.length === 0) return result;

  const namesWith = new Map<string, Set<number>>();
  const followerCounts = new Map<string, Map<string, number>>();
  const precederCounts = new Map<string, Map<string, number>>();

  docs.forEach((name, nameIdx) => {
    const chars = name.toLowerCase().split("");
    const seen = new Set<string>();
    chars.forEach((ch, i) => {
      // Count names containing this char (deduplicated per name)
      if (!seen.has(ch)) {
        seen.add(ch);
        if (!namesWith.has(ch)) namesWith.set(ch, new Set());
        namesWith.get(ch)!.add(nameIdx);
      }
      // Bigram: what follows this char
      if (i < chars.length - 1) {
        const next = chars[i + 1];
        if (!followerCounts.has(ch)) followerCounts.set(ch, new Map());
        const fc = followerCounts.get(ch)!;
        fc.set(next, (fc.get(next) ?? 0) + 1);
      }
      // Bigram: what precedes this char
      if (i > 0) {
        const prev = chars[i - 1];
        if (!precederCounts.has(ch)) precederCounts.set(ch, new Map());
        const pc = precederCounts.get(ch)!;
        pc.set(prev, (pc.get(prev) ?? 0) + 1);
      }
    });
  });

  const topN = (map: Map<string, number> | undefined, n: number): string[] => {
    if (!map) return [];
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([ch]) => ch);
  };

  for (const [ch, names] of namesWith) {
    result.set(ch, {
      nameCount: names.size,
      totalNames: docs.length,
      pct: `${Math.round((names.size / docs.length) * 100)}%`,
      topFollowers: topN(followerCounts.get(ch), 3),
      topPreceders: topN(precederCounts.get(ch), 3),
    });
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/charStats.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/utils/charStats.ts src/utils/charStats.test.ts
git commit -m "feat: add charStats utility for dataset frequency analysis"
```

---

### Task 2: EmbeddingBarChart component — test + implementation

**Files:**

- Create: `src/components/EmbeddingBarChart.tsx`
- Create: `src/components/EmbeddingBarChart.test.tsx`

**Step 1: Write the failing test**

Create `src/components/EmbeddingBarChart.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import EmbeddingBarChart from "./EmbeddingBarChart";

afterEach(() => cleanup());

describe("EmbeddingBarChart", () => {
  it("shows empty state when values is null", () => {
    render(<EmbeddingBarChart values={null} label={null} charStats={null} />);
    expect(screen.getByText(/survole une lettre/i)).toBeTruthy();
  });

  it("shows bar chart with label when values provided", () => {
    const values = Array.from({ length: 16 }, (_, i) => (i - 8) * 0.1);
    render(
      <EmbeddingBarChart
        values={values}
        label="'e'"
        charStats={{
          nameCount: 42,
          totalNames: 50,
          pct: "84%",
          topFollowers: ["r", "n", "l"],
          topPreceders: ["l", "i", "r"],
        }}
      />,
    );
    expect(screen.getByText(/embedding de 'e'/i)).toBeTruthy();
    expect(screen.getByText(/42\/50/)).toBeTruthy();
  });

  it("shows BOS message for null charStats with BOS label", () => {
    const values = Array.from({ length: 16 }, () => 0.1);
    render(<EmbeddingBarChart values={values} label="BOS" charStats={null} />);
    expect(screen.getByText(/token spécial/i)).toBeTruthy();
  });

  it("renders 16 bars", () => {
    const values = Array.from({ length: 16 }, () => 0.1);
    const { container } = render(
      <EmbeddingBarChart values={values} label="'a'" charStats={null} />,
    );
    const bars = container.querySelectorAll(".barchart-bar");
    expect(bars.length).toBe(16);
  });

  it("renders legend with positif/négatif/zéro", () => {
    const values = Array.from({ length: 16 }, () => 0.1);
    render(<EmbeddingBarChart values={values} label="'a'" charStats={null} />);
    expect(screen.getByText(/positif/i)).toBeTruthy();
    expect(screen.getByText(/négatif/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/EmbeddingBarChart.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/components/EmbeddingBarChart.tsx`:

```tsx
import type { CharStats } from "../utils/charStats";

interface Props {
  values: number[] | null;
  label: string | null;
  charStats: CharStats | null;
}

export default function EmbeddingBarChart({ values, label, charStats }: Props) {
  if (!values || !label) {
    return (
      <div className="barchart-container">
        <div className="barchart-empty">Survole une lettre dans le tableau</div>
      </div>
    );
  }

  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  const isBos = label === "BOS";

  return (
    <div className="barchart-container">
      <div className="barchart-title">
        Embedding de <strong>{label}</strong> — {values.length} dimensions
      </div>
      <div className="barchart-subtitle">
        {isBos ? (
          "Token spécial — marque le début et la fin de chaque nom."
        ) : charStats ? (
          <>
            {charStats.nameCount}/{charStats.totalNames} prénoms (
            {charStats.pct})
            {charStats.topFollowers.length > 0 && (
              <> · Souvent après : {charStats.topFollowers.join(", ")}</>
            )}
          </>
        ) : null}
      </div>
      <div
        className="barchart"
        role="img"
        aria-label={`Barres des ${values.length} dimensions de ${label}`}
      >
        <div className="barchart-zero" />
        {values.map((v, i) => {
          const h = (Math.abs(v) / maxAbs) * 60;
          return (
            <div
              key={i}
              className="barchart-col"
              title={`d${i}: ${v.toFixed(4)}`}
            >
              <div
                className={`barchart-bar ${v >= 0 ? "barchart-bar--pos" : "barchart-bar--neg"}`}
                style={{ height: `${h}px` }}
              />
              <div className="barchart-label">d{i}</div>
            </div>
          );
        })}
      </div>
      <div className="barchart-legend">
        <span className="barchart-legend-item">
          <span className="barchart-legend-dot barchart-legend-dot--pos" />
          positif
        </span>
        <span className="barchart-legend-item">
          <span className="barchart-legend-dot barchart-legend-dot--neg" />
          négatif
        </span>
        <span className="barchart-legend-item">
          <span className="barchart-legend-line" />
          zéro
        </span>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/EmbeddingBarChart.test.tsx`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/EmbeddingBarChart.tsx src/components/EmbeddingBarChart.test.tsx
git commit -m "feat: add EmbeddingBarChart component with stats display"
```

---

### Task 3: CSS for bar chart and layout

**Files:**

- Modify: `src/styles.css` (insert after `.heatmap-wrap` block ~line 448, and in responsive sections)

**Step 1: Add CSS rules**

Insert after line 448 (after `.heatmap-wrap { ... }`):

```css
/* ── Heatmap + bar chart side-by-side layout ── */
.heatmap-with-bars {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.barchart-side {
  flex: 1 1 280px;
  min-width: 240px;
  position: sticky;
  top: 16px;
}

/* ── EmbeddingBarChart ── */
.barchart-container {
  background: var(--surface2);
  border-radius: 8px;
  padding: 12px 16px 8px;
  min-height: 180px;
}
.barchart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
  color: var(--text-dim);
  font-size: 12px;
  font-style: italic;
}
.barchart-title {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 2px;
}
.barchart-title strong {
  color: var(--purple);
  font-size: 13px;
}
.barchart-subtitle {
  font-size: 11px;
  color: var(--text-dim);
  margin-bottom: 8px;
  min-height: 16px;
}
.barchart {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 140px;
  position: relative;
}
.barchart-zero {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--text-dim);
  opacity: 0.4;
  pointer-events: none;
}
.barchart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
  justify-content: center;
}
.barchart-bar {
  width: 100%;
  max-width: 20px;
  border-radius: 3px;
  position: absolute;
  transition:
    height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.3s ease;
}
.barchart-bar--pos {
  bottom: 50%;
  border-radius: 3px 3px 0 0;
  background: #5a9a5e;
}
.barchart-bar--neg {
  top: 50%;
  border-radius: 0 0 3px 3px;
  background: #b06060;
}
.barchart-label {
  position: absolute;
  bottom: 0;
  font-size: 8px;
  color: var(--text-dim);
}
.barchart-legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 10px;
  color: var(--text-dim);
}
.barchart-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.barchart-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.barchart-legend-dot--pos {
  background: #5a9a5e;
}
.barchart-legend-dot--neg {
  background: #b06060;
}
.barchart-legend-line {
  width: 16px;
  height: 1px;
  background: var(--text-dim);
}

/* ── Training badge ── */
.training-badge {
  font-size: 11px;
  color: var(--text-dim);
  background: var(--surface2);
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 8px;
  display: inline-block;
}
```

Add in the `@media (max-width: 900px)` block (~line 1042):

```css
.heatmap-with-bars {
  flex-direction: column;
}
.barchart-side {
  position: static;
  min-width: auto;
}
```

**Step 2: Verify no CSS errors**

Run: `npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: add CSS for EmbeddingBarChart and heatmap-with-bars layout"
```

---

### Task 4: Integrate everything in EmbeddingsPage

**Files:**

- Modify: `src/pages/EmbeddingsPage.tsx`

**Step 1: Update EmbeddingsPage**

Replace `src/pages/EmbeddingsPage.tsx` contents:

```tsx
import { useState, useMemo } from "react";
import { uchars, N_EMBD, BLOCK_SIZE, BOS, charToId } from "../engine/model";
import Heatmap, { VectorBar } from "../components/Heatmap";
import EmbeddingBarChart from "../components/EmbeddingBarChart";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import { useModel } from "../modelStore";
import { computeCharStats } from "../utils/charStats";
import { memo } from "react";

export default memo(function EmbeddingsPage() {
  const model = useModel();
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [selectedChar, setSelectedChar] = useState("e");

  const wte = model.stateDict.wte;
  const wpe = model.stateDict.wpe;
  const wteLabels = [...uchars, "BOS"];
  const wpeLabels = Array.from({ length: BLOCK_SIZE }, (_, i) => `p${i}`);

  const charId = charToId[selectedChar] ?? 0;
  const tokEmb = wte[charId].map((v) => v.data);
  const posEmb = wpe[0].map((v) => v.data);
  const combined = tokEmb.map((t, i) => t + posEmb[i]);

  // Dataset stats (recalculated when dataset changes)
  const charStats = useMemo(() => computeCharStats(model.docs), [model.docs]);

  // Bar chart data for hovered row
  const hoveredValues =
    hoverRow !== null ? wte[hoverRow].map((v) => v.data) : null;
  const hoveredLabel = hoverRow !== null ? wteLabels[hoverRow] : null;
  const hoveredStats =
    hoverRow !== null && hoverRow < uchars.length
      ? (charStats.get(uchars[hoverRow]) ?? null)
      : null; // BOS or unknown → null

  return (
    <PageSection id="embeddings" title="2. Plongements (Embeddings)">
      <p className="page-desc">
        Le modèle représente chaque <Term id="token" /> et chaque position comme
        un <Term id="vecteur" /> de {N_EMBD} nombres — un{" "}
        <Term id="plongement" />. Ces nombres sont les <Term id="parametre" />s
        apprenables du modèle — ils commencent aléatoires et sont ajustés
        pendant l'entraînement.
      </p>

      {/* WTE */}
      <div className="panel">
        <div className="panel-title">wte — Plongements de tokens</div>
        <div className="training-badge">
          {model.totalStep === 0
            ? "Valeurs aléatoires — entraîne le modèle (page 4) pour voir des motifs apparaître"
            : `Entraîné (${model.totalStep} étapes) — les lettres similaires développent des motifs proches`}
        </div>
        <div className="explain">
          {/* ... existing explain text unchanged ... */}
        </div>
        <div className="heatmap-with-bars">
          <div className="heatmap-side">
            <Heatmap
              matrix={wte}
              rowLabels={wteLabels}
              colCount={N_EMBD}
              highlightRow={hoverRow ?? undefined}
              onHoverRow={setHoverRow}
            />
          </div>
          <div className="barchart-side">
            <EmbeddingBarChart
              values={hoveredValues}
              label={hoveredLabel}
              charStats={hoveredStats}
            />
          </div>
        </div>
      </div>

      {/* WPE — unchanged */}
      {/* ... */}

      {/* Comment wte + wpe se combinent — unchanged */}
      {/* ... */}
    </PageSection>
  );
});
```

Key changes vs current file:

- Line 1: add `useMemo` to import
- Line 2: add `BOS` to import (for reference, may not be needed directly)
- New import: `EmbeddingBarChart` and `computeCharStats`
- New `charStats` useMemo on `model.docs`
- New derived state: `hoveredValues`, `hoveredLabel`, `hoveredStats`
- Training badge `<div>` after `.panel-title`
- Wrap Heatmap in `.heatmap-with-bars > .heatmap-side` + `.barchart-side`
- WPE and combine panels: **NO CHANGES** — keep exactly as-is

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS (94 existing + ~10 new = ~104 tests)

**Step 3: Visual verification**

1. Open `http://localhost:5173`, go to page 2 (Plongements)
2. Verify training badge says "Valeurs aléatoires..."
3. Hover row 'e' → bar chart appears with stats
4. Hover row 'a' → bars transition smoothly
5. Hover BOS → "Token spécial" message
6. Leave hover → empty state
7. Go to page 4, train 200 steps, return to page 2
8. Badge now says "Entraîné (200 étapes)..."
9. Resize to < 900px → bar chart moves below heatmap
10. WPE and combine panels unchanged

**Step 4: Commit**

```bash
git add src/pages/EmbeddingsPage.tsx
git commit -m "feat: integrate bar chart, dataset stats, and training badge in EmbeddingsPage"
```

---

### Task 5: Final verification + push

**Step 1: Full test suite**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Build check**

Run: `npx vite build`
Expected: Build succeeds, no warnings

**Step 3: ESLint check**

Run: `npx eslint src/`
Expected: 0 errors, 0 warnings

**Step 4: Push**

```bash
git push
```
