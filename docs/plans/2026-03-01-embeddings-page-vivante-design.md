# Design : EmbeddingsPage vivante

## Contexte

La page "Plongements (Embeddings)" affiche deux heatmaps statiques (wte 27x16, wpe 16x16) et un panneau interactif wte+wpe. Les heatmaps sont un mur de chiffres colores sans narration : l'ado ne comprend pas ce que representent les 16 dimensions, ne voit pas le lien avec le dataset, et ne sait pas que les valeurs sont aleatoires avant training.

**Objectif :** Transformer le survol d'une ligne en moment pedagogique — bar chart visuel, stats dataset, et conscience de l'etat du training.

## Design valide

### 1. Bar chart a cote de wte (Option A du proto)

**Layout :** Flex row `.heatmap-with-bars` dans le panneau wte.

- Gauche : heatmap existante (inchangee)
- Droite : nouveau composant `EmbeddingBarChart` (sticky, flex 1 1 280px)
- Responsive : `flex-direction: column` sous 900px

**EmbeddingBarChart :**

- Props : `values: number[] | null`, `label: string | null`, `charStats: CharStats | null`
- Etat vide : "Survole une lettre dans le tableau"
- Etat actif : 16 barres verticales (vert = positif, rouge = negatif)
- `transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` pour les changements fluides
- Labels d0-d15 en dessous, valeur au hover
- Legende : positif / negatif / zero

### 2. Stats dataset au hover

**Calcul :** `computeCharStats(docs: string[])` dans `src/utils/charStats.ts`

- Pour chaque lettre : frequence (X/Y prenoms, Z%), top 3 lettres suivantes, top 3 precedentes
- `useMemo` sur `model.docs` dans EmbeddingsPage
- O(n) sur les noms, instantane meme sur 33k

**Affichage :** Sous-titre dans le bar chart :

- `42/50 prenoms (84%) . Souvent apres : l, r, n`
- BOS : "Token special — marque le debut et la fin de chaque nom."

### 3. Badge etat du training

**Emplacement :** Sous le `.panel-title` de wte, une ligne discrete.

- `totalStep === 0` : "Valeurs aleatoires — entraine le modele (page 4) pour voir des motifs apparaitre"
- `totalStep > 0` : "Entraine (X etapes) — les lettres similaires developpent des motifs proches"

CSS : `font-size: 11px`, `color: var(--text-dim)`, fond `var(--surface2)`, `border-radius: 4px`.

## Fichiers concernes

| Fichier                                | Action                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `src/components/EmbeddingBarChart.tsx` | Nouveau composant                                              |
| `src/utils/charStats.ts`               | Nouveau utilitaire                                             |
| `src/pages/EmbeddingsPage.tsx`         | Integration bar chart + stats + badge                          |
| `src/styles.css`                       | Classes `.heatmap-with-bars`, `.barchart-*`, `.training-badge` |

## Ce qui ne change PAS

- Heatmap.tsx (aucune modification)
- VectorBar (aucune modification)
- Panneau wpe (statique, pas de bar chart)
- Panneau "Comment wte + wpe se combinent" (deja interactif)
- modelStore.ts, engine/\* (read-only)

## Verification

1. Hover wte ligne 'e' → bar chart s'affiche avec stats "42/50 prenoms"
2. Hover ligne 'a' → barres transitionnent, stats changent
3. Hover BOS → message special
4. Quitter le hover → etat vide "Survole une lettre"
5. Changer dataset → stats recalculees
6. Avant training → badge "aleatoire"
7. Apres training (200 etapes) → badge "entraine"
8. Mobile < 900px → bar chart passe sous la heatmap
9. `prefers-reduced-motion` → transitions desactivees
10. `npx vitest run` → 94+ tests passent
