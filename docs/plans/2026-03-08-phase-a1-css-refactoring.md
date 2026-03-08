# Phase A1 — Refactoring CSS structurel (sans redesign)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Assainir l'architecture CSS (2 150 lignes monolithiques → modulaire, tokenisée, cohérente) sans changer le rendu visuel.

**Architecture:** Découpage de `styles.css` en fichiers par scope, introduction de design tokens non-couleur, standardisation des transitions/breakpoints/animations, remplacement du hack `filter: brightness()`. Résultat visuellement identique pixel-perfect, mais maintenable et extensible.

**Tech Stack:** CSS custom properties, CSS files per component (pas de CSS Modules — garder la simplicité), Vitest pour tests de non-régression.

**Principe cardinal : AUCUN changement visuel.** Chaque tâche DOIT produire un rendu identique avant/après. Le playground-redesign.html est une référence future, PAS le scope de A1.

---

## Inventaire initial

| Métrique                  | Avant A1                                    |
| ------------------------- | ------------------------------------------- |
| Fichiers CSS              | 2 (`styles.css` 2 150L, `index.css` ~10L)   |
| Design tokens non-couleur | 0                                           |
| Breakpoints distincts     | 5 (767, 768, 480, 500, 900px) — incohérents |
| Patterns de transition    | 9 (durées 0.1s à 0.35s, easings mixtes)     |
| `@keyframes`              | 3 (`tokenSlideIn`, `arrowFadeIn`, `fadeUp`) |
| `filter: brightness()`    | 1 (`.btn:hover`)                            |
| Sections commentées       | 41                                          |
| `!important`              | 4 (tous justifiés)                          |

---

### Task 1 : Design tokens — spacing, radius, shadows, typography

**Files:**

- Modify: `src/styles.css` (`:root` / `[data-theme]` blocks)

**Step 1: Ajouter les tokens dans `:root`**

Extraire les valeurs hardcodées récurrentes en variables. Inventaire des valeurs à tokeniser :

```css
:root {
  /* --- Spacing --- */
  --sp-2: 0.125rem; /* 2px */
  --sp-4: 0.25rem; /* 4px */
  --sp-8: 0.5rem; /* 8px */
  --sp-12: 0.75rem; /* 12px */
  --sp-16: 1rem; /* 16px */
  --sp-24: 1.5rem; /* 24px */
  --sp-32: 2rem; /* 32px */

  /* --- Border radius --- */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* --- Shadows --- */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);

  /* --- Typography --- */
  --font-mono: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-md: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 22px;

  /* --- Transitions --- */
  --t-fast: 0.1s;
  --t-normal: 0.15s;
  --t-slow: 0.3s;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Step 2: Remplacer les valeurs hardcodées par les tokens**

Parcourir `styles.css` et remplacer :

- `border-radius: 8px` → `border-radius: var(--radius-md)`
- `border-radius: 4px` → `border-radius: var(--radius-sm)`
- `border-radius: 12px` → `border-radius: var(--radius-lg)`
- `font-family: "SF Mono"...` → `font-family: var(--font-mono)`
- `transition: all 0.15s` → `transition: all var(--t-normal)`
- `transition: ... 0.1s` → `transition: ... var(--t-fast)`
- `transition: ... 0.3s` → `transition: ... var(--t-slow)`
- `transition: ... 0.2s` → `transition: ... var(--t-normal)` (unifier 0.2s→0.15s ou créer `--t-medium: 0.2s` si écart visible)
- `cubic-bezier(0.34, 1.56, 0.64, 1)` → `var(--ease-spring)`
- Font sizes récurrentes vers les tokens

**Step 3: Vérifier visuellement**

Run: `pnpm dev` et comparer visuellement les 9 pages (dark + light) — AUCUNE différence visible.

**Step 4: Run tests**

Run: `pnpm test`
Expected: 192 tests PASS (aucun test ne dépend de valeurs CSS hardcodées)

**Step 5: Commit**

```bash
git add src/styles.css
git commit -m "refactor: extract design tokens (spacing, radius, shadows, typography, transitions)"
```

---

### Task 2 : Standardiser les breakpoints

**Files:**

- Modify: `src/styles.css` (media queries)

**Problème :** 5 breakpoints incohérents (480, 500, 767, 768, 900px). Les breakpoints 480/500 et 767/768 sont quasi-identiques.

**Step 1: Auditer chaque media query**

Lister toutes les `@media` et leur contenu. Décider du mapping :

| Actuel            | Standard | Nom                                      |
| ----------------- | -------- | ---------------------------------------- |
| `900px`           | `900px`  | `--bp-tablet` — tablette / petit desktop |
| `767px` + `768px` | `768px`  | `--bp-mobile` — mobile (iPad portrait)   |
| `480px` + `500px` | `480px`  | `--bp-small` — petits mobiles            |

**Step 2: Fusionner les breakpoints**

- Fusionner les règles `767px` dans `768px` (différence 1px non significative)
- Fusionner les règles `500px` dans `480px` (vérifier pas de conflit)
- Ajouter un commentaire de référence en haut de la section responsive :

```css
/* --- Breakpoints ---
 * Tablet:  max-width: 900px
 * Mobile:  max-width: 768px
 * Small:   max-width: 480px
 */
```

**Step 3: Vérifier visuellement**

Tester avec Chrome DevTools les largeurs 480, 768, 900, 1024px. Aucune régression.

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "refactor: standardize breakpoints (5 → 3: 900/768/480px)"
```

---

### Task 3 : Remplacer `filter: brightness()` par couleur oklch hover

**Files:**

- Modify: `src/styles.css` (`.btn:hover` rule, line ~320)

**Problème :** `.btn:hover { filter: brightness(1.15); }` — hack qui affecte TOUS les enfants du bouton (texte, icônes) et ne respecte pas l'espace colorimétrique oklch.

**Step 1: Identifier la couleur actuelle du `.btn` background**

Le `.btn` utilise `background: var(--surface2)`. En dark theme, `--surface2` = `oklch(0.294 0.004 106.7)`.

**Step 2: Créer des variantes hover explicites**

```css
[data-theme="dark"] {
  --surface2-hover: oklch(0.344 0.004 106.7); /* L +0.05 */
}
[data-theme="light"] {
  --surface2-hover: oklch(0.904 0.007 88.6); /* L -0.05 */
}
```

**Step 3: Remplacer le hack**

```css
/* AVANT */
.btn:hover {
  filter: brightness(1.15);
}

/* APRÈS */
.btn:hover {
  background: var(--surface2-hover);
}
```

**Step 4: Vérifier visuellement**

Comparer le hover de tous les boutons (sidebar, pages, toggles) dans les 2 thèmes.

**Step 5: Run tests**

Run: `pnpm test`
Expected: 192 PASS

**Step 6: Commit**

```bash
git add src/styles.css
git commit -m "refactor: replace filter:brightness() hack with oklch hover color"
```

---

### Task 4 : Découper `styles.css` — extraire les sections par composant

**Files:**

- Modify: `src/styles.css` (réduire)
- Create: fichiers CSS par composant/scope

**Principe :** Garder un `styles.css` central pour les fondations (reset, tokens, layout app, utilities, responsive global) et extraire les styles scoped par composant dans des fichiers dédiés importés dans `main.tsx`.

**Step 1: Identifier les blocs extractibles**

Blocs candidats (sections auto-contenues, référencées par 1 seul composant) :

| Section                         | Lignes ~approx | Fichier cible                       |
| ------------------------------- | -------------- | ----------------------------------- |
| Heatmap + bar chart layout      | ~170           | `src/components/Heatmap.css`        |
| NNDiagram canvas                | ~25            | `src/components/NNDiagram.css`      |
| FullNNDiagram canvas            | ~45            | `src/components/FullNNDiagram.css`  |
| PCA Scatter Plot                | ~180           | `src/components/PCAScatterPlot.css` |
| Attention weight cells + matrix | ~70            | `src/components/AttnMatrix.css`     |
| BertViz visualization           | ~110           | `src/components/BertVizView.css`    |
| MLP neuron cells                | ~15            | `src/components/NeuronCell.css`     |
| Loss cells                      | ~15            | `src/components/LossCell.css`       |
| Term tooltip + modal            | ~160           | `src/components/Term.css`           |
| Share button + dialog           | ~70            | `src/components/ShareDialog.css`    |
| Confirm dialog                  | ~35            | `src/components/ConfirmDialog.css`  |
| HomePage specific               | ~80            | `src/pages/HomePage.css`            |
| ConclusionPage specific         | ~55            | `src/pages/ConclusionPage.css`      |

**Step 2: Extraire un premier bloc (commencer par le plus simple)**

Commencer par `NeuronCell.css` (~15 lignes). Copier les règles `.neuron-cell`, `.neuron-grid` dans le nouveau fichier. Ajouter `import './NeuronCell.css'` dans `NeuronCell.tsx`. Supprimer de `styles.css`.

**Step 3: Vérifier**

Run: `pnpm dev` — le composant doit être visuellement identique.
Run: `pnpm test` — 192 PASS.

**Step 4: Extraire tous les autres blocs**

Répéter pour chaque bloc du tableau. Ordre suggéré : cellules simples (NeuronCell, LossCell, HeatCell) → composants Canvas (NNDiagram, FullNNDiagram, PCA) → composants complexes (Heatmap, AttnMatrix, BertViz, Term) → pages (HomePage, ConclusionPage) → dialogs (Share, Confirm).

**Step 5: Ajouter les imports dans chaque composant**

Chaque `.tsx` importe son `.css` : `import './NeuronCell.css'`. Pas d'import dans `main.tsx` sauf pour `styles.css` (fondations) et `index.css`.

**Step 6: Vérifier `styles.css` résiduel**

Ce qui RESTE dans `styles.css` :

- `:root` / `[data-theme]` tokens et couleurs
- Reset & scrollbar
- Body & app layout (`.app`, `.main`, `.sidebar`)
- Dataset picker
- Semantic utilities (`.text-red`, `.mt-8`, `.sr-only`)
- Reduced motion
- Responsive global (sidebar hide, mobile menu)

Estimer ~600-800 lignes résiduelles (vs 2 150 avant).

**Step 7: Run full test suite**

Run: `pnpm test`
Expected: 192 PASS

**Step 8: Commit**

```bash
git add src/styles.css src/components/*.css src/pages/*.css src/main.tsx src/components/*.tsx src/pages/*.tsx
git commit -m "refactor: split monolithic styles.css into per-component CSS files"
```

---

### Task 5 : Nettoyer les sélecteurs — scoping et nommage cohérent

**Files:**

- Modify: `src/styles.css` (fondations restantes)
- Modify: fichiers `.css` extraits en Task 4

**Step 1: Auditer les sélecteurs restants dans `styles.css`**

Vérifier qu'il n'y a pas de sélecteur orphelin (classe définie mais plus utilisée après extraction). Supprimer le cas échéant.

**Step 2: Renommer les sélecteurs incohérents**

Cas identifiés :

- `.select-native` → nom OK (descriptif)
- `.label-dim` → garder (BEM-ish cohérent)
- Vérifier la cohérence des noms de sections (`.nn-canvas-wrap` vs `.pca-canvas-wrap` → pattern `.*-canvas-wrap` cohérent ✓)

**Step 3: Documenter les conventions de nommage**

Ajouter un commentaire en tête de `styles.css` :

```css
/*
 * CSS conventions:
 * - BEM-ish: .component__element--modifier
 * - Component CSS: co-located in src/components/*.css or src/pages/*.css
 * - This file: foundations (tokens, reset, layout, utilities, responsive)
 * - Colors: oklch only (via CSS custom properties)
 * - Transitions: use --t-fast / --t-normal / --t-slow tokens
 * - Breakpoints: 900px (tablet) / 768px (mobile) / 480px (small)
 */
```

**Step 4: Commit**

```bash
git add src/styles.css src/components/*.css src/pages/*.css
git commit -m "refactor: clean up selectors and document CSS conventions"
```

---

### Task 6 : Centraliser les animations réutilisables

**Files:**

- Modify: `src/styles.css` (keyframes section)
- Possibly modify: component CSS files

**Step 1: Inventorier les 3 keyframes existants**

- `tokenSlideIn` : opacity 0→1, translateY 8px→0, scale 0.9→1 (0.3s ease)
- `arrowFadeIn` : opacity 0→1 (0.2s ease)
- `fadeUp` : opacity 0→1, translateY 6px→0 (0.3s)

**Step 2: Factoriser**

`tokenSlideIn` et `fadeUp` sont quasi-identiques (opacity + translateY). Garder les deux car les valeurs diffèrent (8px+scale vs 6px). Mais les regrouper dans une section clairement balisée :

```css
/* ═══════════════════════════════════════════
   Animations — bibliothèque partagée
   ═══════════════════════════════════════════ */

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tokenSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes arrowFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Step 3: Vérifier que `prefers-reduced-motion` les couvre tous**

La règle existante `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }` couvre tous les keyframes globalement. ✓

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "refactor: centralize keyframes in shared animations section"
```

---

### Task 7 : Tests de non-régression visuelle + nettoyage final

**Files:**

- Modify: tests existants si nécessaire
- Modify: `docs/analyse-effort-changement-theme.md` (marquer A1 FAIT)
- Modify: `PLAN.md`, `docs/fork-changes.md`, `README.md`

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: 192 PASS

**Step 2: Run build**

Run: `pnpm build`
Vérifier : pas de warning CSS supplémentaire, taille bundle CSS proche de 28 KB (peut légèrement augmenter à cause des imports multiples, mais Vite les concatene en production).

**Step 3: Vérification visuelle manuelle**

Parcourir les 9 pages en dark + light theme. Checklist :

- [ ] Accueil — grille 8 étapes, bouton Commencer
- [ ] Tokenisation — animation tokens, input
- [ ] Plongements — heatmap, bar chart, PCA scatter
- [ ] Propagation — FlowDiagram, NNDiagram, vectors
- [ ] Attention — BertViz SVG, matrices, token boxes
- [ ] Entraînement — LossChart canvas, heatmap loss
- [ ] Inférence — génération, probabilités, range slider
- [ ] Modèle complet — FullNNDiagram canvas, animation
- [ ] Conclusion — table, liens

**Step 4: Mettre à jour les docs**

- `docs/analyse-effort-changement-theme.md` : ajouter section 12 "Phase A1 : FAIT"
- `PLAN.md` : mettre à jour les métriques (nombre de fichiers CSS, lignes styles.css résiduel)
- `docs/fork-changes.md` : ajouter section "Phase A1 — refactoring CSS structurel"
- `README.md` : mettre à jour la structure projet si nécessaire

**Step 5: Commit**

```bash
git add docs/ PLAN.md README.md
git commit -m "docs: update all docs (Phase A1 CSS refactoring complete)"
```

---

## Résumé des tâches

| Task | Description                                                   | Fichiers                                 | Risque |
| ---- | ------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1    | Design tokens (spacing, radius, shadows, typo, transitions)   | `styles.css`                             | Faible |
| 2    | Standardiser breakpoints (5→3)                                | `styles.css`                             | Faible |
| 3    | Remplacer `filter: brightness()` → oklch hover                | `styles.css`                             | Faible |
| 4    | Découper `styles.css` → fichiers par composant (~13 fichiers) | `styles.css`, 13+ new `.css`, ~13 `.tsx` | Moyen  |
| 5    | Nettoyer sélecteurs, documenter conventions                   | `.css` files                             | Faible |
| 6    | Centraliser keyframes                                         | `styles.css`                             | Faible |
| 7    | Tests non-régression + docs                                   | tests, docs                              | Faible |

**Contrainte absolue :** Le rendu visuel DOIT être identique avant/après sur les 9 pages × 2 thèmes. Tout écart est un bug à corriger avant commit.
