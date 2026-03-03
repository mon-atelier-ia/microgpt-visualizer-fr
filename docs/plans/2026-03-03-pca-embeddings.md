# PCA Scatter Plot des Embeddings — Plan d'implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ajouter une carte PCA 2D interactive dans la page Embeddings (page 2) montrant les 27 vecteurs d'embedding projetés en 2D, avec animation de l'évolution réelle pendant l'entraînement grâce à des snapshots de wte capturés à intervalles réguliers.

**Architecture:** Snapshots wte stockés dans `modelStore.ts` (pas dans l'engine — séparation des préoccupations). Collecte dans `TrainingPage.tsx` (couche UI qui pilote l'entraînement). PCA pur extrait en utilitaire `pca.ts`. Composant Canvas 2D `PCAScatterPlot.tsx` (~350 lignes) intégré dans `EmbeddingsPage.tsx`. Port du prototype `playground-pca.html` avec données réelles du modèle. Enrichissements visuels validés par review frontend-design : ghost trails, constellation lines, radial gradient dots, vignette atmosphere, Canvas-rendered tooltip, bidirectional hover avec heatmap wte, rAF interpolation entre snapshots.

**Tech Stack:** React 19, TypeScript, Canvas 2D, Power iteration PCA, CSS custom properties

---

## Contexte

La page 2 (Embeddings) montre les heatmaps wte/wpe et les bar charts au survol. L'utilisateur veut un "scatter plot PCA" projetant les 27 embeddings de 16D en 2D — le "waow effect" de la page 2. Les voyelles se regroupent, les consonnes forment des sous-groupes, BOS s'isole.

**Prérequis identifié :** pour rejouer l'animation d'évolution réelle (pas une interpolation linéaire), il faut capturer des snapshots de `wte` pendant l'entraînement. Coût : 432 floats × ~20 snapshots = ~67 Ko. Négligeable.

**Prototype existant :** `playground-pca.html` — fonctionne avec données simulées, validé visuellement via Playwright.

## Principes d'intégration

### Continuité pédagogique (même pattern que NNDiagram)

Le `useModel()` hook + `[model, model.totalStep]` deps garantit que le scatter PCA reflète les poids actuels. Si l'élève entraîne à la page 5, revient page 2 → le scatter montre les vrais embeddings entraînés. Les snapshots permettent de rejouer le film de l'évolution.

### Réutilisation des patterns existants

| Pattern existant                  | Où                    | Réutilisé                                                                |
| --------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `useModel()` hook                 | `modelStore.ts`       | EmbeddingsPage lit wte via model                                         |
| `[model, model.totalStep]` deps   | ForwardPassPage:33    | useMemo pour wteData                                                     |
| `getCssVar()`                     | `utils/getCssVar.ts`  | Couleurs Canvas (cyan/orange/purple)                                     |
| `useRef<HTMLCanvasElement>` + DPR | `LossChart.tsx:14-24` | Pattern Canvas identique                                                 |
| `if (!ctx) return` guard          | `LossChart.tsx:20`    | jsdom safety                                                             |
| `role="img"` + `aria-label`       | `LossChart.tsx:138`   | Accessibilité canvas                                                     |
| `notifyModelUpdate()`             | `modelStore.ts`       | Snapshots visibles au prochain render                                    |
| `resetModel()` clears state       | `modelStore.ts`       | Clear snapshots on reset                                                 |
| `.nn-canvas-wrap` pattern         | NNDiagram CSS         | Réutilisé pour `.pca-canvas-wrap`                                        |
| `parseColor()`                    | NNDiagram.tsx:56-69   | Extrait vers `src/utils/parseColor.ts` (Task 0), partagé NNDiagram + PCA |

### Ce qui est nouveau

- `src/utils/parseColor.ts` — extraction DRY de NNDiagram (~13 lignes, 0 nouveau code)
- `src/utils/pca.ts` — utilitaire pur PCA 16D→2D + `cosineSim` + `topSimilarPairs` (~75 lignes)
- Snapshots wte dans `modelStore.ts` — ~20 lignes ajoutées
- `PCAScatterPlot.tsx` — composant Canvas 2D (~350 lignes, inclut enrichissements visuels)
- `.text-orange` CSS class — manquante, doit être ajoutée (cohérence avec `.text-cyan`, `.text-green`)

## Analyse pédagogique

### Contexte narratif dans le parcours de l'app

Les 6 pages forment un parcours linéaire :

1. **Tokenisation** — le modèle ne lit pas les lettres, il utilise des nombres
2. **Plongements** — chaque token/position = un vecteur de 16 nombres (aléatoire au départ)
3. **Propagation** — un token traverse le réseau (NNDiagram = "waow")
4. **Attention** — les tokens communiquent entre eux
5. **Entraînement** — ajuster les paramètres pour réduire l'erreur
6. **Inférence** — générer de nouveaux noms

La page 2 est le **deuxième moment de contact** de l'élève avec les embeddings. Le texte actuel dit : _"Pour l'instant ces valeurs sont **aléatoires** — après l'entraînement, les lettres similaires auront des motifs similaires."_ Cette promesse n'est jamais tenue visuellement sur la page 2 elle-même — l'élève doit comparer mentalement les heatmaps avant/après. Le scatter PCA **rend cette promesse visible** : les lettres similaires se regroupent littéralement sous ses yeux.

### Positionnement du panneau PCA dans la page

La page 2 actuelle a 3 panneaux :

1. **wte** — heatmap 27×16 + bar chart au survol (représentation détaillée)
2. **wpe** — heatmap 16×16 + bar chart au survol
3. **wte + wpe combinés** — sélecteur + 3 VectorBar (opération d'addition)

Le panneau PCA sera le **4ème et dernier panneau**. Logique pédagogique :

- Panneaux 1-2 : « voici les données brutes » (valeurs exactes, 16 dimensions)
- Panneau 3 : « voici comment elles se combinent » (opération mathématique)
- **Panneau 4 (PCA) : « voici la vue d'ensemble » (toutes les lettres d'un coup, structure globale)**

C'est un zoom arrière : après avoir regardé chaque lettre individuellement (hover heatmap), l'élève voit la carte complète. Le passage du détail (heatmap) à la vue globale (scatter) est naturel.

### Textes proposés — respectant les conventions existantes

#### Panel title

```
Carte PCA — les plongements en 2D
```

Utilise `<Term id="plongement" />` (cohérence : même terme que partout ailleurs). "Carte" est concret pour un 10-14 ans. "PCA" est gardé comme nom propre non traduit (comme "BOS", "MLP", "Adam").

#### Training badge (label-dim, conditionnel)

```
État non entraîné :
  "Poids aléatoires — les lettres sont éparpillées au hasard"

État entraîné :
  "Entraîné (X étapes) — les lettres similaires se regroupent"
```

**Pattern identique** aux training badges de wte (page 2) et BertViz (page 4). Même structure : état + constat. Note : formulation en constat ("les lettres similaires se regroupent") plutôt qu'en commande ("observe comment…") — cohérence avec le badge wte qui utilise aussi un constat.

#### Explain text (principal)

```
Chaque lettre est un point dans un espace à 16 dimensions — impossible à
visualiser ! On utilise une technique appelée PCA pour condenser ces 16
nombres en 2, en gardant les 2 directions les plus informatives. C'est comme
projeter l'ombre d'un objet 3D sur un mur : on perd du détail, mais la forme
générale reste visible.
```

**Choix pédagogiques :**

- _"impossible à visualiser"_ — valide le sentiment de l'élève (16D c'est abstrait)
- _"condenser"_ — verbe concret et non destructif (un 12 ans pourrait croire que "écraser" détruit les données). Alternative envisagée : "écraser" + qualificatif "(les points bougent, mais leurs relations restent)" — plus long pour le même résultat
- _"les 2 directions les plus informatives"_ — évite "composantes principales", "variance"
- _"projeter l'ombre"_ — métaphore du mur (3D→2D), directement transposable à 16D→2D
- Pas de formule mathématique, pas de "matrice de covariance", pas de "vecteurs propres"

#### Explain text (couleurs + backward reference)

```
Chaque point correspond à une ligne du tableau wte ci-dessus.
Couleurs : voyelles (cyan), consonnes (orange), BOS (violet).
Survole une lettre pour voir ses coordonnées — la ligne correspondante
s'éclaire aussi dans le tableau wte.
```

**Cohérence :** même pattern que la heatmap ("Survole une ligne pour voir ses dimensions"). La première phrase est le pont conceptuel crucial : elle relie explicitement les 16 nombres abstraits de la heatmap à une position sur la carte. La mention du lien hover bidirectionnel (PCA ↔ heatmap) prépare l'élève à l'interaction.

#### Explain text conditionnel (quand snapshots existent)

```
Clique Rejouer pour voir le chemin réel de chaque lettre pendant l'entraînement.
```

**Cohérence :** même pattern que NNDiagram ("Rejouer") et InferencePage ("Clique sur chaque étape pour voir").

#### Step label pendant l'animation (dans le canvas)

```
"Étape 0 — poids aléatoires"
"Étape 50 — entraînement…"
"Étape 200 — entraînement terminé"
```

**Cohérence :** même vocabulaire que TrainingPage ("Étape : X") et playground-pca.html.

### Glossaire — additions nécessaires ?

**Aucune addition requise.** Analyse :

| Concept PCA               | Déjà couvert ?              | Action                                                                                                                                                                                                                                                                                                  |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "dimension"               | Oui — terme Tier 1 existant | Réutiliser `<Term id="dimension" />`                                                                                                                                                                                                                                                                    |
| "plongement"              | Oui — terme Tier 2 existant | Réutiliser `<Term id="plongement" />`                                                                                                                                                                                                                                                                   |
| "vecteur"                 | Oui — terme Tier 1 existant | Réutiliser `<Term id="vecteur" />`                                                                                                                                                                                                                                                                      |
| "PCA"                     | Non, mais…                  | Expliqué inline (métaphore de l'ombre). Un terme glossaire serait over-engineering pour un nom propre d'algorithme que l'élève ne reverra nulle part ailleurs dans l'app                                                                                                                                |
| "projection"              | Non, et **piégeux**         | Le mot "projeté" est déjà utilisé page 4 (Q/K/V : "le token courant est projeté en trois vecteurs") avec un sens différent (projection linéaire = multiplication matricielle). Ajouter un terme "projection" avec deux sens serait confus. Mieux vaut éviter le mot et utiliser la métaphore de l'ombre |
| "composantes principales" | Non                         | Trop technique pour la cible. La métaphore "2 directions les plus informatives" suffit                                                                                                                                                                                                                  |

### Cohérence des prompts d'interactivité

Verbes utilisés dans l'app et leur mapping PCA :

| Verbe existant | Contexte original         | Usage PCA                                                            |
| -------------- | ------------------------- | -------------------------------------------------------------------- |
| "Survole"      | Heatmap, NNDiagram        | "Survole une lettre pour voir ses coordonnées"                       |
| "Clique"       | Boutons, BertViz          | "Clique **Rejouer** pour voir l'évolution"                           |
| "Observe"      | page-desc introductions   | "Observe comment les lettres similaires se regroupent"               |
| "Change"       | Sélecteurs token/position | _(pas de sélecteur dans le PCA — toutes les lettres sont affichées)_ |

### Teasing inter-pages (forward/backward references)

Le panneau PCA doit s'inscrire dans le réseau de renvois existants :

- **Backward** (référence aux panneaux précédents de la page 2) :
  _"Les valeurs que tu vois dans le tableau wte ci-dessus sont exactement les mêmes — chaque ligne du tableau est un point sur cette carte."_

- **Forward** (invitation à entraîner) :
  Utiliser le training badge existant : _"reviens après avoir entraîné le modèle à l'étape 5"_. Ne pas dupliquer la formulation — **même phrase** que le wte badge, cohérence totale.

- **Forward** (vers page 3, propagation) :
  _(optionnel)_ _"C'est ce vecteur combiné (wte + wpe) qui entre dans le réseau que tu verras à l'étape suivante."_ — Mais ce teasing existe déjà dans le panneau 3 (wte+wpe), donc pas besoin d'en ajouter un dans le PCA.

### Accessibilité du canvas

- `role="img"` + `aria-label` dynamique : `"Carte PCA des plongements — 27 lettres projetées en 2D, étape {totalStep}"`
- Légende intégrée dans le canvas (pas de texte HTML séparé à synchroniser)
- `cursor: crosshair` pour indiquer l'interactivité
- `prefers-reduced-motion` : pas d'animation, affichage immédiat de l'état final

### Résumé : ce que l'élève apprend avec le PCA

1. **Avant entraînement** : les embeddings sont aléatoires → la carte est un nuage informe
2. **Après entraînement** : les lettres similaires se regroupent → la carte montre une structure
3. **Animation replay** : le chemin n'est pas une ligne droite → l'apprentissage est chaotique au début, se stabilise ensuite
4. **Le lien** : les 16 nombres de la heatmap ne sont pas abstraits — ils définissent une position dans un espace, et cette position a du sens

---

## Fichiers critiques

| Fichier                                  | Action   | Lignes estimées                           |
| ---------------------------------------- | -------- | ----------------------------------------- |
| `src/utils/parseColor.ts`                | Créer    | ~13 (extraction DRY de NNDiagram)         |
| `src/components/NNDiagram.tsx`           | Modifier | -13 +1 (import parseColor)                |
| `src/utils/pca.ts`                       | Créer    | ~75 (pca2d + cosineSim + topSimilarPairs) |
| `src/utils/pca.test.ts`                  | Créer    | ~60                                       |
| `src/components/PCAScatterPlot.tsx`      | Créer    | ~350                                      |
| `src/components/PCAScatterPlot.test.tsx` | Créer    | ~45                                       |
| `src/modelStore.ts`                      | Modifier | +20 lignes                                |
| `src/modelStore.test.ts`                 | Modifier | +25 lignes                                |
| `src/pages/TrainingPage.tsx`             | Modifier | +10 lignes                                |
| `src/pages/EmbeddingsPage.tsx`           | Modifier | +50 lignes (hover bidirectionnel)         |
| `src/styles.css`                         | Modifier | +35 lignes (incl. `.text-orange`)         |

Net : +560 lignes. Tests : 111 → ~123.

---

## Task 0 : Extraction `parseColor` (DRY, pré-requis) — FAIT ✅ `6c26017`

**Files:**

- Create: `src/utils/parseColor.ts`
- Modify: `src/components/NNDiagram.tsx` (import, supprimer copie locale)

### Step 1: Créer `src/utils/parseColor.ts`

```typescript
/** Parse a CSS color string (#hex or rgb()) into [r, g, b]. */
export function parseColor(c: string): [number, number, number] {
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const m = c.match(/(\d+)/g);
  return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
}
```

### Step 2: Mettre à jour NNDiagram.tsx

Supprimer la fonction `parseColor` locale (lignes 56-69) et ajouter l'import :

```typescript
import { parseColor } from "../utils/parseColor";
```

### Step 3: Vérifier que les tests existants passent

Run: `npx vitest run src/components/NNDiagram.test.tsx`
Expected: 2 tests PASS (aucun changement de comportement)

### Step 4: Commit

```
refactor: extract parseColor to shared utility (DRY for PCA)
```

---

## Task 1 : Utilitaire PCA (TDD) — FAIT ✅ `0080c8f`

**Files:**

- Create: `src/utils/pca.ts`
- Create: `src/utils/pca.test.ts`

### Step 1: Écrire les tests

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { pca2d, cosineSim, topSimilarPairs } from "./pca";

describe("cosineSim", () => {
  it("retourne 1 pour des vecteurs identiques", () => {
    expect(cosineSim([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("retourne ~0 pour des vecteurs orthogonaux", () => {
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("topSimilarPairs", () => {
  it("retourne les paires triées par similarité décroissante", () => {
    const emb = [
      [1, 0],
      [0.9, 0.1],
      [0, 1],
    ]; // 0↔1 très similaires
    const pairs = topSimilarPairs(emb, 2);
    expect(pairs[0][0]).toBe(0);
    expect(pairs[0][1]).toBe(1);
    expect(pairs[0][2]).toBeGreaterThan(0.9);
  });
});

describe("pca2d", () => {
  it("retourne N points 2D pour N vecteurs d'entrée", () => {
    const data = Array.from({ length: 5 }, () =>
      Array.from({ length: 8 }, () => Math.random()),
    );
    const result = pca2d(data);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveLength(2);
  });

  it("projette des données 2D triviales sans perte", () => {
    // Données déjà en 2D (padded à 4D avec des zéros)
    const data = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [-1, 0, 0, 0],
      [0, -1, 0, 0],
    ];
    const result = pca2d(data);
    // Les 2 premières composantes doivent capturer toute la variance
    // Vérifie que les points ne sont pas tous au même endroit
    const xs = result.map((p) => p[0]);
    const ys = result.map((p) => p[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.5);
  });

  it("gère un seul point sans crash", () => {
    const result = pca2d([[1, 2, 3]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    // Un seul point → centré à l'origine
    expect(result[0][0]).toBeCloseTo(0);
    expect(result[0][1]).toBeCloseTo(0);
  });

  it("centre les données (moyenne projetée ≈ 0)", () => {
    const data = Array.from({ length: 20 }, () =>
      Array.from({ length: 8 }, () => Math.random() * 10 - 5),
    );
    const result = pca2d(data);
    const meanX = result.reduce((s, p) => s + p[0], 0) / result.length;
    const meanY = result.reduce((s, p) => s + p[1], 0) / result.length;
    expect(meanX).toBeCloseTo(0, 5);
    expect(meanY).toBeCloseTo(0, 5);
  });
});
```

### Step 2: Vérifier que les tests échouent

Run: `npx vitest run src/utils/pca.test.ts`
Expected: FAIL — module not found

### Step 3: Implémenter pca2d + cosineSim + topSimilarPairs

```typescript
/** Cosine similarity between two vectors. */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** Return top-K most similar pairs by cosine in original space. */
export function topSimilarPairs(
  embeddings: number[][],
  topK: number,
): [number, number, number][] {
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < embeddings.length; i++)
    for (let j = i + 1; j < embeddings.length; j++)
      pairs.push([i, j, cosineSim(embeddings[i], embeddings[j])]);
  pairs.sort((a, b) => b[2] - a[2]);
  return pairs.slice(0, topK);
}

/**
 * PCA — Project N vectors of dimension D down to 2D.
 * Uses power iteration on the covariance matrix (no external deps).
 */
export function pca2d(data: number[][]): number[][] {
  const n = data.length;
  if (n === 0) return [];
  const d = data[0].length;
  if (n === 1) return [[0, 0]];

  // 1. Center
  const mean = Array(d).fill(0);
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;

  const centered = data.map((row) => row.map((v, j) => v - mean[j]));

  // 2. Covariance matrix (d×d)
  const cov = Array.from({ length: d }, () => Array(d).fill(0) as number[]);
  for (const row of centered) {
    for (let i = 0; i < d; i++) {
      for (let j = i; j < d; j++) {
        cov[i][j] += row[i] * row[j];
      }
    }
  }
  const denom = n > 1 ? n - 1 : 1;
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      cov[i][j] /= denom;
      cov[j][i] = cov[i][j];
    }
  }

  // 3. Power iteration for top 2 eigenvectors
  function powerIter(mat: number[][]): { vec: number[]; val: number } {
    // Deterministic seed vector
    let v = Array.from({ length: d }, (_, k) => Math.sin(k + 1));
    const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map((x) => x / norm0);

    for (let iter = 0; iter < 100; iter++) {
      const nv = Array(d).fill(0);
      for (let i = 0; i < d; i++)
        for (let j = 0; j < d; j++) nv[i] += mat[i][j] * v[j];
      const nm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0)) || 1;
      v = nv.map((x) => x / nm);
    }
    // Eigenvalue
    const mv = Array(d).fill(0);
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++) mv[i] += mat[i][j] * v[j];
    const eigenval = v.reduce((s, x, i) => s + x * mv[i], 0);
    return { vec: v, val: eigenval };
  }

  const e1 = powerIter(cov);

  // Deflate: remove first component from covariance
  const deflated = cov.map((row, i) =>
    row.map((v, j) => v - e1.val * e1.vec[i] * e1.vec[j]),
  );
  const e2 = powerIter(deflated);

  // 4. Project onto top 2 eigenvectors
  return centered.map((row) => [
    row.reduce((s, v, j) => s + v * e1.vec[j], 0),
    row.reduce((s, v, j) => s + v * e2.vec[j], 0),
  ]);
}
```

### Step 4: Vérifier que les tests passent

Run: `npx vitest run src/utils/pca.test.ts`
Expected: 7 tests PASS (4 pca2d + 2 cosineSim + 1 topSimilarPairs)

### Step 5: Commit

```
feat: add PCA utility for 2D projection of embedding vectors
```

---

## Task 2 : Infrastructure de snapshots dans modelStore — FAIT ✅ `4f94fdd`

**Files:**

- Modify: `src/modelStore.ts`
- Modify: `src/modelStore.test.ts`

### Step 1: Modifier modelStore.ts

Ajouter au module :

```typescript
// ── wte Snapshots (visualization concern, not engine) ──
export interface WteSnapshot {
  step: number;
  wte: number[][]; // vocabSize × N_EMBD (copied values, not Value references)
}

let wteSnapshots: WteSnapshot[] = [];
export const SNAPSHOT_INTERVAL = 50;

/** Push a deep copy of current wte embeddings. */
export function pushWteSnapshot(state: ModelState) {
  const snap: number[][] = state.stateDict.wte.map((row) =>
    row.map((v) => v.data),
  );
  wteSnapshots.push({ step: state.totalStep, wte: snap });
}

/** Get all snapshots (for PCA animation). Returns shallow copy to avoid memo bypass. */
export function getWteSnapshots(): WteSnapshot[] {
  return [...wteSnapshots];
}
```

Dans `resetModel()`, ajouter le clear :

```typescript
export function resetModel(datasetId?: string) {
  if (datasetId !== undefined) currentDatasetId = datasetId;
  model = createModel(getDataset(currentDatasetId).words);
  wteSnapshots = []; // ← ajouter
  emit();
}
```

### Step 2: Ajouter tests dans modelStore.test.ts

```typescript
describe("wteSnapshots", () => {
  beforeEach(() => {
    act(() => resetModel());
  });

  it("pushWteSnapshot stores a deep copy", () => {
    const { result } = renderHook(() => useModel());
    act(() => {
      pushWteSnapshot(result.current);
    });
    const snaps = getWteSnapshots();
    expect(snaps).toHaveLength(1);
    expect(snaps[0].step).toBe(result.current.totalStep);
    expect(snaps[0].wte).toHaveLength(result.current.stateDict.wte.length);
    // Verify it's a copy, not a reference
    expect(snaps[0].wte[0][0]).toBe(result.current.stateDict.wte[0][0].data);
  });

  it("resetModel clears snapshots", () => {
    const { result } = renderHook(() => useModel());
    act(() => {
      pushWteSnapshot(result.current);
    });
    expect(getWteSnapshots().length).toBeGreaterThan(0);
    act(() => resetModel());
    expect(getWteSnapshots()).toHaveLength(0);
  });
});
```

### Step 3: Vérifier que les tests passent

Run: `npx vitest run src/modelStore.test.ts`
Expected: 8 tests PASS (6 existants + 2 nouveaux)

### Step 4: Commit

```
feat: add wte snapshot infrastructure to modelStore
```

---

## Task 3 : Collecte de snapshots dans TrainingPage — FAIT ✅ `6f03ece`

**Files:**

- Modify: `src/pages/TrainingPage.tsx`

### Step 1: Ajouter imports

```typescript
import {
  pushWteSnapshot,
  getWteSnapshots,
  SNAPSHOT_INTERVAL,
} from "../modelStore";
```

### Step 2: Modifier runTraining

Dans `runTraining()`, capturer l'état initial si aucun snapshot n'existe :

```typescript
const runTraining = (steps: number) => {
  if (training) return;
  setTraining(true);
  stopRef.current = false;

  // Capture initial state before first training
  if (getWteSnapshots().length === 0) {
    pushWteSnapshot(model);
  }

  // ... reste du code existant ...
```

### Step 3: Modifier tick()

Dans la boucle de batch, ajouter le snapshot après chaque trainStep :

```typescript
for (let i = 0; i < batch; i++) {
  result = trainStep(model, targetSteps);
  if (model.totalStep % SNAPSHOT_INTERVAL === 0) {
    pushWteSnapshot(model);
  }
  done++;
}
```

### Step 4: Vérifier que les tests passent

Run: `npx vitest run`
Expected: tous les tests PASS (pas de changement de comportement visible)

### Step 5: Commit

```
feat: collect wte snapshots during training every 50 steps
```

---

## Task 4 : Composant PCAScatterPlot (TDD) — FAIT ✅ `b2f462a`

**Files:**

- Create: `src/components/PCAScatterPlot.test.tsx`
- Create: `src/components/PCAScatterPlot.tsx`

### Step 1: Écrire les tests

```typescript
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import PCAScatterPlot from "./PCAScatterPlot";

afterEach(() => cleanup());

function makeProps() {
  return {
    wteData: Array.from({ length: 27 }, () =>
      Array.from({ length: 16 }, () => Math.random()),
    ),
    totalStep: 0,
    snapshots: [],
    highlightLetter: null,
    onHoverLetter: undefined,
  };
}

describe("PCAScatterPlot", () => {
  it("le canvas a role='img' et un aria-label", () => {
    const { container } = render(<PCAScatterPlot {...makeProps()} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("role")).toBe("img");
    expect(canvas!.getAttribute("aria-label")).toContain("PCA");
  });

  it("affiche le bouton play quand ≥3 snapshots existent", () => {
    const props = makeProps();
    props.snapshots = [
      { step: 0, wte: props.wteData },
      { step: 50, wte: props.wteData },
      { step: 100, wte: props.wteData },
    ];
    const { container } = render(<PCAScatterPlot {...props} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain("Rejouer");
  });

  it("n'affiche pas le bouton play avec <3 snapshots", () => {
    const { container } = render(<PCAScatterPlot {...makeProps()} />);
    const btn = container.querySelector("button");
    expect(btn).toBeNull();
  });
});
```

### Step 2: Vérifier que les tests échouent

Run: `npx vitest run src/components/PCAScatterPlot.test.tsx`
Expected: FAIL — module not found

### Step 3: Implémenter PCAScatterPlot.tsx

Le composant est un port de `playground-pca.html` en React TypeScript, enrichi par les recommandations frontend-design. Architecture :

**Props :**

```typescript
import type { WteSnapshot } from "../modelStore";

interface PCAScatterPlotProps {
  wteData: number[][]; // 27×16 — current embeddings
  totalStep: number; // current training step
  snapshots: WteSnapshot[]; // historical snapshots for animation
  highlightLetter?: number | null; // index of letter highlighted from heatmap hover (bidirectional link)
  onHoverLetter?: (index: number | null) => void; // callback when hovering a dot (bidirectional link)
}
```

**Fonctionnalités :**

1. **Scatter plot Canvas 2D** — 27 points colorés (voyelles=cyan, consonnes=orange, BOS=purple)
2. **PCA 16D→2D** — via `pca2d()` importé depuis `utils/pca.ts`
3. **Hover** — tooltip Canvas-rendered (pas HTML overlay) avec lettre, type (voyelle/consonne), coordonnées PC1/PC2. Rounded rect avec fill `--surface2`, texte en `--text`, coordonnées en `--text-dim`. Même couche visuelle que le reste du canvas (cohérence NNDiagram).
4. **Bidirectional hover link** (HIGH priority) — Quand l'utilisateur survole un point, `onHoverLetter(index)` est appelé → la ligne correspondante s'illumine dans la heatmap wte au-dessus. Et inversement : `highlightLetter` en prop → le dot correspondant reçoit un anneau de surbrillance + les connexions partant de cette lettre sont accentuées. Pattern identique au BertVizView dans AttentionPage (état hover remonté dans la page parent).
5. **Animation replay** — si snapshots.length ≥ 3, bouton `<button type="button" className="btn btn-secondary pca-replay">▶ Rejouer l'évolution</button>`
   - Animation par `requestAnimationFrame` avec interpolation ease-in-out entre chaque paire de snapshots (~200ms par transition)
   - Total pour 20 snapshots : ~4 secondes (perceptuellement fluide)
   - **Ghost trails** : les 3-4 positions précédentes de chaque dot sont dessinées à alpha décroissant (0.3, 0.15, 0.05), créant un effet de "motion blur" qui montre la trajectoire
   - Label "Étape N" pendant l'animation (snap sur le step exact du snapshot courant)
   - À la fin, revient à l'état courant
6. **Constellation lines — similarité cosinus 16D** (HONEST) — lignes entre les paires d'embeddings les plus similaires selon le cosinus dans l'espace 16D original (pas la distance écran 2D). Top ~80 paires. Alpha et épaisseur proportionnels à la force de similarité (strength = normalized cosine). Couleur = type des endpoints (cyan pour voyelle↔voyelle, orange pour consonne↔consonne, blend pour cross-type). Cross-type et same-type traités ÉGALEMENT — les ponts bigrammes (t↔e, q↔u) sont visibles quand la similarité 16D est forte. Hover : lignes connectées au dot survolé s'allument dans la couleur du dot. Ceci révèle des relations que la projection 2D perd (la similarité vit sur des dimensions non capturées par PC1/PC2).
7. **Dot rendering avec profondeur** — radial gradient par dot (plus lumineux au centre, fade vers l'extérieur, comme des planètes vues au télescope — thème "observatoire scientifique"). Ombre subtile sous chaque dot (1px offset, alpha faible). BOS visuellement distinct : symbole ⊕ et taille légèrement plus grande.
8. **Canvas atmosphere** — vignette radiale peinte sur le canvas (bords plus sombres, centre légèrement plus clair → attire le regard). Grille de points fins (pas de lignes) à intervalles réguliers en couleur `--border` alpha ~0.08 — impression de carte astronomique, pas de tableur.
9. **DPR + ResizeObserver + MutationObserver** — même pattern NNDiagram/LossChart
10. **prefers-reduced-motion** — skip animation, affiche état final immédiatement
11. **jsdom guards** — `typeof ResizeObserver === 'undefined'`, `typeof MutationObserver === 'undefined'`

**Constantes de rendu :**

```typescript
const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const DOT_RADIUS = 12;
const BOS_RADIUS = 15; // BOS légèrement plus grand
const PAD = 50;
const INTERP_DURATION_MS = 200; // durée d'interpolation entre 2 snapshots
const GHOST_TRAIL_COUNT = 4; // nombre de positions fantômes pendant l'animation
const CONSTELLATION_TOP_PAIRS = 80; // top cosine-similar pairs in 16D for constellation lines
```

**Labels / couleurs :**

```typescript
function dotColor(
  ch: string,
  cyanRgb,
  orangeRgb,
  purpleRgb,
): [number, number, number] {
  if (ch === "BOS") return purpleRgb;
  if (VOWELS.has(ch)) return cyanRgb;
  return orangeRgb;
}
```

**Animation state :**

```typescript
// Animation uses rAF with interpolation between snapshot keyframes
const animRef = useRef<{
  frameId: number;
  fromIdx: number; // index snapshot départ
  toIdx: number; // index snapshot cible
  startTime: number; // timestamp début interpolation
  ghostTrail: number[][]; // last N positions per dot [[x,y], ...]
} | null>(null);
```

Le `useEffect` principal dessine le canvas (idle + highlight). Un second `useEffect` gère l'animation rAF (startAnimation/stopAnimation). L'interpolation ease-in-out entre chaque paire de snapshots :

```typescript
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
```

**Canvas background layers (draw order) :**

1. Fill background `--surface`
2. Radial vignette (center transparent → edges rgba(0,0,0,0.15))
3. Grid dots (`--border` at alpha 0.08, spacing ~40px)
4. Axis crosshairs (dashed, faint)
5. Constellation lines (top ~80 cosine-similar pairs in 16D, alpha 0.15–0.60 scaled by strength, type-colored)
6. Ghost trails (during animation only, decreasing alpha)
7. Dot shadows (1px offset, rgba(0,0,0,0.2))
8. Dot radial gradients (main dot fill)
9. Letter labels (centered on dots)
10. Axis labels "PC1" / "PC2"
11. Tooltip (Canvas-rendered rounded rect, when hovering)
12. Legend (bottom, 3 colored dots + labels)
13. Step label during animation ("Étape N")

**Axe labels :** "PC1" et "PC2" aux extrémités des axes pointillés (croix au centre).

**Légende :** intégrée dans le canvas (bottom) — 3 points colorés + labels.

### Step 4: Vérifier que les tests passent

Run: `npx vitest run src/components/PCAScatterPlot.test.tsx`
Expected: 3 tests PASS

### Step 5: Commit

```
feat: add PCAScatterPlot Canvas 2D scatter component
```

---

## Task 5 : CSS pour le scatter PCA + `.text-orange` — FAIT ✅

**Files:**

- Modify: `src/styles.css`

### Step 1: Ajouter `.text-orange` (manquante — HIGH priority)

À côté des classes `.text-cyan`, `.text-green`, `.text-red` existantes (lignes 327-334) :

```css
.text-orange {
  color: var(--orange);
}
```

### Step 2: Ajouter les classes PCA

Ajouter après la section `.nn-*` :

```css
/* ── PCA Scatter Plot ── */
.pca-canvas-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.2);
}

.pca-canvas-wrap canvas {
  display: block;
  width: 100%;
  height: 400px;
  cursor: crosshair;
  background: var(--surface);
  border-radius: 8px;
}

.pca-canvas-wrap .pca-replay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}
```

**Note :** Les classes `.pca-tooltip` et `.pca-step-label` sont absentes — tooltip et step label sont rendus entièrement dans le Canvas (D10, cohérence visuelle, pas de couche HTML par-dessus le canvas).

Responsive (dans les breakpoints existants) :

- `@media (max-width: 768px)` : `.pca-canvas-wrap canvas { height: 300px; }`
- `@media (max-width: 480px)` : `.pca-canvas-wrap canvas { height: 220px; }`

Ce CSS est inclus dans le commit de la Task 4 ou fait un commit séparé si nécessaire.

---

## Task 6 : Intégration dans EmbeddingsPage + hover bidirectionnel — FAIT ✅

**Files:**

- Modify: `src/pages/EmbeddingsPage.tsx`

### Step 1: Ajouter imports

```typescript
import PCAScatterPlot from "../components/PCAScatterPlot";
import { getWteSnapshots } from "../modelStore";
```

### Step 2: Ajouter les données PCA + état hover bidirectionnel

Après la ligne `const charStats = useMemo(...)` :

```typescript
// PCA scatter data (current embeddings as plain numbers)
const wteData = useMemo(
  () => model.stateDict.wte.map((row) => row.map((v) => v.data)),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- model mutable: identity=reset, totalStep=training
  [model, model.totalStep],
);
const wteSnapshots = getWteSnapshots();
```

### Step 3: Hover bidirectionnel — remonter l'état (HIGH priority)

**Pattern identique** au BertVizView dans AttentionPage (`hoverSrc` remonté dans la page parent).

L'état `hoverRow` existe déjà dans EmbeddingsPage (contrôle le bar chart wte). Il faut :

1. **PCA → Heatmap :** Quand l'utilisateur survole un dot dans le scatter PCA, `onHoverLetter(index)` met à jour `hoverRow` → la ligne correspondante s'illumine dans la Heatmap wte au-dessus (le bar chart se met aussi à jour — c'est gratuit car il utilise déjà `hoverRow`).

2. **Heatmap → PCA :** Quand `hoverRow` change (hover sur la heatmap), `highlightLetter={hoverRow}` est passé au PCA → le dot correspondant reçoit un anneau de surbrillance et ses constellation lines sont accentuées.

**Aucun nouveau state requis** — `hoverRow` existant sert les deux directions. C'est le même pattern que `selectedSrc`/`hoverSrc` dans AttentionPage pour BertVizView.

### Step 4: Ajouter le panneau PCA

Après le panneau "Comment wte + wpe se combinent" (dernier panneau actuel), ajouter :

```tsx
{
  /* Carte PCA — les plongements en 2D */
}
<div className="panel">
  <div className="panel-title">
    Carte PCA — les <Term id="plongement" />s en 2D
  </div>
  <div className="label-dim" style={{ marginBottom: 8 }}>
    {model.totalStep === 0
      ? "Poids aléatoires — les lettres sont éparpillées au hasard"
      : `Entraîné (${model.totalStep} étapes) — les lettres similaires se regroupent`}
  </div>
  <div className="explain">
    Chaque lettre est un point dans un espace à 16 <Term id="dimension" />s —
    impossible à visualiser ! On utilise une technique appelée <b>PCA</b> pour
    condenser ces 16 nombres en 2, en gardant les 2 directions les plus
    informatives. C'est comme projeter l'ombre d'un objet 3D sur un mur : on
    perd du détail, mais la forme générale reste visible.
    <br />
    <br />
    Chaque point correspond à une ligne du tableau wte ci-dessus. Couleurs :{" "}
    <span className="text-cyan">voyelles</span>,{" "}
    <span className="text-orange">consonnes</span>,{" "}
    <span className="label-purple">BOS</span>. <b>Survole</b> une lettre pour
    voir ses coordonnées — la ligne correspondante s'éclaire aussi dans le
    tableau.
    {wteSnapshots.length >= 3 && (
      <>
        {" "}
        Clique <b>Rejouer</b> pour voir le chemin réel de chaque lettre pendant
        l'entraînement.
      </>
    )}
  </div>
  <div className="pca-canvas-wrap">
    <PCAScatterPlot
      wteData={wteData}
      totalStep={model.totalStep}
      snapshots={wteSnapshots}
      highlightLetter={hoverRow}
      onHoverLetter={setHoverRow}
    />
  </div>
</div>;
```

**Cohérence vérifiée :**

- Training badge : constat ("les lettres similaires se regroupent"), pas commande. Même pattern que wte badge
- `<Term id="dimension" />` et `<Term id="plongement" />` : termes glossaire existants réutilisés
- "Survole" : même verbe que "Survole une ligne pour voir ses dimensions" (wte panel)
- "Clique Rejouer" : même pattern que NNDiagram
- Backward reference : "Chaque point correspond à une ligne du tableau wte ci-dessus." — pont conceptuel entre heatmap et carte
- Mention du lien hover : "la ligne correspondante s'éclaire aussi dans le tableau" — prépare l'interaction
- "condenser" au lieu de "écraser" — non destructif, approprié pour 10-14 ans
- Seuil Rejouer : ≥ 3 snapshots (avec 2, l'animation A→B n'apporte rien)
- Pas de nouveau terme glossaire (PCA expliqué inline avec métaphore de l'ombre)

### Step 4: Vérifier que les tests passent

Run: `npx vitest run`
Expected: tous les tests PASS

### Step 5: Commit

```
feat: integrate PCA scatter plot into EmbeddingsPage
```

---

## Task 7 : Vérification visuelle avec Playwright — FAIT ✅

### Step 1: Lancer le dev server (`npm run dev`)

### Step 2: Ouvrir la page 2 (Embeddings) dans Playwright

### Step 3: Vérifier l'état initial (non entraîné)

- Le scatter PCA est visible en bas de la page
- 27 points éparpillés avec radial gradient + ombres subtiles
- BOS est légèrement plus grand avec symbole ⊕, couleur purple
- Voyelles = cyan, consonnes = orange
- Vignette radiale (bords plus sombres)
- Constellation lines (cosinus 16D, type-colored, cross-type bridges visibles)
- Pas de bouton Rejouer (aucun snapshot)
- Hover sur un point → tooltip Canvas-rendered avec lettre, type, PC1/PC2
- **Hover bidirectionnel :** survol d'un point → la ligne correspondante s'illumine dans la heatmap wte au-dessus
- **Bidirectionnel inverse :** survol d'une ligne dans la heatmap wte → le dot correspondant a un anneau de surbrillance dans le scatter

### Step 4: Entraîner le modèle (page 5)

- Naviguer page 5 → Entraîner 200 étapes
- Revenir page 2

### Step 5: Vérifier l'état entraîné

- Les points ont bougé (structure visible, voyelles se regroupent)
- Constellation lines : same-type bright + cross-type bridges visibles (t↔e, q↔u si cosinus fort)
- Le bouton "Rejouer l'évolution" est présent (≥3 snapshots avec 200 étapes)
- Cliquer → animation fluide (rAF interpolation) avec ghost trails visibles
- Les points glissent d'un snapshot à l'autre (pas de saut brusque)
- Ghost trails : 3-4 positions précédentes à alpha décroissant (effet time-lapse)
- Label "Étape N" pendant l'animation
- À la fin, retour à l'état courant

### Step 6: Tests visuels supplémentaires

- Thème clair → les couleurs changent correctement (CSS variables)
- Responsive 640px → hauteur réduite à 300px
- prefers-reduced-motion → animation skip, état final immédiat
- Hover bidirectionnel fonctionne dans les deux directions

### Step 7: Screenshot pour archivage

---

## Task 8 : Documentation — FAIT ✅

**Files:**

- Modify: `PLAN.md` (ajouter section 17)
- Modify: `docs/fork-changes.md`

### Contenu section 17 dans PLAN.md :

```markdown
### 17. PCA Scatter Plot des Embeddings — FAIT

Projection PCA 2D des 27 embeddings wte, intégrée dans la page 2 (Embeddings). "Waow moment" de la page 2.

- ✅ `src/utils/pca.ts` — PCA 16D→2D par power iteration (55 lignes, 0 dépendances)
- ✅ `src/components/PCAScatterPlot.tsx` — Canvas 2D scatter plot interactif (~350 lignes)
- ✅ Snapshots wte dans `modelStore.ts` — capture toutes les 50 étapes pendant l'entraînement
- ✅ Animation replay : rAF + interpolation ease-in-out entre snapshots, ghost trails (time-lapse)
- ✅ Visual design : radial gradient dots, constellation lines, vignette atmosphere
- ✅ Hover bidirectionnel PCA ↔ heatmap wte (pont conceptuel "16 nombres = position sur la carte")
- ✅ Tooltip Canvas-rendered (pas HTML overlay)
- ✅ Couleurs : voyelles cyan, consonnes orange, BOS purple ⊕ (CSS variables)
- ✅ Continuité pédagogique : entraîner page 5 → revenir page 2 → scatter reflète les vrais poids
```

### Commit :

```
docs: update PLAN and fork-changes for PCA scatter plot
```

---

## Décisions architecturales

| #   | Décision                                               | Justification                                                                                                                                                                                                          |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Snapshots dans modelStore (pas engine)                 | Engine = read-only. Snapshots = préoccupation de visualisation, pas de modèle                                                                                                                                          |
| D2  | `WteSnapshot { step, wte }`                            | Le step est nécessaire pour le label d'animation et la timeline                                                                                                                                                        |
| D3  | SNAPSHOT_INTERVAL = 50                                 | ~20 snapshots sur 1000 étapes. Assez pour un film fluide, coût négligeable (67 Ko)                                                                                                                                     |
| D4  | Snapshot initial (step 0) capturé au début du training | Permet de montrer le point de départ (aléatoire) dans l'animation                                                                                                                                                      |
| D5  | PCA via power iteration (pas SVD/QR)                   | Suffisant pour 16D, 0 dépendances, port direct du playground                                                                                                                                                           |
| D6  | Seed déterministe dans power iteration                 | `Math.sin(k+1)` au lieu de `Math.random()` → résultats reproductibles                                                                                                                                                  |
| D7  | rAF + interpolation entre snapshots (pas setInterval)  | Fluide ~60fps. Snapshots = keyframes, interpolation ease-in-out entre chaque paire (~200ms). Total ~4s pour 20 snaps. Les chemins réels sont respectés (interpolation entre vrais snapshots, pas trajectoire inventée) |
| D8  | Canvas 2D (pas SVG)                                    | Cohérence avec NNDiagram et LossChart. 27 points + hover + animation + ghost trails + constellation = Canvas plus simple                                                                                               |
| D9  | Composant reçoit wteData + snapshots en props          | Principe C-4 : props primitives only. `useModel()` reste dans la page parent                                                                                                                                           |
| D10 | Tooltip rendu dans le Canvas (pas HTML overlay)        | Cohérence visuelle : même couche que les dots, pas de clash HTML/Canvas. NNDiagram hover est déjà 100% Canvas                                                                                                          |
| D11 | Hover bidirectionnel PCA ↔ heatmap wte                 | Le pont conceptuel clé : "les 16 nombres = une position sur la carte". `hoverRow` existant sert les 2 directions (aucun nouveau state). Pattern BertVizView                                                            |
| D12 | Ghost trails pendant animation (4 frames)              | Montre la trajectoire, pas juste la destination. Différence entre diaporama et time-lapse                                                                                                                              |
| D13 | Constellation lines via cosinus 16D (pas distance 2D)  | HONNÊTETÉ : les lignes reflètent la vraie géométrie du modèle. Top ~80 paires par cosinus. Cross-type visible quand similarité forte (bigrammes t↔e, q↔u). Révèle des relations perdues par la projection PCA 2D       |
| D14 | Radial gradient dots + ombre                           | Profondeur "planètes vues au télescope" — thème observatoire scientifique cohérent                                                                                                                                     |
| D15 | Vignette + grille de points                            | Atmosphère de carte astronomique, attire le regard au centre                                                                                                                                                           |
| D16 | "condenser" (pas "écraser")                            | Un 12 ans pourrait croire que les données sont détruites. "condenser" est non-destructif                                                                                                                               |
| D17 | Training badge en constat (pas commande)               | "les lettres similaires se regroupent" — cohérence avec les autres badges (état + observation)                                                                                                                         |
| D18 | Seuil Rejouer ≥ 3 snapshots                            | Avec 2, c'est juste A→B. Le "waow" vient de 4+ snapshots (chemin chaotique visible)                                                                                                                                    |

## Vérification

1. `npx vitest run` — ~120 tests passent
2. `npx tsc --noEmit` — 0 erreurs TypeScript
3. `npx eslint src/` — 0 warnings, 0 errors
4. `npm run build` — build Vite réussit
5. Playwright — vérification visuelle page 2 :
   - Scatter avec vignette + grille de points + constellation lines (cosinus 16D, cross-type bridges visibles)
   - Dots avec radial gradient + ombres, BOS plus grand avec ⊕
   - Hover → tooltip Canvas-rendered + heatmap wte s'illumine (bidirectionnel)
   - Hover heatmap → dot PCA surligné (bidirectionnel inverse)
   - Animation replay avec ghost trails + interpolation fluide (rAF)
   - Bouton Rejouer visible seulement avec ≥ 3 snapshots
6. Thème clair/sombre — canvas se redessine (CSS variables)
7. `prefers-reduced-motion` — animation skip, état final immédiat

## Review frontend-design — Findings intégrés

Tous les findings de la review frontend-design ont été validés et intégrés dans ce plan :

| #   | Finding                                   | Priorité | Intégré dans                       |
| --- | ----------------------------------------- | -------- | ---------------------------------- |
| F1  | Constellation lines cosinus 16D (honnête) | **High** | Task 1 (cosineSim), Task 4 §6      |
| F2  | Ghost trails pendant animation            | Medium   | Task 4 §5                          |
| F3  | Radial gradient dots + ombres             | Low      | Task 4 §7                          |
| F4  | Canvas vignette + grille de points        | Medium   | Task 4 §8                          |
| F5  | Tooltip Canvas-rendered (pas HTML)        | Low      | Task 4 §3, Task 5                  |
| F6  | Hover bidirectionnel PCA ↔ heatmap        | **High** | Task 4 §4, Task 6 §3               |
| F7  | rAF + interpolation entre snapshots       | **High** | Task 4 §5, D7                      |
| F8  | `.text-orange` CSS manquant               | **High** | Task 5 §1                          |
| F9  | Seuil Rejouer ≥ 3 snapshots               | Low      | Task 4 §5, D18                     |
| F10 | "condenser" au lieu de "écraser"          | Text     | Analyse péda, Task 6 JSX           |
| F11 | Training badge en constat                 | Text     | Analyse péda, Task 6 JSX           |
| F12 | Backward reference dans JSX               | Text     | Analyse péda §couleurs, Task 6 JSX |
