# MicroGPT Visualizer FR

Application web interactive pour visualiser et comprendre le fonctionnement des modèles GPT (Generative Pre-trained Transformer) pas à pas. Conçue pour un public de **10-14 ans** découvrant les concepts des LLM.

> Fork français de [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer) par [mon-atelier-ia](https://github.com/mon-atelier-ia).
> Production : **https://microgpt-visualizer-fr.vercel.app**

## Fonctionnalités

- **Tokenisation** — Observe comment un texte est découpé en tokens (caractère par caractère)
- **Plongements** — Visualise comment les tokens deviennent des vecteurs de 16 dimensions
- **Propagation avant** — Parcours étape par étape la propagation dans le transformer
- **Entraînement** — Regarde le modèle apprendre en temps réel (courbe de loss, heatmaps)
- **Inférence** — Génère des noms et observe les prédictions à chaque position
- **Moteur autograd** — Différentiation automatique intégrée, transparente et éducative

## Différences avec l'original

- Interface entièrement en français (labels, glossaire, messages)
- Glossaire pédagogique intégré (30 termes avec analogies pour 10-14 ans)
- 6 jeux de données dont 4 francophones (prénoms INSEE, villes, animaux, fruits)
- Accessibilité WCAG 2.1 AA (navigation clavier, contrastes, labels, `prefers-reduced-motion`)
- 86 tests (composants, engine, accessibilité, intégrité des données)
- ErrorBoundary avec message français et bouton de rechargement
- Code splitting (`React.lazy` + `Suspense`)

Voir [`docs/fork-changes.md`](docs/fork-changes.md) pour le registre complet des divergences.

## Démarrage rapide

### Prérequis

- Node.js 18+
- pnpm (recommandé) ou npm

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/mon-atelier-ia/microgpt-visualizer-fr.git
cd microgpt-visualizer-fr

# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

L'application est accessible sur `http://localhost:5173`

## Scripts disponibles

| Commande       | Description                                        |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Serveur de développement avec rechargement à chaud |
| `pnpm build`   | Build de production                                |
| `pnpm preview` | Aperçu local du build de production                |
| `pnpm lint`    | ESLint                                             |
| `pnpm test`    | Vitest (86 tests)                                  |

## Structure du projet

```
src/
├── components/     # Composants UI réutilisables (Heatmap, LossChart, Term…)
├── pages/          # Pages principales
│   ├── TokenizerPage.tsx
│   ├── EmbeddingsPage.tsx
│   ├── ForwardPassPage.tsx
│   ├── TrainingPage.tsx
│   └── InferencePage.tsx
├── engine/         # Moteur ML (code upstream, read-only)
│   ├── autograd.ts # Différentiation automatique
│   ├── model.ts    # Implémentation du GPT
│   ├── data.ts     # Données d'entraînement
│   └── random.ts   # PRNG déterministe
├── data/           # Glossaire pédagogique
├── datasets/       # 6 jeux de données (EN + FR)
└── App.tsx         # Composant racine
```

## Stack technique

- **React 19** — Framework UI
- **TypeScript** (strict) — Typage statique
- **Vite 7** — Build et serveur de développement
- **Vitest** — Tests unitaires et composants
- **Autograd custom** — Moteur ML éducatif (port de microgpt.py)
- **CSS custom** — Pas de Tailwind, 46 custom properties (thème clair/sombre)

## Objectif pédagogique

Ce projet aide à comprendre les modèles transformer en :

1. Fournissant un retour visuel à chaque étape du pipeline
2. Implémentant les concepts fondamentaux à partir de zéro
3. Rendant les opérations complexes transparentes et interactives
4. Permettant l'expérimentation des paramètres en temps réel

## Qualité

- Audit ISO (25010, 40500, 9241-110) : **4,2/5** — voir [`docs/audit-iso.md`](docs/audit-iso.md)
- Audit frontend détaillé : voir [`docs/audit-frontend.md`](docs/audit-frontend.md)
- ESLint 0 warnings, Prettier en pre-commit, TypeScript strict

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

## Crédits et remerciements

Ce projet est inspiré de et basé sur :

- **[MicroGPT Guide](https://karpathy.github.io/2026/02/12/microgpt/)** par [Andrej Karpathy](https://github.com/karpathy) — Guide complet expliquant l'implémentation
- **[microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95)** par Andrej Karpathy — L'implémentation suit fidèlement ce GPT minimal
- **[makemore dataset](https://github.com/karpathy/makemore)** par Andrej Karpathy — Données d'entraînement (names.txt) pour la modélisation au niveau caractère
- **[micrograd](https://github.com/karpathy/micrograd)** par Andrej Karpathy — Inspiration pour le moteur autograd
- **[enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)** par [enescang](https://github.com/enescang) — Projet original dont ce fork est dérivé

Merci à Andrej Karpathy pour ses ressources éducatives qui rendent le deep learning accessible et compréhensible.

## Licence

MIT

## Auteurs

- [enescang](https://github.com/enescang) — projet original
- [mon-atelier-ia](https://github.com/mon-atelier-ia) — fork français

---

<details>
<summary>🇬🇧 English version</summary>

# MicroGPT Visualizer

An interactive web application for visualizing and understanding how GPT (Generative Pre-trained Transformer) models work from the ground up. Built with React and TypeScript, featuring a custom autograd engine for educational purposes.

> French fork of [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer) by [mon-atelier-ia](https://github.com/mon-atelier-ia).
> Production: **https://microgpt-visualizer-fr.vercel.app**

## Features

- **Tokenizer Visualization** — See how text is broken down into tokens
- **Embeddings Explorer** — Visualize how tokens are converted to vector representations
- **Forward Pass Breakdown** — Step through the transformer's forward propagation
- **Training Process** — Watch the model learn in real-time with loss charts and heatmaps
- **Inference Mode** — Generate text and see predictions as they happen
- **Custom Autograd Engine** — Built-in automatic differentiation for transparency

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/mon-atelier-ia/microgpt-visualizer-fr.git
cd microgpt-visualizer-fr
pnpm install
pnpm dev
```

The application will be available at `http://localhost:5173`

## Credits & Acknowledgments

- **[MicroGPT Guide](https://karpathy.github.io/2026/02/12/microgpt/)** by [Andrej Karpathy](https://github.com/karpathy)
- **[microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95)** by Andrej Karpathy
- **[makemore dataset](https://github.com/karpathy/makemore)** by Andrej Karpathy
- **[micrograd](https://github.com/karpathy/micrograd)** by Andrej Karpathy
- **[enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)** by [enescang](https://github.com/enescang) — Original project

## License

MIT

</details>
