# microgpt-visualizer-fr — Plan de fork

> Fork francais de [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)
> Appliquant le meme principe que [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) (fork FR de dubzdubz/microgpt-ts)

---

## Contexte : deux visualiseurs microGPT

### enescang/microgpt-visualizer — 5 panels interactifs

- **GitHub** : https://github.com/enescang/microgpt-visualizer
- **Demo live** : https://microgpt.enescang.dev/
- **Stack** : React 19 + TypeScript + Vite (pas de Tailwind — CSS custom pur)
- **Panels** : Tokenizer, Embeddings Heatmap 16D, Forward Pass, Training, Inference
- **Engine** : autograd custom en TypeScript pur (zero dependance ML)
- **Deps runtime** : react + react-dom uniquement (zero librairie UI, zero chart lib)
- **~2 300 lignes** de code source total

### Sjs2332/microGPT_Visualizer — Attention causale multi-tetes

- **GitHub** : https://github.com/Sjs2332/microGPT_Visualizer
- **Demo live** : aucune (localhost:3000 uniquement)
- **Stack** : Next.js + React + TypeScript + Tailwind
- **Hyperparametres** : n_embd=16, n_head=4, n_layer=1, block_size=8, vocab_size=27 (4 064 params)
- **Pipeline** : 3 etapes interactives + sidebar de reference (architecture, autograd, MLP, training, inference)

**Verdict** : enescang est le meilleur candidat pour un fork FR (demo live existante, 5 panels complets, Vite plus simple a deployer).

---

## Comparaison des deux forks

|            | microgpt-ts-fr (fait)              | microgpt-visualizer-fr (a faire)   |
|------------|------------------------------------|------------------------------------|
| **Upstream** | dubzdubz/microgpt-ts             | enescang/microgpt-visualizer       |
| **Stack**    | Next.js 16 + shadcn/ui + Tailwind v4 | React 19 + Vite + CSS custom  |
| **Nature**   | Playground (training + inference) | Visualisation pedagogique (5 panels) |
| **Focus**    | Entrainer et generer             | Comprendre chaque etape            |
| **Deploy**   | Vercel (Next.js natif)           | Vercel (Vite static build)         |

---

## Ce que le fork ajoute

### 1. UI en francais

Traduire les 5 pages :

| Page originale   | Traduction          |
|------------------|---------------------|
| Tokenizer        | Tokenisation        |
| Embeddings       | Plongements (Embeddings) |
| Forward Pass     | Propagation avant   |
| Training         | Entrainement        |
| Inference        | Inference           |

### 2. Datasets FR

Reutiliser les datasets deja prepares dans microgpt-ts-fr :

| Dataset          | Entrees | Source                    |
|------------------|---------|---------------------------|
| prenoms-simple   | 50      | INSEE 2024, top 50        |
| prenoms          | 1 000   | INSEE 2024, top 1000      |
| pokemon-fr       | 1 022   | PokeAPI FR via tuto-llm   |
| dinosaures       | 1 522   | Dvelezs94 via tuto-llm    |

### 3. Vocabulaire pedagogique

Adapter les explications au public tuto-llm (10-14 ans) :
- Termes techniques traduits ou expliques
- Analogies coherentes avec les notebooks (lancer au panier, filtre Instagram, salle de classe)
- Annotations contextuelles reliant chaque panel au notebook correspondant

### 4. Deploy Vercel

- Auto-deploy sur `microgpt-visualizer-fr.vercel.app`
- Build Vite statique (plus simple que Next.js)

### 5. AGENTS.md

Conventions de fork (meme pattern que microgpt-ts-fr) :
- Fichiers upstream `src/engine/` en lecture seule
- Modifications uniquement sur l'UI et les datasets
- Git rules strictes (pas de push sans demande, pas de PR auto)

### 6. Hooks git

- Husky + Biome (lint au commit, build au push)
- Meme setup que microgpt-ts-fr

---

## Complementarite avec microgpt-ts-fr

```
Parcours eleve :

microgpt-visualizer-fr          microgpt-ts-fr
(comprendre)                    (experimenter)
─────────────────               ──────────────
1. Tokenizer → voir a→0        1. Choisir un dataset
2. Embeddings → heatmap 16D    2. Configurer l'architecture
3. Forward Pass → etape/etape  3. Lancer l'entrainement live
4. Training → loss en temps    4. Generer des noms
   reel + heatmaps
5. Inference → predictions     5. Ajuster temperature/prefix
   token par token
```

Les deux outils couvrent le meme algorithme (microgpt de Karpathy) sous deux angles differents :
**visualisation passive** vs **experimentation active**.

Ensemble, ils forment une paire pedagogique complete pour tuto-llm :
- L'eleve **comprend** avec le visualiseur (chaque etape decomposee)
- L'eleve **experimente** avec le playground (entrainement et generation en temps reel)

---

## Structure du projet upstream (audit complet)

```
src/
├── App.tsx              # 137 lignes — shell, routing useState, theme dark/light
├── main.tsx             #   5 lignes — point d'entree React
├── styles.css           # 391 lignes — TOUT le design (CSS vars, pas de Tailwind)
├── index.css            #  69 lignes — scaffold Vite inutilise
├── App.css              #  43 lignes — scaffold Vite inutilise
├── components/
│   ├── Heatmap.tsx      #  92 lignes — composant Heatmap (table) + VectorBar
│   └── LossChart.tsx    # 127 lignes — courbe de loss en Canvas 2D pur
├── pages/
│   ├── TokenizerPage    # 126 lignes — mapping char→id, tokenisation live
│   ├── EmbeddingsPage   #  99 lignes — heatmaps wte/wpe, combinaison vecteurs
│   ├── ForwardPassPage  # 244 lignes — pipeline 7 etapes, attention, MLP neurons
│   ├── TrainingPage     # 180 lignes — boucle rAF (pas de Worker), loss chart
│   └── InferencePage    # 221 lignes — generation, trace token par token, probas
├── engine/              # ~467 lignes — LECTURE SEULE, zero migration
│   ├── autograd.ts      #  99 lignes — classe Value, backward topologique
│   ├── model.ts         # 339 lignes — GPT complet, tokenizer, train, inference
│   ├── random.ts        #  27 lignes — PRNG mulberry32
│   └── data.ts          #   2 lignes — blob ~8000 noms anglais
└── assets/react.svg     # favicon Vite (a remplacer)
```

**Total : ~2 300 lignes, 16 fichiers source.**

### Constats cles de l'audit

- **Zero Tailwind** : le styling est 100% CSS custom (`styles.css`, 391 lignes, CSS vars)
- **Zero librairie UI** : pas de shadcn, Radix, MUI — tout est `<div>` + classes CSS
- **Zero librairie chart** : LossChart = Canvas 2D pur, Heatmap = `<table>` HTML
- **Zero routeur** : `useState("tokenizer")` + rendu conditionnel dans App.tsx
- **Zero feature Vite-specifique** : pas de `import.meta.env`, pas de `?raw`, pas de glob
- **Theme** : hook custom `useTheme()` avec `data-theme` sur `<html>` + `localStorage`
- **Training** : boucle `requestAnimationFrame` (5 steps/frame), pas de Web Worker
- **Model sharing** : `useRef<ModelState>` dans App, passe en prop aux pages

---

## Audit effort migration → Next.js 16 + shadcn/ui + Tailwind v4

### Ce qui facilite la migration

1. **Pas de routeur** a remplacer — juste un `useState`
2. **Zero librairie UI** — pas de conflit avec shadcn/ui
3. **Zero feature Vite** — le bundler est transparent dans le code source
4. **Engine 100% isole** — pur TypeScript math, se copie tel quel
5. **CSS portable** — variables CSS custom compatibles Tailwind

### Effort detaille

| Tache | Effort | Detail |
|-------|--------|--------|
| Setup Next.js 16 + Tailwind v4 + shadcn/ui + Biome | Moyen | Scaffolding, config identique a microgpt-ts-fr |
| `"use client"` sur pages et composants | Faible | Tout utilise useState/useRef/useEffect — 100% client |
| Migrer `styles.css` (391 lignes) → Tailwind v4 | Moyen-eleve | ~50 classes custom → utilitaires Tailwind + CSS vars |
| Remplacer composants custom par shadcn/ui | Moyen | `.btn` → Button, `.panel` → Card, sliders → Slider |
| Heatmap + LossChart (canvas) | Faible | Pas d'equivalent shadcn, restent custom |
| Theme dark/light | Faible | `next-themes` remplace le hook custom |
| `localStorage` SSR guard | Faible | Proteger l'init theme dans useEffect |
| Google Analytics | Trivial | Inline HTML → `next/script` |
| Traduction FR des 5 pages | Moyen | ~870 lignes de texte UI |
| Datasets FR | Faible | Deja prets dans microgpt-ts-fr |
| AGENTS.md + Husky + Biome | Faible | Copier pattern microgpt-ts-fr |

### Verdict

**Migration recommandee.** Effort ~2-3 jours, gain en coherence stack significatif.
Le projet est petit (2 300 lignes), le CSS est le gros du travail, l'engine ne bouge pas.

### Strategie : traduction FR d'abord (sur stack Vite), migration stack ensuite

Phase 1 — Fork FR sur stack Vite existante :
- Cloner, creer repo mon-atelier-ia/microgpt-visualizer-fr
- Traduire UI + integrer datasets FR
- Deployer une v1 fonctionnelle rapidement

Phase 2 (optionnelle) — Migration stack :
- Migrer vers Next.js 16 + shadcn/ui + Tailwind v4
- Aligner sur la stack microgpt-ts-fr

---

## References

- [enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer) — upstream
- [Demo live upstream](https://microgpt.enescang.dev/)
- [Sjs2332/microGPT_Visualizer](https://github.com/Sjs2332/microGPT_Visualizer) — projet alternatif (pas de demo)
- [microgpt-ts-fr](https://github.com/mon-atelier-ia/microgpt-ts-fr) — fork FR de reference
- [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — Andrej Karpathy
- [tuto-llm](https://github.com/mon-atelier-ia/tuto-llm) — cours pedagogique associe
