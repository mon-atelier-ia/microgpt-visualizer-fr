# Design — Page Attention (page 4)

> **Contexte** : Cette page s'insère entre Propagation (3) et Entraînement (5→futur 6).
> Elle comble le gap critique identifié dans l'audit pédagogique : l'attention est
> actuellement trivialisée (token unique → `[1.0]`). La source de vérité est le guide
> Karpathy : _"Attention is a token communication mechanism"_.
>
> Voir : `docs/reference-microgpt-karpathy.md` section 6 (Architecture → Attention)

---

## 1. Arc narratif — la "story" de la page

### Le problème que cette page résout

L'élève sort de la page 3 (Propagation) en ayant vu **un seul token** traverser le modèle.
L'attention y affichait `[1.0]` partout — trivial, pas intéressant. L'élève pourrait
conclure (à tort) que l'attention ne sert à rien.

Cette page renverse cette impression en montrant ce qui se passe avec **une séquence
complète**. C'est le moment "ah-ha" : le modèle regarde en arrière pour décider quoi
prédire.

### Le fil narratif (6 panneaux)

```
Panneau 1 — "Pourquoi l'attention ?"
   Le problème : un token seul ne sait pas ce qui est venu avant.
   Transition depuis la page 3 : "tu as vu [1.0], maintenant voici pourquoi"
           │
           ▼
Panneau 2 — "Une séquence complète"
   L'élève choisit un nom → voit les tokens s'empiler un par un.
   Le KV cache se remplit à chaque position.
           │
           ▼
Panneau 3 — "Q, K, V — trois rôles"
   Pour une position choisie : que cherche ce token (Q),
   qu'offrent les précédents (K, V) ?
   Analogie de la classe (glossaire existant).
           │
           ▼
Panneau 4 — "La matrice d'attention"         ← VISUALISATION CENTRALE
   Heatmap T×T par tête. Le masque causal est visible
   (triangle : on ne regarde pas le futur).
   Interactif : sélection position + tête.
           │
           ▼
Panneau 5 — "4 têtes, 4 regards différents"
   Les 4 heatmaps côte à côte. Après entraînement,
   chaque tête se spécialise.
           │
           ▼
Panneau 6 — "Récapitulatif"
   Comment ça s'intègre dans le pipeline global.
   Pont vers l'entraînement et l'inférence.
```

---

## 2. Panneau par panneau

### Panneau 1 — "Pourquoi l'attention ?"

**Objectif** : Poser le problème. Faire le lien avec la page 3.

**Texte pédagogique** (draft) :

> À l'étape 3, tu as fait passer un seul token dans le modèle. L'attention affichait
> `[1.0]` — le token ne regardait que lui-même, car il n'y avait personne d'autre.
>
> Mais pour prédire le caractère suivant, le modèle a besoin de **contexte** : après
> "em", la lettre "m" est probable ; après "emm", "a" est probable. Comment le modèle
> sait-il ce qui est venu avant ?
>
> **L'attention est le seul endroit où un token peut regarder les tokens passés.**
> C'est un mécanisme de communication.

**Rappel explicite** : "comme tu l'as vu à l'étape 2, chaque token a son propre
vecteur de 16 nombres (son plongement). L'attention utilise ces vecteurs pour décider
quels tokens passés sont pertinents."

**Données** : aucune (texte pur + éventuellement le diagramme de flux simplifié
montrant où l'attention se situe dans le pipeline).

---

### Panneau 2 — "Une séquence complète"

**Objectif** : Montrer les tokens s'empiler. Construire l'intuition du KV cache.

**Interaction** :

- Sélecteur de nom parmi le dataset actif (boutons, comme les sélecteurs des pages 2/3).
  Défaut : un nom court (ex: "emma" → 6 tokens avec BOS).
- Le nom est tokenisé et affiché comme séquence : `[BOS, e, m, m, a, BOS]`
- Un **curseur de position** (boutons 0..T-1) permet de choisir "à quelle position
  on regarde". Quand on avance, les tokens précédents sont visuellement "empilés" —
  ils sont dans le cache, disponibles pour l'attention.

**Texte pédagogique** (draft) :

> Quand le modèle lit un nom, il traite les tokens **un par un, de gauche à droite**.
> À chaque nouvelle position, il garde en mémoire les tokens déjà vus
> (leur clé K et leur valeur V) dans un **cache**.
>
> Choisis un nom et avance position par position. Observe comment le contexte
> s'agrandit à chaque étape.

**Animation placeholder** : les tokens apparaissent un à un (slide+fade, même pattern
que TokenizerPage). Le token actuel est en surbrillance, les précédents sont grisés
mais visibles.

**Données** :

- `tokenize(name)` → tableau de tokens
- Pour chaque position : appeler `gptForward(tokenId, posId, keys, vals, model, true)`
  avec le KV cache cumulé (même pattern que `trainStep` lignes 250-261)
- Stocker un `ForwardTrace[]` (un par position)

---

### Panneau 3 — "Q, K, V — trois rôles"

**Objectif** : Expliquer les trois vecteurs pour la position sélectionnée.

**Texte pédagogique** (draft) :

> À chaque position, le token courant est projeté en trois vecteurs :
>
> - **Q (Query = question)** : "Qu'est-ce que je cherche ?"
> - **K (Key = clé)** : "Qu'est-ce que je contiens ?"
> - **V (Value = valeur)** : "Qu'est-ce que j'ai à offrir si on me sélectionne ?"
>
> Imagine une salle de classe. Chaque élève (token) a :
>
> - une **question** qu'il veut poser aux autres (Q)
> - une **étiquette** qui dit ce qu'il sait (K)
> - un **cahier** avec l'info à partager (V)
>
> L'attention calcule : "à quel point ma question (Q) correspond-elle à l'étiquette
> (K) de chaque token passé ?" Plus ça correspond, plus j'écoute son cahier (V).

**Visualisation** :

- 3 `VectorBar` (composant existant de `Heatmap.tsx`) montrant Q, K, V du token
  sélectionné (16 dimensions chacun)
- Rappel : "ces 16 nombres viennent des matrices wq, wk, wv que tu as vues à l'étape 3
  dans le diagramme de flux"

**Animation placeholder** : highlight séquentiel Q → K → V (3 barres qui apparaissent
l'une après l'autre).

**Données** : `traces[selectedPos].q`, `.k`, `.v` (number[16] chacun, déjà dans
ForwardTrace)

---

### Panneau 4 — "La matrice d'attention" (VISUALISATION CENTRALE)

**Objectif** : Montrer comment l'attention distribue les poids sur les tokens passés.
C'est LE moment pédagogique de la page.

**Texte pédagogique** (draft) :

> Voici ce que le modèle "voit" quand il est à la position {selectedPos}.
> Chaque cellule indique **combien il écoute** le token à cette colonne.
>
> - Les poids totalisent toujours 100 % (grâce au softmax).
> - Le triangle gris en haut à droite, c'est le **masque causal** : le modèle
>   **ne peut pas regarder le futur**. C'est ce qui rend la génération possible
>   — tu le verras en action à l'étape 6 (Inférence).

**Visualisation** :

- Heatmap T×T pour une tête sélectionnée.
  - Axe Y (lignes) = position du token qui "pose la question" (Q)
  - Axe X (colonnes) = position du token qui "répond" (K)
  - Cellule = poids d'attention (0.0 à 1.0)
  - Couleur : même palette que les heatmaps existantes (vert intense = poids élevé)
- **Masque causal visible** : cellules au-dessus de la diagonale grisées / barrées
  (le token à la position 2 ne peut voir que les positions 0, 1, 2)
- Ligne sélectionnée (position courante) en surbrillance
- Labels axes : les caractères du nom (pas les IDs numériques)

**Interaction** :

- Sélecteur de tête (0, 1, 2, 3) en boutons toggle
- Click/hover sur une ligne pour voir la distribution de cette position
- La position sélectionnée dans le panneau 2 met en surbrillance la ligne correspondante

**Animation placeholder** : la matrice se "construit" ligne par ligne de haut en bas
(chaque ligne = une position ajoutée au cache). Effet : l'élève voit le triangle se
remplir progressivement.

**Données** :

- Pour chaque position `p` : `traces[p].attnWeights[head]` → nombre[] de taille `p+1`
- Assembler en matrice T×T : `matrix[row][col]` où `row` = position query,
  `col` = position key. Les cellules `col > row` = masquées (causal).
- La matrice est différente pour chaque tête.

**Détail technique — dimensions** :

- Nom "emma" → 6 tokens → matrice 6×6
- Chaque tête a sa propre matrice (4 matrices)
- Les poids d'attention viennent de `softmax(Q·K^T / √d_head)` avec `d_head = 4`
- Le masque causal n'est pas explicite dans le code — il est implicite car le KV cache
  à la position `p` ne contient que les clés/valeurs des positions `0..p`

---

### Panneau 5 — "4 têtes, 4 regards différents"

**Objectif** : Montrer que les têtes se spécialisent. Comparaison côte à côte.

**Texte pédagogique** (draft) :

> Le modèle a **4 têtes** d'attention qui travaillent en parallèle. Chacune pose une
> question différente. Après l'entraînement (étape 5), elles se spécialisent :
> l'une regarde peut-être le token juste avant, une autre cherche les voyelles,
> une autre le début du nom...
>
> Avant l'entraînement, les 4 têtes sont presque identiques (poids aléatoires).
> C'est normal — c'est l'entraînement qui crée la spécialisation.

**Visualisation** :

- 4 heatmaps T×T côte à côte (compact, taille réduite par rapport au panneau 4)
- Labels "Tête 0", "Tête 1", "Tête 2", "Tête 3"
- Responsive : 2×2 en mobile, 4×1 en desktop

**Badge entraînement** (même pattern que EmbeddingsPage) :

- `totalStep === 0` : "Poids aléatoires — les têtes se ressemblent. Reviens après
  avoir entraîné le modèle à l'étape 5"
- `totalStep > 0` : "Entraîné ({totalStep} étapes) — observe comment les têtes
  ont appris des motifs différents"

**Animation placeholder** : aucune (les heatmaps sont statiques, l'animation est
dans le panneau 4).

**Données** : même matrice que panneau 4, juste pour les 4 têtes simultanément.

---

### Panneau 6 — "Comment ça s'intègre"

**Objectif** : Boucler. Relier au pipeline global et ponter vers les pages suivantes.

**Texte pédagogique** (draft) :

> Récapitulons. Pour chaque token :
>
> 1. Le modèle calcule Q, K, V (3 projections linéaires)
> 2. Il compare Q avec toutes les K passées (produit scalaire → softmax)
> 3. Il utilise les poids pour faire une moyenne pondérée des V
> 4. Les résultats des 4 têtes sont concaténés et projetés (matrice wo)
> 5. Le tout est additionné au vecteur d'entrée (connexion résiduelle —
>    même si l'attention n'apprend rien d'utile, l'information passe quand même)
>
> L'attention est le **seul endroit** où les tokens communiquent entre eux.
> Tout le reste (MLP, lm_head) travaille sur un seul token à la fois.
>
> À l'étape 5 (Entraînement), tu verras le modèle ajuster les 1 024 paramètres
> des matrices Q, K, V et wo pour que l'attention apprenne les bons motifs.
> Et à l'étape 6 (Inférence), tu verras le modèle utiliser ce mécanisme
> à chaque nouveau caractère qu'il génère.

**Données** : aucune (texte pur).

**Nouveau terme glossaire à ajouter** : `connexion-residuelle`

- `label` : "connexion résiduelle"
- `short` : "Additionner la sortie d'un bloc à son entrée. Même si le bloc n'apprend
  rien, l'information passe quand même."
- `long` : analogie du filet de sécurité / autoroute avec bretelle

---

## 3. Données et calcul

### Source des données

La page appelle `gptForward()` en boucle sur une séquence complète, exactement comme
`trainStep` le fait (model.ts:250-261). Pas de modification de l'engine.

```typescript
// Pseudo-code du calcul côté page (pas dans l'engine)
function computeSequenceTraces(
  name: string,
  model: ModelState,
): ForwardTrace[] {
  const tokens = tokenize(name);
  const n = Math.min(BLOCK_SIZE, tokens.length - 1);
  const keys: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const vals: Value[][][] = Array.from({ length: N_LAYER }, () => []);
  const traces: ForwardTrace[] = [];

  for (let pos = 0; pos < n; pos++) {
    const { trace } = gptForward(tokens[pos], pos, keys, vals, model, true);
    traces.push(trace!);
  }
  return traces;
}
```

### Performance

- Nom typique = 4-8 tokens → 4-8 appels `gptForward` avec trace
- `gptForward` avec trace est déjà utilisé dans ForwardPassPage (1 appel)
- 8 appels = ~8× le coût actuel de ForwardPassPage → acceptable
- Recalcul à chaque changement de nom ou après entraînement (via `useModel()`)
- Envelopper dans `useMemo` keyed sur `[name, model, model.totalStep]`

### Assemblage de la matrice d'attention

```typescript
// Pour chaque tête h, assembler la matrice T×T
function buildAttnMatrix(traces: ForwardTrace[], head: number): number[][] {
  return traces.map((trace) => {
    // trace.attnWeights[head] = poids sur les positions 0..pos
    // Padder avec 0 pour les positions futures (masque causal)
    const row = new Array(traces.length).fill(0);
    const weights = trace.attnWeights[head];
    for (let i = 0; i < weights.length; i++) {
      row[i] = weights[i];
    }
    return row;
  });
}
```

---

## 4. Continuité inter-pages

### Rappels vers les pages précédentes (pas de répétition, juste des ponts)

| Page            | Rappel dans la page Attention                                            |
| --------------- | ------------------------------------------------------------------------ |
| 1. Tokenisation | "Le nom 'emma' devient `[BOS, e, m, m, a, BOS]` (étape 1)"               |
| 2. Plongements  | "Chaque token a son vecteur de 16 nombres (étape 2)"                     |
| 3. Propagation  | "À l'étape 3, l'attention affichait [1.0] — maintenant tu vois pourquoi" |

### Phrases prospectives vers les pages suivantes

| Page            | Phrase dans la page Attention                                             |
| --------------- | ------------------------------------------------------------------------- |
| 5. Entraînement | "C'est l'entraînement (étape 5) qui apprend aux têtes à se spécialiser"   |
| 6. Inférence    | "Le masque causal rend la génération possible — tu le verras à l'étape 6" |

### Modification de la page 3 (Propagation)

- **Retirer** `AttentionWeightsPanel` (ou le remplacer par un lien) :
  "Pour voir l'attention en action sur une séquence complète, va à l'étape 4."
- **Garder** la boîte "Attention" dans FlowDiagram (elle montre Q/K/V brièvement,
  c'est un résumé utile)

### Renumérotation

```
Sidebar PAGES actuelle          Sidebar PAGES proposée
1. Tokenisation                 1. Tokenisation
2. Plongements (wte/wpe)        2. Plongements (wte/wpe)
3. Propagation                  3. Propagation
4. Entraînement                 4. Attention           ← NOUVEAU
5. Inférence                    5. Entraînement
                                6. Inférence
```

---

## 5. Composants React à créer/modifier

### Nouveaux fichiers

| Fichier                         | Rôle                                                | ~Lignes |
| ------------------------------- | --------------------------------------------------- | ------- |
| `src/pages/AttentionPage.tsx`   | Page principale, boucle multi-token, 6 panneaux     | ~250    |
| `src/components/AttnMatrix.tsx` | Heatmap T×T (une tête), masque causal, labels chars | ~80     |

### Fichiers modifiés

| Fichier                                    | Modification                                               |
| ------------------------------------------ | ---------------------------------------------------------- |
| `src/App.tsx`                              | Ajouter page 4 dans PAGES, lazy import, rendu conditionnel |
| `src/pages/ForwardPassPage.tsx`            | Retirer/modifier AttentionWeightsPanel                     |
| `src/components/AttentionWeightsPanel.tsx` | Supprimer ou transformer en lien                           |
| `src/data/glossary.ts`                     | Ajouter `connexion-residuelle`                             |

### Composants réutilisés (existants)

| Composant                      | Usage                                          |
| ------------------------------ | ---------------------------------------------- |
| `VectorBar` (from Heatmap.tsx) | Afficher Q, K, V (panneau 3)                   |
| `HeatCell`                     | Cellules de la matrice d'attention (panneau 4) |
| `PageSection`                  | Wrapper de page                                |
| `Term`                         | Glossaire inline                               |
| `useModel()`                   | Accès au modèle partagé                        |

---

## 6. Ce qui est hors périmètre

- Canvas 2D / animations complexes (les playgrounds sont séparés)
- Visualisation du produit scalaire Q·K pas à pas (trop mathématique)
- Modification de l'engine (la boucle multi-token est côté page)
- Slider de température d'attention / scale factor (sur-ingénierie pour la cible)
- Vue 3D, drag-and-drop, libs externes

---

## 7. Décisions prises

### D1. Sélecteur de nom → Boutons prédéfinis + input libre

Boutons raccourcis (emma, léa, hugo, ali) pour le guidage + champ texte libre pour
l'exploration. Même pattern combiné que les pages précédentes (boutons toggle +
possibilité de taper). Les boutons prédéfinis garantissent des motifs intéressants
après entraînement ; l'input libre permet l'engagement personnel.

### D2. Taille matrice → Libre + responsive (max 15×15)

Pas de limite artificielle. Le plafond naturel est `BLOCK_SIZE = 16` : un nom de
N chars → N+2 tokens (avec 2 BOS) → `n = min(16, tokens.length - 1)` positions
traitées → matrice max **15×15**. En pratique : noms 3-8 chars = matrices 5-10,
très lisibles. Les cellules s'adaptent (grandes pour petits noms, réduites pour
grands). Le composant `Heatmap.tsx` gère déjà des matrices 27×16 — pas de problème.

### D3. AttentionWeightsPanel (page 3) → Garder + reformuler en cliffhanger

Garder les cellules `[1.0]` mais reformuler le texte pour créer la curiosité :

> "Avec un seul token, l'attention est triviale : chaque tête ne regarde
> qu'elle-même (1.0). **Reviens après avoir exploré l'étape 4 (Attention)
> pour voir la différence** — avec une séquence complète, les poids
> se répartissent sur les tokens précédents."

Pattern identique au badge "reviens après" de EmbeddingsPage — le cliffhanger
invite à explorer la page 4, puis à revenir constater le contraste.
