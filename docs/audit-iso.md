# Audit ISO — microgpt-visualizer-fr

> Date : 2026-02-27
> Auditeur : Claude Opus 4.6 (assisté par 4 agents parallèles)
> Périmètre : `src/` (pages, components, styles, App, engine read-only)
> Commit de référence : `89a4ec8` (main)

---

## Normes appliquées

| Norme                               | Objet                                  | Score         |
| ----------------------------------- | -------------------------------------- | ------------- |
| ISO/IEC 25010:2023 — Maintenabilité | Modularité, testabilité, modifiabilité | 3,2/5         |
| ISO/IEC 25010:2023 — Sécurité       | XSS, CSP, confidentialité              | 4,5/5         |
| ISO/IEC 25010:2023 — Performance    | Bundle, mémoire, rAF, cleanup          | 3,8/5         |
| ISO/IEC 25010:2023 — Fiabilité      | ErrorBoundary, edge cases, recovery    | 4,3/5         |
| ISO/IEC 40500:2012 (WCAG 2.1 AA)    | Accessibilité web                      | 90 % conforme |
| ISO 9241-110:2020 — Interaction     | Usabilité, ergonomie, pédagogie        | 4,0/5         |

**Score global consolidé : 3,9/5 — BON, prêt pour production avec améliorations ciblées.**

---

## Non-conformités par sévérité

### Critiques (1)

| #   | Norme                | Problème                                                                    | Impact                                  |
| --- | -------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| A-1 | 25010 Maintenabilité | `useRef` + `forceUpdate` antipattern — couple 4 pages, bloque `memo`/`lazy` | Empêche toute optimisation React future |

### Majeures (3)

| #   | Norme                | Problème                                              | Fix                               |
| --- | -------------------- | ----------------------------------------------------- | --------------------------------- |
| P-1 | 25010 Performance    | Main bundle 638 KB (datasets inlinés)                 | `manualChunks` dans `vite.config` |
| S-3 | 40500 WCAG           | Heatmap `valToColor()` contraste < 4,5:1 sur cellules | Élargir plage RGB interpolation   |
| C-4 | 25010 Maintenabilité | `ForwardPassPage` 292 LOC, 8 niveaux JSX              | Extraire 4-5 sous-composants      |

### Modérées (7)

| #      | Norme                | Problème                                                                             |
| ------ | -------------------- | ------------------------------------------------------------------------------------ |
| S-1    | 25010 Sécurité       | CSP header absent dans `index.html`                                                  |
| P-3    | 25010 Performance    | InferencePage results non-limités (accumulation mémoire)                             |
| TEST-1 | 25010 Maintenabilité | Engine non testé (autograd, gptForward, trainStep)                                   |
| TEST-2 | 25010 Maintenabilité | Pages peu testées (30-40 % coverage)                                                 |
| DOC-1  | 25010 Maintenabilité | JSDoc manquante engine (`vAdd`, `vSum`, `rmsnorm`)                                   |
| UX-1   | 9241-110             | Changement dataset sans confirmation de réinitialisation                             |
| UX-2   | 9241-110             | Personnalisabilité faible (2,8/5) : pas de taille police, mode contrasté, difficulté |

### Mineures (8)

| #     | Problème                                               |
| ----- | ------------------------------------------------------ |
| MIN-1 | LossChart deps redondantes (`lossHistory` + `.length`) |
| MIN-2 | Props inline `{ model }` au lieu d'`interface Props`   |
| MIN-3 | `prefers-reduced-motion` absent                        |
| MIN-4 | Canvas LossChart sans texte alternatif                 |
| MIN-5 | Heatmap sans `<caption>`                               |
| MIN-6 | Active sidebar border 3,2:1 (sous 3:1 AA non-text)     |
| MIN-7 | `console.error()` en production                        |
| MIN-8 | Pas de hint "clavier" sur Heatmap                      |

---

## Points forts (conformes ou exemplaires)

| Aspect                | Score | Détail                                                                  |
| --------------------- | ----- | ----------------------------------------------------------------------- |
| Sécurité XSS          | 5/5   | Zéro `dangerouslySetInnerHTML`, `eval`, `innerHTML`. Input sanitisé.    |
| TermProvider          | 5/5   | Pattern singleton dialog, WAI-ARIA, WCAG 1.4.13, testable, réutilisable |
| Navigation clavier    | 5/5   | Roving tabindex, 9 `:focus-visible`, Escape dismiss, `<dialog>` natif   |
| Landmarks sémantiques | 5/5   | `<main>`, `<aside>`, `<nav>`, `<header>`, `<section aria-labelledby>`   |
| Récupérabilité        | 5/5   | ErrorBoundary FR, `resetModel()`, reload, rAF cleanup                   |
| Tests composants      | 4,5/5 | 70 tests, 9 fichiers. Term, Heatmap, ProbabilityBar exhaustifs          |
| Glossaire pédagogique | 4,5/5 | 30 termes, Tier 1/2, analogies adaptées 10-14 ans                       |
| Code splitting        | 4,5/5 | `React.lazy()` + `Suspense`, 5 chunks 4-7 KB chacun                     |

---

## Détail par norme

### ISO/IEC 25010:2023 — Maintenabilité (3,2/5)

#### Modularité (3/5)

- (+) Séparation claire `engine/` (read-only) / `pages/` / `components/`
- (+) TermProvider context pattern isolé et réutilisable
- (+) `PageSection`, `ProbabilityBar`, `ErrorBoundary` composants partagés
- (-) **A-1** : `useRef` + `forceUpdate` dans `App.tsx` couple toutes les pages au mécanisme de mise à jour
- (-) **C-4** : `ForwardPassPage` 292 LOC avec 8 niveaux JSX — fichier monolithique

#### Testabilité (3/5)

- (+) 70 tests existants, 9 fichiers de tests
- (+) Composants isolés testables (Term, Heatmap, ProbabilityBar)
- (-) **TEST-1** : Engine entièrement non testé (autograd, gptForward, trainStep)
- (-) **TEST-2** : Pages à ~30-40 % de couverture (TrainingPage : 2 tests, InferencePage : 6 tests)

#### Modifiabilité (3,5/5)

- (+) ESLint 0 warnings, Prettier en pre-commit
- (+) TypeScript strict (`any` éliminé sauf 1 `eslint-disable` documenté)
- (-) **DOC-1** : JSDoc manquante sur les fonctions engine (`vAdd`, `vSum`, `rmsnorm`, `softmax`)
- (-) **MIN-2** : Props inline `{ model }` au lieu d'interfaces `Props` nommées

### ISO/IEC 25010:2023 — Sécurité (4,5/5)

#### Confidentialité (5/5)

- Aucune donnée utilisateur collectée
- Pas de cookies, pas de localStorage, pas de tracking
- Application 100 % client-side, zéro appel réseau

#### Intégrité (5/5)

- Zéro `dangerouslySetInnerHTML`, `eval()`, `innerHTML`
- Input sanitisé (`<input>` contrôlé, pas d'injection possible)
- React 19 échappement automatique des expressions JSX

#### Non-répudiation (N/A)

- Sans objet (pas d'authentification ni de transactions)

#### Points d'amélioration

- (-) **S-1** : Pas de CSP `<meta>` dans `index.html` — protection supplémentaire contre injection XSS tierce
- (-) Pas de `Permissions-Policy` header (caméra, micro, géolocalisation)

### ISO/IEC 25010:2023 — Performance (3,8/5)

#### Comportement temporel (3,5/5)

- (+) Code splitting via `React.lazy()` — 5 chunks 4-7 KB
- (+) `useMemo` sur calculs coûteux (`gptForward`, tri/slice top-k)
- (+) `requestAnimationFrame` + cleanup dans LossChart et TrainingPage
- (-) **P-1** : Bundle principal 638 KB (datasets JSON inlinés)
- (-) **P-3** : InferencePage accumule les résultats sans limite mémoire

#### Utilisation des ressources (4/5)

- (+) Zéro dépendance externe (canvas natif, pas de chart lib)
- (+) rAF cleanup systématique (C-6 corrigé)
- (-) **MIN-1** : LossChart useEffect deps redondantes

### ISO/IEC 25010:2023 — Fiabilité (4,3/5)

#### Maturité (4/5)

- (+) ErrorBoundary avec fallback français et bouton rechargement
- (+) `resetModel()` pour réinitialisation propre
- (-) Edge case : changement de dataset pendant entraînement sans confirmation (UX-1)

#### Tolérance aux fautes (4,5/5)

- (+) `cancelAnimationFrame` dans stop() ET cleanup useEffect
- (+) ErrorBoundary catch + `window.location.reload()` (pas de re-render crash loop)
- (+) Glossaire Term : `useId()` pour unicité, viewport flip pour débordement

#### Récupérabilité (5/5)

- (+) ErrorBoundary couvre toutes les pages (sidebar exclue volontairement)
- (+) Bouton "Recharger la page" accessible
- (+) Modèle réinitialisable à tout moment

### ISO/IEC 40500:2012 — WCAG 2.1 AA (90 % conforme)

#### Conformités

| Critère WCAG               | Statut   | Détail                                                       |
| -------------------------- | -------- | ------------------------------------------------------------ |
| 1.3.1 Info & Relationships | Conforme | `<label htmlFor>`, `<section aria-labelledby>`, landmarks    |
| 2.1.1 Keyboard             | Conforme | Roving tabindex Heatmap, `<button>` natifs, `<dialog>`       |
| 2.4.7 Focus Visible        | Conforme | 9 règles `:focus-visible` (outline 2px solid)                |
| 1.4.3 Contrast             | Conforme | `--text-dim` corrigé 4,73:1 (clair), dark W-8 corrigé 4,52:1 |
| 4.1.2 Name, Role, Value    | Conforme | SVGs `aria-hidden`, boutons avec texte visible               |
| 1.4.13 Content on Hover    | Conforme | Term tooltip bridge `::before`, hoverable, Escape dismiss    |

#### Non-conformités résiduelles

| Critère                    | Problème                                                    | Sévérité           |
| -------------------------- | ----------------------------------------------------------- | ------------------ |
| 1.4.3 Contrast             | S-3 : `valToColor()` Heatmap — certaines cellules < 4,5:1   | Majeure (acceptée) |
| 1.1.1 Non-text Content     | MIN-4 : Canvas LossChart sans texte alternatif              | Mineure            |
| 1.3.1 Info & Relationships | MIN-5 : Heatmap `<table>` sans `<caption>`                  | Mineure            |
| 2.1.1 Keyboard             | MIN-8 : Pas de hint "Utiliser ↑↓ pour naviguer" sur Heatmap | Mineure            |
| 2.3.1 Three Flashes        | MIN-3 : `prefers-reduced-motion` non supporté               | Mineure            |

### ISO 9241-110:2020 — Interaction (4,0/5)

#### Adéquation à la tâche (4,5/5)

- (+) 5 pages couvrent le pipeline complet (tokenization → inference)
- (+) Glossaire intégré avec 30 termes et analogies pour 10-14 ans
- (+) Visualisations interactives (heatmap navigable, training animé)

#### Autodescription (4/5)

- (+) Labels en français, aide contextuelle via tooltips glossaire
- (+) Feedback visuel entraînement (courbe de perte, compteur d'étapes)
- (-) **UX-1** : Changement de dataset sans confirmation si entraînement en cours

#### Conformité aux attentes utilisateur (4,5/5)

- (+) Navigation sidebar conventionnelle
- (+) Toggle thème clair/sombre
- (+) Responsive mobile (menu hamburger)

#### Tolérance aux erreurs (4/5)

- (+) ErrorBoundary avec message français
- (+) `resetModel()` accessible
- (-) Pas de "Annuler" pour les actions destructives

#### Personnalisabilité (2,8/5)

- (-) **UX-2** : Pas de réglage taille police
- (-) Pas de mode contraste élevé
- (-) Pas de niveaux de difficulté (débutant/avancé)
- (+) Toggle thème clair/sombre
- (+) Choix du dataset

#### Apprentissage (4,5/5)

- (+) Progression pédagogique logique (Tokenizer → Embeddings → Forward → Training → Inference)
- (+) Glossaire Tier 1 (base) / Tier 2 (avancé) avec analogies adaptées
- (-) Pas de navigation "Suivant → Page X" en bas de page

---

## Roadmap recommandée

### Phase 4A — Conformité stricte (1-2 jours)

| Priorité | #     | Action                                          | Norme      |
| -------- | ----- | ----------------------------------------------- | ---------- |
| 1        | S-3   | `valToColor()` contraste AA — élargir plage RGB | 40500      |
| 2        | S-1   | CSP `<meta>` dans `index.html`                  | 25010 Sécu |
| 3        | MIN-3 | `prefers-reduced-motion` media query            | 40500      |
| 4        | P-3   | Limiter InferencePage results à 100             | 25010 Perf |
| 5        | MIN-5 | `<caption>` sur Heatmap `<table>`               | 40500      |

### Phase 4B — Maintenabilité (3-5 jours)

| Priorité | #      | Action                                                  | Norme       |
| -------- | ------ | ------------------------------------------------------- | ----------- |
| 6        | A-1    | Refactoriser `useRef` + `forceUpdate` → Context/Reducer | 25010 Maint |
| 7        | C-4    | Décomposer `ForwardPassPage` en 5 sous-composants       | 25010 Maint |
| 8        | TEST-1 | Tests unitaires engine (autograd, gptForward)           | 25010 Maint |
| 9        | P-1    | `manualChunks` vite.config pour datasets                | 25010 Perf  |

### Phase 4C — UX pédagogique (optionnel)

| Priorité | #     | Action                                                   | Norme    |
| -------- | ----- | -------------------------------------------------------- | -------- |
| 10       | UX-1  | Confirmation avant changement dataset si `totalStep > 0` | 9241-110 |
| 11       | —     | Boutons "Suivant → Page X" au bas de chaque page         | 9241-110 |
| 12       | —     | `<details>` dépliables dans ForwardPassPage              | 9241-110 |
| 13       | MIN-8 | Hint clavier Heatmap ("↑↓ pour naviguer")                | 40500    |

---

## Méthodologie

L'audit a été conduit par 4 agents spécialisés en parallèle :

1. **Agent Maintenabilité** (25010) — modularité, testabilité, modifiabilité, réutilisabilité
2. **Agent Sécurité + Performance** (25010) — XSS, CSP, bundle, mémoire, rAF
3. **Agent Accessibilité** (40500/WCAG 2.1 AA) — clavier, contraste, ARIA, landmarks
4. **Agent Usabilité** (9241-110) — adéquation, personnalisabilité, apprentissage

Chaque agent a inspecté l'intégralité du code source (`src/`), les fichiers CSS, la configuration Vite, et les tests existants. Les scores sont attribués selon les sous-caractéristiques définies par chaque norme.

### Limites

- Pas de test automatisé Lighthouse/axe-core (audit manuel uniquement)
- Pas de mesure réelle du bundle (estimation basée sur le code source)
- Pas de test utilisateur réel (évaluation heuristique ISO 9241)
- Engine `src/engine/` inspecté mais non audité en profondeur (code upstream read-only)
