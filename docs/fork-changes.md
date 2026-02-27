# Fork Changes Registry

> Tracks all divergences from upstream ([enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)). Each entry is commit-linked and justified, to facilitate future PRs or cherry-picks.

## Localization (FR)

| Change                                                              | Commit    | Justification                                                              |
| ------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| All UI strings translated to French (5 pages + sidebar + LossChart) | `19a3d1e` | Target audience: French learners (10-14 ans, programme tuto-llm)           |
| French accents added to all translated text                         | `fd323e8` | Initial translation omitted diacritics — invalid French (modèle vs modele) |
| French typographic conventions (guillemets, etc.)                   | `fd323e8` | Respect des conventions typographiques françaises                          |

## Datasets (planned)

| Change                                                                                     | Commit    | Justification                                                                                       |
| ------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| Dataset selector UI in sidebar                                                             | `efc9b85` | Allow switching between FR/EN datasets without code change                                          |
| French datasets: prénoms-simple (50), prénoms (1000), pokémon-fr (1022), dinosaures (1530) | `135b53e` | FR training data, reused from microgpt-ts-fr. All a-z ASCII only — vocabulary unchanged (27 tokens) |
| `createModel(docs?)` accepts optional docs parameter                                       | `efc9b85` | Minimal engine change (2 lines) to support dataset selection                                        |

## Vocabulaire pédagogique (tooltips + modals)

| Change                                                         | Commit    | Justification                                                                                                                            |
| -------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Glossary data file: 28 terms (15 Tier 1 + 13 Tier 2)           | `bdca1f2` | Tier 1 = tooltip seul, Tier 2 = tooltip + modal "En savoir plus". Définitions adaptées 10-14 ans                                         |
| `<Term>` tooltip + `<TermProvider>` singleton `<dialog>` + CSS | `a433337` | WAI-ARIA tooltip pattern, WCAG 1.4.13 (hoverable, dismissible, persistent), `useId()` pour IDs uniques, flip viewport, bridge `::before` |
| Intégration `<Term id="…" />` dans les 5 pages                 | `d89a5e2` | ~50 remplacements inline (token, BOS, loss, softmax, attention, etc.)                                                                    |
| Tests glossaire (8) + Term component (12) + devDeps            | `8e81c27` | jsdom + @testing-library/react. Co-located tests, 20 assertions                                                                          |

## Infrastructure

| Change                                   | Commit    | Justification                      |
| ---------------------------------------- | --------- | ---------------------------------- |
| ESLint + Husky pre-commit + lint-staged  | `6fad5e0` | Enforce code quality on commit     |
| Vitest + test script in `check` pipeline | `4fe9edd` | Dataset integrity tests (18 tests) |

## Corrections audit Phase 3 — critiques

| Change                                                                                    | Fichier                                                               | Justification                                                                                                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Fix rAF memory leak: `rafRef` + `useEffect` cleanup + `cancelAnimationFrame` in `stop()`  | `TrainingPage.tsx`                                                    | C-6 : `requestAnimationFrame` sans cleanup causait fuite mémoire au démontage pendant entraînement                     |
| Roving tabindex + arrow key navigation + `aria-label` on `<table>` + `:focus-visible` CSS | `Heatmap.tsx`, `styles.css`                                           | W-1 : WCAG 2.1.1 Keyboard — lignes non navigables au clavier. 1 seul tab stop au lieu de 27, navigation Arrow/Home/End |
| `<label htmlFor>` on temperature range input                                              | `InferencePage.tsx`                                                   | W-2 : WCAG 1.3.1 Info & Relationships — `<input type="range">` sans label programmatique                               |
| 15 tests pour les 3 fixes critiques                                                       | `Heatmap.test.tsx`, `TrainingPage.test.tsx`, `InferencePage.test.tsx` | Couverture : rAF cleanup, navigation clavier, label accessible                                                         |

## Corrections audit Phase 3 — haute

| Change                                                                  | Fichier(s)                                                                 | Justification                                                                                                             |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Semantic HTML: `PageSection` component, `<aside>`, `<header>`, `<main>` | `PageSection.tsx`, `App.tsx`, 5 pages                                      | W-3 : WCAG 1.3.1 — landmarks sémantiques pour navigation assistive                                                        |
| Convert `<span onClick>` to `<button>` for gen-names                    | `InferencePage.tsx`, `styles.css`                                          | W-4 : WCAG 2.1.1 Keyboard — éléments cliquables non activables au clavier                                                 |
| ErrorBoundary with French fallback                                      | `ErrorBoundary.tsx`, `App.tsx`                                             | A-2 : crash dans une page faisait tomber toute l'app. Sidebar reste fonctionnelle                                         |
| Extract 30 inline styles → 7 BEM CSS classes                            | `styles.css`, 5 pages, `Heatmap.tsx`                                       | D-1/S-1/D-3 : 47% réduction inline styles. Classes : `.btn-toggle`, `.btn--danger`, `.label-dim`, `.vector-divider`, etc. |
| Stable React keys instead of array index                                | `InferencePage.tsx`, `TrainingPage.tsx`                                    | R-3 : `key={i}` instable → `r.id`, `s.pos`, compound keys                                                                 |
| React.lazy code splitting + Suspense                                    | `App.tsx`                                                                  | R-2 : 5 pages chargées au démarrage → lazy loading, 5+ chunks JS séparés                                                  |
| React.memo on TokenizerPage (only safe candidate)                       | `TokenizerPage.tsx`                                                        | R-1 : seule page sans props. 4 autres bloquées par A-1 (useRef + forceUpdate)                                             |
| 9 tests for haute fixes                                                 | `PageSection.test.tsx`, `ErrorBoundary.test.tsx`, `InferencePage.test.tsx` | Couverture : landmarks, error boundary, buttons accessibles, stable keys                                                  |

## Deployment

| Change                                                                     | Justification                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| Vercel auto-deploy from `main` → https://microgpt-visualizer-fr.vercel.app | Vite static build, Node 24.x, production ready |

## Engine modifications

> `src/engine/` is upstream code, treated as read-only. Exceptions documented here.

| File                  | Change                                                    | Commit    | Justification                                                                                                                                            |
| --------------------- | --------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/model.ts` | `createModel()` → `createModel(docs?)` (1 optional param) | `efc9b85` | Required for dataset selection. Backward-compatible — no param = original behavior. Module-level vocabulary derivation (`uchars`, `vocabSize`) unchanged |
| `src/engine/data.ts`  | No change                                                 | —         | Original NAMES_RAW kept as-is. New datasets live in `src/datasets/`                                                                                      |
