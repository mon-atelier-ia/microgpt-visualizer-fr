# Analyse gain/effort — Changement de thème frontend

> Date : 2026-03-08
> Projet : microgpt-visualizer-fr
> Stack actuel : React 19 + TypeScript + Vite + CSS custom pur (1 fichier `styles.css`, ~2 140 lignes)
> Zéro dépendance UI runtime (pas de Tailwind, pas de shadcn, pas de CSS-in-JS)
> Décision : toute nouvelle palette sera full oklch

---

## 1. Situation actuelle — Diagnostic

### 1.1 Métriques mesurées

| Indicateur            | Valeur actuelle                                     | Commentaire                                    |
| --------------------- | --------------------------------------------------- | ---------------------------------------------- |
| CSS total             | 2 140 lignes, 1 fichier                             | Monolithique mais zéro CSS mort détecté        |
| CSS bundle (prod)     | 27.7 KB (5.9 KB gzip)                               | Bon — tout le CSS est utile                    |
| JS bundle principal   | 646 KB (202 KB gzip)                                | Lourd (datasets inlinés), indépendant du thème |
| Custom properties     | 20 variables (17 + 3 sémantiques), 2 palettes oklch | Architecture oklch complète                    |
| Usages `var(--*)` CSS | ~222                                                | Bon découplage couleurs/composants             |
| Usages `var(--*)` JSX | ~21 inline styles                                   | Raisonnable (tous dynamiques/conditionnels)    |
| Lectures runtime JS   | ~87 (`getCssVar`/`parseColor`)                      | Nécessaires pour les 6 Canvas                  |
| Sélecteurs CSS        | 250 classes, 21 descendants, 26 chaînés             | Spécificité faible — peu de conflits           |
| Dead CSS              | 0 classe inutilisée                                 | Pas de bloat                                   |
| `!important`          | 4 (justifiés)                                       | 1 override inline, 3 reduced-motion            |
| Composants Canvas     | 6 (dessin JS, thème-réactifs)                       | Point de couplage fort                         |
| RGB hardcodés         | 0 (éliminés Phase 0)                                | Résolu — CSS vars + oklch interpolation        |

### 1.2 Forces de l'architecture actuelle

- **Theming fonctionnel** : 17 CSS vars + `getCssVar()` = changement de palette en 1 endroit, propagation automatique (y compris Canvas)
- **Zéro dead CSS** : chaque classe est utilisée — pas de purge nécessaire
- **Spécificité plate** : peu de conflits de cascade, pas de `!important` abusifs
- **Bundle CSS léger** : 5.9 KB gzip, pas de framework superflu
- **Zéro dépendance UI** : pas de dette de mise à jour (Tailwind majors, shadcn breaking changes)
- **WCAG AA conforme** : 95 % conforme (audit ISO, score 4.5/5)

### 1.3 Faiblesses

- **Monolithique** : 1 fichier, pas de découpage par composant (risque croissance)
- **Pas de convention de nommage stricte** : mix de BEM-ish, utilitaires ad hoc, et noms longs
- **Pas de tokens design formalisés** : espacements/rayons/ombres hardcodés dans les règles (seules les couleurs sont tokenisées)
- **3 composants avec RGB hardcodé** : `HeatCell`, `NeuronCell`, `LossCell` — pas thématisables sans modification manuelle
- **`parseColor()` ne supporte que `#hex` et `rgb()`** : incompatible oklch
- **`valToColor()` interpole en RGB** : non perceptuellement uniforme
- **~50 constructions `rgba(r,g,b,a)` dans les Canvas** : toutes dépendent de `parseColor()` RGB

---

## 2. Décision : full oklch

### 2.1 Pourquoi oklch

| Propriété             | Hex/RGB (actuel)                                  | oklch                                                                           |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Harmonie des couleurs | Manuelle (chaque couleur choisie indépendamment)  | Rotation de hue = harmonies automatiques (complémentaire, triadique, etc.)      |
| Dark/light            | 2 palettes séparées, ajustées manuellement        | Ajuster L (lightness) suffit — chroma et hue sont préservés                     |
| Interpolation         | RGB = non-linéaire perceptuellement (gris boueux) | oklch = perceptuellement uniforme (dégradés propres)                            |
| Contraste WCAG        | Vérification manuelle par paire                   | L oklch corrèle mieux avec la luminosité perçue → prédiction plus fiable        |
| Modularité palette    | 17 vars indépendantes                             | Palette dérivable : 1 hue accent + règles = toutes les couleurs                 |
| Support navigateurs   | Universel                                         | 96 %+ (Chrome 111+, Safari 15.4+, Firefox 113+). Suffisant pour le public cible |

### 2.2 Contrainte bloquante : Canvas 2D API

Le Canvas 2D API (`ctx.fillStyle`, `ctx.strokeStyle`) accepte oklch dans les navigateurs récents, **mais `getComputedStyle()` retourne oklch quand les vars CSS sont en oklch**. Or :

- **`parseColor()`** ne parse que `#hex` et `rgb()` → crash silencieux (fallback gris `[128,128,128]`)
- **~50 constructions `rgba(r,g,b,a)`** dans 6 composants Canvas dépendent de `parseColor()` pour extraire les composantes R, G, B et les recombiner avec une alpha variable
- **`valToColor()`** interpole en espace RGB → résultats visuellement inférieurs en oklch

**Solution** : réécrire `parseColor()` pour supporter oklch et convertir en RGB, ou utiliser un helper `oklchToRgb()`. Les Canvas continuent de recevoir du `rgba()` — c'est la couche de conversion qui change.

### 2.3 Impact sur chaque option

| Surface                   | Impact oklch                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| CSS vars (`styles.css`)   | Trivial — `--blue: oklch(0.7 0.12 65)` fonctionne nativement                                             |
| `parseColor()`            | **Réécriture** — doit parser `oklch(L C H)` et convertir → `[r, g, b]`                                   |
| `valToColor()`            | **Réécriture** — interpolation en espace oklch (L, C, H linéaire) puis conversion → `rgba()` pour Canvas |
| 3 composants RGB hardcodé | Remplacement par CSS vars → `getCssVar()` + `parseColor()`                                               |
| ~50 Canvas `rgba()`       | Aucun changement — ils reçoivent toujours du RGB via `parseColor()`                                      |
| Tailwind (si A2)          | Tailwind v4 supporte oklch nativement dans la config                                                     |

---

## 3. Phase 0 — Socle commun (réutilisable A1 et A2) — FAIT

> Ce socle est un **gain net indépendant** : il améliore le code actuel sans engager de choix A1 ou A2. Il peut être mergé sur `main` et utilisé tel quel.

### 3.1 Tâches

| #    | Tâche                                                                              | Fichiers                                         | Effort (Claude Code) |
| ---- | ---------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------- |
| P0-1 | Concevoir la palette oklch (17 vars × 2 thèmes)                                    | Nouveau fichier ou `styles.css` L1-40            | 1-2h                 |
| P0-2 | Réécrire `parseColor()` : supporter oklch → RGB                                    | `parseColor.ts`, `parseColor.test.ts`            | 1-2h                 |
| P0-3 | Réécrire `valToColor()` : interpolation oklch                                      | `valToColor.ts` + nouveau test                   | 1h                   |
| P0-4 | Éliminer les 3 RGB hardcodés → CSS vars                                            | `HeatCell.tsx`, `NeuronCell.tsx`, `LossCell.tsx` | 30min                |
| P0-5 | Migrer les 17 CSS vars hex → oklch (2 palettes)                                    | `styles.css`                                     | 30min                |
| P0-6 | Vérifier contraste WCAG AA (2 thèmes)                                              | —                                                | 30min                |
| P0-7 | Tests : parseColor oklch, valToColor oklch, Canvas 6 composants, 9 pages visuelles | Tests existants + nouveaux                       | 1h                   |

**Effort total Phase 0 : 0.5-1 jour** (Claude Code + solo dev) — **FAIT le 2026-03-08** (172 tests, 7 commits)

### 3.2 Gains nets de Phase 0 (indépendants de A1/A2)

| Critère             | Gain      | Justification                                                                                                                                                   |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Qualité du code     | **Fort**  | Élimination des RGB hardcodés (3 composants), `parseColor` robuste (supporte tout format CSS), `valToColor` perceptuellement correct                            |
| Modernité           | **Fort**  | oklch = standard CSS Color Level 4 (2024). Signal technique fort. Peu de projets l'adoptent encore — avance significative                                       |
| Modularité          | **Moyen** | Palette dérivable par hue rotation. Dark/light = ajuster L. Ajout d'un thème futur = trivial                                                                    |
| Performance runtime | **Nul**   | `parseColor` oklch→RGB ajoute ~10 µs par appel. Négligeable sur ~87 appels                                                                                      |
| DX                  | **Moyen** | Une seule source de vérité couleur (oklch). Ajouter une couleur = choisir H, dériver L/C. Plus besoin de picker hex manuellement                                |
| Accessibilité       | **Moyen** | oklch L corrèle mieux avec la luminosité perçue → contraste plus prévisible. `valToColor` oklch = dégradés heatmap plus lisibles (pas de gris boueux au milieu) |
| Pérennité           | **Fort**  | oklch est le futur du CSS couleur. `parseColor` multi-format = pas besoin de réécrire si un navigateur change le format retourné par `getComputedStyle`         |

**Verdict : Phase 0 est un gain net.** Ratio gain/effort excellent (0.5-1 jour pour des gains forts en qualité, modernité, pérennité). Aucun risque de régression si bien testé. Totalement réutilisable que l'on choisisse ensuite A1, A2, ou ni l'un ni l'autre.

### 3.3 Ce qui N'EST PAS dans Phase 0

- Pas de changement de layout, espacements, arrondis, ombres
- Pas de changement de typographie (sauf si inclus dans le reskin palette)
- Pas de migration Tailwind
- Pas de découpage du fichier CSS
- Pas de nouveaux composants UI

---

## 4. Séquencement optimal

```
Phase 0 (socle oklch)          A1 (CSS redesign)          A2 (Tailwind)
─────────────────────          ──────────────────          ─────────────
P0-1  Palette oklch       ──→  Redesign CSS rules    ──→  Convert → Tailwind classes
P0-2  parseColor oklch         Revoir layout/spacing       Tailwind config oklch
P0-3  valToColor oklch         Revoir typo                 shadcn/ui composants
P0-4  Élim. RGB hardcodés      Revoir inline JSX           Toggle dark: prefix
P0-5  CSS vars → oklch         Breakpoints responsive      getCssVar compat
P0-6  WCAG check               WCAG re-check               WCAG re-check
P0-7  Tests                    Tests                       Tests

0.5-1 jour                     +0.5-1 jour                 +1-1.5 jours
```

### Chemins possibles

| Chemin                          | Effort total | Travail jeté                                   |
| ------------------------------- | ------------ | ---------------------------------------------- |
| **Phase 0 seul** (oklch + stop) | 0.5-1 j      | 0                                              |
| **Phase 0 → A1**                | 1-2 j        | 0                                              |
| **Phase 0 → A2**                | 1.5-2.5 j    | 0                                              |
| **Phase 0 → A1 → A2**           | 2-3.5 j      | ~0.5 j (CSS restructuré dans A1, jeté dans A2) |
| ~~A1 seul (sans Phase 0)~~      | ~~2-4 j~~    | ~~oklch non inclus = même dette technique~~    |
| ~~A2 seul (sans Phase 0)~~      | ~~1-2 j~~    | ~~oklch à refaire dans le contexte Tailwind~~  |

**Phase 0 n'est jamais du travail jeté.** C'est le seul investissement garanti réutilisable.

Faire A1 puis A2 ajoute ~0.5 jour de restructuration CSS jetée. Le chemin **Phase 0 → A2 directement** est le plus efficient si Tailwind est l'objectif final.

---

## 5. Grille d'évaluation des gains

| Critère                       | Poids | Description                                                  |
| ----------------------------- | ----- | ------------------------------------------------------------ |
| **Qualité du code**           | Fort  | Lisibilité, maintenabilité, conventions, testabilité du CSS  |
| **Modernité**                 | Moyen | Alignement avec les standards actuels (2026) du frontend     |
| **Modularité**                | Fort  | Découpage, réutilisabilité, isolation des composants         |
| **Performance runtime**       | Fort  | Taille bundle, temps de parsing CSS, coût reflow/repaint     |
| **DX (Developer Experience)** | Moyen | Autocomplétion, docs, outillage, onboarding d'un nouveau dev |
| **Accessibilité**             | Fort  | Conformité WCAG, contraste, focus visible                    |
| **Pérennité**                 | Moyen | Résistance à l'obsolescence, communauté, migrations futures  |

---

## 6. Option A1 — Redesign CSS custom pur (après Phase 0)

### Effort additionnel (post Phase 0)

| Tâche                                                                | Fichiers         | Effort (Claude Code) |
| -------------------------------------------------------------------- | ---------------- | -------------------- |
| Adapter les ~192 règles CSS (espacements, arrondis, ombres, tailles) | `styles.css`     | Moyen                |
| Revoir la typographie (font stack, échelle, poids)                   | `styles.css`     | Faible               |
| Revoir les 34 inline styles JSX                                      | 10+ composants   | Faible               |
| Tester les 4 breakpoints responsive                                  | `styles.css`     | Faible               |
| Mettre a jour les tests                                              | 29 fichiers test | Faible               |

**Effort additionnel : 0.5-1 jour** | **Effort total (Phase 0 + A1) : 1-2 jours**

### Gains (cumulés avec Phase 0)

| Critère             | Phase 0 seul | + A1   | Delta A1                                                |
| ------------------- | ------------ | ------ | ------------------------------------------------------- |
| Qualité du code     | Fort         | Fort   | Nul (déja acquis par Phase 0)                           |
| Modernité           | Fort         | Fort+  | Faible (nouveau look)                                   |
| Modularité          | Moyen        | Moyen  | Nul (même fichier CSS, sauf si on découpe — optionnel)  |
| Performance runtime | Nul          | Nul    | Nul                                                     |
| DX                  | Moyen        | Moyen  | Nul                                                     |
| Accessibilité       | Moyen        | Moyen+ | Faible (opportunité de revoir les contrastes exotiques) |
| Pérennité           | Fort         | Fort   | Nul                                                     |

**Gain net de A1 par rapport à Phase 0 seul : FAIBLE** — principalement esthétique. L'essentiel du gain technique est dans Phase 0.

---

## 7. Option A2 — Migration Tailwind (après Phase 0)

### Effort additionnel (post Phase 0)

| Tâche                                               | Fichiers                 | Effort (Claude Code)                         |
| --------------------------------------------------- | ------------------------ | -------------------------------------------- |
| Installer et configurer Tailwind + PostCSS          | config files             | Faible                                       |
| Convertir ~192 règles CSS en classes Tailwind       | 35+ fichiers `.tsx`      | Moyen (mécanique, bien adapté à Claude Code) |
| Supprimer/réduire `styles.css`                      | `styles.css`             | Faible                                       |
| Adapter toggle thème (`dark:` prefix)               | `App.tsx`, config        | Faible                                       |
| Adapter `getCssVar()` pour Tailwind                 | `getCssVar.ts`, 6 Canvas | Faible                                       |
| shadcn/ui (optionnel) : `.btn`, `.panel`, `.dialog` | 20+ composants           | Moyen                                        |
| Tests régression                                    | 29 fichiers test         | Faible                                       |

**Effort additionnel : 1-1.5 jours** | **Effort total (Phase 0 + A2) : 1.5-2.5 jours**

### Gains (cumulés avec Phase 0)

| Critère             | Phase 0 seul | + A2          | Delta A2                                                                  |
| ------------------- | ------------ | ------------- | ------------------------------------------------------------------------- |
| Qualité du code     | Fort         | Fort+         | Faible (conventions Tailwind, mais classes longues dans JSX)              |
| Modernité           | Fort         | **Très Fort** | **Fort** (Tailwind = standard de facto 2024-2026)                         |
| Modularité          | Moyen        | **Fort**      | **Fort** (colocation styles/composant, purge auto, plus de CSS global)    |
| Performance runtime | Nul          | Nul           | Nul (Tailwind purgé ~ même taille)                                        |
| DX                  | Moyen        | **Fort**      | **Fort** (autocomplétion, écosystème plugins, onboarding Tailwind-native) |
| Accessibilité       | Moyen        | Moyen         | Nul (Tailwind n'améliore pas l'a11y)                                      |
| Pérennité           | Fort         | Fort          | Nul (Tailwind = large communauté mais dépendance framework)               |

**Gain net de A2 par rapport à Phase 0 seul : MOYEN à FORT** — modularité et DX sont les vrais gains.

### Quand A2 est justifié

- L'équipe grossit et les nouveaux devs connaissent Tailwind
- Le projet va significativement croître (nouvelles pages, composants)
- On veut un design system réutilisable cross-projets (shadcn/ui)
- On migre vers Next.js (Tailwind = standard dans l'écosystème Next)

---

## 8. Option B — Reskin oklch (Phase 0 seul)

> Phase 0 EST l'option B. On change la palette en oklch, on modernise le pipeline couleur, on ne touche a rien d'autre.

**Effort : 0.5-1 jour** | **Gains : voir section 3.2**

---

## 9. Matrice gain/effort finale

```
Gain
 ^
 |                    P0+A2 (oklch + Tailwind)
 |                      *
 |                   /
 |                  /
 |      P0+A1 (oklch + CSS redesign)
 |        *
 |      /
 |     /
 |   P0 (oklch seul)
 |   *
 +---*--------*-----------*---------> Effort
   0.75j     1.5j        2j        (Claude Code + solo dev)
```

| Option                   | Effort    | Gain global | Ratio gain/effort | Risque | Travail jeté si on continue |
| ------------------------ | --------- | ----------- | ----------------- | ------ | --------------------------- |
| **Phase 0 seul** (oklch) | 0.5-1 j   | Fort        | **Excellent**     | Faible | 0                           |
| **Phase 0 → A1**         | 1-2 j     | Fort+       | Bon               | Moyen  | ~0.5j si A2 ensuite         |
| **Phase 0 → A2**         | 1.5-2.5 j | Très Fort   | Bon               | Moyen  | 0                           |
| ~~Phase 0 → A1 → A2~~    | 2-3.5 j   | Très Fort   | Moyen             | Fort   | ~0.5j (CSS A1 jeté)         |

---

## 10. Recommandation

| Objectif                         | Chemin                      | Pourquoi                                                         |
| -------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| Moderniser le pipeline couleur   | **Phase 0**                 | Gain net garanti, 0.5-1 jour, zéro regret                        |
| Changer le branding + moderniser | **Phase 0 → palette oklch** | = Phase 0, la palette est incluse                                |
| Moderniser l'apparence complète  | **Phase 0 → A1**            | 1-2 jours, bon si on reste en CSS pur                            |
| Préparer le projet a grossir     | **Phase 0 → A2**            | 1.5-2.5 jours, chemin le plus efficient vers Tailwind            |
| Faire A1 "pour voir" puis A2     | **Déconseillé**             | 0.5 jour de CSS restructuré jeté. Aller directement Phase 0 → A2 |

**Dans tous les cas, commencer par Phase 0.** C'est le seul investissement qui n'est jamais gaspillé et qui produit des gains nets immédiats en qualité, modernité et pérennité.

---

## 11. Décision finale (2026-03-08)

**Phase 0** : FAIT (192 tests, 35 fichiers test, 9 commits sur `main`, déployé en production).

**Phase A2 (Tailwind)** : REJETEE — le playground `playground-redesign.html` a démontré qu'un redesign CSS pur atteint le niveau visuel 2026 sans dépendance framework.

**Phase A1 (CSS redesign)** : VALIDEE comme prochaine étape. Le playground sert de référence.

### 11.1 Prototype de référence : `playground-redesign.html`

Démo standalone HTML/CSS/JS (zero dépendance React) montrant la direction esthétique "Digital Explorer" pour A1 :

| Dimension          | Design actuel                           | Direction A1 (playground)                                                                                                   |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Palette**        | Warm neutral oklch (ambre/brun)         | Deep space indigo + coral/salmon + electric teal + acid lime                                                                |
| **Typographie**    | SF Mono / Fira Code partout (monospace) | Plus Jakarta Sans (display, geometrique, friendly) + Space Mono (donnees)                                                   |
| **Layout**         | Sidebar fixe 230px + contenu scrollable | Topbar horizontale avec tabs scrollables + barre XP gamifiee                                                                |
| **Fond**           | Aplat solide `--bg`                     | Mesh gradient anime (3 blobs oklch) + grille geometrique masquee en radial                                                  |
| **Panneaux**       | Surface opaque + bordure solide 1px     | Glass blur (`backdrop-filter`) + ligne d'accent au hover + ombres profondes + lift 3D                                       |
| **Tokens**         | Petits, plats, hover translateY(-2px)   | Rotation + scale 1.05 au hover, bounce spring, selection doree avec glow                                                    |
| **Datasets**       | Liste verticale dans sidebar            | Pills horizontales avec gradient (chip actif = gradient coral→pink)                                                         |
| **Heatmap**        | Rampe bleue, border-collapse dense      | Rampe teal, border-spacing 4px, cells qui scale 1.15 au hover                                                               |
| **Sparkline loss** | (n'existe pas en CSS)                   | 3 couleurs (coral → gold → lime) selon la progression                                                                       |
| **Animations**     | Basiques (0.15s ease)                   | Staggered rise-in au load, `@property` pour animation gradient, spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`) partout |
| **Progression**    | Visited dots verts 6px dans sidebar     | Barre XP gradient shimmer sous la topbar                                                                                    |

### 11.2 Scope révisé de A1

Le playground a révélé que A1 ne serait pas un simple reskin mais une **refonte structurelle du CSS** :

| Problème actuel                                            | Correction A1                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1 fichier CSS monolithique (550+ lignes)                   | Découpage par composant/page (CSS Modules ou fichiers séparés)                        |
| Sélecteurs plats sans scope (`.panel`, `.btn`)             | Scoping par composant                                                                 |
| Layout rigide `margin-left: 230px` hardcodé                | CSS Grid layout, responsive natif                                                     |
| Pas de design tokens (seules les couleurs sont tokenisées) | Tokens sémantiques : `--card-bg`, `--card-border`, `--glow-*`, `--radius`, `--shadow` |
| Transitions inconsistantes (0.15s, 0.2s, mixtes)           | Système de timing unifié (`--t-fast`, `--t-normal`, `--t-slow`)                       |
| Responsive ad hoc, breakpoints non standardisés            | Breakpoints centralisés, mobile-first                                                 |
| Chaque composant réinvente ses keyframes                   | Animations réutilisables (fade, rise, pop, spring)                                    |
| `filter: brightness()` pour hover — hack                   | Vraies couleurs hover en oklch                                                        |

**Effort estimé A1 révisé : 1-2 jours** (Claude Code + solo dev), incluant la restructuration.
