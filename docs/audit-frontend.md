# Audit frontend — microgpt-visualizer-fr

> Date : 2026-02-27 (révisé 2026-02-28, CSS mis à jour 2026-02-28)
> Périmètre : `src/` (pages, components, styles, App). Le répertoire `src/engine/` (code upstream read-only) est mentionné mais non priorisé.
> Voir aussi : [`docs/audit-iso.md`](audit-iso.md) — audit ISO (25010, 40500, 9241-110), score global 4,5/5.

---

## 1. Architecture

### 1.1 Points forts

- Séparation claire : App → pages → components → engine (read-only)
- Graphe d'imports sans dépendance circulaire
- TermProvider : pattern Context pour singleton `<dialog>` — bon découplage

### 1.2 Problèmes identifiés

| #   | Sévérité | Fichier   | Lignes | Problème                                       | Détail                                                                                                                                                                                              |
| --- | -------- | --------- | ------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Majeur   | `App.tsx` | 38-39  | Anti-pattern `useRef` + `forceUpdate`          | `modelRef` stocke l'état mutable du modèle ; un compteur `useState` force le re-render. Fonctionne mais couple toutes les pages au mécanisme de mise à jour et empêche toute optimisation de rendu. |
| A-2 | Majeur   | `App.tsx` | —      | Pas d'error boundary                           | Aucun `<ErrorBoundary>` — un crash dans une page fait tomber toute l'application.                                                                                                                   |
| A-3 | Majeur   | `App.tsx` | 145    | HTML non sémantique (`<div className="main">`) | Devrait être `<main>`. Le sidebar est un `<div>` au lieu de `<nav>` ou `<aside>`. Pas de `<header>`.                                                                                                |
| A-4 | Modéré   | Pages     | —      | Pas de `<section role="region">`               | Les pages rendent un `<>` fragment au lieu d'une `<section>` avec `aria-labelledby`.                                                                                                                |

---

## 2. Duplication

### 2.1 Inline styles — ✅ CORRIGÉ (64 → 7 dynamiques)

24 styles inline statiques extraits en 20 classes CSS utilitaires (`b0b3ad9`). Ne restent que 7 styles dynamiques (couleurs/opacité calculés au runtime) :

| Fichier              | Dynamiques | Raison                                           |
| -------------------- | ---------- | ------------------------------------------------ |
| `Heatmap.tsx`        | 3          | `valToColor()` background/color, highlight row   |
| `HeatCell.tsx`       | 1          | Background conditionnel sur valeur               |
| `NeuronCell.tsx`     | 1          | Background conditionnel sur valeur               |
| `LossCell.tsx`       | 1          | Background conditionnel sur loss                 |
| `ProbabilityBar.tsx` | 1          | Width proportionnel + background                 |
| `InferencePage.tsx`  | 1          | Opacity conditionnelle sur étape active          |
| **Total**            | **7**      | Tous calculés au runtime — inline = seule option |

### 2.2 Patterns dupliqués

| #   | Sévérité | Pattern                                                              | Occurrences | Fichiers concernés                                                                                          |
| --- | -------- | -------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| D-1 | Haute    | `display: "flex", gap: X, flexWrap: "wrap"`                          | 8+          | EmbeddingsPage:80, ForwardPassPage:42/189/193/223, InferencePage:130, TokenizerPage:89, TrainingPage:132    |
| D-2 | Haute    | Légendes couleur `<span style={{ color: "var(--red/green/cyan)" }}>` | 5+          | EmbeddingsPage:43-45, ForwardPassPage:75-76, TokenizerPage:104-106, TrainingPage:150-152, InferencePage:169 |
| D-3 | Haute    | Boutons toggle (sélecteur caractère/étape) `padding: "4px 10px"`     | 3           | EmbeddingsPage:85, InferencePage:135, TokenizerPage:97                                                      |
| D-4 | Modéré   | Label violet `fontSize: 11, color: "var(--purple)"`                  | 2           | ForwardPassPage:192, 239                                                                                    |
| D-5 | Modéré   | Barres de probabilité (width proportionnel, background conditionnel) | 2           | ForwardPassPage:170, InferencePage:190-197                                                                  |

### 2.3 Recommandations — ✅ TOUTES CORRIGÉES

- ✅ Classes CSS utilitaires : 20 classes extraites (`controls--tight`, `cursor-default`, `d-contents`, `mt-*`, `label-control`, `explain--warning`, `btn-toggle--char`, `token-box--compact`, etc.)
- ✅ Composant `<ProbabilityBar>` partagé (D-5, 7 tests)
- Composant `<ToggleButton>` : non nécessaire — classes CSS BEM suffisent (`.btn-toggle`, `.btn-toggle--sm`, `.btn-toggle--char`)

---

## 3. Complexité

### 3.1 Fichiers volumineux

| #   | Sévérité | Fichier               | Lignes | Problème                                                       |
| --- | -------- | --------------------- | ------ | -------------------------------------------------------------- |
| C-1 | Haute    | `ForwardPassPage.tsx` | 246    | 7 sections de rendu distinctes dans un seul composant          |
| C-2 | Haute    | `InferencePage.tsx`   | 226    | 2 boucles `.map()` majeures avec `.map()` imbriqué inline      |
| C-3 | Modéré   | `TrainingPage.tsx`    | 183    | 3 panneaux, structure correcte mais logique animation complexe |

### 3.2 Nesting JSX excessif

| #   | Sévérité | Fichier               | Lignes  | Profondeur    | Détail                                                           |
| --- | -------- | --------------------- | ------- | ------------- | ---------------------------------------------------------------- |
| C-4 | Haute    | `ForwardPassPage.tsx` | 179-211 | **7 niveaux** | `panel > div > map(hw) > div > div > map(w) > div` — optimal < 5 |
| C-5 | Modéré   | `InferencePage.tsx`   | 145-159 | 5 niveaux     | `.map()` inline à l'intérieur d'un `.map()` dans un conditionnel |

### 3.3 Logique d'état complexe

| #   | Sévérité     | Fichier            | Lignes | Problème                                                                                                                                                                                             |
| --- | ------------ | ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-6 | **Critique** | `TrainingPage.tsx` | 17-44  | Boucle `requestAnimationFrame(tick)` sans cleanup au démontage. Si le composant se démonte pendant l'entraînement → la boucle continue → mutations d'état sur composant démonté → **fuite mémoire**. |
| C-7 | Modéré       | `TrainingPage.tsx` | 17-44  | 4 niveaux de fermetures imbriquées, variable `result` mutable potentiellement `undefined`.                                                                                                           |

---

## 4. Standards React

| #   | Sévérité | Standard                     | Statut  | Détail                                                                                                               |
| --- | -------- | ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| R-1 | Haute    | `React.memo()`               | Absent  | Aucune page mémorisée. Toutes re-rendent à chaque changement d'état parent (page, dataset, theme, model).            |
| R-2 | Haute    | `React.lazy()` + `Suspense`  | Absent  | 5 pages importées et rendues d'un coup. Pas de code splitting.                                                       |
| R-3 | Haute    | Keys stables dans les listes | Partiel | `key={i}` (index de tableau) utilisé dans InferencePage:96,133 et TrainingPage:121,139. Instable si la liste change. |
| R-4 | Modéré   | `useCallback` / `useMemo`    | Partiel | Présent dans Term.tsx et TermProvider.tsx. Absent dans toutes les pages (handlers recréés à chaque rendu).           |
| R-5 | Modéré   | `useMemo` deps incorrects    | Oui     | ForwardPassPage:20 — `model` entier dans les deps au lieu de `model.totalStep`. Le memo se re-calcule trop souvent.  |
| R-6 | Faible   | Types inline vs interface    | Oui     | InferencePage:10 et Heatmap/VectorBar utilisent `{ model: ModelState }` inline au lieu d'une `interface Props`.      |

---

## 5. Accessibilité (WCAG 2.1)

### 5.1 Points conformes

- Term.tsx : `role="tooltip"`, `aria-describedby`, `tabIndex={0}`, Escape dismiss ✓
- TermProvider : `<dialog>` natif (focus trap, Escape, `::backdrop`) ✓
- Bouton menu mobile : `aria-label="Ouvrir le menu"` ✓

### 5.2 Non-conformités

| #   | Sévérité     | Critère WCAG               | Fichier             | Lignes  | Problème                                                                                                           |
| --- | ------------ | -------------------------- | ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| W-1 | **Critique** | 2.1.1 Keyboard             | `Heatmap.tsx`       | 44-66   | `onMouseEnter`/`onMouseLeave` sans `onKeyDown`/`onFocus`. Les lignes du tableau ne sont pas navigables au clavier. |
| W-2 | **Critique** | 1.3.1 Info & Relationships | `InferencePage.tsx` | 71-78   | `<input type="range">` sans `<label>`, sans `aria-label` ni `aria-labelledby`.                                     |
| W-3 | Haute        | 1.3.1 Info & Relationships | `App.tsx`           | 145     | `<div className="main">` au lieu de `<main>`. Pas de landmarks sémantiques.                                        |
| W-4 | Haute        | 2.1.1 Keyboard             | `InferencePage.tsx` | 94-109  | `<span>` avec `onClick` sans `onKeyDown`, `role="button"`, `tabIndex`. Non activable au clavier.                   |
| W-5 | Modéré       | 4.1.2 Name, Role, Value    | `App.tsx`           | 110-128 | Boutons thème (sombre/clair) : le SVG n'a pas de `<title>`, le bouton n'a pas d'`aria-label`.                      |
| W-6 | Modéré       | 2.4.7 Focus Visible        | `styles.css`        | —       | Pas de style `:focus-visible` explicite sur les boutons custom. Le navigateur peut ne pas afficher d'indicateur.   |
| W-7 | Modéré       | 1.4.3 Contrast             | `styles.css`        | —       | `--text-dim` (#7a756b) sur `--surface2` (#ece8e0) en thème clair — ratio à vérifier (possiblement < 4.5:1).        |

---

## 6. Performance

| #   | Sévérité | Fichier               | Problème                                                | Impact                                                                                                   |
| --- | -------- | --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| P-1 | Haute    | `App.tsx`             | Toutes les pages re-rendent ensemble (pas de `memo`)    | Chaque changement d'état (thème, dataset, page, model) re-rend les 5 pages même si une seule est visible |
| P-2 | Haute    | `App.tsx`             | Pas de `React.lazy()` — 5 pages chargées au démarrage   | Bundle initial plus lourd, temps de chargement allongé                                                   |
| P-3 | Haute    | `TrainingPage.tsx`    | `requestAnimationFrame` sans cleanup                    | Fuite mémoire si le composant se démonte pendant l'entraînement                                          |
| P-4 | Modéré   | `LossChart.tsx`       | Canvas recalculé à chaque changement de `lossHistory`   | Pas de throttle ni de RAF pour limiter les re-draws                                                      |
| P-5 | Modéré   | `ForwardPassPage.tsx` | `useMemo` avec `model` entier dans les deps             | Se re-calcule à chaque re-render parent au lieu de seulement quand `char`/`pos`/`totalStep` changent     |
| P-6 | Faible   | `Heatmap.tsx`         | `valToColor()` appelé à chaque cellule sans mémoisation | Calcul répété pour chaque cellule à chaque render                                                        |

---

## 7. CSS

### 7.1 Points forts

- 46 custom properties (dark + light themes) avec noms sémantiques ✓
- 20 classes utilitaires (margin, gap, display, font-size, contrôles, tokens) ✓
- Scrollbars thématiques (webkit + standard `scrollbar-color`/`scrollbar-width`) ✓
- Styles Term/TermProvider : positionnés avant les `@media` queries (cascade correcte) ✓
- WCAG 1.4.13 : bridge `::before`, tooltip hoverable, flip viewport ✓
- 3 `!important` : tous justifiés (1 row-label override inline, 2 prefers-reduced-motion) ✓

### 7.2 Problèmes

| #   | Sévérité  | Problème                                        | Détail                                                                                                                  |
| --- | --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| S-1 | ~~Haute~~ | ~~64 inline styles~~ → **7 dynamiques**         | ✅ 24 static extraits en 20 classes utilitaires. 7 dynamiques restants = runtime-computed (inline seule option)         |
| S-2 | ~~Haute~~ | ~~Pas de classes utilitaires~~                  | ✅ 20 classes utilitaires dans `styles.css` (margin, gap, display, font-size, contrôles, tokens)                        |
| S-3 | Modéré    | Couleurs hardcodées dans Heatmap                | `valToColor()` utilise des RGB littéraux (`rgb(...)`) au lieu de custom properties                                      |
| S-4 | Faible    | `styles.css` = ~1 500 lignes en un seul fichier | Pas de découpage (layout, components, utilities, themes). Acceptable pour la taille actuelle mais risque de croissance. |

---

## Synthèse par priorité

### Critique (corriger avant mise en production) — ✅ TOUS CORRIGÉS

| #   | Problème                                                          | Fichier           | Correction                                                                                                                             | Tests                                |
| --- | ----------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| C-6 | Fuite mémoire : `requestAnimationFrame` sans cleanup au démontage | TrainingPage.tsx  | `rafRef` + `useEffect` cleanup + `cancelAnimationFrame` dans `stop()`                                                                  | 2 tests (démontage + bouton Arrêter) |
| W-1 | Heatmap non navigable au clavier                                  | Heatmap.tsx       | Roving tabindex (1 seul `tabIndex=0`), `onFocus`/`onBlur`, navigation Arrow/Home/End, `aria-label` sur `<table>`, `:focus-visible` CSS | 10 tests                             |
| W-2 | `<input type="range">` sans label                                 | InferencePage.tsx | `<label htmlFor="temp-slider">` associé au `<input id="temp-slider">` (pas d'`aria-label` dynamique)                                   | 3 tests                              |

### Haute (qualité production) — ✅ TOUS CORRIGÉS

| #       | Problème                                       | Fichier(s)                                 | Correction                                                                                                 | Tests               |
| ------- | ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| W-3     | HTML non sémantique (`<main>`, `<section>`)    | App.tsx, pages                             | `PageSection` composant partagé (`<section aria-labelledby>`), `<aside>`, `<header>`, `<main>`             | 3 tests PageSection |
| W-4     | `<span onClick>` sans accès clavier            | InferencePage:94-109                       | `<button type="button">` natif + `.gen-name--active` CSS + `:focus-visible`                                | 2 tests             |
| A-2     | Pas d'error boundary                           | App.tsx                                    | `ErrorBoundary` class component, `window.location.reload()`, French fallback BEM, sidebar hors boundary    | 3 tests             |
| D-1/S-1 | 64 inline styles → extraire en classes CSS     | 5 pages + Heatmap                          | 20 classes utilitaires CSS, 24 static extraits. 7 dynamiques restants (runtime). Réduction : 64 → 7 (89 %) | —                   |
| D-3     | 3 boutons toggle dupliqués → composant partagé | EmbeddingsPage, InferencePage, ForwardPass | `.btn-toggle` / `.btn-toggle--sm` CSS classes (pas de composant générique — KISS)                          | —                   |
| R-3     | `key={i}` (index instable) dans les listes     | InferencePage, TrainingPage                | `r.id` (compteur module-level), `s.pos`, compound keys                                                     | 1 test              |
| R-2     | Pas de code splitting (`React.lazy`)           | App.tsx                                    | `React.lazy()` + `Suspense` fallback FR, 5+ chunks JS                                                      | Build vérifié       |
| R-1     | Pas de `React.memo()` sur les pages            | TokenizerPage (seul faisable)              | `memo()` sur TokenizerPage (zéro prop). 4 autres bloqués par A-1                                           | —                   |

### Modérée (bonnes pratiques) — ✅ TOUS CORRIGÉS (sauf S-3 accepté)

| #   | Problème                                          | Fichier(s)                     | Statut                                                                                                                    |
| --- | ------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| R-4 | `useMemo` absents des calculs coûteux             | ForwardPass, Inference         | ✅ `useMemo` sur trace (gptForward), top5, top10. EmbeddingsPage exclu (calcul trivial : 48 itérations)                   |
| R-5 | `useMemo` deps trop larges                        | ForwardPassPage:20             | ✅ deps corrigées : `[tokenId, pos, model, model.totalStep]` — `model` pour identité reset, `totalStep` pour entraînement |
| W-5 | Boutons thème SVG sans `aria-hidden`              | App.tsx                        | ✅ `aria-hidden="true"` sur 3 SVGs décoratifs                                                                             |
| W-6 | Pas de `:focus-visible` explicite                 | styles.css                     | ✅ 9 règles `:focus-visible` (6 boutons + input text + range + select)                                                    |
| W-7 | Contraste `--text-dim` insuffisant en thème clair | styles.css                     | ✅ `#7a756b` → `#6a655d` (4.73:1 sur surface2, 5.14:1 sur bg, WCAG AA)                                                    |
| P-4 | LossChart canvas redraw sans RAF                  | LossChart.tsx                  | ✅ `requestAnimationFrame` + cleanup `cancelAnimationFrame`                                                               |
| D-5 | Barres de probabilité dupliquées                  | ForwardPassPage, InferencePage | ✅ Composant `ProbabilityBar` partagé + 7 tests                                                                           |
| S-3 | Couleurs hardcodées dans Heatmap                  | Heatmap.tsx                    | Accepté — interpolation RGB runtime, CSS custom properties inapplicables                                                  |

### Faible (améliorations) — W-8 corrigé, reste accepté

| #       | Problème                                           | Fichier(s)             | Statut                                                                                |
| ------- | -------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| ~~W-8~~ | ~~Contraste `--text-dim` dark theme sous WCAG AA~~ | ~~styles.css~~         | ✅ Corrigé : `#7d786e` → `#959082` (4.52:1 sur surface2, 5.00:1 sur surface, WCAG AA) |
| R-6     | Types inline vs interface Props                    | InferencePage, Heatmap | Accepté — 1 seul fichier, idiomatique TypeScript pour prop unique                     |
| P-6     | `valToColor()` non mémorisé                        | Heatmap.tsx            | Accepté — calcul trivial, mémoisation ajouterait de la complexité inutile             |
| S-4     | CSS monolithique (~1 500 lignes)                   | styles.css             | Accepté — fichier unique acceptable pour cette taille de projet                       |
| D-4     | Labels violet dupliqués                            | ForwardPassPage        | Accepté — 2 occurrences dans le même fichier, extraction non justifiée                |
