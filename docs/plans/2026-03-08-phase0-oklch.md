# Phase 0 — oklch socle commun Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the entire color pipeline to oklch — CSS vars, parseColor, valToColor, hardcoded components — so all colors are perceptually uniform and theme-ready.

**Architecture:** CSS custom properties move from hex to oklch(L C H). `parseColor()` gains oklch→RGB conversion for Canvas 2D API compatibility. `valToColor()` interpolates in oklch space. Three hardcoded-RGB components (HeatCell, NeuronCell, LossCell) switch to CSS vars.

**Tech Stack:** CSS Color Level 4 (oklch), TypeScript, Vitest, Canvas 2D API

---

## Task 1: parseColor — oklch support

**Files:**

- Modify: `src/utils/parseColor.ts`
- Modify: `src/utils/parseColor.test.ts`

### Step 1: Write failing tests for oklch parsing

Add these tests to `src/utils/parseColor.test.ts`:

```typescript
it("parse oklch() basique", () => {
  // oklch(0.7 0.15 150) ≈ sRGB (73, 180, 75)
  const [r, g, b] = parseColor("oklch(0.7 0.15 150)");
  expect(r).toBeGreaterThanOrEqual(60);
  expect(r).toBeLessThanOrEqual(90);
  expect(g).toBeGreaterThanOrEqual(165);
  expect(g).toBeLessThanOrEqual(195);
  expect(b).toBeGreaterThanOrEqual(60);
  expect(b).toBeLessThanOrEqual(90);
});

it("parse oklch() avec espaces variés", () => {
  const [r, g, b] = parseColor("oklch(0.5 0.2 30)");
  // Should produce valid RGB in 0-255 range
  expect(r).toBeGreaterThanOrEqual(0);
  expect(r).toBeLessThanOrEqual(255);
  expect(g).toBeGreaterThanOrEqual(0);
  expect(g).toBeLessThanOrEqual(255);
  expect(b).toBeGreaterThanOrEqual(0);
  expect(b).toBeLessThanOrEqual(255);
});

it("parse oklch() achromatic (C=0)", () => {
  // oklch(0.5 0 0) = pure gray, L=0.5 ≈ sRGB ~110
  const [r, g, b] = parseColor("oklch(0.5 0 0)");
  // All channels should be equal (gray) and near 110
  expect(r).toBe(g);
  expect(g).toBe(b);
  expect(r).toBeGreaterThanOrEqual(95);
  expect(r).toBeLessThanOrEqual(125);
});

it("parse oklch() noir (L=0)", () => {
  expect(parseColor("oklch(0 0 0)")).toEqual([0, 0, 0]);
});

it("parse oklch() blanc (L=1)", () => {
  const [r, g, b] = parseColor("oklch(1 0 0)");
  expect(r).toBe(255);
  expect(g).toBe(255);
  expect(b).toBe(255);
});

it("parse oklch() clamp out-of-gamut", () => {
  // Very high chroma may produce out-of-gamut values — must clamp 0-255
  const [r, g, b] = parseColor("oklch(0.9 0.4 150)");
  expect(r).toBeGreaterThanOrEqual(0);
  expect(r).toBeLessThanOrEqual(255);
  expect(g).toBeGreaterThanOrEqual(0);
  expect(g).toBeLessThanOrEqual(255);
  expect(b).toBeGreaterThanOrEqual(0);
  expect(b).toBeLessThanOrEqual(255);
});
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/utils/parseColor.test.ts`
Expected: FAIL — `parseColor("oklch(...")` falls through to regex, returns wrong values or gray fallback.

### Step 3: Implement oklch→RGB conversion in parseColor

Replace `src/utils/parseColor.ts` with:

```typescript
/**
 * Parse a CSS color string (#hex, rgb(), rgba(), or oklch()) into [r, g, b].
 * oklch values are converted to sRGB and clamped to 0-255.
 */
export function parseColor(c: string): [number, number, number] {
  // #hex (6 digits)
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  // oklch(L C H)
  const oklchMatch = c.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (oklchMatch) {
    return oklchToRgb(
      Number(oklchMatch[1]),
      Number(oklchMatch[2]),
      Number(oklchMatch[3]),
    );
  }

  // rgb() / rgba()
  const m = c.match(/(\d+)/g);
  return m
    ? ([Number(m[0]), Number(m[1]), Number(m[2])] as [number, number, number])
    : [128, 128, 128];
}

/** Convert oklch(L, C, H) to clamped sRGB [r, g, b] (0-255). */
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  // oklch → oklab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // oklab → linear sRGB (via LMS)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [
    clampByte(linearToSrgb(lr)),
    clampByte(linearToSrgb(lg)),
    clampByte(linearToSrgb(lb)),
  ];
}

function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function clampByte(v: number): number {
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/utils/parseColor.test.ts`
Expected: PASS — all 11 tests (5 existing + 6 new).

### Step 5: Commit

```bash
git add src/utils/parseColor.ts src/utils/parseColor.test.ts
git commit -m "feat: add oklch→RGB support to parseColor"
```

---

## Task 2: valToColor — oklch interpolation

**Files:**

- Modify: `src/utils/valToColor.ts`
- Create: `src/utils/valToColor.test.ts`

### Step 1: Write tests for valToColor

Create `src/utils/valToColor.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { valToColor } from "./valToColor";

describe("valToColor", () => {
  const green = [100, 200, 50];
  const red = [200, 50, 50];
  const neutral = [128, 128, 128];

  it("v=0 retourne couleur neutre", () => {
    const result = valToColor(0, 1, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
    // Near-zero → should be close to neutral
    const m = result.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeCloseTo(128, -1);
    expect(Number(m![2])).toBeCloseTo(128, -1);
    expect(Number(m![3])).toBeCloseTo(128, -1);
  });

  it("v=1 retourne couleur verte", () => {
    const result = valToColor(1, 0.8, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
    const m = result.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    expect(m).not.toBeNull();
    // Alpha should be 0.8
    expect(Number(m![4])).toBeCloseTo(0.8);
  });

  it("v=-1 retourne couleur rouge", () => {
    const result = valToColor(-1, 1, green, red, neutral);
    expect(result).toMatch(/^rgba\(/);
  });

  it("clamp v > 1", () => {
    const a = valToColor(1, 1, green, red, neutral);
    const b = valToColor(5, 1, green, red, neutral);
    expect(a).toBe(b);
  });

  it("clamp v < -1", () => {
    const a = valToColor(-1, 1, green, red, neutral);
    const b = valToColor(-5, 1, green, red, neutral);
    expect(a).toBe(b);
  });

  it("alpha is included in output", () => {
    const result = valToColor(0.5, 0.3, green, red, neutral);
    expect(result).toContain(",0.3)");
  });

  it("produces valid RGB values (0-255)", () => {
    // Test a range of values
    for (const v of [-1, -0.5, 0, 0.5, 1]) {
      const result = valToColor(v, 1, green, red, neutral);
      const m = result.match(/rgba\((\d+),(\d+),(\d+)/);
      expect(m).not.toBeNull();
      for (let i = 1; i <= 3; i++) {
        const ch = Number(m![i]);
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});
```

### Step 2: Run tests to verify they pass with current implementation

Run: `npx vitest run src/utils/valToColor.test.ts`
Expected: PASS — current RGB interpolation satisfies the contract.

### Step 3: Rewrite valToColor for oklch interpolation

Replace `src/utils/valToColor.ts` with:

```typescript
/**
 * Map a value in [-1, 1] to an RGBA color string.
 * Negative → redRgb, positive → greenRgb, near-zero → neutralRgb.
 * Interpolates in oklch space for perceptual uniformity.
 */
export function valToColor(
  v: number,
  alpha: number,
  greenRgb: number[],
  redRgb: number[],
  neutralRgb: number[],
): string {
  const t = Math.max(-1, Math.min(1, v));
  const base = t < 0 ? redRgb : greenRgb;
  const a = Math.abs(t);

  const neutralLch = rgbToOklch(neutralRgb[0], neutralRgb[1], neutralRgb[2]);
  const baseLch = rgbToOklch(base[0], base[1], base[2]);

  const L = neutralLch[0] * (1 - a) + baseLch[0] * a;
  const C = neutralLch[1] * (1 - a) + baseLch[1] * a;

  // Hue interpolation: use shorter arc; if neutral is achromatic, take base hue
  let H: number;
  if (neutralLch[1] < 0.001) {
    H = baseLch[2];
  } else if (baseLch[1] < 0.001) {
    H = neutralLch[2];
  } else {
    let diff = baseLch[2] - neutralLch[2];
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    H = neutralLch[2] + diff * a;
  }

  const [r, g, b] = oklchToRgb(L, C, H);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Convert sRGB (0-255) to oklch [L, C, H]. */
function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(a * a + bVal * bVal);
  const H = ((Math.atan2(bVal, a) * 180) / Math.PI + 360) % 360;

  return [L, C, H];
}

/** Convert oklch to clamped sRGB [r, g, b] (0-255). */
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [
    clampByte(linearToSrgb(lr)),
    clampByte(linearToSrgb(lg)),
    clampByte(linearToSrgb(lb)),
  ];
}

function srgbToLinear(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function clampByte(v: number): number {
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/utils/valToColor.test.ts`
Expected: PASS — oklch interpolation produces valid rgba() output matching the contract.

### Step 5: Commit

```bash
git add src/utils/valToColor.ts src/utils/valToColor.test.ts
git commit -m "feat: rewrite valToColor for oklch interpolation"
```

---

## Task 3: Eliminate hardcoded RGB in HeatCell, NeuronCell, LossCell

**Files:**

- Modify: `src/components/HeatCell.tsx`
- Modify: `src/components/NeuronCell.tsx`
- Modify: `src/components/LossCell.tsx`
- Modify: `src/styles.css` (add 3 new CSS vars)

### Step 1: Write failing tests

Create `src/components/HeatCell.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import HeatCell from "./HeatCell";

describe("HeatCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<HeatCell value={0.5} label="test" />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(122/);
  });
});
```

Create `src/components/NeuronCell.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import NeuronCell from "./NeuronCell";

describe("NeuronCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<NeuronCell value={0.5} index={0} />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(158/);
  });
});
```

Create `src/components/LossCell.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import LossCell from "./LossCell";

describe("LossCell", () => {
  it("n'utilise pas de rgba hardcodé", () => {
    const { container } = render(<LossCell loss={2} from="a" to="b" />);
    const el = container.firstElementChild as HTMLElement;
    const bg = el.style.background;
    expect(bg).not.toMatch(/rgba\(247/);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/components/HeatCell.test.tsx src/components/NeuronCell.test.tsx src/components/LossCell.test.tsx`
Expected: FAIL — hardcoded rgba values are still present.

### Step 3: Add CSS custom properties

Add to both `:root` / `[data-theme="dark"]` and `[data-theme="light"]` in `src/styles.css`:

Dark theme (inside `:root, [data-theme="dark"]` block):

```css
--heat-cell-bg: var(--blue);
--neuron-active-bg: var(--green);
--loss-bg: var(--red);
```

Light theme (inside `[data-theme="light"]` block):

```css
--heat-cell-bg: var(--blue);
--neuron-active-bg: var(--green);
--loss-bg: var(--red);
```

### Step 4: Modify HeatCell to use CSS vars

Replace `src/components/HeatCell.tsx`:

```typescript
interface Props {
  value: number;
  label: string;
}

export default function HeatCell({ value, label }: Props) {
  return (
    <div
      className="heat-cell"
      style={{
        background: `color-mix(in oklch, var(--heat-cell-bg) ${Math.round(value * 100)}%, transparent)`,
        color: value > 0.3 ? "#fff" : "var(--text-dim)",
      }}
    >
      {label}
    </div>
  );
}
```

### Step 5: Modify NeuronCell to use CSS vars

Replace `src/components/NeuronCell.tsx`:

```typescript
interface Props {
  value: number;
  index: number;
}

export default function NeuronCell({ value, index }: Props) {
  const active = value > 0;
  return (
    <div
      className="neuron-cell"
      style={{
        background: active
          ? `color-mix(in oklch, var(--neuron-active-bg) ${Math.round(Math.min(1, value * 2) * 100)}%, transparent)`
          : "var(--surface2)",
        color: active ? "#fff" : "var(--text-dim)",
      }}
      title={`neurone ${index} : ${value.toFixed(4)} ${active ? "(actif)" : "(inactif)"}`}
    >
      {active ? "+" : "·"}
    </div>
  );
}
```

### Step 6: Modify LossCell to use CSS vars

Replace `src/components/LossCell.tsx`:

```typescript
interface Props {
  loss: number;
  from: string;
  to: string;
}

export default function LossCell({ loss, from, to }: Props) {
  const intensity = Math.min(1, loss / 4);
  return (
    <div
      className="loss-cell"
      style={{
        background: `color-mix(in oklch, var(--loss-bg) ${Math.round(intensity * 30)}%, transparent)`,
        border: `1px solid color-mix(in oklch, var(--loss-bg) ${Math.round(intensity * 50)}%, transparent)`,
      }}
    >
      <div>
        <span className="text-cyan">{from}</span>
        <span className="text-dim"> → </span>
        <span className="text-green">{to}</span>
      </div>
      <div className="loss-cell__value">loss : {loss.toFixed(3)}</div>
    </div>
  );
}
```

### Step 7: Run tests to verify they pass

Run: `npx vitest run src/components/HeatCell.test.tsx src/components/NeuronCell.test.tsx src/components/LossCell.test.tsx`
Expected: PASS — no more hardcoded rgba values.

### Step 8: Run all tests

Run: `npx vitest run`
Expected: PASS — all 148+ tests pass.

### Step 9: Commit

```bash
git add src/components/HeatCell.tsx src/components/NeuronCell.tsx src/components/LossCell.tsx src/components/HeatCell.test.tsx src/components/NeuronCell.test.tsx src/components/LossCell.test.tsx src/styles.css
git commit -m "refactor: replace hardcoded RGB with CSS vars + color-mix in oklch"
```

---

## Task 4: Migrate 17 CSS vars from hex to oklch

**Files:**

- Modify: `src/styles.css` (lines 1-38)

### Step 1: Verify current visual appearance

Run: `npm run dev`
Open browser, take mental note of dark and light theme appearance.

### Step 2: Convert hex palette to oklch

Replace the two palette blocks in `src/styles.css` (lines 1-38):

```css
/* Dark theme — warm neutral */
:root,
[data-theme="dark"] {
  --bg: oklch(0.14 0.005 90);
  --surface: oklch(0.19 0.005 90);
  --surface2: oklch(0.22 0.005 90);
  --border: oklch(0.28 0.005 90);
  --border-hover: oklch(0.36 0.005 90);
  --text: oklch(0.83 0.015 80);
  --text-dim: oklch(0.65 0.02 80);
  --blue: oklch(0.65 0.1 65);
  --purple: oklch(0.65 0.08 300);
  --cyan: oklch(0.65 0.08 180);
  --green: oklch(0.68 0.1 140);
  --red: oklch(0.6 0.12 25);
  --orange: oklch(0.65 0.12 55);
  --yellow: oklch(0.72 0.1 95);
  --vector-text: oklch(0.2 0.005 90);
  --heat-cell-bg: var(--blue);
  --neuron-active-bg: var(--green);
  --loss-bg: var(--red);
}

/* Light theme — warm paper */
[data-theme="light"] {
  --bg: oklch(0.95 0.01 85);
  --surface: oklch(0.99 0.005 85);
  --surface2: oklch(0.92 0.01 85);
  --border: oklch(0.86 0.01 80);
  --border-hover: oklch(0.76 0.01 80);
  --text: oklch(0.23 0.01 85);
  --text-dim: oklch(0.48 0.015 80);
  --blue: oklch(0.52 0.1 65);
  --purple: oklch(0.48 0.12 300);
  --cyan: oklch(0.52 0.08 180);
  --green: oklch(0.5 0.12 140);
  --red: oklch(0.48 0.12 25);
  --orange: oklch(0.52 0.1 55);
  --yellow: oklch(0.55 0.1 95);
  --vector-text: oklch(0.23 0.01 85);
  --heat-cell-bg: var(--blue);
  --neuron-active-bg: var(--green);
  --loss-bg: var(--red);
}
```

> **IMPORTANT**: These oklch values are starting points derived from the current hex palette. They MUST be visually compared and fine-tuned to match the existing appearance as closely as possible. Use browser DevTools color picker to verify perceptual equivalence. The goal is **parity**, not redesign.

### Step 3: Run build to verify no CSS errors

Run: `npm run build`
Expected: BUILD SUCCESS.

### Step 4: Visual verification

Run: `npm run dev`

- Compare dark theme side-by-side with the hex version (use git stash to toggle)
- Compare light theme
- Check all 9 pages
- Verify Canvas components render correctly (FullNNDiagram, NNDiagram, Heatmap, LossChart, AttnMatrix, PCAScatterPlot)

### Step 5: Run all tests

Run: `npx vitest run`
Expected: PASS — all tests pass.

### Step 6: Commit

```bash
git add src/styles.css
git commit -m "feat: migrate 17 CSS vars from hex to oklch"
```

---

## Task 5: Deduplicate Heatmap's local valToColor

**Files:**

- Modify: `src/components/Heatmap.tsx` (lines 9-24)

### Step 1: Write a test verifying Heatmap uses shared valToColor

This is a refactor — existing Heatmap tests should continue to pass. No new test needed.

### Step 2: Remove local valToColor from Heatmap.tsx

In `src/components/Heatmap.tsx`:

- Remove lines 9-24 (the local `valToColor` function)
- Add import: `import { valToColor } from "../utils/valToColor";`
- Update the two call sites (lines ~117 and ~173) to match the shared function signature:
  - `valToColor(v, scale, negRgb, posRgb, neutralRgb)` → the local version divides by scale internally, the shared version expects pre-normalized v ∈ [-1,1]
  - At line ~117: change `valToColor(val, maxAbs, negRgb, posRgb, neutralRgb)` to `valToColor(maxAbs === 0 ? 0 : val / maxAbs, 1, posRgb, negRgb, neutralRgb)`
  - At line ~173: change `valToColor(v, maxAbs * 0.8, neg, pos, neutral)` to `valToColor(maxAbs === 0 ? 0 : v / (maxAbs * 0.8), 1, pos, neg, neutral)`

> **Note:** The local version uses `rgb()` (no alpha), the shared uses `rgba(,1)`. Both are valid CSS — `rgba(r,g,b,1)` is identical to `rgb(r,g,b)`. Verify visually that the output is the same.

### Step 3: Run Heatmap tests

Run: `npx vitest run src/components/Heatmap.test.tsx`
Expected: PASS.

### Step 4: Run all tests

Run: `npx vitest run`
Expected: PASS.

### Step 5: Commit

```bash
git add src/components/Heatmap.tsx
git commit -m "refactor: use shared valToColor in Heatmap (DRY)"
```

---

## Task 6: WCAG AA contrast verification

**Files:**

- Create: `src/utils/contrast.test.ts`

### Step 1: Write WCAG contrast tests

Create `src/utils/contrast.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseColor } from "./parseColor";

/** Calculate relative luminance per WCAG 2.1. */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate contrast ratio between two colors. */
function contrastRatio(
  c1: [number, number, number],
  c2: [number, number, number],
): number {
  const l1 = relativeLuminance(...c1);
  const l2 = relativeLuminance(...c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA contrast (4.5:1 text, 3:1 large/UI)", () => {
  // These values must match the oklch vars in styles.css after migration.
  // If a test fails, the oklch value must be adjusted — not the test.

  // Dark theme pairs
  const darkBg = parseColor("oklch(0.14 0.005 90)");
  const darkText = parseColor("oklch(0.83 0.015 80)");
  const darkTextDim = parseColor("oklch(0.65 0.02 80)");
  const darkSurface = parseColor("oklch(0.19 0.005 90)");

  it("dark: --text sur --bg >= 4.5:1", () => {
    expect(contrastRatio(darkText, darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark: --text-dim sur --bg >= 3:1", () => {
    expect(contrastRatio(darkTextDim, darkBg)).toBeGreaterThanOrEqual(3);
  });

  it("dark: --text sur --surface >= 4.5:1", () => {
    expect(contrastRatio(darkText, darkSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark: --text-dim sur --surface >= 3:1", () => {
    expect(contrastRatio(darkTextDim, darkSurface)).toBeGreaterThanOrEqual(3);
  });

  // Light theme pairs
  const lightBg = parseColor("oklch(0.95 0.01 85)");
  const lightText = parseColor("oklch(0.23 0.01 85)");
  const lightTextDim = parseColor("oklch(0.48 0.015 80)");
  const lightSurface = parseColor("oklch(0.99 0.005 85)");

  it("light: --text sur --bg >= 4.5:1", () => {
    expect(contrastRatio(lightText, lightBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("light: --text-dim sur --bg >= 3:1", () => {
    expect(contrastRatio(lightTextDim, lightBg)).toBeGreaterThanOrEqual(3);
  });

  it("light: --text sur --surface >= 4.5:1", () => {
    expect(contrastRatio(lightText, lightSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("light: --text-dim sur --surface >= 3:1", () => {
    expect(contrastRatio(lightTextDim, lightSurface)).toBeGreaterThanOrEqual(3);
  });
});
```

### Step 2: Run contrast tests

Run: `npx vitest run src/utils/contrast.test.ts`
Expected: PASS. If any fail, adjust the corresponding oklch value in `src/styles.css` and re-run until all pass.

### Step 3: Run all tests

Run: `npx vitest run`
Expected: PASS — all tests including new contrast tests.

### Step 4: Commit

```bash
git add src/utils/contrast.test.ts
git commit -m "test: add WCAG AA contrast verification for oklch palette"
```

---

## Task 7: Final verification and cleanup

**Files:**

- Possibly: `src/styles.css` (fine-tuning oklch values)

### Step 1: Run full check pipeline

Run: `npm run check`
Expected: eslint OK, tsc OK, vitest PASS, build OK.

### Step 2: Visual smoke test

Run: `npm run dev`

- Toggle dark/light theme on every page
- Verify FullNNDiagram colors (connections, neurons, gradients)
- Verify NNDiagram colors
- Verify Heatmap positive/negative colors
- Verify LossChart lines
- Verify AttnMatrix heatmap
- Verify PCAScatterPlot dots and labels
- Verify HeatCell, NeuronCell, LossCell appearance
- Verify `prefers-reduced-motion` still works

### Step 3: Commit any final adjustments

```bash
git add -A
git commit -m "fix: fine-tune oklch palette after visual review"
```

### Step 4: Update docs

Update in `docs/analyse-effort-changement-theme.md`: mark Phase 0 as FAIT.
Update `PLAN.md` if Phase 0 is tracked there.

```bash
git add docs/
git commit -m "docs: mark Phase 0 oklch migration as complete"
```

---

## Summary

| Task      | Description                    | New tests        | Files modified |
| --------- | ------------------------------ | ---------------- | -------------- |
| 1         | parseColor oklch→RGB           | 6                | 2              |
| 2         | valToColor oklch interpolation | 7                | 2 (1 new)      |
| 3         | Eliminate hardcoded RGB        | 3 (3 new files)  | 6              |
| 4         | Migrate 17 CSS vars to oklch   | 0                | 1              |
| 5         | Deduplicate Heatmap valToColor | 0                | 1              |
| 6         | WCAG AA contrast tests         | 8                | 1 (new)        |
| 7         | Final verification             | 0                | docs           |
| **Total** |                                | **24 new tests** | **~12 files**  |

Expected test count after Phase 0: **148 + 24 = 172 tests**.
