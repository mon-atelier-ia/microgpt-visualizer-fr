# Sidebar + 3 New Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sidebar restructure (9 entries, separators, visited dots) + 3 new pages (Home, Full Model, Conclusion) to the app.

**Architecture:** Extend existing PAGES array in App.tsx with 3 new lazy-loaded page components. Sidebar gets visual separators via CSS class on first item of each block, visited dots via localStorage Set. FullNNDiagram is a new standalone Canvas component ported from playground-full.html with real model data.

**Tech Stack:** React 19, TypeScript strict, Vite 7, Vitest, Canvas 2D, CSS custom properties

---

### Task 1: Sidebar — PAGES array + separators + footer

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Step 1: Update PAGES array and lazy imports**

In `src/App.tsx`, add 3 lazy imports and expand PAGES:

```typescript
const HomePage = lazy(() => import("./pages/HomePage"));
// ... existing 6 lazy imports ...
const FullModelPage = lazy(() => import("./pages/FullModelPage"));
const ConclusionPage = lazy(() => import("./pages/ConclusionPage"));

const PAGES = [
  { id: "home", num: 0, label: "Accueil", sep: false },
  { id: "tokenizer", num: 1, label: "Tokenisation", sep: true },
  { id: "embeddings", num: 2, label: "Plongements (wte/wpe)", sep: false },
  { id: "forward", num: 3, label: "Propagation", sep: false },
  { id: "attention", num: 4, label: "Attention", sep: false },
  { id: "training", num: 5, label: "Entraînement", sep: false },
  { id: "inference", num: 6, label: "Inférence", sep: false },
  { id: "fullmodel", num: 7, label: "Modèle complet", sep: true },
  { id: "conclusion", num: 8, label: "Conclusion", sep: false },
];
```

**Step 2: Change default page to `"home"`**

```typescript
const [page, setPage] = useState("home");
```

**Step 3: Add separator CSS class in nav rendering**

```tsx
{
  PAGES.map((p) => (
    <button
      key={p.id}
      className={`${page === p.id ? "active" : ""} ${p.sep ? "nav-sep" : ""}`}
      onClick={() => handlePageChange(p.id)}
    >
      <span className="num">{p.num}</span>
      <span>{p.label}</span>
    </button>
  ));
}
```

**Step 4: Add page rendering for 3 new pages**

Inside the `<Suspense>` block, add:

```tsx
{
  page === "home" && <HomePage onStart={() => handlePageChange("tokenizer")} />;
}
{
  /* ... existing 6 pages ... */
}
{
  page === "fullmodel" && <FullModelPage />;
}
{
  page === "conclusion" && <ConclusionPage />;
}
```

**Step 5: Shorten footer and remove guide link**

Remove the `<a className="guide-link">` block entirely.

Change community-note to:

```tsx
<div className="community-note">
  Basé sur{" "}
  <a
    href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95"
    target="_blank"
    rel="noopener noreferrer"
  >
    microgpt.py de Karpathy
  </a>
  .
</div>
```

**Step 6: Add separator CSS**

In `src/styles.css`, add after `.sidebar nav button.active .num`:

```css
.sidebar nav button.nav-sep {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
```

**Step 7: Remove `.guide-link` CSS**

Delete the `.guide-link`, `.guide-link:focus-visible`, `.guide-link:hover` rules and their responsive counterparts.

**Step 8: Create stub pages so the app compiles**

Create minimal stubs for `HomePage.tsx`, `FullModelPage.tsx`, `ConclusionPage.tsx` (just a `<PageSection>` with placeholder text) so everything compiles and tests pass.

**Step 9: Run tests**

Run: `pnpm test`
Expected: 133 tests pass (existing tests unaffected).

**Step 10: Commit**

```bash
git add src/App.tsx src/styles.css src/pages/HomePage.tsx src/pages/FullModelPage.tsx src/pages/ConclusionPage.tsx
git commit -m "feat: restructure sidebar with 9 entries, separators, and shortened footer"
```

---

### Task 2: Sidebar — visited dots (localStorage)

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Step 1: Write the failing test**

Create or modify test to verify visited dot appears after page change. In practice, since App.tsx is not directly tested via unit tests (it's integration), we verify via manual + existing tests passing.

**Step 2: Add visited state in App**

```typescript
const [visited, setVisited] = useState<Set<string>>(() => {
  try {
    const saved = localStorage.getItem("microgpt-visited");
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
});
```

**Step 3: Mark page visited on navigation**

In `handlePageChange`:

```typescript
const handlePageChange = (pageId: string) => {
  setPage(pageId);
  setMobileMenuOpen(false);
  setVisited((prev) => {
    if (prev.has(pageId)) return prev;
    const next = new Set(prev);
    next.add(pageId);
    localStorage.setItem("microgpt-visited", JSON.stringify([...next]));
    return next;
  });
};
```

**Step 4: Render dot in nav button**

```tsx
<button
  key={p.id}
  className={`${page === p.id ? "active" : ""} ${p.sep ? "nav-sep" : ""}`}
  onClick={() => handlePageChange(p.id)}
>
  <span className="num">{p.num}</span>
  <span>{p.label}</span>
  {visited.has(p.id) && page !== p.id && (
    <span className="visited-dot" aria-label="déjà visitée" />
  )}
</button>
```

**Step 5: Add visited-dot CSS**

```css
.visited-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  margin-left: auto;
  flex-shrink: 0;
}
```

**Step 6: Run tests**

Run: `pnpm test`
Expected: 133 tests pass.

**Step 7: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add visited page dots with localStorage persistence"
```

---

### Task 3: HomePage (page 0)

**Files:**

- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/HomePage.test.tsx`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("renders the pitch and Commencer button", () => {
    const onStart = vi.fn();
    render(<HomePage onStart={onStart} />);
    expect(screen.getByText(/cerveau artificiel/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /commencer/i })).toBeTruthy();
  });

  it("calls onStart when Commencer is clicked", () => {
    const onStart = vi.fn();
    render(<HomePage onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /commencer/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("displays the 8-step journey overview", () => {
    const onStart = vi.fn();
    render(<HomePage onStart={onStart} />);
    expect(screen.getByText(/tokenisation/i)).toBeTruthy();
    expect(screen.getByText(/inférence/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/HomePage.test.tsx`
Expected: FAIL (stub has no real content yet).

**Step 3: Implement HomePage**

```typescript
import { memo } from "react";
import PageSection from "../components/PageSection";

interface Props {
  onStart: () => void;
}

const STEPS = [
  { num: 1, label: "Tokenisation", desc: "Découper le texte en lettres" },
  { num: 2, label: "Plongements", desc: "Transformer les lettres en vecteurs" },
  { num: 3, label: "Propagation", desc: "Faire circuler l'information" },
  { num: 4, label: "Attention", desc: "Décider quoi regarder" },
  { num: 5, label: "Entraînement", desc: "Apprendre de ses erreurs" },
  { num: 6, label: "Inférence", desc: "Inventer de nouveaux noms" },
  { num: 7, label: "Modèle complet", desc: "Voir toute la machine assemblée" },
  { num: 8, label: "Conclusion", desc: "Comparer avec les vrais GPT" },
];

const HomePage = memo(function HomePage({ onStart }: Props) {
  return (
    <PageSection id="home" title="Bienvenue">
      <div className="home-hero">
        <p className="home-pitch">
          Tu vas construire un <strong>cerveau artificiel</strong> qui invente
          des prénoms. Étape par étape, tu vas comprendre comment fonctionnent
          les modèles comme GPT.
        </p>
        <div className="home-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="home-step">
              <span className="home-step-num">{s.num}</span>
              <div>
                <strong>{s.label}</strong>
                <span className="home-step-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="home-start-btn"
          onClick={onStart}
        >
          Commencer
        </button>
      </div>
    </PageSection>
  );
});

export default HomePage;
```

**Step 4: Add CSS for HomePage**

In `src/styles.css`:

```css
/* HomePage */
.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 0;
}
.home-pitch {
  font-size: 18px;
  line-height: 1.6;
  text-align: center;
  color: var(--text);
}
.home-steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}
.home-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.home-step-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--border);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.home-step strong {
  display: block;
  font-size: 13px;
  color: var(--text);
}
.home-step-desc {
  display: block;
  font-size: 11px;
  color: var(--text-dim);
}
.home-start-btn {
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  background: var(--blue);
  color: var(--bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.home-start-btn:hover {
  opacity: 0.85;
}
.home-start-btn:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
```

**Step 5: Run tests**

Run: `pnpm test src/pages/HomePage.test.tsx`
Expected: 3 tests pass.

**Step 6: Run full suite**

Run: `pnpm test`
Expected: 136 tests pass.

**Step 7: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/styles.css
git commit -m "feat: add HomePage with pitch, 8-step journey, and Commencer button"
```

---

### Task 4: ConclusionPage (page 8)

**Files:**

- Create: `src/pages/ConclusionPage.tsx`
- Create: `src/pages/ConclusionPage.test.tsx`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConclusionPage from "./ConclusionPage";

describe("ConclusionPage", () => {
  it("renders the comparison table with microGPT and LLM columns", () => {
    render(<ConclusionPage />);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText(/notre microgpt/i)).toBeTruthy();
    expect(screen.getByText(/les vrais llm/i)).toBeTruthy();
  });

  it("renders the Aller plus loin section with Karpathy link", () => {
    render(<ConclusionPage />);
    expect(screen.getByText(/aller plus loin/i)).toBeTruthy();
    const link = screen.getByRole("link", { name: /guide officiel/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toContain("karpathy.github.io");
  });

  it("has motivating intro text", () => {
    render(<ConclusionPage />);
    expect(screen.getByText(/fondations/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/ConclusionPage.test.tsx`
Expected: FAIL.

**Step 3: Implement ConclusionPage**

```typescript
import { memo } from "react";
import PageSection from "../components/PageSection";

const ROWS = [
  {
    concept: "Paramètres",
    micro: "4 192",
    real: "des centaines de milliards",
    analogy: "Comme comparer un carnet de notes à toutes les bibliothèques du monde.",
  },
  {
    concept: "Vocabulaire",
    micro: "27 lettres (a-z + ⊕)",
    real: "50 000+ sous-mots (BPE)",
    analogy: "On épelle lettre par lettre ; les vrais LLM lisent des mots entiers.",
  },
  {
    concept: "Couches",
    micro: "1 seule",
    real: "96 et plus",
    analogy: "Un étage vs un gratte-ciel de 96 étages.",
  },
  {
    concept: "Têtes d'attention",
    micro: "4",
    real: "96 et plus",
    analogy: "4 paires d'yeux vs une centaine qui regardent partout en même temps.",
  },
  {
    concept: "Contexte",
    micro: "8 positions",
    real: "128 000+ tokens",
    analogy: "On retient 8 lettres ; GPT retient un livre entier.",
  },
  {
    concept: "Normalisation",
    micro: "aucune",
    real: "LayerNorm, dropout, scheduling",
    analogy: "Comme des garde-fous qui empêchent le modèle de dérailler.",
  },
  {
    concept: "Alignement",
    micro: "aucun",
    real: "RLHF / instruction tuning",
    analogy: "Les vrais LLM apprennent aussi à être polis et utiles.",
  },
  {
    concept: "Infrastructure",
    micro: "ton navigateur",
    real: "clusters de GPU, des mois",
    analogy: "Un vélo vs une fusée — même principe, autre échelle.",
  },
];

const ConclusionPage = memo(function ConclusionPage() {
  return (
    <PageSection id="conclusion" title="8. Conclusion">
      <p className="page-desc">
        Tu as compris les <strong>fondations</strong> : tokenisation, plongements,
        attention, propagation, entraînement et inférence. Les vrais LLM comme
        GPT-5 font exactement la même chose — voici ce que les ingénieurs
        ajoutent par-dessus.
      </p>

      <div className="panel">
        <table className="conclusion-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Notre microGPT</th>
              <th>Les vrais LLM</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.concept}>
                <td className="conclusion-concept">{r.concept}</td>
                <td>{r.micro}</td>
                <td>{r.real}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="conclusion-analogies">
          {ROWS.map((r) => (
            <p key={r.concept} className="conclusion-analogy">
              <strong>{r.concept}</strong> — {r.analogy}
            </p>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Aller plus loin</h2>
        <ul className="conclusion-links">
          <li>
            <a
              href="https://karpathy.github.io/2026/02/12/microgpt/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guide officiel MicroGPT
            </a>{" "}
            — le tutoriel complet d'Andrej Karpathy (en anglais, pour les plus
            motivés)
          </li>
          <li>
            <a
              href="https://github.com/mon-atelier-ia/tuto-llm"
              target="_blank"
              rel="noopener noreferrer"
            >
              tuto-llm
            </a>{" "}
            — cours pédagogique associé (en français)
          </li>
          <li>
            <a
              href="https://github.com/mon-atelier-ia/microgpt-ts-fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              microgpt-ts-fr
            </a>{" "}
            — le code TypeScript de référence pour aller plus loin
          </li>
        </ul>
      </div>
    </PageSection>
  );
});

export default ConclusionPage;
```

**Step 4: Add CSS for ConclusionPage**

```css
/* ConclusionPage */
.conclusion-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.conclusion-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 2px solid var(--border);
  color: var(--text);
  font-weight: 600;
}
.conclusion-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--text-dim);
}
.conclusion-concept {
  color: var(--text);
  font-weight: 600;
}
.conclusion-analogies {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.conclusion-analogy {
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.5;
}
.conclusion-links {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.conclusion-links li {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}
.conclusion-links a {
  color: var(--blue);
  text-decoration: none;
}
.conclusion-links a:hover {
  text-decoration: underline;
}
```

**Step 5: Run tests**

Run: `pnpm test src/pages/ConclusionPage.test.tsx`
Expected: 3 tests pass.

**Step 6: Commit**

```bash
git add src/pages/ConclusionPage.tsx src/pages/ConclusionPage.test.tsx src/styles.css
git commit -m "feat: add ConclusionPage with comparison table and go-further links"
```

---

### Task 5: FullModelPage + FullNNDiagram (page 7)

> This is the largest task. It ports `playground-full.html` into a React Canvas component.

**Files:**

- Create: `src/components/FullNNDiagram.tsx`
- Create: `src/components/FullNNDiagram.test.tsx`
- Create: `src/pages/FullModelPage.tsx`
- Create: `src/pages/FullModelPage.test.tsx`
- Modify: `src/styles.css`

**Step 1: Write the failing tests**

`src/components/FullNNDiagram.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FullNNDiagram from "./FullNNDiagram";

// Minimal props matching ForwardTrace + stateDict shapes
const emptyProps = {
  tokEmb: new Array(16).fill(0),
  posEmb: new Array(16).fill(0),
  combined: new Array(16).fill(0),
  q: new Array(16).fill(0),
  k: new Array(16).fill(0),
  v: new Array(16).fill(0),
  afterAttn: new Array(16).fill(0),
  mlpHidden: new Array(64).fill(0),
  mlpActiveMask: new Array(64).fill(false),
  afterMlp: new Array(16).fill(0),
  logits: new Array(27).fill(0),
  probs: new Array(27).fill(1 / 27),
  attnWeights: Array.from({ length: 4 }, () => new Array(8).fill(0.125)),
  weights: {
    wq: Array.from({ length: 16 }, () => new Array(16).fill(0)),
    wk: Array.from({ length: 16 }, () => new Array(16).fill(0)),
    wv: Array.from({ length: 16 }, () => new Array(16).fill(0)),
    attnWo: Array.from({ length: 16 }, () => new Array(16).fill(0)),
    mlpFc1: Array.from({ length: 16 }, () => new Array(64).fill(0)),
    mlpFc2: Array.from({ length: 64 }, () => new Array(16).fill(0)),
    lmHead: Array.from({ length: 16 }, () => new Array(27).fill(0)),
  },
};

describe("FullNNDiagram", () => {
  it("renders a canvas with role=img and descriptive aria-label", () => {
    render(<FullNNDiagram {...emptyProps} />);
    const canvas = screen.getByRole("img");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.getAttribute("aria-label")).toContain("13 couches");
  });

  it("renders a Rejouer button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /rejouer/i })).toBeTruthy();
  });

  it("renders a backward toggle button", () => {
    render(<FullNNDiagram {...emptyProps} />);
    expect(screen.getByRole("button", { name: /backward/i })).toBeTruthy();
  });
});
```

`src/pages/FullModelPage.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FullModelPage from "./FullModelPage";

vi.mock("../components/FullNNDiagram", () => ({
  default: () => <canvas data-testid="full-nn" role="img" aria-label="mock" />,
}));

describe("FullModelPage", () => {
  it("renders the page title", () => {
    render(<FullModelPage />);
    expect(screen.getByText(/modèle complet/i)).toBeTruthy();
  });

  it("renders the FullNNDiagram canvas", () => {
    render(<FullModelPage />);
    expect(screen.getByTestId("full-nn")).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/components/FullNNDiagram.test.tsx src/pages/FullModelPage.test.tsx`
Expected: FAIL.

**Step 3: Implement FullNNDiagram**

Port from `playground-full.html`. Key structure:

```typescript
import { useRef, useState, useCallback, useEffect } from "react";
import { getCssVar } from "../utils/getCssVar";
import { parseColor } from "../utils/parseColor";

// 13-column layout from playground-full.html
const COLS = [
  {
    n: 16,
    label: "Token\nEmb",
    xFrac: 0.0,
    stage: 0,
    color: "cyan",
    sec: "Embedding",
  },
  {
    n: 16,
    label: "Pos\nEmb",
    xFrac: 0.05,
    stage: 0,
    color: "cyan",
    sec: "Embedding",
  },
  {
    n: 16,
    label: "Add\n+Norm",
    xFrac: 0.125,
    stage: 1,
    color: "text",
    sec: "",
  },
  {
    n: 16,
    label: "Q",
    xFrac: 0.205,
    stage: 2,
    color: "purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "K",
    xFrac: 0.25,
    stage: 2,
    color: "purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "V",
    xFrac: 0.295,
    stage: 2,
    color: "purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "4 Têtes",
    xFrac: 0.375,
    stage: 3,
    color: "purple",
    sec: "Attention",
  },
  {
    n: 16,
    label: "Après\nAttn",
    xFrac: 0.46,
    stage: 4,
    color: "purple",
    sec: "Attention",
  },
  {
    n: 64,
    label: "MLP\n(×4)",
    xFrac: 0.56,
    stage: 5,
    color: "orange",
    sec: "MLP",
  },
  { n: 64, label: "ReLU", xFrac: 0.645, stage: 6, color: "orange", sec: "MLP" },
  {
    n: 16,
    label: "Après\nMLP",
    xFrac: 0.735,
    stage: 7,
    color: "orange",
    sec: "MLP",
  },
  {
    n: 27,
    label: "Logits",
    xFrac: 0.87,
    stage: 8,
    color: "blue",
    sec: "Sortie",
  },
  { n: 27, label: "Probs", xFrac: 1.0, stage: 9, color: "blue", sec: "Sortie" },
];

const RESIDUALS = [
  { from: 2, to: 7, label: "+res₁" },
  { from: 7, to: 10, label: "+res₂" },
];

// ... full implementation ported from playground-full.html
// IntersectionObserver, ResizeObserver, MutationObserver
// Forward animation (180ms/stage), backward optional
// Bézier arcs for residuals + flash effect
// prefers-reduced-motion respected
// Real data from props (never simulated)
```

Props interface — primitive-only (C-4 principle):

```typescript
interface FullNNDiagramProps {
  tokEmb: number[];
  posEmb: number[];
  combined: number[];
  q: number[];
  k: number[];
  v: number[];
  afterAttn: number[];
  mlpHidden: number[];
  mlpActiveMask: boolean[];
  afterMlp: number[];
  logits: number[];
  probs: number[];
  attnWeights: number[][];
  weights: {
    wq: number[][];
    wk: number[][];
    wv: number[][];
    attnWo: number[][];
    mlpFc1: number[][];
    mlpFc2: number[][];
    lmHead: number[][];
  };
}
```

> Note: Full implementation (~800+ lines) will be ported from playground-full.html during execution. The plan provides the architecture and interface; the exact drawing code is a mechanical port.

**Step 4: Implement FullModelPage**

```typescript
import { memo, useMemo } from "react";
import { useModel } from "../modelStore";
import { gptForward } from "../engine/model";
import PageSection from "../components/PageSection";
import FullNNDiagram from "../components/FullNNDiagram";

const FullModelPage = memo(function FullModelPage() {
  const model = useModel();

  const trace = useMemo(
    () => gptForward(model, 0, 0),
    [model, model.totalStep],
  );

  const weights = useMemo(() => ({
    wq: model.stateDict["layer0.attn_wq"],
    wk: model.stateDict["layer0.attn_wk"],
    wv: model.stateDict["layer0.attn_wv"],
    attnWo: model.stateDict["layer0.attn_wo"],
    mlpFc1: model.stateDict["layer0.mlp_fc1"],
    mlpFc2: model.stateDict["layer0.mlp_fc2"],
    lmHead: model.stateDict["lm_head"],
  }), [model, model.totalStep]);

  return (
    <PageSection id="fullmodel" title="7. Modèle complet">
      <p className="page-desc">
        Voici toute la machine assemblée — les 13 couches que tu as explorées
        une par une dans les étapes précédentes.
      </p>
      <div className="full-nn-canvas-wrap">
        <FullNNDiagram
          tokEmb={trace.tokEmb}
          posEmb={trace.posEmb}
          combined={trace.combined}
          q={trace.q}
          k={trace.k}
          v={trace.v}
          afterAttn={trace.afterAttn}
          mlpHidden={trace.mlpHidden}
          mlpActiveMask={trace.mlpActiveMask}
          afterMlp={trace.afterMlp}
          logits={trace.logits}
          probs={trace.probs}
          attnWeights={trace.attnWeights}
          weights={weights}
        />
      </div>
      <div className="full-nn-mobile-msg">
        Pour voir l'architecture complète, utilise un écran plus large (≥768px).
      </div>
    </PageSection>
  );
});

export default FullModelPage;
```

**Step 5: Add CSS**

```css
/* FullModelPage */
.full-nn-canvas-wrap {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px var(--border);
  background: var(--surface2);
}
.full-nn-mobile-msg {
  display: none;
  text-align: center;
  padding: 32px 16px;
  color: var(--text-dim);
  font-size: 14px;
}
@media (max-width: 767px) {
  .full-nn-canvas-wrap {
    display: none;
  }
  .full-nn-mobile-msg {
    display: block;
  }
}
```

**Step 6: Run tests**

Run: `pnpm test`
Expected: All tests pass (133 existing + ~8 new = ~141).

**Step 7: Commit**

```bash
git add src/components/FullNNDiagram.tsx src/components/FullNNDiagram.test.tsx \
        src/pages/FullModelPage.tsx src/pages/FullModelPage.test.tsx src/styles.css
git commit -m "feat: add FullModelPage with 13-column FullNNDiagram spectacle"
```

---

### Task 6: Remove stub pages + final cleanup

**Files:**

- Modify: `src/App.tsx` — remove stubs if any remain, verify all 9 pages render
- Modify: `src/styles.css` — responsive cleanup
- Modify: `README.md` — update page count, test count

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: ~141 tests pass.

**Step 2: Run TypeScript check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

**Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 errors.

**Step 4: Visual verification with Playwright**

Navigate all 9 pages in both dark and light themes. Verify:

- Sidebar shows 9 entries with 2 separators
- Visited dots appear after navigation
- Footer shows shortened text
- HomePage pitch + steps + Commencer button
- FullModelPage Canvas renders 13 columns (desktop only)
- ConclusionPage table + links
- Mobile: hamburger shows all 9 entries

**Step 5: Update README and docs**

- README.md: update feature list, test count
- PLAN.md: mark sections 18-21 as FAIT
- docs/fork-changes.md: add entries for 3 new pages + sidebar

**Step 6: Commit**

```bash
git add -A
git commit -m "docs: update README, PLAN, fork-changes for sections 18-21"
```

**Step 7: Push**

```bash
git push
```
