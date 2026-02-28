# Architecture du réseau de neurones — MicroGPT

> Graphe de calcul complet du forward pass, tracé à partir de `src/engine/model.ts`.
> Sert de spécification pour la visualisation réseau de neurones dans le playground et l'app.

## Constantes du modèle

| Constante    | Valeur  | Description                           |
| ------------ | ------- | ------------------------------------- |
| `N_EMBD`     | 16      | Dimensions d'embedding                |
| `N_HEAD`     | 4       | Nombre de têtes d'attention           |
| `HEAD_DIM`   | 4       | Dimensions par tête (N_EMBD / N_HEAD) |
| `N_LAYER`    | 1       | Nombre de blocs transformer           |
| `BLOCK_SIZE` | 16      | Longueur de contexte maximale         |
| `vocabSize`  | ~27-101 | Dépend du dataset (27 pour names.txt) |

Toutes les constantes sont **hardcodées** — pas de configuration utilisateur.

## Graphe de calcul complet

```
  ┌─────────────┐   ┌─────────────┐
  │ tokEmb [16] │   │ posEmb [16] │    Lookup tables : wte[vocabSize×16], wpe[16×16]
  └──────┬──────┘   └──────┬──────┘
         │                 │
         └────── add ──────┘
                  │
              x [16]                    « Combined embedding »
                  │
           ┌──────┴──────┐
           │  RMSNorm₀   │             Normalisation initiale (pré-couche)
           │    [16]      │             rms = √(Σx²/16 + ε), x = x / rms
           └──────┬──────┘
                  │
  ════════════════╪══════════════════   BLOC TRANSFORMER (N_LAYER = 1)
                  │
           ┌──────┴──────┐
           │  RMSNorm₁   │             Pré-attention norm
           │    [16]      │
           └──────┬──────┘
                  │
              save xRes ─────────────── Connexion résiduelle ①
                  │
         ┌────────┼────────┐
         ↓        ↓        ↓
     ┌───────┐┌───────┐┌───────┐
     │ Wq    ││ Wk    ││ Wv    │       Projections linéaires [16×16]
     │ →Q[16]││ →K[16]││ →V[16]│       Q = Wq·x, K = Wk·x, V = Wv·x
     └───┬───┘└───┬───┘└───┬───┘
         │        │        │
         │    K,V stockés dans le cache KV (positions précédentes)
         │        │        │
    ┌────┴────────┴────────┴────┐
    │   Split en 4 têtes        │       Chaque tête voit HEAD_DIM=4 dims
    │                           │
    │  ┌─────────────────────┐  │
    │  │ Tête 0 (dims 0-3)  │  │
    │  │ qH·kH / √4         │  │──→ scores d'attention [T+1]
    │  │ softmax → poids     │  │──→ poids d'attention [T+1]
    │  │ Σ(poids × vH)      │  │──→ sortie [4]
    │  └─────────────────────┘  │
    │  ┌─────────────────────┐  │
    │  │ Tête 1 (dims 4-7)  │  │──→ sortie [4]
    │  └─────────────────────┘  │
    │  ┌─────────────────────┐  │
    │  │ Tête 2 (dims 8-11) │  │──→ sortie [4]
    │  └─────────────────────┘  │
    │  ┌─────────────────────┐  │
    │  │ Tête 3 (dims 12-15)│  │──→ sortie [4]
    │  └─────────────────────┘  │
    │                           │
    │   concat → xAttn [16]     │       4 têtes × 4 dims = 16
    └─────────────┬─────────────┘
                  │
           ┌──────┴──────┐
           │  Wo [16×16] │             Projection de sortie attention
           │   → [16]    │
           └──────┬──────┘
                  │
              + xRes ────────────────── Résiduel ① : x = attn_out + xRes
                  │
              x [16]                    « After attention »
                  │
           ┌──────┴──────┐
           │  RMSNorm₂   │             Pré-MLP norm
           │    [16]      │
           └──────┬──────┘
                  │
              save xRes2 ───────────── Connexion résiduelle ②
                  │
           ┌──────┴──────┐
           │ fc1 [64×16] │             MLP expansion ×4
           │   → [64]    │             64 neurones cachés
           └──────┬──────┘
                  │
           ┌──────┴──────┐
           │    ReLU     │             max(0, x) — seule activation non-linéaire
           │    [64]     │             ~50% des neurones à zéro (sparsité)
           └──────┬──────┘
                  │
           ┌──────┴──────┐
           │ fc2 [16×64] │             MLP projection retour
           │   → [16]    │
           └──────┬──────┘
                  │
              + xRes2 ───────────────── Résiduel ② : x = mlp_out + xRes2
                  │
  ════════════════╪══════════════════   FIN BLOC TRANSFORMER
                  │
              x [16]                    « After MLP » (état caché final)
                  │
           ┌──────┴──────┐
           │  lm_head    │             Projection vers vocabulaire [vocabSize×16]
           │→ logits[V]  │             V = vocabSize (27 pour a-z + BOS)
           └──────┬──────┘
                  │
           ┌──────┴──────┐
           │   softmax   │             Normalisation en probabilités
           │→ probs [V]  │             Σ = 1.0
           └──────┬──────┘
                  │
              token prédit              argmax(probs) ou échantillonnage
```

## Données du trace (`ForwardTrace`)

Valeurs capturées par `gptForward(..., trace=true)` et disponibles pour la visualisation :

| Champ           | Forme          | Étape du graphe                    |
| --------------- | -------------- | ---------------------------------- |
| `tokEmb`        | `number[16]`   | Embedding du token                 |
| `posEmb`        | `number[16]`   | Embedding de la position           |
| `combined`      | `number[16]`   | tokEmb + posEmb                    |
| `afterNorm`     | `number[16]`   | Après RMSNorm₀                     |
| `q`             | `number[16]`   | Vecteur Query                      |
| `k`             | `number[16]`   | Vecteur Key                        |
| `v`             | `number[16]`   | Vecteur Value                      |
| `attnWeights`   | `number[4][T]` | Poids d'attention par tête         |
| `afterAttn`     | `number[16]`   | Après attention + résiduel ①       |
| `mlpHidden`     | `number[64]`   | Pré-activation MLP (avant ReLU)    |
| `mlpActiveMask` | `boolean[64]`  | Masque ReLU (true = neurone actif) |
| `afterMlp`      | `number[16]`   | Après MLP + résiduel ②             |
| `logits`        | `number[V]`    | Scores bruts par token             |
| `probs`         | `number[V]`    | Probabilités (softmax des logits)  |

## Couches pour la visualisation

Mapping du graphe vers des colonnes de neurones connectés :

```
Col  Nom                  Neurones  Données trace         Notes
───  ───────────────────  ────────  ────────────────────  ──────────────────────
 1   Token Embedding       16       tokEmb                Lookup wte
 2   Position Embedding    16       posEmb                Lookup wpe
 3   Combined + Norm       16       combined → afterNorm  add + RMSNorm₀
 4   Q (Query)             16       q                     ┐
 5   K (Key)               16       k                     ├ 3 projections parallèles
 6   V (Value)             16       v                     ┘
 7a  Tête 0                 4       attnWeights[0]        ┐
 7b  Tête 1                 4       attnWeights[1]        ├ 4 têtes indépendantes
 7c  Tête 2                 4       attnWeights[2]        │  (HEAD_DIM = 4)
 7d  Tête 3                 4       attnWeights[3]        ┘
 8   After Attention        16       afterAttn             Wo + résiduel ①
 9   MLP Hidden             64       mlpHidden             fc1 (expansion ×4)
10   MLP ReLU               64       mlpActiveMask         max(0, x) — sparsité
11   After MLP              16       afterMlp              fc2 + résiduel ②
12   Logits                  V       logits                lm_head projection
13   Probabilités            V       probs                 softmax → distribution
```

## Connexions entre colonnes

| De → Vers    | Type           | Poids           | Nombre de lignes |
| ------------ | -------------- | --------------- | ---------------- |
| 1 → 3        | add (1:1)      | —               | 16               |
| 2 → 3        | add (1:1)      | —               | 16               |
| 3 → 4 (Q)    | linéaire dense | attn_wq [16×16] | 256              |
| 3 → 5 (K)    | linéaire dense | attn_wk [16×16] | 256              |
| 3 → 6 (V)    | linéaire dense | attn_wv [16×16] | 256              |
| 4,5,6 → 7a-d | split (slice)  | —               | 16 par tête      |
| 7a-d → 8     | concat + Wo    | attn_wo [16×16] | 16 + 256         |
| 8 → 9        | linéaire dense | mlp_fc1 [64×16] | 1 024            |
| 9 → 10       | ReLU (1:1)     | —               | 64               |
| 10 → 11      | linéaire dense | mlp_fc2 [16×64] | 1 024            |
| 11 → 12      | linéaire dense | lm_head [V×16]  | 16 × V           |
| 12 → 13      | softmax (all)  | —               | V × V            |

**Connexions résiduelles** (arcs qui sautent des couches) :

- 3 → 8 : résiduel ① (skip attention)
- 8 → 11 : résiduel ② (skip MLP)

## Matrices de poids

| Matrice          | Forme           | Paramètres | Rôle                        |
| ---------------- | --------------- | ---------- | --------------------------- |
| `wte`            | [vocabSize, 16] | ~432       | Token embeddings            |
| `wpe`            | [16, 16]        | 256        | Position embeddings         |
| `layer0.attn_wq` | [16, 16]        | 256        | Projection Query            |
| `layer0.attn_wk` | [16, 16]        | 256        | Projection Key              |
| `layer0.attn_wv` | [16, 16]        | 256        | Projection Value            |
| `layer0.attn_wo` | [16, 16]        | 256        | Projection sortie attention |
| `layer0.mlp_fc1` | [64, 16]        | 1 024      | MLP expansion               |
| `layer0.mlp_fc2` | [16, 64]        | 1 024      | MLP contraction             |
| `lm_head`        | [vocabSize, 16] | ~432       | Projection logits           |

**Total** : ~4 192 paramètres (avec vocabSize=27)

## Opérations clés

### RMSNorm (Root Mean Square Normalization)

```
rms = √(Σᵢ xᵢ² / n + ε)     avec ε = 1e-5
x̂ᵢ = xᵢ / rms
```

Pas de paramètres appris (pas de γ, β). Utilisé 3 fois : avant la couche, avant attention, avant MLP.

### Attention (par tête)

```
score(t) = qH · kH(t) / √HEAD_DIM     pour chaque position t du contexte
weights = softmax(scores)               distribution sur les positions
output(j) = Σₜ weights(t) × vH(t)(j)   moyenne pondérée des valeurs
```

Attention **causale** implicite : seules les positions 0..pos_courante sont dans le cache KV.

### ReLU

```
relu(x) = max(0, x)
```

Seule non-linéarité du modèle. Produit de la **sparsité** : ~50% des 64 neurones MLP sont à zéro.

## Notes pour la visualisation

1. **Colonnes 1-2** (embeddings) : connexions 1:1 vers colonne 3 (addition élément par élément)
2. **Colonnes 4-6** (Q/K/V) : projections parallèles depuis la même source — dessiner 3 faisceaux
3. **Colonnes 7a-d** (têtes) : 4 groupes visuels distincts, chacun de 4 neurones — montrer les poids d'attention comme opacité des connexions
4. **Résidus** : arcs courbes qui contournent les blocs (3→8, 8→11) — visuellement distincts des connexions denses
5. **ReLU** (col 9→10) : neurones inactifs en gris/transparent, actifs en couleur — le masque binaire est très visuel
6. **Softmax** (col 12→13) : pas de connexion individuelle — plutôt un bloc « normalisation » qui redistribute les valeurs
7. **Animation** : le signal traverse de gauche à droite, couche par couche, avec un délai par étape
