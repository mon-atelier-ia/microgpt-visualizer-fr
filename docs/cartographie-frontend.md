# Cartographie Frontend — Spécification de migration

> Document de référence pour reproduire le frontend `microgpt-visualizer-fr` dans un autre stack (ex: Next.js + shadcn/ui + Tailwind). Généré le 2 mars 2026, mis à jour le 7 mars 2026.

---

## Table des matières

1. [Stack actuel](#1-stack-actuel)
2. [Design system — Tokens CSS](#2-design-system--tokens-css)
3. [Typographie et couleurs sémantiques](#3-typographie-et-couleurs-sémantiques)
4. [Layout global](#4-layout-global)
5. [Composants primitifs (design system)](#5-composants-primitifs-design-system)
6. [Arbre des composants et état](#6-arbre-des-composants-et-état)
7. [Pages — Spécification panneau par panneau](#7-pages--spécification-panneau-par-panneau)
8. [Glossaire (30 termes)](#8-glossaire-30-termes)
9. [Visualisations et composants spécialisés](#9-visualisations-et-composants-spécialisés)
10. [Animations et transitions](#10-animations-et-transitions)
11. [Responsive et breakpoints](#11-responsive-et-breakpoints)
12. [Accessibilité (a11y)](#12-accessibilité-a11y)
13. [Engine API (read-only)](#13-engine-api-read-only)
14. [Datasets](#14-datasets)
15. [Utilitaires](#15-utilitaires)
16. [Store (gestion d'état)](#16-store-gestion-détat)
17. [Tests existants](#17-tests-existants)
18. [Décisions architecturales à préserver](#18-décisions-architecturales-à-préserver)

---

## 1. Stack actuel

| Couche    | Technologie                                       | Version   |
| --------- | ------------------------------------------------- | --------- |
| Framework | React                                             | 19.2      |
| Langage   | TypeScript                                        | 5.9       |
| Bundler   | Vite                                              | 7.3       |
| Styles    | CSS custom (1 fichier `styles.css`, ~2140 lignes) | —         |
| Tests     | Vitest + jsdom + @testing-library/react           | 4.0       |
| Linting   | ESLint 9 + Prettier 3                             | —         |
| Deploy    | Vercel (auto-deploy `main`)                       | Node 24.x |

**Zéro dépendance runtime** hors React/React-DOM. Pas de router, pas de state library, pas de UI framework. Le QR code Partager est un SVG statique inline (pré-généré).

---

## 2. Design system — Tokens CSS

### 2.1 Palette — Thème sombre (défaut)

```css
:root,
[data-theme="dark"] {
  --bg: #181816;
  --surface: #222220;
  --surface2: #2a2a27;
  --border: #363632;
  --border-hover: #4a4a44;
  --text: #cdc8be;
  --text-dim: #959082;
  --blue: #c28b4e; /* accent principal — ambre/cuivre */
  --purple: #a08cb4;
  --cyan: #6a9f9b;
  --green: #8aaa6b;
  --red: #bf6a63;
  --orange: #c4885c;
  --yellow: #b8a45c;
  --vector-text: #2c2a25;
}
```

### 2.2 Palette — Thème clair

```css
[data-theme="light"] {
  --bg: #f5f1ea;
  --surface: #fffdf8;
  --surface2: #ece8e0;
  --border: #d6d0c5;
  --border-hover: #b8b2a6;
  --text: #2c2a25;
  --text-dim: #6a655d;
  --blue: #9c6b30;
  --purple: #7b5ea0;
  --cyan: #3a7d78;
  --green: #527a34;
  --red: #a04040;
  --orange: #a06830;
  --yellow: #8a7a2e;
  --vector-text: #2c2a25;
}
```

### 2.3 Notes sur la palette

- **Tonalité** : warm neutral. Le fond sombre est olive/brun, pas bleu/gris. Le clair est « warm paper ».
- **`--blue`** n'est PAS bleu : c'est un ambre/cuivre. C'est l'accent principal (sidebar active, liens, focus).
- Le contraste `--text-dim` sur `--surface2` est ≥ 4.5:1 en clair, 3.28:1 en sombre (acceptable pour texte secondaire/large).

---

## 3. Typographie et couleurs sémantiques

### 3.1 Font stack

```css
font-family: "SF Mono", "Fira Code", "Consolas", monospace;
```

Tout le site est en monospace. Pas de font-face custom chargée.

### 3.2 Échelle typographique

| Élément           | Taille                                  | Couleur               | Weight  |
| ----------------- | --------------------------------------- | --------------------- | ------- |
| `page-title`      | 22px (→18px mobile, →16px petit mobile) | `--blue`              | default |
| `page-desc`       | 13px (→11px mobile)                     | `--text-dim`          | default |
| `panel-title`     | 14px (→13px mobile, →12px petit mobile) | `--purple`            | default |
| `explain`         | 12px (→11px mobile, →10px petit mobile) | `--text-dim`          | default |
| `label-dim`       | 12px                                    | `--text-dim`          | default |
| `btn`             | 12px (→11px mobile, →10px petit mobile) | `--bg` (sur `--blue`) | bold    |
| `token-box .char` | 18px (→16px, →14px)                     | `--cyan`              | bold    |
| `token-box .id`   | 10px (→9px, →8px)                       | `--text-dim`          | default |

### 3.3 Couleurs sémantiques

| Classe          | Couleur      | Usage                           |
| --------------- | ------------ | ------------------------------- |
| `.text-cyan`    | `--cyan`     | Tokens affichés, labels probas  |
| `.text-green`   | `--green`    | Valeurs positives, token prédit |
| `.text-red`     | `--red`      | BOS, erreurs, loss élevé        |
| `.text-dim`     | `--text-dim` | Texte secondaire                |
| `.label-purple` | `--purple`   | Sous-titres, labels de sections |

---

## 4. Layout global

```
┌─────────────────────────────────────────────────────┐
│ .app (display: flex, min-height: 100vh)             │
│                                                     │
│ ┌──────────┐ ┌────────────────────────────────────┐ │
│ │ .sidebar  │ │ .main                              │ │
│ │ 230px     │ │ margin-left: 230px                 │ │
│ │ fixed     │ │ padding: 24px 32px                 │ │
│ │ left      │ │ max-width: 1400px                  │ │
│ │           │ │                                    │ │
│ │ <header>  │ │ <ErrorBoundary>                    │ │
│ │  h1       │ │   <Suspense fallback="Chargement…">│ │
│ │  subtitle │ │     {activePage}                   │ │
│ │ <nav>     │ │   </Suspense>                      │ │
│ │  9 pages  │ │ </ErrorBoundary>                   │ │
│ │  (3 blocs)│ │                                    │ │
│ │ dataset   │ │                                    │ │
│ │  picker   │ │                                    │ │
│ │ theme     │ │                                    │ │
│ │  picker   │ │                                    │ │
│ │ footer    │ │                                    │ │
│ └──────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Sidebar

| Section        | Détail                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header         | `h1` "MicroGPT" (`--blue`), subtitle "Explorateur visuel"                                                                                                                      |
| Nav            | 9 boutons numérotés (0-8), 3 blocs séparés par `.nav-sep` (`border-top`). `.active` = `--blue` border-left + bg. Pastille `.visited-dot` (6px `--green`) si page déjà visitée. |
| Dataset picker | 6 boutons (label + title=description), dialog de confirmation si entraînement en cours                                                                                         |
| Theme picker   | 2 boutons (Sombre/Clair) avec SVGs (lune/soleil)                                                                                                                               |
| Footer         | "Basé sur microgpt.py d'Andrej Karpathy." + bouton Partager (QR code) — `margin-top: auto`, flex row                                                                           |

**Structure nav 3 blocs :**

```
0  Accueil
── séparateur (.nav-sep) ──
1  Tokenisation
2  Plongements (wte/wpe)
3  Propagation
4  Attention
5  Entraînement
6  Inférence
── séparateur (.nav-sep) ──
7  Modèle complet
8  Conclusion
```

**Visited dots** : `Set<string>` dans localStorage (clé `microgpt-visited`). Marqué au changement de page. Dot affiché si `visited.has(p.id) && page !== p.id`.

### Navigation

Pas de router. `page` state dans `App.tsx` (défaut `"home"`), rendu conditionnel : `{page === "tokenizer" && <TokenizerPage />}`.

Les 9 pages sont lazy-loadées (`React.lazy`). Fallback : `<div class="panel loading-fallback" role="status">Chargement…</div>`.

HomePage a un prop `onStart` qui appelle `handlePageChange("tokenizer")`.

### Dialog de confirmation (changement dataset)

Native `<dialog>` avec backdrop blur. Titre orange (`--orange`), message `--text-dim`, boutons "Annuler" (secondaire) et "Réinitialiser" (`--red`/danger).

---

## 5. Composants primitifs (design system)

### 5.1 `.panel`

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 10px;
padding: 16px;
margin-bottom: 16px;
```

Conteneur principal pour chaque section de contenu. Toutes les pages sont composées de `.panel`s empilés.

### 5.2 `.panel-row`

```css
display: flex;
gap: 16px;
margin-bottom: 16px;
```

Deux `.panel`s côte à côte. `> * { flex: 1; min-width: 0; }`. Passe en `column` sous 900px.

### 5.3 `.explain`

```css
font-size: 12px;
color: var(--text-dim);
line-height: 1.7;
margin-bottom: 12px;
padding: 10px 12px;
background: var(--surface2);
border-radius: 6px;
border-left: 3px solid var(--blue);
```

Bloc d'explication pédagogique. `b` en `--cyan`, `code` en `--green`. Variante `.explain--warning` : `border-left-color: var(--orange)`.

### 5.4 `.btn`

| Variante            | Apparence                          |
| ------------------- | ---------------------------------- |
| `.btn` (défaut)     | `--blue` bg, `--bg` text, bold     |
| `.btn-secondary`    | `--border-hover` bg, `--text` text |
| `.btn-toggle`       | padding réduit (4px 10px)          |
| `.btn-toggle--char` | font-size 14px, min-width 32px     |
| `.btn-toggle--sm`   | padding 3px 8px, min-width 28px    |
| `.btn--danger`      | `--red` bg                         |
| `:hover`            | `filter: brightness(1.15)`         |
| `:disabled`         | opacity 0.4, cursor not-allowed    |

### 5.5 `.token-box`

Carte de token avec deux lignes (caractère + ID) :

| Variante               | Usage                                             |
| ---------------------- | ------------------------------------------------- |
| `.token-box`           | Standard (display-only)                           |
| `.token-box.bos`       | border `--red`, char `--red`                      |
| `.token-box--selected` | border `--orange`, translateY(-2px)               |
| `.token-box--compact`  | padding réduit, font-size réduit                  |
| `.token-box--bv`       | BertViz variant (52×44px, pas de hover transform) |

Hover : `border-color: var(--blue); transform: translateY(-2px)`.

### 5.6 `.token-flow`

Container flex horizontal pour la chaîne animée de tokens :

```css
display: flex;
flex-wrap: nowrap;
gap: 4px;
align-items: center;
overflow-x: auto;
```

Variante `.token-flow--animated` : applique `@keyframes tokenSlideIn` sur les `.token-box` et `@keyframes arrowFadeIn` sur les `.arrow-sym`.

### 5.7 Tooltip / Modal (Term)

- **Tooltip** : absolute, max-width 300px, arrow `::after`, bridge `::before` (14px, WCAG 1.4.13)
- **Flip** : `.term-tooltip--below` si `rect.top < 140`
- **Modal** : native `<dialog>`, max-width 560px, backdrop blur, singleton partagé via Context

---

## 6. Arbre des composants et état

### 6.1 Arbre

```
App
├── TermProvider (Context: openModal)
│   ├── Sidebar (inline dans App)
│   │   ├── Nav (9 boutons, 3 blocs, visited dots)
│   │   ├── DatasetPicker (6 boutons)
│   │   └── ThemePicker (2 boutons)
│   ├── <dialog> confirmation dataset
│   ├── ErrorBoundary
│   │   └── Suspense
│   │       └── {page} (1 des 9 pages)
│   │           ├── PageSection (wrapper <section>)
│   │           └── ... (composants spécifiques à la page)
│   └── <dialog> glossaire modal (singleton dans TermProvider)
```

### 6.2 État global

| Source                   | Type                   | Accès                                         |
| ------------------------ | ---------------------- | --------------------------------------------- |
| `modelStore.ts`          | `useSyncExternalStore` | `useModel()` hook → retourne `ModelState`     |
| `resetModel(datasetId?)` | Action                 | Récrée le modèle                              |
| `notifyModelUpdate()`    | Action                 | Incrémente version après mutation (trainStep) |
| `getModelTotalStep()`    | Getter non-réactif     | Pour event handlers (pas render)              |

### 6.3 État par page

| Page            | État local                                                       |
| --------------- | ---------------------------------------------------------------- |
| HomePage        | _(aucun — reçoit `onStart` prop)_                                |
| TokenizerPage   | `input: string`                                                  |
| EmbeddingsPage  | `hoverRow`, `hoverRowWpe`, `selectedChar`, `selectedPos`         |
| ForwardPassPage | `char`, `pos`                                                    |
| AttentionPage   | `input`, `selectedPos`, `selectedHead`, `activeHead`, `hoverSrc` |
| TrainingPage    | `training`, `lastResult`, `stopRef`, `rafRef`                    |
| InferencePage   | `temperature`, `results[]`, `activeTrace`, `activeStep`          |
| FullModelPage   | _(aucun — trace via useMemo, passé à FullNNDiagram)_             |
| ConclusionPage  | _(aucun — statique)_                                             |

### 6.4 Données dérivées (useMemo)

| Page            | Donnée                    | Dépendances                              | Coût                           |
| --------------- | ------------------------- | ---------------------------------------- | ------------------------------ |
| ForwardPassPage | `trace` (ForwardTrace)    | `[tokenId, pos, model, model.totalStep]` | `gptForward` — cher            |
| ForwardPassPage | `top5`                    | `[trace]`                                | sort + slice                   |
| AttentionPage   | `tokens`                  | `[name]`                                 | `tokenize`                     |
| AttentionPage   | `traces` (ForwardTrace[]) | `[tokens, n, model, model.totalStep]`    | multi-`gptForward` — très cher |
| AttentionPage   | `matrix`                  | `[traces, selectedHead]`                 | `buildAttnMatrix`              |
| AttentionPage   | `allHeadMatrices`         | `[traces]`                               | 4× `buildAttnMatrix`           |
| EmbeddingsPage  | `charStats`               | `[model.docs]`                           | `computeCharStats`             |

---

## 7. Pages — Spécification panneau par panneau

### 7.1 Page 1 : Tokenisation

**ID** : `tokenizer` | **Titre** : `1. Tokenisation`

**Description** : _Observe un token traverser tout le modèle..._ (13px, `--text-dim`)

**Panneau 1 — "Correspondance caractère → ID"**

- Grille horizontale scrollable (`.char-mapping-scroll`) de 28 `.token-box.cursor-default` :
  - 26 lettres (a-z) : `.char` = lettre, `.id` = `id: N`
  - 1 BOS : `.token-box.bos`, `.char` = "BOS", `.id` = `id: 26`
- Non interactif (display-only)
- Texte sous la grille : `"27 tokens : 26 lettres + BOS (...)"`

**Panneau 2 — "Essaie : tape un nom"**

- `<label class="sr-only" for="tokenizer-name-input">Nom à tokeniser</label>`
- `<input type="text" id="tokenizer-name-input" placeholder="Tape un nom...">` maxLength 16
- `.token-flow.token-flow--animated` : séquence BOS → lettres → BOS
  - Chaque box a `animationDelay: ${i * 80}ms`
  - Flèches `→` entre chaque box avec `animationDelay: ${i * 80 + 60}ms`
- Sous la flow : paires de prédiction `token-pair` : `"e → m"`, `"m → m"`, etc.
- Termes référencés : `token`, `tokeniseur`, `identifiant`, `bos`, `vocabulaire`

**Panneau 3 — "Comment fonctionne la tokenisation dans les vrais GPT"**

- Texte explicatif uniquement, pas d'interaction

---

### 7.2 Page 2 : Plongements (Embeddings)

**ID** : `embeddings` | **Titre** : `2. Plongements (Embeddings)`

**Panneau 1 — "wte — Plongements de tokens"**

- Badge d'état : `"Poids aléatoires — chaque lettre a un vecteur au hasard."` (si `totalStep === 0`) ou `"Entraîné (N étapes) — ..."` (sinon)
- Layout `.heatmap-with-bars` (flex row, column sous 900px) :
  - **Gauche** : `Heatmap` (27 rows × 16 cols) avec roving tabindex
  - **Droite** : `.barchart-side` > `EmbeddingBarChart` (sticky top:16px)
    - Si rien survolé : `"Survole une lettre dans le tableau"`
    - Si survolé : barre chart vertical (16 barres, vert=positif, rouge=négatif), charStats (fréquence, précédeurs, suiveurs)
- Termes : `token`, `vecteur`, `plongement`, `parametre`, `wte`

**Panneau 2 — "wpe — Plongements de positions"**

- Même layout `.heatmap-with-bars`
- `Heatmap` (16 rows × 16 cols)
- `EmbeddingBarChart` avec `charStats={null}` (pas de stats pour les positions)
- `emptyText="Survole une position dans le tableau"`
- Termes : `wpe`, `dimension`

**Panneau 3 — "Comment wte + wpe se combinent"**

- Sélecteur de caractère : 26 `.btn.btn-toggle.btn-toggle--char` (un par lettre)
- Sélecteur de position : 16 `.btn.btn-toggle.btn-toggle--char` (0-15)
- 3 `VectorBar` empilés : token emb + position emb = combined
- Séparateur `.vector-divider` "+" et "="

**Panneau 4 — "PCA — les plongements en 2D"**

- Badge d'état dynamique (même pattern que panneau 1 wte)
- `.pca-canvas-wrap` > `PCAScatterPlot` Canvas 2D :
  - `wteData`: `model.stateDict.wte` mappé en `number[][]` (27×16), deps `[model, model.totalStep]`
  - `totalStep`: `model.totalStep`
  - `snapshots`: `getWteSnapshots()` — deep copies wte capturées tous les 50 pas
  - `highlightLetter={hoverRow}` — heatmap wte survol → anneau PCA
  - `onHoverLetter={setHoverRow}` — PCA dot survol → highlight heatmap wte
- Texte pédagogique : métaphore de l'ombre (16D → 2D = "ombre sur un mur")
- Mention conditionnelle : "Clique le bouton « Rejouer »" si ≥3 snapshots disponibles
- Termes : `plongement`, `dimension`

---

### 7.3 Page 3 : Propagation

**ID** : `forward` | **Titre** : `3. Propagation`

**FlowDiagram** (toujours affiché en premier)

- Pipeline horizontal scrollable (`.flow`) avec 7 étapes (`.flow-step`) et flèches (`.flow-arrow`) :
  1. Token lookup (`'{char}' → id {tokenId}`)
  2. Position (`pos = {pos}`)
  3. `tok + pos` (résultat)
  4. `RMSNorm` (normalize)
  5. `Attention` (4 heads)
  6. `MLP` (ReLU, N/{64} actifs)
  7. `Softmax → probs` (top char: {topChar} {topProbPct}%)
- Termes dans les steps : `rmsnorm`, `attention`, `mlp`, `relu`, `neurone`, `logits`, `softmax`

**Panneau — "Choisis l'entrée"**

- 26 boutons token (a-z) + 16 boutons position (0-15)
- Pattern `.btn-toggle--char`

**`.panel-row` — deux panneaux côte à côte**

- **Gauche** : `VectorsPanel` — 6 `VectorBar` empilés (tokEmb, posEmb, combined, afterNorm, afterAttn, afterMlp)
- **Droite** : "Sortie : probabilités du token suivant" — `ProbabilityBar` top 10

**Panneaux conditionnels** (toujours affichés car trace existe) :

- `AttentionWeightsPanel` : N_HEAD groupes de HeatCells
- `MLPActivationPanel` : 64 NeuronCells dans `.neuron-grid`

---

### 7.4 Page 4 : Attention

**ID** : `attention` | **Titre** : `4. Attention`

**Panneau 1 — "Pourquoi l'attention ?"**

- 3 blocs `.explain` textuels
- Termes : `token`, `attention`, `plongement`

**Panneau 2 — "Une séquence complète"**

- `<input type="text" class="input--name" maxLength={14}>` (défaut : "emma")
- `.token-flow.token-flow--animated` avec boxes cliquables (clickables si `i < n`)
  - `.token-box--selected` sur la position active
  - Flèches animées
- Sélecteur de position : N boutons
- Label contextuel : `"Position N — le token « X » voit ..."`
- Termes : `token`

**Panneau 3 — `.panel-row` : "4 têtes, 4 regards différents"** (BertViz)

- **Gauche** : panneau avec :
  - Texte explicatif (N_HEAD=4 têtes)
  - Badge entraînement
  - `BertVizView` : 3 colonnes (source tokens | SVG Bézier | dest tokens)
    - Sélecteur tête (Toutes / 0-3) avec dots colorés
    - Légende par tête (personnalité classifiée dynamiquement)
    - Click source → met à jour `selectedPos` (tous les panneaux réagissent)
    - Hover source → dim non-survolés à opacity 0.25
- **Droite** : panneau "Poids d'attention" :
  - Si `activeHead === "all"` : moyenne des 4 têtes, barres `--cyan`
  - Si tête spécifique : barres de la couleur de la tête, explication de personnalité
  - Barres horizontales : `.bv-weight-row` (label | track | pct)

**Panneau 4 — "Q, K, V — trois rôles"** (conditionnel : `trace`)

- 3 `VectorBar` (Q, K, V) depuis `trace.q`, `trace.k`, `trace.v`
- Analogie salle de classe
- Termes : `attention`

**Panneau 5 — "La matrice d'attention"** (conditionnel : `traces.length > 0`)

- Sélecteur de tête (0-3 boutons)
- `AttnMatrix` : table T×T avec masque causal
- Termes : `softmax`, `generation-autoregressive`

**Panneau 6 — "Comment ça s'intègre"**

- Liste ordonnée 5 étapes récapitulatives
- Termes : `softmax`, `connexion-residuelle`, `mlp`

---

### 7.5 Page 5 : Entraînement

**ID** : `training` | **Titre** : `5. Entraînement`

**Panneau 1 — "Contrôles"**

- Boutons : "200 étapes" / "500 étapes" / "1000 étapes" (désactivés si training) / "Stop" (pendant training) / "Reset" (danger)
- Stats : step, loss, LR, nom en cours
- Pattern rAF : requestAnimationFrame loop avec cancelAnimationFrame cleanup

**Panneau 2 — "Loss au fil du temps"**

- `LossChart` : `<canvas>` 100%×220px
  - Ligne brute (bleue 44% opacity)
  - Moyenne mobile (verte, 2px)
  - Baseline aléatoire (rouge pointillé, 3.30)
  - Lit les CSS vars via `getComputedStyle` → thème-réactif

**Panneau 3 — "Détail de la dernière étape"** (conditionnel : `lastResult`)

- Token-flow compact (`.token-box--compact`) montrant le nom d'entraînement
- Grille de `LossCell` par position (from → to, loss colorée)

**Panneau 4 — "Que se passe-t-il à chaque étape d'entraînement"**

- Liste ordonnée 4 étapes
- Termes : `loss`, `parametre`, `token`, `moyenne-mobile`, `retropropagation`, `gradient`, `adam`, `taux-apprentissage`

---

### 7.6 Page 6 : Inférence

**ID** : `inference` | **Titre** : `6. Inférence`

**Panneau 1 — "Générer"**

- Banner warning (si non entraîné) : `.explain--warning`
- Boutons : "1 nom" / "5 noms" / "20 noms"
- Slider température : `<input type="range" min=1 max=20 step=1>` (affiché /10)
- Label contrôle : `"Température : N.N"`
- Stat : `"N noms générés"`

**Panneau 2 — "Noms générés (N)"**

- `.gen-names` : grille flex-wrap de `<button class="gen-name">` cliquables
  - `.gen-name--active` : border `--blue`
  - Animation `@keyframes fadeUp` à l'apparition

**Panneau 3 — `.panel-row`** (conditionnel : `activeTrace`)

- **Gauche** : "Trace de génération" — boutons step (`.controls--tight`), trace textuelle `.trace`
- **Droite** : "Probabilités à la position N" — `ProbabilityBar` top 12 avec barre colorée pour le token choisi

**Panneau 4 — "Comment fonctionne la génération"**

- Liste ordonnée 5 étapes
- Termes : `bos`, `echantillonnage`, `distribution`, `temperature`, `token`, `generation-autoregressive`

### 7.0 Page 0 : Accueil

**ID** : `home` | **Titre** : `Bienvenue`

**Pitch** :

- `<p class="home-pitch">` : "Tu vas construire un cerveau artificiel qui invente des prénoms…"
- Pas de `<Term>` — zéro jargon technique

**Grille 8 étapes** :

- `.home-steps` : `display: grid; grid-template-columns: 1fr 1fr`
- 8 `.home-step` (flex row) : `.home-step-num` (cercle 28px `--border`) + `<strong>` label + `.home-step-desc` desc
- Correspondance 1:1 avec les 8 pages (Tokenisation → Conclusion)

**Bouton** :

- `.home-start-btn` : `<button type="button">Commencer</button>` → `onStart()` → `handlePageChange("tokenizer")`
- Style : `--blue` bg, 16px, 14px 48px padding

---

### 7.7 Page 7 : Modèle complet

**ID** : `fullmodel` | **Titre** : `7. Modèle complet`

**Description** : _Voici toute la machine assemblée — les 16 couches que tu as explorées une par une dans les étapes précédentes._

**FullNNDiagram** — Canvas 2D, 16 colonnes, 17 edges, 2 arcs résiduels (Bézier dashed), 12 stages d'animation.

| Col | Label       | Taille | Donnée trace | Couleur  | Section   |
| --- | ----------- | ------ | ------------ | -------- | --------- |
| 0   | Token Emb   | 16     | tokEmb       | --cyan   | Embedding |
| 1   | Pos Emb     | 16     | posEmb       | --cyan   | Embedding |
| 2   | Add         | 16     | combined     | --text   | —         |
| 3   | Norm        | 16     | afterNorm    | --text   | —         |
| 4   | Norm (attn) | 16     | preAttnNorm  | --text   | —         |
| 5   | Q           | 16     | q            | --purple | Attention |
| 6   | K           | 16     | k            | --purple | Attention |
| 7   | V           | 16     | v            | --purple | Attention |
| 8   | 4 Tetes     | 16     | headOutputs  | --purple | Attention |
| 9   | Apres Attn  | 16     | afterAttn    | --purple | Attention |
| 10  | Norm (mlp)  | 16     | preMlpNorm   | --text   | —         |
| 11  | MLP (x4)    | 64     | mlpHidden    | --orange | MLP       |
| 12  | ReLU        | 64     | masked       | --orange | MLP       |
| 13  | Apres MLP   | 16     | afterMlp     | --orange | MLP       |
| 14  | Logits      | 27     | logits       | --blue   | Sortie    |
| 15  | Probs       | 27     | probs        | --blue   | Sortie    |

Residuels : Norm(3)→ApresAttn(9) `+res₁`, ApresAttn(9)→ApresMLP(13) `+res₂`.

Animations : forward (vert, stage-by-stage 180ms), pause ("Erreur"), backward optionnel (orange, stages inverses). Gradients backward simulés (sin hash). `prefers-reduced-motion` respecté.

**ADR** : `preAttnNorm` et `preMlpNorm` ajoutés à `ForwardTrace` pour fidélité architecturale du diagramme complet. Non propagés aux pages individuelles (VectorsPanel, AttentionPage) — rmsnorm ne change que l'échelle, faible valeur pédagogique pour le public 10-14 ans, risque de surcharge visuelle.

---

### 7.8 Page 8 : Conclusion

**ID** : `conclusion` | **Titre** : `8. Conclusion`

**Description** : _Tu as compris les fondations : tokenisation, plongements, propagation, attention, entraînement et inférence..._

**Panneau 1 — "Notre microGPT vs les vrais LLM"**

- `.conclusion-table` : `<table>` sémantique, 3 colonnes (Concept, Notre microGPT, Les vrais LLM), 8 lignes
- Concepts : Paramètres, Vocabulaire, Couches, Têtes d'attention, Contexte, Normalisation, Alignement, Infrastructure
- `.conclusion-analogies` : 8 `<p>` avec `<strong>concept</strong> — <em>analogie</em>`
- Analogies adaptées 10-14 ans (vélo vs fusée, étage vs gratte-ciel, etc.)

**Panneau 2 — "Aller plus loin"**

- `.conclusion-links` : `<ul>` avec 3 `<li>` contenant `<a target="_blank">` :
  - Guide officiel MicroGPT (karpathy.github.io)
  - tuto-llm (cours FR)
  - microgpt-ts-fr (code TypeScript)

---

## 8. Glossaire (30 termes)

### 8.1 Tier 1 — Tooltip seul (16 termes)

| ID                     | Label FR             | Texte tooltip (résumé)                   |
| ---------------------- | -------------------- | ---------------------------------------- |
| `token`                | token                | Un morceau de texte que le modèle traite |
| `bos`                  | BOS                  | Beginning Of Sequence                    |
| `vocabulaire`          | vocabulaire          | 26 lettres + BOS = 27                    |
| `identifiant`          | identifiant          | Numéro unique par token                  |
| `vecteur`              | vecteur              | Liste de 16 nombres                      |
| `dimension`            | dimension            | 16 valeurs par vecteur                   |
| `parametre`            | paramètre            | 4 192 nombres ajustables                 |
| `logits`               | logits               | Scores bruts avant softmax               |
| `neurone`              | neurone              | Unité de calcul                          |
| `taux-apprentissage`   | taux d'apprentissage | Taille du pas d'ajustement               |
| `moyenne-mobile`       | moyenne mobile       | Moyenne lissée                           |
| `distribution`         | distribution         | Répartition des probabilités             |
| `tokeniseur`           | tokeniseur           | Programme de découpage                   |
| `wte`                  | wte                  | Word Token Embeddings                    |
| `wpe`                  | wpe                  | Word Position Embeddings                 |
| `connexion-residuelle` | connexion résiduelle | x + f(x)                                 |

### 8.2 Tier 2 — Tooltip + Modal "En savoir plus" (14 termes)

| ID                          | Label FR                  | Modal (~150-250 mots chacun)     |
| --------------------------- | ------------------------- | -------------------------------- |
| `plongement`                | plongement                | Analogie GPS dans espace 16D     |
| `attention`                 | attention                 | Q/K/V, analogie salle de classe  |
| `softmax`                   | softmax                   | e^x / Σe^x, amplification        |
| `relu`                      | ReLU                      | Filtre positif, non-linéarité    |
| `mlp`                       | MLP                       | Expansion 16→64→16               |
| `rmsnorm`                   | RMSNorm                   | Normaliseur de volume            |
| `loss`                      | loss                      | -log(P), baseline ~3.30          |
| `gradient`                  | gradient                  | Direction + magnitude par param  |
| `retropropagation`          | rétropropagation          | Backprop, enquête inversée       |
| `adam`                      | Adam                      | Adaptive Moment Estimation       |
| `temperature`               | température               | Diviseur de logits               |
| `echantillonnage`           | échantillonnage           | Roue de la fortune               |
| `generation-autoregressive` | génération autorégressive | Token par token, gauche à droite |

Chaque entrée `long` contient 3-5 paragraphes séparés par `\n\n`, rendus comme `<p>` dans le modal.

---

## 9. Visualisations et composants spécialisés

### 9.1 Heatmap (wte / wpe)

| Prop           | Type                  | Description                        |
| -------------- | --------------------- | ---------------------------------- |
| `matrix`       | `Value[][]`           | Matrice de poids (autograd Values) |
| `rowLabels`    | `string[]`            | Labels des lignes                  |
| `colCount`     | `number`              | Nombre de colonnes (= N_EMBD = 16) |
| `highlightRow` | `number?`             | Ligne surlignée                    |
| `onHoverRow`   | `(row\|null) => void` | Callback hover                     |

- **Rendu** : `<table class="heatmap">` avec headers de colonne (d0..d15)
- **Couleur** : `valToColor(value)` — interpolation runtime RGB :
  - Négatif → terracotta (194, 131, 116)
  - Positif → sage vert (138, 170, 107)
  - Intensité proportionnelle à la valeur normalisée
- **Interaction** : roving tabindex (W-1), Arrow Up/Down/Home/End pour naviguer les lignes
- **Keyboard hint** : affiché uniquement si `onHoverRow` fourni, format `"↑↓ Début Fin"`

### 9.2 VectorBar

| Prop     | Type       |
| -------- | ---------- |
| `values` | `number[]` |
| `label`  | `string?`  |

Strip horizontal de `.vector-cell` colorés via `valToColor()`.

### 9.3 EmbeddingBarChart

| Prop        | Type                                                    |
| ----------- | ------------------------------------------------------- |
| `values`    | `number[] \| null`                                      |
| `label`     | `string \| null`                                        |
| `charStats` | `CharStats \| null`                                     |
| `emptyText` | `string` (défaut: "Survole une lettre dans le tableau") |

- Empty state : texte italique centré
- Chart : barres verticales, positif (vert) vers le haut, négatif (rouge) vers le bas depuis la ligne zéro
- Hauteur : `min(val/maxAbs * 50, 50)%`
- Animation CSS : `transition: height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce)

### 9.4 AttnMatrix

| Prop           | Type               |
| -------------- | ------------------ |
| `matrix`       | `number[][]` (T×T) |
| `tokens`       | `string[]`         |
| `highlightRow` | `number?`          |
| `compact`      | `boolean?`         |

- `<table class="attn-matrix">` avec `border-collapse: separate`
- Cellules masquées (col > row, masque causal) : `—` avec `.attn-cell--masked`
- Cellules actives : `background: rgba(122, 162, 247, weight)`
- Texte blanc si `w > 0.3`, sinon `--text-dim`

### 9.5 BertVizView

| Prop                 | Type                              |
| -------------------- | --------------------------------- |
| `matrices`           | `number[][][]` (N_HEAD × T × T)   |
| `tokens`             | `string[]`                        |
| `tokenIds`           | `number[]`                        |
| `activeHead`         | `number \| "all"`                 |
| `onActiveHeadChange` | `(head: number \| "all") => void` |
| `selectedSrc`        | `number`                          |
| `onClickSrc`         | `(pos: number) => void`           |
| `hoverSrc`           | `number \| null`                  |
| `onHoverSrc`         | `(pos: number \| null) => void`   |

**Export constant** : `HEAD_COLORS = ["var(--blue)", "var(--purple)", "var(--cyan)", "var(--green)"]`

**Layout** : 3 colonnes (source tokens | SVG | dest tokens)

- BOX_H=44, GAP=6, SVG_W=180, HEADER_H=22
- SVG Bézier : `M 0 y1 C cx1 y1, cx2 y2, SVG_W y2`
- Opacity = weight value, strokeWidth = 1 + weight×4
- Hover dims non-survolés à 0.25
- Couleurs : thème-réactives via CSS variables en stroke

### 9.6 ProbabilityBar

| Prop         | Type                                  |
| ------------ | ------------------------------------- |
| `items`      | `ProbItem[]` ({id, char, prob})       |
| `maxProb`    | `number`                              |
| `labelStyle` | `(item) => CSSProperties` (optionnel) |
| `barColor`   | `(item) => string` (optionnel)        |

Barre horizontale. Largeur = `prob/maxProb * 100%`. Couleur par défaut : `--blue` (normal), `--red` (BOS).

### 9.7 LossChart (Canvas)

`<canvas role="img" aria-label="...">` redimensionné via CSS (100%×220px).

Dessins :

1. Fond `--surface2`
2. Grille horizontale `--border`
3. Ligne loss brute `--blue` 44% opacité
4. Moyenne mobile `--green` 2px
5. Baseline 3.30 `--red` pointillé
6. Labels texte via `fillText`

Empty state : texte centré "Clique sur « Entraîner » pour commencer".

### 9.8 PCAScatterPlot

| Prop              | Type                              |
| ----------------- | --------------------------------- |
| `wteData`         | `number[][]` (27×16)              |
| `totalStep`       | `number`                          |
| `snapshots`       | `WteSnapshot[]`                   |
| `highlightLetter` | `number \| null`                  |
| `onHoverLetter`   | `(index: number \| null) => void` |

- Canvas 2D (641 lignes), pattern identique NNDiagram/LossChart
- **Points** : 27 dots (voyelles=`--cyan`, consonnes=`--orange`, BOS=`--purple`), labels lettres
- **Constellation** : lignes entre points proches, couleur par type (même type=couleur type, cross=`--border`), alpha/épaisseur par distance inversée
- **Axes** : lignes centrées sur l'origine PCA, labels "Composante 1" / "Composante 2"
- **Hover** : anneau lumineux (`shadowBlur` + `strokeStyle` couleur type), constellation highlight
- **Hover bidirectionnel** : `highlightLetter` prop → anneau sur le dot correspondant ; `onHoverLetter` callback → met à jour heatmap wte
- **Animation replay** : interpolation linéaire entre snapshots wte (ghost trails cyan 30%), bouton "Rejouer" conditionnel ≥3 snapshots
- **Vignette** : dégradé radial transparent→noir (effet observatoire)
- **Responsive** : hauteur 400→300→220px via media queries sur `.pca-canvas-wrap`
- `prefers-reduced-motion` : skip animation, état final immédiat
- IntersectionObserver (scroll reveal), ResizeObserver (responsive), MutationObserver (thème)
- Couleurs lues via `getComputedStyle` + `parseColor()` (réactif au changement de thème)

### 9.9 Composants atomiques

| Composant    | Props                                        | Couleur                                                               |
| ------------ | -------------------------------------------- | --------------------------------------------------------------------- |
| `HeatCell`   | `value: number`, `label: string`             | `rgba(122, 162, 247, value)`, texte blanc si >0.3                     |
| `NeuronCell` | `value: number`, `index: number`             | Actif: `rgba(158, 206, 106, min(1, v*2))` vert. Inactif: `--surface2` |
| `LossCell`   | `loss: number`, `from: string`, `to: string` | `rgba(247, 118, 142, min(1, loss/4))` rouge                           |

---

## 10. Animations et transitions

### 10.1 Keyframes

```css
@keyframes tokenSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
}
/* Durée: 0.3s ease backwards. Délai: i * 80ms par box */

@keyframes arrowFadeIn {
  from {
    opacity: 0;
  }
}
/* Durée: 0.2s ease backwards. Délai: i * 80 + 60ms */

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
/* Durée: 0.3s. Sur .gen-name (InferencePage) */
```

### 10.2 Transitions

| Élément              | Propriété | Durée        | Easing                                       |
| -------------------- | --------- | ------------ | -------------------------------------------- |
| `.token-box`         | all       | 0.2s         | default                                      |
| `.barchart-bar`      | height    | 0.35s        | `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce) |
| `.bv-weight-fill`    | width     | 0.35s        | ease                                         |
| `.prob-bar`          | width     | 0.3s         | default                                      |
| `.bv-svg path`       | opacity   | 0.15s        | default                                      |
| `.token-box--bv`     | opacity   | 0.15s        | default                                      |
| `.sidebar` (mobile)  | transform | 0.3s         | ease                                         |
| `.btn`, `.theme-btn` | all       | 0.15s / 0.2s | default                                      |

### 10.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Responsive et breakpoints

| Breakpoint | Cible        | Changements clés                                                                                                         |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| > 900px    | Desktop      | Layout par défaut                                                                                                        |
| ≤ 900px    | Tablet       | `.panel-row` → column, `.heatmap-with-bars` → column, `.barchart-side` → static                                          |
| ≤ 768px    | Mobile       | Sidebar cachée (translateX), hamburger visible, `.main` margin-left:0, padding:70px 16px, tooltip → fixed pleine largeur |
| ≤ 480px    | Petit mobile | Dimensions réduites partout, sidebar 240px                                                                               |

### Mobile sidebar

- Hamburger : `.mobile-menu-btn` fixed (top:16px, left:16px, z-index:1000)
- Overlay : `.mobile-overlay` fixed inset:0, backdrop-filter blur(2px)
- Sidebar : z-index:20, translateX(-100%) → translateX(0) quand `.mobile-open`
- Fermeture : clic overlay OU clic nav button

---

## 12. Accessibilité (a11y)

### 12.1 Landmarks

- `<aside class="sidebar">` : navigation latérale
- `<header>` : dans sidebar
- `<nav>` : navigation par page
- `<main class="main">` : contenu principal
- `<section aria-labelledby="page-title-{id}">` : chaque page (via PageSection)

### 12.2 Focus visible

Tous les éléments interactifs : `outline: 2px solid var(--blue)`, `outline-offset: 2px` (sidebar nav: -2px inset).

### 12.3 Screen reader

- `.sr-only` : labels invisibles pour inputs
- `aria-hidden="true"` : SVGs décoratifs (sidebar buttons ont texte visible)
- `aria-label` dynamique : LossChart canvas, erreur fallback
- `aria-describedby` : Term tooltip quand visible
- `role="status"` : loading fallback
- `role="img"` : LossChart canvas, EmbeddingBarChart container

### 12.4 Clavier

- **Roving tabindex** (Heatmap) : ArrowUp/Down/Home/End, un seul tabIndex=0
- **Escape** : ferme tooltip Term
- **Tab** : Term, tous les boutons, inputs
- Hint clavier : `"↑ ↓ Début Fin"` sous Heatmap interactif

### 12.5 Dialogs

- Native `<dialog>` avec `showModal()` (trap focus automatique navigateur)
- Backdrop : `rgba(0,0,0,0.55)` + `backdrop-filter: blur(3px)`
- Close : Escape (natif), clic backdrop (via `onCancel`), bouton explicite

### 12.6 Share dialog (QR code)

- Native `<dialog class="share-dialog">` ouverte via bouton Partager dans le footer sidebar
- Contenu : titre "Partager", SVG QR code statique inline (pré-généré, `fill="currentColor"` → thème-réactif), URL texte, bouton Fermer
- Close : Escape (natif), clic backdrop, bouton explicite
- `aria-label="Partager"` sur le bouton déclencheur

---

## 13. Engine API (read-only)

> Le dossier `src/engine/` est **read-only** (code upstream Karpathy). Seul `createModel(inputDocs?)` accepte un param optionnel (notre seule modification).

### 13.1 Constants

```typescript
N_EMBD     = 16    // dimension des vecteurs
N_HEAD     = 4     // nombre de têtes d'attention
N_LAYER    = 1     // nombre de couches transformer
BLOCK_SIZE = 16    // taille max de séquence
HEAD_DIM   = 4     // N_EMBD / N_HEAD
vocabSize  = 27    // 26 lettres + BOS
BOS        = 26    // id du token BOS
uchars     = ["a".."z"]  // alphabet
charToId   = { a:0, b:1, ... z:25 }
```

### 13.2 Types principaux

```typescript
interface ModelState {
  stateDict: Record<string, Value[][]>;
  params: Value[];
  adamM: Float64Array;
  adamV: Float64Array;
  totalStep: number;
  lossHistory: number[];
  docs: string[];
  rng: () => number;
}

interface ForwardTrace {
  tokenId: number;
  posId: number;
  tokEmb: number[]; // [N_EMBD]
  posEmb: number[]; // [N_EMBD]
  combined: number[]; // [N_EMBD]
  afterNorm: number[]; // [N_EMBD]
  preAttnNorm: number[]; // [N_EMBD] — rmsnorm before Q/K/V
  q: number[]; // [N_EMBD]
  k: number[]; // [N_EMBD]
  v: number[]; // [N_EMBD]
  attnWeights: number[][]; // [N_HEAD][T] — PAS T×T !
  afterAttn: number[]; // [N_EMBD]
  preMlpNorm: number[]; // [N_EMBD] — rmsnorm before MLP
  mlpHidden: number[]; // [N_EMBD * 4 = 64]
  mlpActiveMask: boolean[]; // [64]
  afterMlp: number[]; // [N_EMBD]
  logits: number[]; // [vocabSize = 27]
  probs: number[]; // [vocabSize = 27]
}

interface TrainStepResult {
  loss: number;
  doc: string;
  lr: number;
  tokens: number[];
  perPositionLoss: number[];
}

interface InferenceStep {
  pos: number;
  probs: number[];
  chosenId: number;
  chosenChar: string;
  top5: { id: number; char: string; prob: number }[];
}
```

### 13.3 Fonctions

| Fonction       | Signature                                                           | Notes                  |
| -------------- | ------------------------------------------------------------------- | ---------------------- |
| `tokenize`     | `(name: string) => number[]`                                        | BOS + chars + BOS      |
| `tokenLabel`   | `(id: number) => string`                                            | "BOS" si id=26         |
| `createModel`  | `(inputDocs?: string[]) => ModelState`                              | Seul point d'extension |
| `gptForward`   | `(tokenId, posId, keys, vals, state, trace?) => { logits, trace? }` | Mute keys/vals (push)  |
| `trainStep`    | `(state, totalTargetSteps) => TrainStepResult`                      | Mute state in-place    |
| `generateName` | `(state, temperature?) => { name, steps }`                          | temp défaut 0.5        |
| `linear`       | `(x: Value[], w: Value[][]) => Value[]`                             | Projection linéaire    |
| `softmax`      | `(logits: Value[]) => Value[]`                                      | —                      |
| `rmsnorm`      | `(x: Value[]) => Value[]`                                           | —                      |

### 13.4 Pattern KV-cache (AttentionPage)

```typescript
const keys: Value[][][] = Array.from({ length: N_LAYER }, () => []);
const vals: Value[][][] = Array.from({ length: N_LAYER }, () => []);
for (let pos = 0; pos < n; pos++) {
  const { trace } = gptForward(tokens[pos], pos, keys, vals, model, true);
  // keys et vals sont mutés à chaque appel (push)
}
```

La matrice T×T pour BertViz est assemblée HORS de l'engine :

```typescript
function buildAttnMatrix(traces: ForwardTrace[], head: number): number[][] {
  return traces.map((trace) => {
    const row = new Array(T).fill(0);
    trace.attnWeights[head].forEach((w, i) => {
      row[i] = w;
    });
    return row;
  });
}
```

---

## 14. Datasets

```typescript
interface Dataset {
  id: string;
  label: string;
  description: string;
  words: string[];
}
```

| ID               | Label             | Taille | Source            |
| ---------------- | ----------------- | ------ | ----------------- |
| `prenoms-simple` | Prénoms FR (50)   | 50     | INSEE (défaut)    |
| `prenoms`        | Prénoms FR (1000) | 1 000  | INSEE 2024        |
| `prenoms-insee`  | Prénoms FR (33k)  | 33 235 | data.gouv.fr      |
| `pokemon-fr`     | Pokémon FR (1022) | 1 022  | —                 |
| `dinosaures`     | Dinosaures (1530) | 1 530  | —                 |
| `names-en`       | Prénoms EN (8000) | ~8 000 | Karpathy/makemore |

---

## 15. Utilitaires

### 15.1 `classifyHead(matrix: number[][]): HeadPersonality`

Classifie dynamiquement un head d'attention en 4 personnalités :

- **Ancrage** : regarde principalement le premier token (BOS)
- **Précédent** : regarde principalement le token juste avant
- **Écho** : regarde principalement lui-même
- **Contexte** : distribution relativement uniforme

### 15.2 `headExplanation(personality, token): ReactNode`

Retourne un JSX avec une explication FR de la personnalité du head. Aucun `dangerouslySetInnerHTML`.

### 15.3 `pca2d(data: number[][]): [number, number][]`

Projection PCA analytique (pas de bibliothèque). Centrage des données, covariance 2×2, résolution analytique des vecteurs propres, projection sur les 2 premières composantes. Retourne un tableau de coordonnées `[x, y]`.

### 15.4 `parseColor(str: string): [number, number, number]`

Parse une couleur CSS (`#rrggbb`, `rgb(r,g,b)`, `rgba(r,g,b,a)`) en triplet RGB. Fallback `[128,128,128]` pour chaîne vide. Utilisé par `PCAScatterPlot` pour extraire les couleurs CSS variables (`getComputedStyle`).

### 15.5 `computeCharStats(docs: string[]): Map<string, CharStats>`

```typescript
interface CharStats {
  nameCount: number;
  totalNames: number;
  pct: string; // "73%"
  topFollowers: string[]; // max 3
  topPreceders: string[]; // max 3
}
```

### 15.6 `getCssVar(name: string): string`

Raccourci pour `getComputedStyle(document.documentElement).getPropertyValue(name).trim()`. Utilisé par tous les composants Canvas (LossChart, PCAScatterPlot, NNDiagram, FullNNDiagram, AttnMatrix, Heatmap) pour lire les CSS custom properties de façon réactive au thème.

### 15.7 `valToColor(value: number): { background: string; color: string }`

Interpolation RGB runtime : négatif → terracotta (194,131,116), positif → sage vert (138,170,107). Retourne background + foreground (noir/blanc selon luminosité). Utilisé par Heatmap, VectorBar, HeatCell.

### 15.8 `useCanvasObservers(canvasRef, drawFn)`

Hook custom combinant IntersectionObserver (scroll reveal) + ResizeObserver (responsive canvas sizing) + MutationObserver (thème data-theme change). Pattern partagé par NNDiagram et FullNNDiagram.

### 15.9 `canvasInteraction(canvas, nodes, callbacks)`

Utilitaire pour détecter hover/click sur des "nodes" dessinés dans un Canvas 2D (hit-testing par distance). Utilisé par NNDiagram et FullNNDiagram pour l'interactivité tooltip au survol.

---

## 16. Store (gestion d'état)

```typescript
// modelStore.ts — useSyncExternalStore pattern
let model: ModelState;
let version: number;

export function resetModel(datasetId?: string): void;
export function notifyModelUpdate(): void;
export function getModelTotalStep(): number; // non-réactif
export function useModel(): ModelState; // hook React
export function pushWteSnapshot(model: ModelState): void; // deep copy wte
export function getWteSnapshots(): WteSnapshot[]; // {step, wte}[]
```

**Pattern** : version counter + Set<Listener>. `model` est muté in-place par `trainStep`, la version est incrémentée via `notifyModelUpdate()`.

**Duplication datasetId** : `App.tsx` garde `datasetId` pour l'UI sidebar, le store garde `currentDatasetId` pour `resetModel()`. Synchronisés via `handleDatasetChange`.

---

## 17. Tests existants

148 tests dans 29 fichiers. Framework : Vitest + jsdom + @testing-library/react.

| Fichier test               | Nb  | Cible                                            |
| -------------------------- | --- | ------------------------------------------------ |
| glossary.test.ts           | 8   | Intégrité données glossaire                      |
| datasets.test.ts           | 19  | Intégrité datasets                               |
| Term.test.tsx              | 12  | Tooltip/modal composant                          |
| Heatmap.test.tsx           | 12  | Roving tabindex, clavier, hint                   |
| ProbabilityBar.test.tsx    | 7   | Rendu, styles                                    |
| EmbeddingBarChart.test.tsx | 4   | Empty state, bars                                |
| TrainingPage.test.tsx      | 2   | rAF cleanup, bouton stop                         |
| InferencePage.test.tsx     | 6   | Labels, boutons, keys stables                    |
| PageSection.test.tsx       | 3   | Landmarks, aria-labelledby                       |
| ErrorBoundary.test.tsx     | 3   | Rendu, catch, reload                             |
| LossChart.test.tsx         | 2   | role="img", aria-label                           |
| TokenizerPage.test.tsx     | 2   | Label htmlFor, sr-only                           |
| ForwardPassPage.test.tsx   | 3   | 26 token buttons, 16 position buttons, canvas NN |
| autograd.test.ts           | 5   | Arithmetic, backward                             |
| model.test.ts              | 5   | tokenize, softmax, create, forward, train        |
| random.test.ts             | 1   | Determinism                                      |
| charStats.test.ts          | 5   | Fréquences, bigrams                              |
| classifyHead.test.ts       | 4   | 4 personnalités                                  |
| modelStore.test.ts         | 8   | Hook, reset, notify, unsub, snapshots            |
| pca.test.ts                | 6   | Identité, corrélation, forme, taille, vide       |
| parseColor.test.ts         | 5   | hex6, rgb, rgba, hex3, fallback                  |
| EmbeddingsPage.test.tsx    | 4   | PCA canvas, wrap, hover, badge                   |
| NNDiagram.test.tsx         | 2   | Canvas role/aria-label, Rejouer                  |
| HomePage.test.tsx          | 3   | Pitch+button, onStart callback, 8 steps          |
| ConclusionPage.test.tsx    | 3   | 8 rows table, Karpathy link, fondations text     |
| FullModelPage.test.tsx     | 3   | PageSection, FullNNDiagram canvas, page-desc     |
| FullNNDiagram.test.tsx     | 3   | Canvas role/aria-label, légende, animation       |
| App.share.test.tsx         | 3   | Share button, dialog open, QR canvas             |

---

## 18. Décisions architecturales à préserver

| Décision                                      | Justification                                                       |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Engine read-only                              | Code upstream Karpathy, pas de divergence                           |
| `useSyncExternalStore` + version counter      | Modèle muté in-place (performance), React notifié manuellement      |
| `memo()` sur toutes les pages                 | Pas de re-render si le model n'a pas changé                         |
| `React.lazy` + Suspense                       | Une seule page chargée à la fois                                    |
| `window.confirm()` → native `<dialog>`        | Proportionné pour confirmation simple                               |
| `window.location.reload()` dans ErrorBoundary | Un setState re-crasherait sur le même enfant                        |
| Roving tabindex (Heatmap)                     | WCAG 2.1 : un seul tab stop par widget composite                    |
| Tooltip `::before` bridge                     | WCAG 1.4.13 : contenu hover accessible sans perte                   |
| `valToColor()` runtime RGB                    | Impossible en CSS pur (Math.floor sur valeurs dynamiques)           |
| Singleton dialog (TermProvider)               | Un seul modal glossaire partagé par toutes les pages                |
| BertViz état lifté                            | Click source token → met à jour TOUS les panneaux de la page        |
| rAF loop + cleanup                            | C-6 pattern : cancelAnimationFrame dans stop() ET useEffect cleanup |
| Stable keys (module counter)                  | R-3 : `nextResultId++` pour InferencePage results                   |
| Visited dots (localStorage)                   | `Set<string>` persisté, dot vert si page visitée et non-active      |
| Sidebar 3 blocs avec `.nav-sep`               | Séparateurs visuels (border-top) entre Accueil / Étapes / Synthèse  |
| HomePage sans `<Term>`                        | Zéro jargon technique sur la page d'accueil — public 10-14 ans      |
| FullNNDiagram indépendant de NNDiagram        | Layout/animation différents, 16 colonnes vs 7, real data only       |
| `getCssVar()` + `parseColor()` shared utils   | Canvas thème-réactif sans duplication getComputedStyle              |
| `useCanvasObservers` hook                     | DRY triple observer (Intersection+Resize+Mutation) pour Canvas      |
| Share button + QR code (SVG statique inline)  | Zéro dep runtime, pré-généré, dialog native                         |
