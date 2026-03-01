# Comportements des têtes d'attention — micro-GPT

Architecture : 1 couche, 4 têtes, HEAD_DIM=4, N_EMBD=16, seed=42.

## Résultats empiriques

Investigation : 10 seeds × 1000 étapes × 7 noms par catégorie.
Script : `scripts/investigate-heads.ts`

### Noms courts (3-4 lettres) — 40 classifications

| Comportement  | Fréquence | Exemple (seed 42, "emma")        |
| ------------- | --------- | -------------------------------- |
| **Ancrage**   | 62.5 %    | BOS ~49 %, self ~15 %            |
| **Précédent** | 30.0 %    | prev ~45 %, BOS ~31 %            |
| **Écho**      | 5.0 %     | near ~40 %, BOS ~14 %            |
| **Contexte**  | 2.5 %     | entropie > 1.6, rien de dominant |

### Noms longs (>6 lettres) — 40 classifications

| Comportement | Fréquence |
| ------------ | --------- |
| **Contexte** | 92.5 %    |
| **Ancrage**  | 7.5 %     |
| Précédent    | 0 %       |
| Écho         | 0 %       |

### Interprétation

La longueur de la séquence détermine la différenciation des têtes :

- **Séquences courtes** (3-5 tokens) : peu de cibles possibles, les têtes
  se distinguent davantage (Ancrage, Précédent, parfois Écho).
- **Séquences longues** (>7 tokens) : l'attention se dilue, presque toutes
  les têtes deviennent "Contexte" (entropie élevée, pas de cible dominante).

## Littérature scientifique

### Comportements possibles dans un modèle 1 couche

| Comportement            | Description                                                                                                                                                                                  | Référence                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Attention Sink**      | Attention disproportionnée sur le 1er token (BOS). Le softmax doit totaliser 100 % — quand aucun token passé n'est pertinent, le surplus va au BOS. Universel, même dans les petits modèles. | [When Attention Sink Emerges, ICLR 2025](https://openreview.net/forum?id=78Nn4QJTEN)                            |
| **Previous Token Head** | Regarde surtout le token juste avant (position i-1). Le pattern le plus simple et le plus documenté pour les modèles 1 couche.                                                               | [Previous Token Heads, LessWrong](https://www.lesswrong.com/posts/zRA8B2FJLtTYRgie6/)                           |
| **Positional Head**     | Préfère certaines positions relatives (ex: "2 tokens en arrière"). Généralisation du Previous Token Head.                                                                                    | [A Mathematical Framework for Transformer Circuits](https://transformer-circuits.pub/2021/framework/index.html) |

### Comportements impossibles dans un modèle 1 couche

| Comportement                               | Raison                                                                                                  | Référence                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Induction Head**                         | Nécessite 2 couches minimum — circuit composé (Previous Token Head couche 0 → Induction Head couche 1). | [In-context Learning and Induction Heads, Anthropic](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) |
| **Retrieval / Safety / Attribution Heads** | Nécessitent profondeur et capacité au-delà de notre modèle.                                             | [Awesome Attention Heads, taxonomie](https://github.com/IAAR-Shanghai/Awesome-Attention-Heads)                                                 |

## Taxonomie du classifieur

Le classifieur (`classifyHead`) détecte 4 comportements par heuristique :

| Label         | Signal dans la matrice T×T                              | Seuil principal                |
| ------------- | ------------------------------------------------------- | ------------------------------ |
| **Ancrage**   | avg(BOS) > 0.25 ET avg(self) > 0.15, OU avg(BOS) > 0.35 | Attention sink + self          |
| **Précédent** | avg(prev) > 0.45                                        | Sous-diagonale dominante       |
| **Écho**      | avg(near) > 0.50 ET avg(prev) < 0.45                    | Positions i-1 et i-2 combinées |
| **Contexte**  | avg(entropy) > 1.2 (fallback)                           | Rien de dominant               |

"Écho" est rarement déclenché en pratique mais conservé — il ne dégrade pas
la sincérité du classifieur, il représente un comportement théoriquement
possible (positional head avec fenêtre > 1).

## Stabilité des personnalités

- **Seed fixe (42)** : les personnalités sont reproductibles à chaque
  ouverture de l'app.
- **Seeds différents** : les types de comportement (Ancrage, Contexte)
  apparaissent, mais leur assignation aux indices de tête varie.
- **Ce qui est stable** : l'attention sink (BOS) émerge dans presque tous
  les runs. La différenciation forte (Précédent, Écho) est rare et dépend
  de la longueur de séquence et du nombre d'étapes d'entraînement.
