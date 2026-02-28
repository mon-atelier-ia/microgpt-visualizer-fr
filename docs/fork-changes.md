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

| Change                                                                  | Fichier(s)                                                                 | Justification                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Semantic HTML: `PageSection` component, `<aside>`, `<header>`, `<main>` | `PageSection.tsx`, `App.tsx`, 5 pages                                      | W-3 : WCAG 1.3.1 — landmarks sémantiques pour navigation assistive                                                       |
| Convert `<span onClick>` to `<button>` for gen-names                    | `InferencePage.tsx`, `styles.css`                                          | W-4 : WCAG 2.1.1 Keyboard — éléments cliquables non activables au clavier                                                |
| ErrorBoundary with French fallback                                      | `ErrorBoundary.tsx`, `App.tsx`                                             | A-2 : crash dans une page faisait tomber toute l'app. Sidebar reste fonctionnelle                                        |
| Extract 10 inline styles → 7 BEM CSS classes                            | `styles.css`, 5 pages, `Heatmap.tsx`                                       | D-1/S-1/D-3 : ~15% réduction (10 sur 65). Classes : `.btn-toggle`, `.btn--danger`, `.label-dim`, `.vector-divider`, etc. |
| Stable React keys instead of array index                                | `InferencePage.tsx`, `TrainingPage.tsx`                                    | R-3 : `key={i}` instable → `r.id`, `s.pos`, compound keys                                                                |
| React.lazy code splitting + Suspense                                    | `App.tsx`                                                                  | R-2 : 5 pages chargées au démarrage → lazy loading, 5+ chunks JS séparés                                                 |
| React.memo on TokenizerPage (only safe candidate)                       | `TokenizerPage.tsx`                                                        | R-1 : seule page sans props. 4 autres bloquées par A-1 (useRef + forceUpdate)                                            |
| 9 tests for haute fixes                                                 | `PageSection.test.tsx`, `ErrorBoundary.test.tsx`, `InferencePage.test.tsx` | Couverture : landmarks, error boundary, buttons accessibles, stable keys                                                 |

## Corrections audit qualité post-Phase 3

| Change                                                              | Fichier(s)                             | Justification                                                                             |
| ------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| ErrorBoundary: `window.location.reload()` instead of `setState`     | `ErrorBoundary.tsx`                    | L'ancien `setState({hasError:false})` re-rendait l'enfant crashé → re-crash silencieux    |
| ErrorBoundary fallback: extract 3 inline styles to CSS classes      | `ErrorBoundary.tsx`, `styles.css`      | `.error-fallback`, `.error-fallback__title`, `.error-fallback__desc` (BEM)                |
| Suspense fallback: `role="status"` + extract inline styles          | `App.tsx`, `styles.css`                | Accessibilité lecteurs d'écran + `.loading-fallback` CSS class                            |
| `button.gen-name`: add `:hover` state + `transition`                | `styles.css`                           | Feedback visuel au survol manquant (seul `:focus-visible` existait)                       |
| ErrorBoundary test: verify `window.location.reload()` is called     | `ErrorBoundary.test.tsx`               | L'ancien test vérifiait seulement l'existence du bouton, pas son comportement             |
| R-3 test: generate 20 items in 2 waves to verify no key duplication | `InferencePage.test.tsx`               | L'ancien test comptait seulement 10 boutons sans vérifier l'unicité                       |
| Docs: correct false "47% réduction" to actual ~15% (10 sur 65)      | `audit-frontend.md`, `fork-changes.md` | Le chiffre initial était copié du plan sans vérification réelle du comptage inline styles |

## Corrections audit Phase 3 — modérées

| Change                                                           | Fichier(s)                                                                                  | Justification                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-hidden="true"` on 3 decorative SVGs (hamburger, moon, sun) | `App.tsx`                                                                                   | W-5 : SVGs dans boutons avec texte visible — décoratifs, doivent être ignorés par lecteurs d'écran                                                  |
| 9 `:focus-visible` rules for all interactive elements            | `styles.css`                                                                                | W-6 : WCAG 2.4.7 Focus Visible — 6 boutons + `input[text]` + `input[range]` + `.select-native`                                                      |
| Darken `--text-dim` in light theme: `#7a756b` → `#6a655d`        | `styles.css`                                                                                | W-7 : WCAG 1.4.3 Contrast — ratio 3.75:1 → 4.73:1 sur `--surface2`, WCAG AA atteint                                                                 |
| Brighten `--text-dim` in dark theme: `#7d786e` → `#959082`       | `styles.css`                                                                                | W-8 : WCAG 1.4.3 Contrast — ratio 3.28:1 → 4.52:1 sur `--surface2`, WCAG AA atteint                                                                 |
| `useMemo` on expensive computations + fix deps                   | `ForwardPassPage.tsx`, `InferencePage.tsx`                                                  | R-4/R-5 : trace gptForward, top5, top10 mémorisés ; deps corrigées `[tokenId, pos, model, model.totalStep]` ; EmbeddingsPage exclu (calcul trivial) |
| Throttle LossChart canvas redraws with `requestAnimationFrame`   | `LossChart.tsx`                                                                             | P-4 : multiples updates dans la même frame ne déclenchent qu'un seul redraw canvas                                                                  |
| Extract `ProbabilityBar` shared component + 7 tests              | `ProbabilityBar.tsx`, `ProbabilityBar.test.tsx`, `ForwardPassPage.tsx`, `InferencePage.tsx` | D-5 : ~50 lignes JSX dupliquées → composant partagé avec `labelStyle`/`barColor` props                                                              |
| Extract `HeatCell` component for attention weight cells          | `HeatCell.tsx`, `ForwardPassPage.tsx`, `styles.css`                                         | 10 inline styles → `.heat-cell`, `.attn-heads`, `.attn-head-label`, `.attn-head-row` CSS                                                            |
| Extract `NeuronCell` component for MLP activation grid           | `NeuronCell.tsx`, `ForwardPassPage.tsx`                                                     | 9 inline styles → `.neuron-cell`, `.neuron-grid` CSS. Encapsule logique actif/inactif                                                               |
| Extract `LossCell` component for per-position loss               | `LossCell.tsx`, `TrainingPage.tsx`, `styles.css`                                            | 15 inline styles → `.loss-cell`, `.loss-cell__value` CSS. Encapsule calcul intensité                                                                |
| 4 semantic text color utilities + 14 replacements                | `styles.css`, 5 pages                                                                       | `.text-red`, `.text-green`, `.text-cyan`, `.text-dim` — remplace 14 inline `style={{ color }}`                                                      |
| S-3 marked as accepted (won't fix)                               | `audit-frontend.md`                                                                         | S-3 : `valToColor()` fait de l'interpolation RGB runtime — CSS custom properties ne peuvent pas remplacer                                           |

## Refactoring architectural

| Change                                                                  | Fichier(s)                                                                                             | Justification                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Replace `useRef` + `forceUpdate` with `useSyncExternalStore` + `memo()` | `modelStore.ts` (new), `App.tsx`, 4 pages                                                              | A-1 : antipattern couplant toutes les pages. Store externe + `useModel()` hook. `memo()` sur 5 pages.     |
| Extract `ForwardPassPage` into 4 sub-components                         | `FlowDiagram.tsx`, `VectorsPanel.tsx`, `AttentionWeightsPanel.tsx`, `MLPActivationPanel.tsx` (all new) | C-4 : 296 LOC / 8 niveaux JSX → ~120 LOC / 4 niveaux. Sous-composants présentationnels, props primitives. |

## Corrections audit — UX et accessibilité restantes

| Change                                                      | Fichier(s)                  | Justification                                                                                     |
| ----------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| `window.confirm()` before dataset change if `totalStep > 0` | `App.tsx`, `modelStore.ts`  | UX-1 : changement dataset sans confirmation perdait la progression d'entraînement                 |
| `getModelTotalStep()` non-reactive getter                   | `modelStore.ts`             | Getter synchrone pour event handler — évite d'abonner App au store (re-render à chaque trainStep) |
| Keyboard hint `<kbd>↑↓</kbd>` under interactive Heatmap     | `Heatmap.tsx`, `styles.css` | MIN-8 : roving tabindex existait mais aucune indication visuelle pour l'utilisateur               |
| MIN-1 retracted (false positive)                            | `docs/audit-iso.md`         | `lossHistory` muté en place (`.push()`), `.length` est le seul trigger effectif — pas redondant   |

## Visualisation du réseau de neurones

| Change                                                                | Fichier(s)                                | Justification                                                                                                      |
| --------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Architecture spec: full computation graph, 13 layers, weight matrices | `docs/architecture-nn.md`                 | Spécification complète du forward pass pour guider la visualisation (~4 192 paramètres documentés)                 |
| Neural network playground: 5 columns, 4 attention head groups, hover  | `playground.html`                         | Canvas 2D, design system (CSS vars), purple brackets H0–H3, head-aware hover, dark/light themes                    |
| Full 13-column architecture playground                                | `playground-full.html`                    | Fidèle au graphe de calcul complet : 13 colonnes, résidus bézier, section labels, head brackets                    |
| Forward + backward animation                                          | `playground.html`, `playground-full.html` | 3 phases (forward→pause→backward), orange gradient rings, vanishing gradient effect, phase indicator               |
| App design system integration                                         | `playground.html`, `playground-full.html` | CSS custom properties (`--bg`, `--surface`, `--blue`…), `.btn`/`.btn-toggle`, `.explain`, `prefers-reduced-motion` |

## EmbeddingsPage interactive (bar chart + dataset stats)

| Change                                                                       | Fichier(s)                                              | Justification                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `EmbeddingBarChart` component: 16-bar visualization on wte row hover         | `EmbeddingBarChart.tsx`, `EmbeddingBarChart.test.tsx`   | Rend tangibles les 16 dimensions abstraites — survol = bar chart animé (vert positif, rouge négatif)       |
| `charStats` utility: per-character dataset frequency and bigram analysis     | `src/utils/charStats.ts`, `src/utils/charStats.test.ts` | Contextualise chaque lettre : "41/50 prénoms (82%) · Avant : n, i, r · Après : r, l, n"                    |
| Training state badge under wte panel title                                   | `EmbeddingsPage.tsx`                                    | Indique si les embeddings sont aléatoires ou entraînés, renvoie à l'étape 4 pour encourager la progression |
| Side-by-side flex layout (`.heatmap-with-bars`) + responsive stacking <900px | `EmbeddingsPage.tsx`, `styles.css`                      | Utilise l'espace libre à droite de la heatmap (16 colonnes = ~600px). Passe en colonne sur mobile          |
| BOS special message in bar chart                                             | `EmbeddingBarChart.tsx`                                 | "Token spécial — marque le début et la fin de chaque nom." au lieu des stats dataset                       |
| 9 new tests (5 charStats + 4 EmbeddingBarChart)                              | `charStats.test.ts`, `EmbeddingBarChart.test.tsx`       | Couverture : empty state, label+stats, BOS, bar count, frequency, bigrams                                  |
| Bar chart on wpe heatmap hover + `emptyText` prop                            | `EmbeddingsPage.tsx`, `EmbeddingBarChart.tsx`           | Même pattern que wte — survol position = 16 barres. `emptyText` prop pour message contextuel               |
| Interactive position selector (0–15) in combine panel                        | `EmbeddingsPage.tsx`                                    | Remplace `wpe[0]` codé en dur — sélection dynamique synchronise VectorBar + bar chart                      |

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
