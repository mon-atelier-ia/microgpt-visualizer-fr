# microgpt-visualizer-fr — Plan de fork

> Fork francais de [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)
> Appliquant le meme principe que [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) (fork FR de dubzdubz/microgpt-ts)

---

## Contexte : deux visualiseurs microGPT

### enescang/microgpt-visualizer — 6 panels interactifs (5 upstream + Attention)

- **GitHub** : https://github.com/enescang/microgpt-visualizer
- **Demo live** : https://microgpt.enescang.dev/
- **Stack** : React 19 + TypeScript + Vite (pas de Tailwind — CSS custom pur)
- **Panels** : Tokenizer, Embeddings Heatmap 16D, Forward Pass, Attention, Training, Inference
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
| **Nature**   | Playground (training + inference)    | Visualisation pedagogique (6 panels) |
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
| _(new)_        | Attention                |
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

- **30 termes** définis dans `src/data/glossary.ts` (16 Tier 1 tooltip seul + 14 Tier 2 tooltip + modal)
- Composant `<Term id="…" />` avec tooltip WAI-ARIA (`role="tooltip"`, `aria-describedby`, WCAG 1.4.13)
- `TermProvider` : singleton `<dialog>` natif à la racine (focus trap, Escape, `::backdrop`)
- `useId()` pour IDs uniques par instance, flip viewport, bridge `::before` hoverable
- ~50 remplacements inline dans les 6 pages
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
4. Attention → matrices T×T    4. Generer des noms
5. Training → loss en temps    5. Ajuster temperature/prefix
   reel + heatmaps
6. Inference → predictions
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
├── App.tsx                        # 251 lignes — shell, routing, theme, TermProvider, lazy, ErrorBoundary
├── main.tsx                       #   5 lignes — point d'entrée React
├── modelStore.ts                  #  76 lignes — useSyncExternalStore + useModel() hook + wteSnapshots (A-1)
├── modelStore.test.ts             # 107 lignes — 8 tests (useModel shape, reset, dataset switch, notify, unsubscribe, getModelTotalStep, wteSnapshot deep-copy, reset clears)
├── styles.css                     # ~1 908 lignes — CSS vars, BEM, 20 utility classes, responsive, sr-only, reduced-motion, barchart, attn-matrix, bv-*, pca-canvas-wrap
├── data/
│   ├── glossary.ts                # 314 lignes — 30 définitions (Tier 1 + Tier 2)
│   └── glossary.test.ts           # 121 lignes — 8 tests intégrité données
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
│   ├── AttnMatrix.tsx             #  71 lignes — matrice attention T×T (table sémantique, compact)
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
│   ├── BertVizView.tsx            # 187 lignes — SVG Bézier token↔token (composant contrôlé)
│   ├── EmbeddingBarChart.tsx      #  45 lignes — bar chart 16 dimensions au hover wte
│   ├── EmbeddingBarChart.test.tsx #  42 lignes — 4 tests (empty, stats, BOS, bars)
│   ├── ErrorBoundary.tsx          #  40 lignes — class component, French fallback
│   ├── ErrorBoundary.test.tsx     #  52 lignes — 3 tests (render, catch, reload)
│   ├── FlowDiagram.tsx            # 123 lignes — sous-composant ForwardPassPage (C-4)
│   ├── VectorsPanel.tsx           #  41 lignes — sous-composant ForwardPassPage (C-4)
│   ├── NNDiagram.tsx              # ~300 lignes — Canvas 2D réseau de neurones interactif (section 16)
│   ├── NNDiagram.test.tsx         #  40 lignes — 2 tests (canvas role/aria-label, bouton Rejouer)
│   ├── PCAScatterPlot.tsx         # 641 lignes — Canvas 2D scatter plot PCA wte (section 17)
│   └── MLPActivationPanel.tsx     #  46 lignes — sous-composant ForwardPassPage (C-4)
├── pages/
│   ├── TokenizerPage.tsx          # 162 lignes — mapping char→id, tokenisation
│   ├── TokenizerPage.test.tsx     #  19 lignes — 2 tests a11y (label sr-only)
│   ├── EmbeddingsPage.tsx         # 251 lignes — heatmaps wte/wpe + bar chart + stats + PCA scatter plot
│   ├── EmbeddingsPage.test.tsx    #  68 lignes — 4 tests (PCA canvas, wrap, hover bidirectionnel, training badge)
│   ├── ForwardPassPage.tsx        # 136 lignes — pipeline 7 étapes, délègue à 4 sous-composants (C-4)
│   ├── ForwardPassPage.test.tsx   #  89 lignes — 3 tests (26 token buttons, 16 position buttons, canvas NN)
│   ├── AttentionPage.tsx          # 397 lignes — 6 panneaux attention multi-token + BertViz deux-panneaux
│   ├── TrainingPage.tsx           # 237 lignes — boucle rAF, loss chart
│   ├── TrainingPage.test.tsx      #  37 lignes — 2 tests (rAF cleanup, stop)
│   ├── InferencePage.tsx          # 259 lignes — génération, trace, probas
│   └── InferencePage.test.tsx     #  95 lignes — 6 tests (W-2, W-4, R-3)
├── utils/
│   ├── charStats.ts               #  59 lignes — statistiques dataset (fréquence, bigrammes)
│   ├── charStats.test.ts          #  30 lignes — 5 tests
│   ├── classifyHead.ts            #  38 lignes — classifieur heuristique personnalités de têtes
│   ├── classifyHead.test.ts       #  55 lignes — 4 tests (T=1, Précédent, Ancrage, Contexte)
│   ├── headExplanation.tsx        #  37 lignes — phrases explicatives FR par personnalité
│   ├── pca.ts                     #  96 lignes — PCA 2D (centrage, covariance, vecteurs propres)
│   ├── pca.test.ts                #  76 lignes — 6 tests (identité, corrélation, forme sortie, taille, ≥2 lignes, vide)
│   ├── parseColor.ts              #  15 lignes — parse hex/rgb/rgba → [r,g,b]
│   └── parseColor.test.ts         #  25 lignes — 5 tests (hex6, rgb, rgba, hex3, fallback)
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
playground-complete.html # Démo complète : vrai autograd+Adam, tokenisation→entraînement→inférence
playground-attention.html # Prototype attention animé (Q·K, softmax, V) — remplacé par BertViz
playground-bertviz.html # Visualisation BertViz — lignes token↔token, classifieur dynamique de têtes
playground-pca.html # Prototype PCA scatter plot (points colorés, constellation, animation)

scripts/
└── investigate-heads.ts # Investigation empirique des personnalités de têtes (10 seeds × 1000 steps)

docs/
├── plans/
│ ├── 2026-03-01-embeddings-page-vivante-design.md # Design EmbeddingsPage vivante
│ ├── 2026-03-01-embeddings-page-vivante-plan.md # Plan d'implémentation
│ └── 2026-03-03-pca-embeddings.md # Plan PCA scatter plot (8 tasks)

**Total : ~6 900 lignes src (hors data blobs), 44 fichiers source + 24 fichiers test. 133 tests. 6 playgrounds standalone.**

### Constats clés

- **Zero Tailwind** : styling 100% CSS custom (`styles.css`, ~1 500 lignes, CSS vars dark/light)
- **Zero librairie UI** : pas de shadcn, Radix, MUI — `<div>` + classes CSS + `<dialog>` natif
- **Zero librairie chart** : LossChart = Canvas 2D pur, Heatmap = `<table>` HTML
- **Zero routeur** : `useState("tokenizer")` + rendu conditionnel dans App.tsx
- **Zero feature Vite-spécifique** : pas de `import.meta.env`, pas de `?raw`, pas de glob
- **Thème** : hook custom `useTheme()` avec `data-theme` sur `<html>` + `localStorage`, scrollbars thématiques
- **Training** : boucle `requestAnimationFrame` (5 steps/frame), pas de Web Worker
- **Attention** : boucle multi-token côté page (KV cache pattern), matrice T×T `<table>` sémantique
- **Model sharing** : `useSyncExternalStore` dans `modelStore.ts`, hook `useModel()` (A-1 corrigé)
- **Tooltips** : WAI-ARIA compliant, WCAG 1.4.13, flip viewport, bridge hoverable
- **Tests** : Vitest + jsdom + @testing-library/react (133 tests, 24 fichiers)
- **ErrorBoundary** : class component, `window.location.reload()`, sidebar hors boundary
- **Code splitting** : `React.lazy()` + `Suspense` → 6+ chunks JS séparés
- **CSS** : 20 classes utilitaires + BEM + `.sr-only` + `prefers-reduced-motion`. Inline styles réduits de 64 à 7 (pages originales) + 8 (AttentionPage, dont 2 dynamiques)
- **Accessibilité** : WCAG 2.1 AA ~95 %, labels sur tous inputs/selects, `:focus-visible`, `aria-label` canvas/table

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

- ✅ A-1 : `useSyncExternalStore` dans `modelStore.ts` + `memo()` sur 6 pages
- ✅ C-4 : Décomposer `ForwardPassPage` en sous-composants (`FlowDiagram`, `VectorsPanel`, `MLPActivationPanel`, `NNDiagram`)
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

### 9b. Playground complet — cycle de vie intégral — FAIT

Démo standalone Canvas 2D montrant le **voyage complet** du modèle, du zéro absolu à la génération de noms.

- ✅ `playground-complete.html` — ~1 000 lignes, standalone, zéro dépendance
- ✅ Port fidèle de l'autograd (classe `Val`, backward par tri topologique)
- ✅ Port fidèle du PRNG (mulberry32), du modèle complet (4 192 params), de l'optimiseur Adam
- ✅ 8 phases auto-play : architecture → tokenisation → forward → loss → backward → entraînement → inférence → idle
- ✅ 13 colonnes avec activations réelles (pas de `Math.random()`)
- ✅ Entraînement réel : 200 étapes, loss ~3.3 → ~1.3, courbe de loss live
- ✅ Inférence réelle : génération de 3 noms lettre par lettre avec sampling
- ✅ KV cache multi-token pour attention causale
- ✅ 34 prénoms (a-z), vocabSize=27
- ✅ Layout 3 panneaux : info (tokens, phase, architecture) | Canvas NN 13 colonnes | loss chart + entraînement + noms générés
- ✅ Contrôles manuels : Entraîner ×100, Générer, Réinitialiser, Pause/Reprendre
- ✅ Thème dark/light, responsive, hover interactif, `prefers-reduced-motion`
- ✅ Textes explicatifs FR par phase (pédagogiques, cible 10-14 ans)

**Différences vs `playground-full.html`** : `playground-full` utilise des données aléatoires et montre uniquement forward+backward. `playground-complete` porte le vrai moteur et montre le cycle complet de vie du modèle.

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

### 12. Page Attention — FAIT

Page dédiée à l'attention multi-token, insérée comme page 4 (Entraînement → 5, Inférence → 6).

- ✅ `AttnMatrix.tsx` — composant `<table>` sémantique T×T (aria-label, masque causal, mode compact)
- ✅ `AttentionPage.tsx` — 6 panneaux pédagogiques (405 lignes), réordonnés pour proximité cause→effet :
  1. Pourquoi l'attention ? (texte)
  2. Séquence complète (input + token-flow animé + sélecteur position)
  3. 4 têtes, 4 regards — `.panel-row` deux boîtes (BertViz SVG + barres de poids toujours visibles)
  4. Q, K, V — trois rôles (VectorBar × 3)
  5. Matrice d'attention (AttnMatrix + sélecteur tête)
  6. Récapitulatif (texte + glossaire connexion résiduelle)
- ✅ Boucle multi-token côté page (KV cache pattern, engine read-only)
- ✅ Données 100 % dynamiques via `gptForward()` + `useModel()`
- ✅ Glossaire `connexion-residuelle` ajouté (30 termes total)
- ✅ Audit : `<table>` sémantique (WCAG), `<label htmlFor>`, `type="button"`, `useMemo` allHeadMatrices, 11 inline styles → classes utilitaires `mt-8`/`mt-4`
- ✅ App.tsx : page 4 dans PAGES, lazy import, rendu conditionnel. Pages 5-6 renumérotées

### 13. Nice-to-have : widget autograd interactif dans TrainingPage

> **Priorité** : après la page Attention (section 12). Enrichissement, pas un gap critique.

**Constat pédagogique** : l'autograd (section 4 du guide Karpathy) est le mécanisme le plus mathématique du code. Le guide lui-même dit _"this is the most mathematically and algorithmically intense part"_ et renvoie vers une vidéo de 2h30. Cependant, le **concept** (pas le mécanisme) est illustrable pour la cible 10-14 ans.

**Ce qui est DIFFICILE (hors portée de la cible) :**

- Les dérivées (calcul différentiel → hors programme collège)
- La règle de la chaîne (composition de fonctions → abstraite)
- Le tri topologique (algorithmique → pas adapté)
- La notation ∂L/∂a (intimidante)

**Ce qui est ACCESSIBLE (le concept, pas la mécanique) :**

1. **Forward = calculer le résultat** — c'est de l'arithmétique :

   ```
   a = 2,  b = 3
       ↓       ↓
      [ × ]  →  c = 6
                  ↓
      c + a  →  L = 8
   ```

2. **Backward = remonter le "blâme"** — analogie de Karpathy :

   > _"If a car travels twice as fast as a bicycle and the bicycle is four times as fast as a walking man, then the car travels 2 × 4 = 8 times as fast as the man."_

   Traduit pour un ado : _"Si je bouge `a` d'un tout petit peu, de combien bouge `L` ?"_ On remonte les opérations en sens inverse en multipliant les "taux de changement". C'est la propagation du blâme : qui est responsable de l'erreur ?

3. **La preuve visuelle** : l'ado bouge `a` de 2.0 à 2.001 → `L` passe de 8.0 à 8.004 → le gradient prédit exactement 4.0 (×0.001 = 0.004). Vérifiable, concret, pas de maths.

**Spécification du widget :**

- Emplacement : panneau dans TrainingPage (pas une page dédiée, ~100 lignes)
- Mini-graphe de 4-5 nœuds (l'exemple `a×b + a` de Karpathy, section 4 du guide)
- Animation forward : les nombres coulent de gauche à droite
- Animation backward : les gradients remontent de droite à gauche (autre couleur)
- Interactivité : l'ado bouge `a` avec un slider → voit `L` bouger → le gradient prédit le ratio exact
- Texte de conclusion : _"C'est exactement ce que fait le modèle avec ses 4 192 paramètres — en beaucoup plus grand"_

**Ce que le widget n'essaie PAS de montrer :**

- La formule de la dérivée
- Le tri topologique
- Le graphe de 4 192 nœuds
- La notation mathématique

**Référence** : guide Karpathy section "Autograd" — exemple `a=2, b=3, c=a*b, L=c+a` + analogie voiture/vélo/piéton. Voir `docs/reference-microgpt-karpathy.md` section 4.

### 14. Playground BertViz + classifieur de têtes — FAIT

Visualisation BertViz-style (token↔token, lignes SVG) + classifieur dynamique des personnalités de têtes d'attention.

- ✅ `playground-bertviz.html` — prototype standalone HTML+CSS+JS :
  - Input dynamique ("Tape un nom..."), tokenisation BOS + lettres
  - 2 colonnes verticales face-à-face (source → destination)
  - Lignes SVG Bézier (épaisseur = poids, couleur = tête)
  - Sélecteur de tête (Toutes / 0-3), hover dim/highlight, clic détail
  - Masque causal (pas de lignes vers le futur)
  - Thème dark/light, CSS variables de l'app
- ✅ `classifyHead(matrix)` — classifieur heuristique intégré comme util réutilisable :
  - Analyse matrice T×T → personnalité parmi {Ancrage, Précédent, Écho, Contexte}
  - Labels dynamiques dans légende et panneau de détail (s'adaptent au nom tapé)
  - Phrases pédagogiques par personnalité via `HEAD_EXPLANATIONS_MAP`
  - Seuils : avg(prev) > 0.45 → Précédent, avg(BOS) > 0.25 + avg(self) > 0.15 → Ancrage, etc.
- ✅ `docs/attention-head-behaviors.md` — documentation des comportements observés :
  - Résultats empiriques : 10 seeds × 1000 steps, noms courts vs longs
  - Littérature : Attention Sink (ICLR 2025), Previous Token Heads, impossibilité Induction Heads en 1 couche
  - Conclusion : Ancrage + Contexte dominent, Précédent rare, Écho quasi absent
- ✅ `scripts/investigate-heads.ts` — script d'investigation reproductible (non inclus dans l'app)
- ✅ Note pédagogique sur la variabilité des personnalités entre entraînements

### 15. Intégration BertViz dans page 4 (Attention) — FAIT

- ✅ `src/utils/classifyHead.ts` — classifieur heuristique (Ancrage/Précédent/Écho/Contexte)
- ✅ `src/utils/classifyHead.test.ts` — 4 tests (T=1, Précédent, Ancrage, Contexte uniforme)
- ✅ `src/utils/headExplanation.tsx` — phrases explicatives FR par personnalité
- ✅ `src/components/BertVizView.tsx` — composant contrôlé SVG Bézier (187 lignes)
  - Sélecteur Toutes/tête unique, légende dynamique, hover dim/highlight
  - State levé vers AttentionPage (activeHead, hoverSrc, selectedSrc) — composant contrôlé
  - Clic sur token source → `onClickSrc` met à jour `selectedPos` (cascade tous panneaux)
  - Réutilisation `.token-box` avec char + token ID (cohérence avec TokenizerPage/AttentionPage)
  - Accessibilité clavier (tabIndex + onFocus sur tokens source)
  - `aria-hidden="true"` sur SVG décoratif, transition opacity sur paths
- ✅ Panneau 5 AttentionPage : `.panel-row` deux boîtes côte à côte (pattern page 3)
  - Gauche : BertVizView SVG + texte + badge entraînement
  - Droite : barres de poids toujours visibles (moyenne N_HEAD ou tête unique), données liées
  - Responsive : stacking vertical <640px via `.panel-row` existant
- ✅ CSS scopé `.bv-*` (~115 lignes, 17 sélecteurs), thème dark + light validé visuellement

### 15b. Réordonnancement layout pages 3 et 4 — FAIT

Amélioration pédagogique : rapprocher les contrôles du feedback visuel (proximité cause→effet).

- ✅ **ForwardPassPage** (page 3) : FlowDiagram (référence) avant les contrôles token/position. Les contrôles sont maintenant adjacents aux panneaux dynamiques (VectorsPanel, ProbabilityBar, MLP) en dessous.
- ✅ **AttentionPage** (page 4) : BertViz + barres de poids (panneau 3) remonté juste après l'input (panneau 2). Q/K/V et matrice descendent comme sections détail. L'élève tape un nom → voit immédiatement les lignes SVG réagir.
- Trade-off assumé : FlowDiagram (page 3) est dynamique (`topChar`, `topProbPct`) mais maintenant au-dessus des contrôles — son feedback sera hors écran au changement de token. Acceptable car le feedback principal (barres de probabilités) reste en dessous.

### 16. Intégration visualisation NN dans page 3 (Propagation) — FAIT

**Composant** : `NNDiagram.tsx` (~300 lignes) — Canvas 2D interactif montrant le réseau de neurones complet en 5 colonnes [Embedding(16), Attention(4×4 têtes), MLP caché(64), MLP sortie(16), Probabilités(27)].

**Réalisé** :

- ✅ Port de `playground.html` en composant React TypeScript avec données réelles du modèle
- ✅ Canvas 2D avec IntersectionObserver (scroll reveal), ResizeObserver (responsive), MutationObserver (thème)
- ✅ Machine d'état animation : dormant → forward (350ms/couche) → idle avec hover interactif
- ✅ Neurones colorés par activations réelles (vert=positif, rouge=négatif, via CSS variables)
- ✅ Connexions pondérées par les poids réels du modèle (alpha normalisée par couche)
- ✅ Brackets H0-H3 sur la colonne Attention, labels par colonne
- ✅ Bouton « Rejouer » pour relancer l'animation
- ✅ Support `prefers-reduced-motion` (skip animation, état final immédiat)
- ✅ Réordonnancement page 3 : Contrôles → Vecteurs+Probabilités → FlowDiagram → NNDiagram → MLP
- ✅ Suppression `AttentionWeightsPanel` (redondant avec page 4)
- ✅ Continuité pédagogique : poids lus via `model.stateDict` + `[model, model.totalStep]` — si l'élève entraîne page 5 et revient page 3, le NNDiagram reflète les poids entraînés
- ✅ Forward only (backward réservé à page 5 avec `playground-full.html`)
- ✅ 2 tests (canvas role/aria-label, bouton Rejouer) + 1 test intégration dans ForwardPassPage
- ✅ Vérifié : dark/light theme, responsive 480px/1280px, animation replay, changement de token

**Décisions** :

- Canvas 2D (pas SVG) — performance (~2700 connexions), pattern existant `LossChart.tsx`
- Forward only — backward = page 5 (Entraînement)
- `probs.length` dynamique — support vocabulaire variable (27-101)
- Poids extraits dans ForwardPassPage (props primitives), pas dans NNDiagram (principe C-4)

### 17. PCA Scatter Plot — plongements en 2D (page 2) — FAIT

Visualisation PCA des embeddings wte : projection 2D des 27 vecteurs de 16 dimensions, avec animation d'évolution pendant l'entraînement.

- ✅ `pca.ts` — PCA 2D pur (centrage, covariance 2×2, vecteurs propres analytiques), 6 tests
- ✅ `parseColor.ts` — extraction RGB depuis CSS computed styles (hex/rgb/rgba), 5 tests
- ✅ `modelStore.ts` — `pushWteSnapshot()` / `getWteSnapshots()` infrastructure snapshots (deep copy), 2 tests ajoutés
- ✅ `PCAScatterPlot.tsx` — Canvas 2D (~677 lignes) :
  - 27 points colorés (voyelles=cyan, consonnes=orange, BOS=violet)
  - Lignes de constellation (même type=couleur type, cross-type=border, alpha/épaisseur par proximité)
  - Hover interactif : anneau lumineux + highlight constellation
  - Hover bidirectionnel : PCA ↔ heatmap wte via `highlightLetter` / `onHoverLetter`
  - Axes PCA (axes centrés sur l'origine, labels PC1/PC2)
  - Vignette radiale (centre 0.025α, bords 0.35α) + effet observatoire scientifique
  - Animation replay : interpolation 16D entre snapshots → pca2d() chaque frame (mouvement organique)
  - Trails fantômes (ghost trail) avec alphas dégressifs
  - Labels bold avec halo (strokeText) pour lisibilité sur dots colorés
  - IntersectionObserver scroll-reveal (seuil 0.3, même pattern NNDiagram)
  - Bouton Rejouer (conditionnel ≥3 snapshots)
  - `prefers-reduced-motion` : skip animation
  - Support dark/light via CSS variables (`getCssVar` + `parseColor`)
  - Responsive : 400px → 300px → 220px via media queries
- ✅ `playground-pca.html` — prototype standalone Canvas pour itération design
- ✅ Intégration dans `EmbeddingsPage.tsx` (4e panneau, +97 lignes) :
  - Badge entraînement dynamique
  - Texte pédagogique adapté 10-14 ans (métaphore de l'ombre)
  - Mention conditionnelle bouton Rejouer (≥3 snapshots)
- ✅ `TrainingPage.tsx` — `pushWteSnapshot(model)` tous les 50 pas d'entraînement
- ✅ 4 tests EmbeddingsPage (canvas PCA, wrap, hover bidirectionnel, training badge)
- ✅ Vérification visuelle complète (Playwright : initial, hover, entraînement, animation, light theme, responsive 640px)

**Décisions** :

- PCA analytique (pas de bibliothèque — 96 lignes, O(n·d²) adapté à n=27, d=16)
- Canvas 2D (pas SVG — cohérence avec NNDiagram et LossChart)
- `parseColor` extraite et partagée : Heatmap, AttnMatrix, LossChart, NNDiagram, PCAScatterPlot
- Snapshots deep copy (mutation-proof) — pattern vérifié par test H-2
- Animation cancellation sur changement de snapshots (F-2) — même pattern C-6/P-4
- Interpolation 16D (pas 2D) : les axes PCA tournent naturellement → mouvement organique vs toile étirée

### 17b. Audit conformité animations + migration CSS vars — FAIT

Audit systématique des 7 composants animés/interactifs : cohérence visuelle, leverage code, fidélité données modèle, `prefers-reduced-motion`.

- ✅ **PCAScatterPlot** — conformité plan corrigée :
  - IntersectionObserver scroll-reveal ajouté (seuil 0.3, même pattern NNDiagram)
  - Vignette intensité corrigée (centre 0.025α, bords 0.35α — était 0.02/0.15)
  - Animation 16D : interpolation embeddings 16D + pca2d() chaque frame (était interpolation 2D = toile étirée)
  - Labels bold + halo strokeText pour contraste sur dots colorés
  - Badge invitation pédagogique aligné avec wte ("Valeurs aléatoires — reviens après…")
- ✅ **Heatmap** — `valToColor()` migré vers CSS vars (`--red`, `--green`, `--surface2` via `getCssVar`+`parseColor`). Texte: `--vector-text`
- ✅ **AttnMatrix** — couleur cellules migré vers `--blue` via `getCssVar`+`parseColor`. Texte: `--bg`/`--text-dim`
- ✅ **LossChart** — couleurs alpha migré vers `parseColor` (plus de concat hex `+"44"`). Ajout ResizeObserver + MutationObserver (pattern NNDiagram)
- ✅ **NNDiagram** — déjà conforme (getCssVar+parseColor, IO+RO+MO, reduced motion JS)
- ✅ **TokenizerPage** — CSS keyframes, `prefers-reduced-motion` global CSS
- ✅ **BertVizView** — SVG inline avec CSS vars HEAD_COLORS, pas d'animation à corriger

**Résultat** : 0 couleur hardcodée dans les composants. Tous utilisent CSS custom properties → prêt pour futur oklch.

### 10. Polish CSS — FAIT

- ✅ Scrollbars thématiques (webkit + standard `scrollbar-color`) — `86ef089`
- ✅ Lisibilité petits textes : font-sizes augmentées (vector-cell 8→10px, heatmap 9→10/11px, flow 9→10/11px, heat-cell 8→10px) — `86ef089`
- ✅ Extraction 24 inline styles statiques → 20 classes CSS utilitaires — `b0b3ad9`
- 7 inline styles dynamiques conservés (couleurs/opacité calculés au runtime)
- 3 `!important` légitimes (1 `.row-label` override inline, 2 `prefers-reduced-motion`)

### 18. Page d'accueil — présentation de l'app

> **État** : à faire. Design validé.

**Constat** : l'app s'ouvre directement sur page 1 (Tokenisation) — entrée abrupte, pas de contexte ni d'accroche. Un élève de 10-14 ans qui arrive ne sait pas ce qu'il va explorer ni pourquoi.

**Objectif** : page d'accueil pédagogique et engageante — donne envie de continuer.

**ADR — page dédiée (page 0), pas modal** :

- _Cohérence sidebar_ : la section 21 prévoit 9 entrées avec "0 Accueil" en première position + séparateur. Une modal casserait cette structure.
- _Toujours accessible_ : l'ado peut revenir à l'accueil pour se re-situer dans le parcours. Une modal first-launch ne le permet pas.
- _Pas de state localStorage_ : pas de logique "déjà vu / pas vu" à gérer.
- _Mobile_ : une page scroll normalement ; une modal demande focus trap, fermeture, overlay.
- _Bouton "Commencer"_ : naturel sur une page (`setPage("tokenizer")`), artificiel sur un dismiss de modal.
- _Rejet de l'alternative modal_ : forcer un ado de 12 ans à lire un écran bloquant ne fonctionne pas.

**Contenu prévu** :

- Pitch court : "Tu vas construire un cerveau artificiel qui invente des prénoms"
- Aperçu visuel du parcours (8 étapes numérotées)
- Bouton "Commencer" → page 1
- Optionnel : aperçu du résultat (nom généré) comme accroche

### 19. Page modèle complet — visualisation architecture intégrale

> **État** : à faire. Design validé.

**Constat** : `playground-full.html` montre les 13 colonnes fidèles au graphe de calcul complet, mais c'est un prototype standalone. L'intégrer dans l'app donnerait une vue d'ensemble que la page 3 (5 colonnes simplifiées) ne couvre pas.

**Objectif** : page 7 = **récompense visuelle**. Full spectacle, animations over the top. Pédagogie minimale — ceux qui ont skip les explications y retourneront d'eux-mêmes.

**ADR — décisions validées** :

1. **Layout horizontal desktop + message mobile** : scroll horizontal sur desktop. Sur mobile (<768px) : message "Utilise un écran plus large" — 13 colonnes ne passent pas en 375px, inutile de forcer.
2. **Ton hybride léger** : intro courte en haut + noms de couches visibles dans le canvas (Emb, Attn, Résidu, MLP, LN, Probs). Pas d'annotations lourdes ni de tooltips pédagogiques.
3. **Page 7 (après Inférence, avant Conclusion)** : zoom-out après le parcours complet. L'ado a vu les 6 étapes isolément, maintenant il voit tout assemblé. Ne touche pas à la numérotation 1-6.
4. **Résidus : arcs Bézier + flash animé** : arcs courbes `var(--green)` semi-transparent au-dessus du canvas en idle (structure visible). Flash lumineux pendant le forward animé quand le signal traverse un résidu (spectacle).
5. **Forward par défaut, bouton "Voir le backward"** : forward = récompense garantie. Backward (gradients en rouge/orange qui redescendent) = bonus pour les curieux. Donne une raison de revenir.
6. **Nouveau composant FullNNDiagram** : dédié 13 colonnes, indépendant de NNDiagram (5 colonnes page 3). Copie les patterns (IO/RO/MO/getCssVar/parseColor) mais pas de prop boolean ni de hook partagé — les layouts et animations sont trop différents. Données réelles du modèle (stateDict, traces), jamais simulées.

### 20. Page de conclusion — ce que les vrais GPT font en plus

> **État** : à faire. Design validé.

**Constat** : l'app montre un modèle à 4 192 paramètres. Les vrais LLM (GPT-5 etc.) en ont des centaines de milliards. L'élève doit comprendre ce qui manque, pour situer ce qu'il a appris dans le paysage réel.

**Objectif** : page finale pédagogique — "tu as compris les fondations, voici ce que les ingénieurs ajoutent". Honnête et motivant, pas simpliste ni décourageant.

**ADR — décisions validées** :

1. **Tableau comparatif "Notre microGPT / Les vrais LLM"** avec micro-analogies sous chaque ligne :
   - Paramètres : 4 192 → centaines de milliards
   - Vocabulaire : 27 lettres → 50 000+ sous-mots (BPE)
   - Couches : 1 → 96+, têtes : 4 → 96+
   - Contexte : 8 positions → 128K+ tokens
   - Normalisation, dropout, learning rate scheduling
   - RLHF / instruction tuning (alignement)
   - Infrastructure : 1 navigateur → clusters GPU, mois d'entraînement
   - Chaque ligne a une analogie concrète pour ados 10-14 ans
2. **Ton "fondations + ajouts"** : l'intro valorise le parcours accompli (7 pages), le tableau montre factuellement les différences sans rabaisser.
3. **Section "Aller plus loin" en bas** : 3-4 liens annotés :
   - Guide Karpathy (migré depuis la sidebar, mention "en anglais, pour les plus motivés")
   - tuto-llm (cours pédagogique associé)
   - microgpt-ts-fr (fork de référence)
4. **Format** : composant React simple (pas de Canvas), table HTML sémantique + texte. Pas d'animation — le spectacle c'est la page 7.

### 21. Sidebar — rôle et contenu

> **État** : design validé. Implémentation à faire.

**Constat** : la sidebar actuelle contient une section de référence (doc upstream) héritée du fork. Avec l'ajout de nouvelles pages (accueil, modèle complet, conclusion), sa structure doit être repensée.

**ADR — décisions validées** :

1. **Lien guide Karpathy → page Conclusion** : supprimé de la sidebar, sera intégré dans la page 8 (section 20). Le guide est en anglais, pas adapté au public cible 10-14 ans.
2. **Séparateurs visuels sans headers** : `border-top: 1px solid var(--border)` entre 3 blocs (Accueil | Étapes 1-6 | Aller plus loin 7-8). Pas de labels de groupe — la numérotation suffit.
3. **Pastilles visitées** : dot `●` 6px `var(--green)` à droite du label. State `Set<string>` en localStorage clé `microgpt-visited`. Marqué au `setPage(id)`. Pas de reset.
4. **Hamburger inchangé** : 9 entrées + picker + theme tiennent sur mobile, scroll si besoin.
5. **Footer raccourci** : "Basé sur microgpt.py de Karpathy." — suppression du disclaimer IA.

**Structure finale** :

```
0  Accueil
── séparateur ──
1  Tokenisation
2  Plongements (wte/wpe)
3  Propagation
4  Attention
5  Entraînement
6  Inférence
── séparateur ──
7  Modèle complet
8  Conclusion
```

**Fichiers impactés** : `src/App.tsx` (PAGES, séparateurs, pastilles, footer), `src/styles.css` (`.visited-dot`, séparateur). Pas de nouveau composant.

---

## References

- [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer) — upstream
- [Demo live upstream](https://microgpt.enescang.dev/)
- [Sjs2332/microGPT_Visualizer](https://github.com/Sjs2332/microGPT_Visualizer) — projet alternatif (pas de demo)
- [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) — fork FR de reference
- [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — Andrej Karpathy
- [tuto-llm](https://github.com/mon-atelier-ia/tuto-llm) — cours pedagogique associe
