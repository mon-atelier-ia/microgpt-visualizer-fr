# microgpt-visualizer-fr — Plan de fork

> Fork francais de [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)
> Appliquant le meme principe que [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) (fork FR de dubzdubz/microgpt-ts)

---

## Contexte : deux visualiseurs microGPT

### enescang/microgpt-visualizer — 5 panels interactifs

- **GitHub** : https://github.com/enescang/microgpt-visualizer
- **Demo live** : https://microgpt.enescang.dev/
- **Stack** : React 19 + TypeScript + Vite (pas de Tailwind — CSS custom pur)
- **Panels** : Tokenizer, Embeddings Heatmap 16D, Forward Pass, Training, Inference
- **Engine** : autograd custom en TypeScript pur (zero dependance ML)
- **Deps runtime** : react + react-dom uniquement (zero librairie UI, zero chart lib)
- **~2 300 lignes** de code source total

### Sjs2332/microGPT_Visualizer — Attention causale multi-tetes

- **GitHub** : https://github.com/Sjs2332/microGPT_Visualizer
- **Demo live** : aucune (localhost:3000 uniquement)
- **Stack** : Next.js + React + TypeScript + Tailwind
- **Hyperparametres** : n_embd=16, n_head=4, n_layer=1, block_size=8, vocab_size=27 (4 064 params)
- **Pipeline** : 3 etapes interactives + sidebar de reference (architecture, autograd, MLP, training, inference)

**Verdict** : enescang est le meilleur candidat pour un fork FR (demo live existante, 5 panels complets, Vite plus simple a deployer).

---

## Comparaison des deux forks

|              | microgpt-ts-fr (fait)                | microgpt-visualizer-fr (a faire)     |
| ------------ | ------------------------------------ | ------------------------------------ |
| **Upstream** | dubzdubz/microgpt-ts                 | enescang/microgpt-visualizer         |
| **Stack**    | Next.js 16 + shadcn/ui + Tailwind v4 | React 19 + Vite + CSS custom         |
| **Nature**   | Playground (training + inference)    | Visualisation pedagogique (5 panels) |
| **Focus**    | Entrainer et generer                 | Comprendre chaque etape              |
| **Deploy**   | Vercel (Next.js natif)               | Vercel (Vite static build)           |

---

## Ce que le fork ajoute

### 1. UI en francais — FAIT

Commits : `19a3d1e`, `fd323e8`

| Page originale | Traduction               |
| -------------- | ------------------------ |
| Tokenizer      | Tokenisation             |
| Embeddings     | Plongements (Embeddings) |
| Forward Pass   | Propagation              |
| Training       | Entraînement             |
| Inference      | Inférence                |

### 2. Datasets FR — FAIT

Commits : `efc9b85`, `135b53e`

| Dataset        | Entrées | Source                  |
| -------------- | ------- | ----------------------- |
| prénoms-simple | 50      | INSEE 2024, top 50      |
| prénoms        | 1 000   | INSEE 2024, top 1000    |
| pokémon-fr     | 1 022   | PokeAPI FR via tuto-llm |
| dinosaures     | 1 522   | Dvelezs94 via tuto-llm  |

Sélecteur de dataset dans la sidebar. Modification minimale de l'engine (`createModel(docs?)`, 2 lignes).

### 3. Vocabulaire pédagogique — FAIT

Commits : `bdca1f2`, `a433337`, `d89a5e2`, `8e81c27`

- **29 termes** définis dans `src/data/glossary.ts` (16 Tier 1 tooltip seul + 13 Tier 2 tooltip + modal)
- Composant `<Term id="…" />` avec tooltip WAI-ARIA (`role="tooltip"`, `aria-describedby`, WCAG 1.4.13)
- `TermProvider` : singleton `<dialog>` natif à la racine (focus trap, Escape, `::backdrop`)
- `useId()` pour IDs uniques par instance, flip viewport, bridge `::before` hoverable
- ~50 remplacements inline dans les 5 pages
- 20 tests (8 glossaire + 12 composant Term) avec jsdom + @testing-library/react
- Définitions adaptées au public 10-14 ans, analogies pédagogiques dans les modals

### 4. Hooks git — FAIT

Commit : `6fad5e0`

- Husky + lint-staged (ESLint au commit)
- Vitest + pipeline `pnpm check` (commit `4fe9edd`)

### 5. Deploy Vercel — FAIT

- **URL production** : https://microgpt-visualizer-fr.vercel.app
- Auto-deploy depuis `main`, build Vite statique, Node 24.x
- Projet Vercel : `microgpt-visualizer-fr` (org `pierrealexandreguillemin-4999`)

### 6. Audit qualité frontend — FAIT

Voir [`docs/audit-frontend.md`](docs/audit-frontend.md) — 37 problèmes répertoriés :

- ~~3 critiques~~ → **corrigés** (rAF cleanup, roving tabindex Heatmap, `<label>` range input) + 15 tests
- ~~8 hauts~~ → **corrigés** (landmarks, buttons a11y, ErrorBoundary, CSS classes, stable keys, lazy/memo) + 9 tests
- ~~7 modérés~~ → **corrigés** (useMemo, focus-visible, contraste, aria-hidden, RAF, ProbabilityBar) + S-3 accepté
- ~~5 faibles~~ → W-8 **corrigé** (contraste dark), R-6/P-6/S-4/D-4 acceptés

---

## Complementarite avec microgpt-ts-fr

```
Parcours eleve :

microgpt-visualizer-fr          microgpt-ts-fr
(comprendre)                    (experimenter)
─────────────────               ──────────────
1. Tokenizer → voir a→0        1. Choisir un dataset
2. Embeddings → heatmap 16D    2. Configurer l'architecture
3. Forward Pass → etape/etape  3. Lancer l'entrainement live
4. Training → loss en temps    4. Generer des noms
   reel + heatmaps
5. Inference → predictions     5. Ajuster temperature/prefix
   token par token
```

Les deux outils couvrent le meme algorithme (microgpt de Karpathy) sous deux angles differents :
**visualisation passive** vs **experimentation active**.

Ensemble, ils forment une paire pedagogique complete pour tuto-llm :

- L'eleve **comprend** avec le visualiseur (chaque etape decomposee)
- L'eleve **experimente** avec le playground (entrainement et generation en temps reel)

---

## Structure du projet (état actuel)

```
src/
├── App.tsx                        # 218 lignes — shell, routing, theme, TermProvider, lazy, ErrorBoundary
├── main.tsx                       #   5 lignes — point d'entrée React
├── styles.css                     # ~1 590 lignes — CSS vars, BEM, 20 utility classes, responsive, sr-only, reduced-motion, barchart
├── data/
│   ├── glossary.ts                # 298 lignes — 29 définitions (Tier 1 + Tier 2)
│   └── glossary.test.ts           #  82 lignes — 8 tests intégrité données
├── datasets/
│   ├── index.ts                   # sélecteur de datasets
│   ├── datasets.test.ts           # 108 lignes — 19 tests intégrité
│   ├── prenoms-simple.ts          # 50 prénoms FR
│   ├── prenoms.ts                 # 1 000 prénoms FR
│   ├── prenoms-insee.ts           # 14 000+ prénoms INSEE
│   ├── pokemon-fr.ts              # 1 022 pokémon FR
│   └── dinosaures.ts              # 1 530 dinosaures
├── components/
│   ├── Term.tsx                   #  88 lignes — tooltip WAI-ARIA + lien modal
│   ├── Term.test.tsx              # 129 lignes — 12 tests composant
│   ├── TermProvider.tsx           #  88 lignes — contexte + singleton <dialog>
│   ├── Heatmap.tsx                # 158 lignes — table heatmap + VectorBar (roving tabindex)
│   ├── Heatmap.test.tsx           # 165 lignes — 10 tests roving tabindex, clavier
│   ├── HeatCell.tsx               #  18 lignes — cellule attention weights
│   ├── NeuronCell.tsx             #  22 lignes — cellule activation MLP
│   ├── LossCell.tsx               #  25 lignes — cellule per-position loss
│   ├── LossChart.tsx              # 142 lignes — courbe de loss Canvas 2D + aria-label dynamique
│   ├── LossChart.test.tsx         #  23 lignes — 2 tests a11y (role="img", aria-label)
│   ├── ProbabilityBar.tsx         #  45 lignes — barres de probabilité partagées
│   ├── ProbabilityBar.test.tsx    #  82 lignes — 7 tests
│   ├── PageSection.tsx            #  20 lignes — DRY landmarks (section + h1)
│   ├── PageSection.test.tsx       #  39 lignes — 3 tests aria-labelledby
│   ├── EmbeddingBarChart.tsx      #  45 lignes — bar chart 16 dimensions au hover wte
│   ├── EmbeddingBarChart.test.tsx #  42 lignes — 4 tests (empty, stats, BOS, bars)
│   ├── ErrorBoundary.tsx          #  40 lignes — class component, French fallback
│   └── ErrorBoundary.test.tsx     #  52 lignes — 3 tests (render, catch, reload)
├── pages/
│   ├── TokenizerPage.tsx          # 162 lignes — mapping char→id, tokenisation
│   ├── TokenizerPage.test.tsx     #  19 lignes — 2 tests a11y (label sr-only)
│   ├── EmbeddingsPage.tsx         # 154 lignes — heatmaps wte/wpe + bar chart + stats
│   ├── ForwardPassPage.tsx        # 297 lignes — pipeline 7 étapes, attention, MLP
│   ├── ForwardPassPage.test.tsx   #  62 lignes — 1 test a11y (select label)
│   ├── TrainingPage.tsx           # 237 lignes — boucle rAF, loss chart
│   ├── TrainingPage.test.tsx      #  37 lignes — 2 tests (rAF cleanup, stop)
│   ├── InferencePage.tsx          # 259 lignes — génération, trace, probas
│   └── InferencePage.test.tsx     #  95 lignes — 6 tests (W-2, W-4, R-3)
├── utils/
│   ├── charStats.ts               #  59 lignes — statistiques dataset (fréquence, bigrammes)
│   └── charStats.test.ts          #  30 lignes — 5 tests
├── engine/                        # 464 lignes — LECTURE SEULE (upstream)
│   ├── autograd.ts                #  98 lignes — classe Value, backward
│   ├── autograd.test.ts           #  48 lignes — 5 tests (arithmétique, backward, diamond)
│   ├── model.ts                   # 338 lignes — GPT complet (+1 param optionnel docs)
│   ├── model.test.ts              #  78 lignes — 5 tests (tokenize, softmax, createModel, forward, train)
│   ├── random.ts                  #  26 lignes — PRNG mulberry32
│   ├── random.test.ts             #  17 lignes — 1 test (déterminisme)
│   └── data.ts                    #   2 lignes — blob noms anglais (upstream)
└── assets/react.svg               # favicon Vite
```

docs/
├── architecture-nn.md # Spécification réseau de neurones (graphe, 13 couches, poids)
├── audit-frontend.md # Audit qualité frontend (37 problèmes)
├── audit-iso.md # Audit ISO (25010, 40500, 9241-110)
└── fork-changes.md # Registre des divergences upstream

playground.html # Visualisation réseau de neurones 5 colonnes, forward+backward animation
playground-full.html # Visualisation réseau de neurones 13 colonnes fidèle architecture

docs/
├── plans/
│ ├── 2026-03-01-embeddings-page-vivante-design.md # Design EmbeddingsPage vivante
│ └── 2026-03-01-embeddings-page-vivante-plan.md # Plan d'implémentation

**Total : ~5 200 lignes src, 31 fichiers source + 18 fichiers test. 104 tests. 2 playgrounds standalone.**

### Constats clés

- **Zero Tailwind** : styling 100% CSS custom (`styles.css`, ~1 500 lignes, CSS vars dark/light)
- **Zero librairie UI** : pas de shadcn, Radix, MUI — `<div>` + classes CSS + `<dialog>` natif
- **Zero librairie chart** : LossChart = Canvas 2D pur, Heatmap = `<table>` HTML
- **Zero routeur** : `useState("tokenizer")` + rendu conditionnel dans App.tsx
- **Zero feature Vite-spécifique** : pas de `import.meta.env`, pas de `?raw`, pas de glob
- **Thème** : hook custom `useTheme()` avec `data-theme` sur `<html>` + `localStorage`, scrollbars thématiques
- **Training** : boucle `requestAnimationFrame` (5 steps/frame), pas de Web Worker
- **Model sharing** : `useSyncExternalStore` dans `modelStore.ts`, hook `useModel()` (A-1 corrigé)
- **Tooltips** : WAI-ARIA compliant, WCAG 1.4.13, flip viewport, bridge hoverable
- **Tests** : Vitest + jsdom + @testing-library/react (94 tests, 16 fichiers)
- **ErrorBoundary** : class component, `window.location.reload()`, sidebar hors boundary
- **Code splitting** : `React.lazy()` + `Suspense` → 5+ chunks JS séparés
- **CSS** : 20 classes utilitaires + BEM + `.sr-only` + `prefers-reduced-motion`. Inline styles réduits de 64 à 7 (dynamiques uniquement)
- **Accessibilité** : WCAG 2.1 AA ~95 %, labels sur tous inputs/selects, `:focus-visible`, `aria-label` canvas

---

## Audit effort migration → Next.js 16 + shadcn/ui + Tailwind v4

### Ce qui facilite la migration

1. **Pas de routeur** a remplacer — juste un `useState`
2. **Zero librairie UI** — pas de conflit avec shadcn/ui
3. **Zero feature Vite** — le bundler est transparent dans le code source
4. **Engine 100% isole** — pur TypeScript math, se copie tel quel
5. **CSS portable** — variables CSS custom compatibles Tailwind

### Effort detaille

| Tache                                              | Effort      | Detail                                               |
| -------------------------------------------------- | ----------- | ---------------------------------------------------- |
| Setup Next.js 16 + Tailwind v4 + shadcn/ui + Biome | Moyen       | Scaffolding, config identique a microgpt-ts-fr       |
| `"use client"` sur pages et composants             | Faible      | Tout utilise useState/useRef/useEffect — 100% client |
| Migrer `styles.css` (391 lignes) → Tailwind v4     | Moyen-eleve | ~50 classes custom → utilitaires Tailwind + CSS vars |
| Remplacer composants custom par shadcn/ui          | Moyen       | `.btn` → Button, `.panel` → Card, sliders → Slider   |
| Heatmap + LossChart (canvas)                       | Faible      | Pas d'equivalent shadcn, restent custom              |
| Theme dark/light                                   | Faible      | `next-themes` remplace le hook custom                |
| `localStorage` SSR guard                           | Faible      | Proteger l'init theme dans useEffect                 |
| Google Analytics                                   | Trivial     | Inline HTML → `next/script`                          |
| Traduction FR des 5 pages                          | Moyen       | ~870 lignes de texte UI                              |
| Datasets FR                                        | Faible      | Deja prets dans microgpt-ts-fr                       |
| AGENTS.md + Husky + Biome                          | Faible      | Copier pattern microgpt-ts-fr                        |

### Verdict

**Migration recommandee.** Effort ~2-3 jours, gain en coherence stack significatif.
Le projet est petit (~5 000 lignes avec tests), le CSS est le gros du travail, l'engine ne bouge pas.

### Stratégie : traduction FR d'abord (sur stack Vite), migration stack ensuite

Phase 1 — Fork FR sur stack Vite existante — **FAIT** :

- ✅ Cloner, créer repo mon-atelier-ia/microgpt-visualizer-fr
- ✅ Traduire UI + intégrer datasets FR
- ✅ Vocabulaire pédagogique (tooltips + modals, 29 termes)
- ✅ Tests (20 assertions)
- ✅ Déployer sur Vercel (https://microgpt-visualizer-fr.vercel.app)

Phase 2 (optionnelle) — Migration stack :

- Migrer vers Next.js 16 + shadcn/ui + Tailwind v4
- Aligner sur la stack microgpt-ts-fr

Phase 3 — Corrections audit ([`docs/audit-frontend.md`](docs/audit-frontend.md)) :

- ✅ 3 critiques corrigés + 15 tests (C-6 rAF leak, W-1 Heatmap clavier, W-2 range label)
- ✅ 8 hauts corrigés + 9 tests (W-3 landmarks, W-4 buttons, A-2 ErrorBoundary, D-1/S-1/D-3 CSS, R-3 keys, R-2 lazy, R-1 memo)
- ✅ Audit qualité post-fix : ErrorBoundary reload réel, hover states, a11y Suspense, docs corrigées
- ✅ 7 modérés corrigés (R-4, R-5, W-5, W-6, W-7, P-4, D-5) + S-3 accepté
- ✅ 4 faibles : W-8 corrigé, R-6/P-6/S-4/D-4 acceptés

### 7. Audit ISO — FAIT

Voir [`docs/audit-iso.md`](docs/audit-iso.md) — audit contre 6 normes ISO :

- ISO/IEC 25010:2023 (Maintenabilité, Sécurité, Performance, Fiabilité)
- ISO/IEC 40500:2012 (WCAG 2.1 AA)
- ISO 9241-110:2020 (Interaction)

Score global : **4,5/5**. 10 findings retirés (inhérents/hors périmètre), 4 a11y corrigés (NEW-1, NEW-4, MIN-3, MIN-4), 11 engine smoke tests ajoutés.

### 8. Phase 4 — roadmap restante

- ✅ A-1 : `useSyncExternalStore` dans `modelStore.ts` + `memo()` sur 5 pages
- ✅ C-4 : Décomposer `ForwardPassPage` en 4 sous-composants (`FlowDiagram`, `VectorsPanel`, `AttentionWeightsPanel`, `MLPActivationPanel`)
- ✅ UX-1 : `window.confirm()` avant changement dataset si `totalStep > 0`
- ✅ MIN-8 : Hint clavier `<kbd>↑↓</kbd>` sous Heatmap interactif
- ✅ MIN-1 : Retiré (faux positif — `.push()` in-place, `.length` = seul trigger)
- ✅ README.md traduit en français (FR principal + EN en `<details>`)

### 9. Visualisation réseau de neurones — FAIT

- ✅ `docs/architecture-nn.md` — spécification complète du réseau (graphe de calcul, 13 colonnes, ~4 192 paramètres)
- ✅ `playground.html` — visualisation 5 colonnes [16, 16, 64, 16, 27], 4 têtes d'attention (H0–H3), hover, dark/light
- ✅ `playground-full.html` — visualisation fidèle 13 colonnes, résidus bézier, section labels
- ✅ Animation forward + backward dans `playground.html` (3 phases : forward→pause→backward, orange gradients)
- ✅ Design system intégré (CSS custom properties, `.btn`, `.explain`, `prefers-reduced-motion`)
- Prochain : intégrer dans l'app React (`ForwardPassPage` + `TrainingPage`) avec données réelles du modèle

### 11. EmbeddingsPage vivante — FAIT

- ✅ `EmbeddingBarChart.tsx` — bar chart interactif (16 barres, vert=positif, rouge=négatif) au survol d'une ligne wte
- ✅ `charStats.ts` — utilitaire pur pour statistiques dataset (fréquence par caractère, top 3 bigrammes avant/après)
- ✅ Statistiques dataset dans le bar chart : "41/50 prénoms (82%) · Avant : n, i, r · Après : r, l, n"
- ✅ Badge entraînement : "Valeurs aléatoires — reviens après avoir entraîné le modèle à l'étape 4…"
- ✅ Message spécial BOS : "Token spécial — marque le début et la fin de chaque nom."
- ✅ Layout flex side-by-side (`heatmap-with-bars`), responsive column <900px
- ✅ Couleurs thème : `var(--green)`, `var(--red)`, `var(--purple)` (dark + light)
- ✅ 9 nouveaux tests (5 charStats + 4 EmbeddingBarChart)
- ✅ Design doc : `docs/plans/2026-03-01-embeddings-page-vivante-design.md`

### 12. Page Attention — à faire

Constats et exigences pour la future page dédiée à l'attention :

1. **Page Propagation actuelle** : l'attention affiche `[1.0]` car un seul token → `softmax([x]) = [1.0]` = résultat trivial, pas un bug
2. **Page dédiée Attention** avec séquence complète (boucle multi-token comme `trainStep`), matrice d'attention par tête (4 têtes × T×T), visualisation Q/K/V, masque causal
3. **Prototype playground** — pas un lien externe, mais une **implémentation** Canvas 2D animé intégrée dans la page React (style validé de `playground.html` : neurones, connexions, forward/backward, thème dark/light)
4. **Données dynamiques du modèle** — zéro donnée hardcodée, tout provient de `gptForward()` via `useModel()` (même pattern que les 5 pages existantes)
5. **Cohérence inter-pages** — les données traversent les pages de façon pédagogique (tokenisation → plongements → propagation → attention → entraînement → inférence)
6. **Engine read-only** sauf obligation absolue — la boucle multi-token se fait côté page (pas dans l'engine), en réutilisant le pattern KV cache de `trainStep` (model.ts:242-261)
7. **Ref** : "Attention Is All You Need" (Vaswani et al. 2017) — la page doit rendre tangible le mécanisme d'attention pour le public 10-14 ans

Données disponibles dans `ForwardTrace` : `q` (number[16]), `k` (number[16]), `v` (number[16]), `attnWeights` (number[4][T]) par position. Avec N_HEAD=4 et HEAD_DIM=4, chaque tête opère sur 4 dimensions.

### 10. Polish CSS — FAIT

- ✅ Scrollbars thématiques (webkit + standard `scrollbar-color`) — `86ef089`
- ✅ Lisibilité petits textes : font-sizes augmentées (vector-cell 8→10px, heatmap 9→10/11px, flow 9→10/11px, heat-cell 8→10px) — `86ef089`
- ✅ Extraction 24 inline styles statiques → 20 classes CSS utilitaires — `b0b3ad9`
- 7 inline styles dynamiques conservés (couleurs/opacité calculés au runtime)
- 3 `!important` légitimes (1 `.row-label` override inline, 2 `prefers-reduced-motion`)

---

## References

- [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer) — upstream
- [Demo live upstream](https://microgpt.enescang.dev/)
- [Sjs2332/microGPT_Visualizer](https://github.com/Sjs2332/microGPT_Visualizer) — projet alternatif (pas de demo)
- [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) — fork FR de reference
- [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — Andrej Karpathy
- [tuto-llm](https://github.com/mon-atelier-ia/tuto-llm) — cours pedagogique associe
