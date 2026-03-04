# Design — Sidebar + 3 nouvelles pages (sections 18-21)

Date : 2026-03-05

## Contexte

L'app a 6 pages (Tokenisation → Inférence). Le PLAN.md prévoit 3 pages supplémentaires (Accueil, Modèle complet, Conclusion) et une refonte de la sidebar pour accueillir 9 entrées.

## Section 21 — Sidebar

### Structure nav (9 entrées, 3 blocs visuels)

```
0  Accueil
── séparateur (border-top 1px --border) ──
1  Tokenisation
2  Plongements (wte/wpe)
3  Propagation
4  Attention
5  Entraînement
6  Inférence
── séparateur ──
7  Modèle complet
8  Conclusion
```

- Séparateurs : `border-top: 1px solid var(--border)` + `margin-top: 4px` + `padding-top: 4px`. Pas de headers de groupe textuels.
- Lien guide Karpathy : supprimé de la sidebar → migré dans page 8 (Conclusion).
- Footer raccourci : "Basé sur microgpt.py de Karpathy." (suppression disclaimer IA).

### Pastilles visitées

- Dot `●` 6px `var(--green)` à droite du label.
- State : `Set<string>` en localStorage clé `microgpt-visited`.
- Marqué au `setPage(id)`.
- Pas de bouton reset.

### Mobile

- Hamburger inchangé. 9 entrées + picker + theme tiennent, scroll si nécessaire.

### Fichiers impactés

- `src/App.tsx` — PAGES array (3 nouvelles entrées), séparateurs, pastilles state, footer text.
- `src/styles.css` — `.visited-dot`, séparateur CSS.

---

## Section 18 — Page d'accueil (page 0)

### ADR : page dédiée, pas modal

- Cohérence sidebar (entry "0 Accueil" prévue).
- Toujours accessible (retour possible), pas de state "déjà vu".
- Mobile : scroll normal, pas de focus trap.
- Bouton "Commencer" → `setPage("tokenizer")`.

### Contenu

- Pitch court : "Tu vas construire un cerveau artificiel qui invente des prénoms".
- Aperçu visuel du parcours (8 étapes numérotées).
- Bouton "Commencer" → page 1.
- Optionnel : aperçu du résultat (nom généré) comme accroche.

### Fichiers

- `src/pages/HomePage.tsx` (nouveau, lazy-loaded).
- `src/App.tsx` — ajout dans PAGES, `page` par défaut = `"home"`.

---

## Section 19 — Page modèle complet (page 7)

### Parti pris : récompense visuelle

Page 7 = waow effect. Full spectacle, animations over the top, pédagogie minimale. Ceux qui ont skip les explications y retourneront d'eux-mêmes.

### ADR

1. **Layout** : horizontal scroll desktop. Mobile (<768px) : message "Utilise un écran plus large".
2. **Ton** : hybride léger — intro courte + noms de couches dans le canvas (Emb, Attn, Résidu, MLP, LN, Probs). Pas d'annotations lourdes.
3. **Position** : page 7, après Inférence. Zoom-out après le parcours complet.
4. **Résidus** : arcs Bézier `var(--green)` semi-transparent en idle + flash lumineux pendant le forward animé.
5. **Backward** : forward par défaut, bouton "Voir le backward" pour les curieux.
6. **Composant** : `FullNNDiagram.tsx` dédié (nouveau), indépendant de `NNDiagram.tsx`. Copie patterns IO/RO/MO/getCssVar/parseColor. Données réelles (stateDict, traces), jamais simulées.

### Fichiers

- `src/components/FullNNDiagram.tsx` (nouveau, ~800+ lignes estimées).
- `src/pages/FullModelPage.tsx` (nouveau, lazy-loaded).
- `src/App.tsx` — ajout dans PAGES.
- `src/styles.css` — `.full-nn-canvas-wrap`, message mobile.

---

## Section 20 — Page conclusion (page 8)

### Contenu

Tableau comparatif "Notre microGPT / Les vrais LLM" avec micro-analogies :

| Concept           | Notre microGPT | Les vrais LLM                     | Analogie |
| ----------------- | -------------- | --------------------------------- | -------- |
| Paramètres        | 4 192          | centaines de milliards            | —        |
| Vocabulaire       | 27 lettres     | 50 000+ sous-mots (BPE)           | —        |
| Couches           | 1              | 96+                               | —        |
| Têtes d'attention | 4              | 96+                               | —        |
| Contexte          | 8 positions    | 128K+ tokens                      | —        |
| Normalisation     | aucune         | LayerNorm, dropout, LR scheduling | —        |
| Alignement        | aucun          | RLHF / instruction tuning         | —        |
| Infrastructure    | 1 navigateur   | clusters GPU, mois d'entraînement | —        |

Analogies concrètes pour ados 10-14 ans à rédiger lors de l'implémentation.

### Ton

"Tu as compris les fondations, voici ce que les ingénieurs ajoutent." Honnête et motivant.

### Section "Aller plus loin"

- Guide Karpathy (en anglais, "pour les plus motivés")
- tuto-llm (cours pédagogique associé)
- microgpt-ts-fr (fork de référence)

### Fichiers

- `src/pages/ConclusionPage.tsx` (nouveau, lazy-loaded).
- `src/App.tsx` — ajout dans PAGES.
- Pas de Canvas, pas d'animation — table HTML sémantique + texte.

---

## Hors scope

- Contenu détaillé des analogies (rédigé à l'implémentation).
- Refonte hamburger mobile.
- Progression barre/pourcentage.
