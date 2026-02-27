/**
 * Glossaire pédagogique — définitions des termes techniques.
 *
 * - `label`  : texte affiché inline (peut différer de la clé)
 * - `short`  : tooltip (1-2 phrases, accessible dès 10 ans)
 * - `long`   : contenu du modal "En savoir plus" (optionnel)
 */

export interface TermDef {
  label: string;
  short: string;
  long?: string;
}

export const GLOSSARY: Record<string, TermDef> = {
  /* ───── Tier 1 — tooltip seul ───── */

  token: {
    label: "token",
    short:
      "Un morceau de texte que le modèle traite. Ici, chaque lettre est un token.",
  },
  bos: {
    label: "BOS",
    short:
      "« Beginning Of Sequence » — token spécial qui marque le début et la fin d'un nom.",
  },
  vocabulaire: {
    label: "vocabulaire",
    short:
      "L'ensemble de tous les tokens possibles. Ici : 26 lettres + BOS = 27.",
  },
  identifiant: {
    label: "identifiant",
    short:
      "Le numéro unique attribué à chaque token (a = 0, b = 1, ..., BOS = 26).",
  },
  vecteur: {
    label: "vecteur",
    short:
      "Une liste de nombres. Ici, 16 nombres qui représentent un token ou une position.",
  },
  dimension: {
    label: "dimension",
    short:
      "Le nombre de valeurs dans un vecteur. Ici, chaque vecteur a 16 dimensions.",
  },
  parametre: {
    label: "paramètre",
    short:
      "Un nombre ajustable dans le modèle. L'entraînement modifie les 4 192 paramètres.",
  },
  logits: {
    label: "logits",
    short:
      "Les scores bruts produits par le modèle avant d'être convertis en probabilités.",
  },
  neurone: {
    label: "neurone",
    short:
      "Une unité de calcul qui reçoit des nombres, les transforme et transmet le résultat.",
  },
  "taux-apprentissage": {
    label: "taux d'apprentissage",
    short:
      "La taille du pas d'ajustement à chaque étape. Trop grand = instable, trop petit = lent.",
  },
  "moyenne-mobile": {
    label: "moyenne mobile",
    short:
      "Une moyenne calculée sur les dernières valeurs pour lisser les variations.",
  },
  distribution: {
    label: "distribution",
    short:
      "La répartition des probabilités entre tous les tokens possibles (total = 100 %).",
  },
  tokeniseur: {
    label: "tokeniseur",
    short:
      "Le programme qui découpe le texte en tokens et leur attribue un identifiant numérique.",
  },
  wte: {
    label: "wte",
    short:
      "« Word Token Embeddings » — le tableau qui associe chaque token à son vecteur de plongement.",
  },
  wpe: {
    label: "wpe",
    short:
      "« Word Position Embeddings » — le tableau qui associe chaque position à son vecteur.",
  },

  /* ───── Tier 2 — tooltip + modal « En savoir plus » ───── */

  plongement: {
    label: "plongement",
    short:
      "La représentation d'un token sous forme de vecteur de nombres.",
    long: `Imagine que chaque lettre a une adresse GPS secrète — pas dans le monde réel, mais dans un espace mathématique à 16 dimensions.

Le plongement (embedding en anglais) transforme un simple numéro de token (par exemple a = 0) en une liste de 16 nombres décimaux. Ces nombres ne sont pas choisis à l'avance : le modèle les apprend pendant l'entraînement.

Pourquoi c'est utile ? Parce que les lettres qui apparaissent souvent dans les mêmes contextes (comme « a » et « e » en fin de prénom) finissent par avoir des plongements proches. Le modèle découvre tout seul que ces lettres se « ressemblent ».

C'est un peu comme si tu rangeais des élèves dans la classe : ceux qui ont les mêmes goûts finiraient assis les uns à côté des autres.`,
  },
  attention: {
    label: "attention",
    short:
      "Le mécanisme qui permet au modèle de regarder les tokens précédents pour décider du suivant.",
    long: `Imagine une classe où chaque élève peut lever la main pour poser une question aux autres.

Le mécanisme d'attention fonctionne en trois étapes :
- Q (Query = question) : « Qu'est-ce que je cherche ? »
- K (Key = clé) : « Qu'est-ce que je contiens ? »
- V (Value = valeur) : « Qu'est-ce que j'ai à offrir ? »

Chaque token crée ses propres Q, K et V. Ensuite, le modèle calcule à quel point la question d'un token correspond aux clés des autres. Plus ça correspond, plus le token « écoute » l'autre.

Notre micro-modèle a 4 « têtes » d'attention : c'est comme si 4 élèves posaient chacun une question différente. L'un regarde peut-être la voyelle précédente, un autre la consonne juste avant, etc.

C'est le mécanisme le plus important du Transformer — c'est lui qui donne au modèle la capacité de « comprendre » le contexte.`,
  },
  softmax: {
    label: "softmax",
    short:
      "Transforme des scores en probabilités (nombres entre 0 et 1 qui totalisent 100 %).",
    long: `Le modèle produit des scores bruts (les logits) pour chaque token possible. Mais ces scores peuvent être n'importe quel nombre : 2.5, -1.3, 0.8...

Softmax les transforme en probabilités propres :
1. Calcule l'exponentielle de chaque score (eˣ) — ça rend tout positif
2. Divise chaque résultat par la somme totale — ça force le total à 100 %

Résultat : les gros scores deviennent de grandes probabilités, les petits deviennent presque zéro.

L'astuce de l'exponentielle, c'est qu'elle amplifie les différences : un score de 5 vs 3 donne un rapport bien plus grand que 2 vs 0. C'est ce qui permet au modèle de faire des choix « nets ».

La température divise les logits avant le softmax : une température basse accentue les différences (choix plus sûr), une haute les réduit (plus aléatoire).`,
  },
  relu: {
    label: "ReLU",
    short:
      "Une fonction simple : garde les nombres positifs, remplace les négatifs par zéro.",
    long: `ReLU signifie « Rectified Linear Unit » (unité linéaire rectifiée). Sa règle est ultra-simple :
- Si le nombre est positif → on le garde tel quel
- Si le nombre est négatif → on le remplace par 0

C'est comme un filtre qui ne laisse passer que les signaux positifs.

Pourquoi le modèle en a besoin ? Sans ReLU (ou une fonction similaire), empiler des couches de calcul reviendrait à faire une seule multiplication géante — le modèle ne pourrait apprendre que des relations « en ligne droite ». ReLU casse cette linéarité et permet au modèle d'apprendre des motifs complexes.

Dans notre modèle, sur les 64 neurones de la couche cachée, seule une partie est « active » (positive) pour chaque entrée. C'est ce qui rend le modèle sélectif.`,
  },
  mlp: {
    label: "MLP",
    short:
      "« Multi-Layer Perceptron » — deux couches de calcul qui transforment les vecteurs.",
    long: `MLP signifie « Multi-Layer Perceptron » (perceptron multicouche). C'est le deuxième bloc important dans chaque couche du Transformer, après l'attention.

Comment ça marche :
1. Le vecteur de 16 nombres passe dans une première couche qui l'expanse à 64 nombres (× 4)
2. ReLU filtre les négatifs
3. Une deuxième couche compresse de 64 retour à 16 nombres

Pourquoi expansion puis compression ? L'expansion permet au modèle de « réfléchir » dans un espace plus grand, d'examiner plus de combinaisons possibles. Puis la compression force le modèle à garder seulement l'information utile.

Si l'attention décide « quels tokens regarder », le MLP décide « quoi en faire ». C'est dans le MLP que le modèle stocke ses connaissances sur les motifs de lettres.`,
  },
  rmsnorm: {
    label: "RMSNorm",
    short:
      "Normalise le vecteur pour que ses valeurs restent dans une plage stable.",
    long: `Imagine que tu écoutes de la musique : si le volume change brusquement entre les morceaux, c'est désagréable. RMSNorm joue le rôle d'un « normaliseur de volume » pour les nombres du modèle.

RMS signifie « Root Mean Square » (racine de la moyenne des carrés). La normalisation :
1. Calcule la « taille » moyenne du vecteur (sa norme RMS)
2. Divise chaque nombre par cette taille

Résultat : les valeurs restent dans une plage raisonnable, ni trop grandes, ni trop petites.

Sans normalisation, après des dizaines de multiplications, les nombres pourraient exploser (devenir énormes) ou s'effondrer (devenir minuscules). Le modèle deviendrait impossible à entraîner. RMSNorm empêche ce problème à chaque couche.`,
  },
  loss: {
    label: "loss",
    short:
      "Mesure l'erreur : à quel point la prédiction du modèle était fausse. Plus c'est bas = mieux.",
    long: `La loss (perte) est la note du modèle — mais inversée : plus c'est bas, mieux c'est !

Comment ça marche : si le modèle devait prédire la lettre « m » et qu'il lui donnait une probabilité de 80 %, la loss est faible (bonne prédiction). S'il ne lui donnait que 2 %, la loss est élevée (mauvaise prédiction).

La formule est -log(P), où P est la probabilité attribuée à la bonne réponse. Par exemple :
- P = 100 % → loss = 0 (parfait !)
- P = 37 % → loss ≈ 1.0 (correct)
- P = 4 % → loss ≈ 3.3 (devinette aléatoire avec 27 tokens)
- P = 1 % → loss ≈ 4.6 (très mauvais)

La valeur ~3,30 correspond à une devinette aléatoire parmi 27 tokens (-log(1/27)). Si la loss descend en dessous, le modèle fait mieux que le hasard — il a commencé à apprendre !`,
  },
  gradient: {
    label: "gradient",
    short:
      "La direction dans laquelle chaque paramètre doit bouger pour réduire l'erreur.",
    long: `Imagine que tu es perdu dans le brouillard en montagne et que tu veux descendre dans la vallée. Tu ne vois pas le chemin, mais tu peux sentir la pente sous tes pieds. Tu fais un pas dans la direction la plus descendante — c'est exactement ce que fait le gradient !

Le gradient d'un paramètre dit au modèle :
- Dans quelle direction le bouger (augmenter ou diminuer ?)
- De combien environ (pente forte = grand pas, pente douce = petit pas)

Chacun des 4 192 paramètres a son propre gradient. C'est comme si 4 192 randonneurs descendaient chacun leur propre colline en même temps.

L'entraînement consiste à répéter : calculer les gradients → faire un petit pas → recalculer → refaire un pas... jusqu'à atteindre un « creux » où la loss est basse.`,
  },
  retropropagation: {
    label: "rétropropagation",
    short:
      "L'algorithme qui calcule les gradients en remontant du résultat vers les entrées.",
    long: `La rétropropagation (backpropagation en anglais) est l'astuce mathématique qui rend l'entraînement possible.

Le problème : le modèle a 4 192 paramètres. Comment savoir lequel est responsable d'une erreur à la sortie ?

La solution : remonter le calcul en sens inverse ! Si la sortie est fausse, on calcule :
1. Quels logits auraient dû être différents ?
2. Quels poids du MLP ont contribué à ces logits ?
3. Quelles valeurs d'attention ont mené à ces poids ?
4. Et ainsi de suite... jusqu'aux plongements d'entrée.

C'est comme une enquête : si un gâteau est trop sucré (erreur), on remonte la recette étape par étape pour trouver où on a mis trop de sucre. Chaque étape transmet le « blâme » à l'étape précédente.

Le « rétro » signifie qu'on parcourt le réseau en arrière, de la sortie vers l'entrée.`,
  },
  adam: {
    label: "Adam",
    short:
      "Un optimiseur intelligent qui adapte la vitesse d'apprentissage pour chaque paramètre.",
    long: `Adam est l'optimiseur utilisé dans presque tous les modèles modernes. Son nom vient de « Adaptive Moment Estimation ».

L'optimiseur le plus simple (SGD) fait le même pas pour tous les paramètres. C'est comme si tous les randonneurs marchaient à la même vitesse, même si certains sont sur une pente raide et d'autres sur du plat.

Adam est plus malin :
- Il garde en mémoire la direction moyenne des derniers gradients (momentum). Si un paramètre reçoit toujours des gradients dans la même direction, Adam accélère.
- Il adapte la taille du pas pour chaque paramètre individuellement. Les paramètres qui bougent beaucoup → petits pas. Ceux qui bougent peu → plus grands pas.

Résultat : l'entraînement est plus rapide et plus stable. C'est comme donner à chaque randonneur des chaussures adaptées au terrain.`,
  },
  temperature: {
    label: "température",
    short:
      "Contrôle le hasard dans la génération. Basse = prévisible, haute = créatif.",
    long: `La température est un nombre qui divise les logits (scores bruts) avant le softmax.

Température basse (ex : 0.1) :
- Les différences entre les scores sont amplifiées
- Le token le plus probable domine presque complètement
- Résultat : le modèle choisit presque toujours la même chose → noms prévisibles

Température haute (ex : 2.0) :
- Les différences entre les scores sont écrasées
- Tous les tokens ont des probabilités plus proches
- Résultat : le modèle fait des choix plus aléatoires → noms inventifs mais parfois bizarres

Température = 1.0 : les probabilités ne sont pas modifiées, c'est le comportement « naturel » du modèle.

Le nom vient de la physique : comme les molécules dans un gaz chaud bougent plus vite et de façon plus chaotique.`,
  },
  echantillonnage: {
    label: "échantillonnage",
    short:
      "Tirer au sort un token selon ses probabilités (les plus probables ont plus de chances).",
    long: `Imagine une roue de la fortune où chaque case correspond à un token. La taille de chaque case est proportionnelle à sa probabilité.

Si « m » a 40 % de chances et « a » a 20 %, la case de « m » est deux fois plus grande. On fait tourner la roue et on prend le résultat.

C'est différent de « prendre le maximum » (argmax), qui choisirait toujours « m ». L'échantillonnage ajoute du hasard contrôlé : « m » sort le plus souvent, mais « a » sort aussi parfois.

Pourquoi ne pas toujours prendre le maximum ? Parce que les noms seraient répétitifs et ennuyeux. L'échantillonnage permet de générer des noms variés à chaque fois, tout en respectant les motifs appris par le modèle.

La température ajuste la taille relative des cases avant le tirage.`,
  },
  "generation-autoregressive": {
    label: "génération autorégressive",
    short:
      "Le modèle génère un token à la fois, chacun dépendant des précédents.",
    long: `« Autorégressif » signifie que chaque prédiction dépend de toutes les prédictions précédentes.

Le processus :
1. On donne BOS au modèle → il prédit le 1er caractère (par ex. « e »)
2. On donne « e » au modèle → il prédit le 2e caractère (par ex. « m »)
3. On donne « m » au modèle → il prédit le 3e (par ex. « m »)
4. On continue jusqu'à ce que le modèle prédise BOS (= fin du nom)

Résultat : « emma »

C'est exactement comme ça que ChatGPT fonctionne ! Quand tu lui poses une question, il génère sa réponse un token à la fois, de gauche à droite. La différence : ChatGPT a des milliards de paramètres et un vocabulaire de ~100 000 tokens, là où notre micro-modèle a 4 192 paramètres et 27 tokens.

La limite de cette approche : le modèle ne peut pas « revenir en arrière » — chaque choix est définitif.`,
  },
};
