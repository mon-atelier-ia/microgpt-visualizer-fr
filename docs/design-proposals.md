# Propositions de design — microGPT Visualizer

> 6 directions esthetiques pour le redesign de l'app.
> La proposition 0 ("Digital Explorer") dispose deja d'un playground : `playground-digital-explorer.html`.
> Les propositions 1-5 sont des candidates pour 2 playgrounds supplementaires.

## Imperatifs communs (toutes propositions)

- **Public** : 10-14 ans, apprentissage des concepts LLM
- **Fidelite microgpt** : 8 etapes (Accueil, Tokenisation, Plongements, Propagation, Attention, Entrainement, Inference, Modele complet, Conclusion)
- **Accessibilite** : `prefers-reduced-motion`, contraste WCAG AA minimum, navigation clavier
- **Themes** : dark + light obligatoires
- **Palette** : oklch exclusivement (coherence avec Phase 0)
- **Responsive** : breakpoint 768px minimum

---

## Proposition 0 — "Digital Explorer" (existante)

**Playground** : `playground-digital-explorer.html`

**Direction** : Futuriste / spatial / neon

**Metaphore** : Un explorateur spatial navigue dans l'espace profond de l'IA. Chaque concept est une station spatiale a visiter.

| Dimension          | Vision                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Palette**        | Deep space indigo `oklch(0.145 0.015 270)` + coral/salmon `oklch(0.72 0.19 25)` + electric teal + acid lime |
| **Typographie**    | Plus Jakarta Sans (display, geometrique, friendly) + Space Mono (donnees)                                   |
| **Layout**         | Topbar horizontale avec tabs scrollables + barre XP gamifiee                                                |
| **Fond**           | Mesh gradient anime (3 blobs oklch) + grille geometrique masquee en radial                                  |
| **Panneaux**       | Glass blur (`backdrop-filter`) + ligne d'accent au hover + ombres profondes + lift 3D                       |
| **Tokens**         | Rotation + scale 1.05 au hover, bounce spring, selection doree avec glow                                    |
| **Datasets**       | Pills horizontales avec gradient (chip actif = gradient coral→pink)                                         |
| **Heatmap**        | Rampe teal, border-spacing 4px, cells qui scale 1.15 au hover                                               |
| **Sparkline loss** | 3 couleurs (coral → gold → lime) selon la progression                                                       |
| **Animations**     | Staggered rise-in au load, `@property` pour animation gradient, spring curves partout                       |
| **Progression**    | Barre XP gradient shimmer sous la topbar                                                                    |
| **Force**          | Forte — le mesh gradient + glass                                                                            |

---

## Proposition 1 — "Le Cahier du Savant"

**Direction** : Journal de naturaliste / illustration scientifique

**Metaphore** : Tu es un naturaliste du XIXe siecle, mais au lieu de cataloguer des papillons, tu dissèques un reseau de neurones. Chaque page est une planche de ton carnet de terrain.

| Dimension       | Vision                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette**     | Papier creme `oklch(0.95 0.02 85)`, encre sepia `oklch(0.35 0.05 60)`, vert herbier `oklch(0.55 0.12 145)`, rouge specimen `oklch(0.55 0.15 25)`, bleu annotation `oklch(0.50 0.10 250)` |
| **Typographie** | Architects Daughter (titres — drafting, structure) + Caveat (corps — annotations manuscrites) + Fira Code (donnees numeriques)                                                           |
| **Layout**      | Pages asymetriques — texte a gauche, "planches" a droite. Marges annotees. Disposition organique comme un vrai carnet                                                                    |
| **Fond**        | Texture papier grain (CSS noise + subtle repeating pattern), leger jaunissement sur les bords, taches d'encre decoratives                                                                |
| **Panneaux**    | Bordure fine a la plume (1px solid sepia), coins legerement arrondis, ombre douce comme une page posee sur une table. Etiquettes collees (ruban adhesif en diagonale)                    |
| **Tokens**      | Lettres dans des boites a specimen — bordure fine, fond creme, numero en indice comme une classification. Hover : rotation legere + loupe                                                |
| **Heatmap**     | Rampe sepia→vert herbier→rouge specimen. Cellules avec bordures fines comme un tableau de publication scientifique                                                                       |
| **Animations**  | Ecriture progressive (stroke-dashoffset sur SVG), apparition "encre qui seche" (opacity + leger blur→net), tournage de page                                                              |
| **Navigation**  | Onglets en haut comme des marque-pages en papier qui depassent, avec numero manuscrit. Progression = cahier qui se remplit                                                               |
| **Force**       | **Tres forte** — l'anti-tech chaleureux. Contraste saisissant avec le sujet (IA)                                                                                                         |

### Recherche typographique

- **Architects Daughter** : ecriture de type drafting architectural. Plus structure que les polices manuscrites classiques, reste lisible en headings tout en paraissant authentiquement dessinee a la main.
- **Caveat** (Pablo Impallari) : concue pour annotations ET corps de texte (rare pour une handwriting font). 4 graisses, lisible même en paragraphes. Lettres legerement cursives, sensation de notes griffonnees dans un cahier.
- **Fira Code** : monospace avec ligatures, pour les donnees numeriques des heatmaps et vecteurs.

---

## Proposition 2 — "Borne d'Arcade"

**Direction** : Retro gaming / pixel art / CRT terminal

**Metaphore** : Apprendre l'IA, c'est jouer a un jeu video 8-bit. Chaque concept = un niveau. Chaque erreur du modele = une vie perdue. L'entrainement = le boss final.

| Dimension       | Vision                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette**     | Noir CRT `oklch(0.10 0.01 270)`, vert phosphore `oklch(0.75 0.20 145)`, bleu electrique `oklch(0.65 0.18 260)`, magenta hot `oklch(0.65 0.22 330)`, jaune pixel `oklch(0.85 0.17 95)` |
| **Typographie** | Press Start 2P (titres — pixel 8-bit, Namco arcade) + VT323 (corps/donnees — terminal DEC VT320)                                                                                      |
| **Layout**      | Cadre de borne d'arcade autour du viewport — bord bisaute avec reflets. Contenu centre comme un ecran CRT. Zone de score en haut a droite                                             |
| **Fond**        | Noir profond + scanlines CSS (repeating-linear-gradient 2px), leger flicker CRT (keyframes opacity), vignette sombre aux bords                                                        |
| **Panneaux**    | Bordure 2px solid vert phosphore, fond noir semi-transparent, coins carres (0 radius). Glow neon sur la bordure (`box-shadow: 0 0 8px`)                                               |
| **Tokens**      | Blocs pixelises qui "tombent" en place (comme Tetris), bordure pixel, clignotement curseur en fin de ligne                                                                            |
| **Heatmap**     | Palette monochrome vert phosphore (noir→vert vif), style "ecran radar". Cellules carrees, gap 1px                                                                                     |
| **Animations**  | Glitch text (transform skew aleatoire), typing effect (caractere par caractere), transition de niveau, power-up sparkle                                                               |
| **Navigation**  | Barre de vies/niveaux en haut — icones pixelisees pour chaque etape. Niveau actif = clignotant. High score = etapes completees                                                        |
| **Force**       | **Tres forte** — le "son mental" du CRT. Nostalgie + apprentissage = dopamine                                                                                                         |

### Recherche typographique

- **Press Start 2P** : bitmap font directement basee sur la typographie arcade Namco des annees 1980. Fonctionne a des multiples de 8px pour un rendu pixel-perfect. Evoque instantanement le gaming classique.
- **VT323** : modelee sur la police du terminal DEC VT320 du debut des annees 1980. Plus lisible que Press Start 2P en corps de texte car concue pour la lecture prolongee sur de vrais terminaux. Monospace, donc double emploi pour l'affichage de donnees.

### Effets CSS specifiques

```css
/* Scanlines CRT */
background: repeating-linear-gradient(
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.1) 2px,
  rgba(0, 0, 0, 0.1) 4px
);

/* Flicker CRT */
@keyframes flicker {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.97;
  }
  75% {
    opacity: 0.99;
  }
}
```

---

## Proposition 3 — "Atelier Vivant"

**Direction** : Kawaii / organique / le reseau est un être vivant

**Metaphore** : Le reseau de neurones est une creature que tu fais grandir. Il nait petit, maladroit, fait des erreurs — puis il apprend. Les neurones respirent, les connexions pulsent, l'entrainement le nourrit.

| Dimension       | Vision                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette**     | Lavande douce `oklch(0.85 0.08 300)`, menthe `oklch(0.88 0.08 165)`, peche `oklch(0.87 0.08 55)`, corail tendre `oklch(0.75 0.12 25)`, ciel pale `oklch(0.92 0.04 240)`. Dark : versions profondes saturees `oklch(0.25 0.06 *)` |
| **Typographie** | Fredoka (display — bubbly, variable weight, pas enfantin) + Quicksand (corps — geometrique arrondi, doux) + Fira Code (donnees)                                                                                                  |
| **Layout**      | Cartes aux coins tres arrondis (16-20px), espacement genereux, impression d'espace et de calme. Disposition en flux vertical naturel                                                                                             |
| **Fond**        | Degrade doux ondulant (lavande→menthe→peche), subtil grain de bruit. Bulles flottantes semi-transparentes en arriere-plan (like lava lamp)                                                                                       |
| **Panneaux**    | Ombres ultra-douces et diffuses (`0 8px 32px`), fond semi-transparent, bordure 0. Hover : legere elevation + halo pastel                                                                                                         |
| **Tokens**      | Bulles rondes (border-radius 50%), flottent legerement (animation ease-in-out up/down 3s), selection = bulle qui grossit et pulse                                                                                                |
| **Heatmap**     | Rampe lavande→menthe→peche→corail. Cellules rondes (border-radius 6px), gap 3px, hover = bulle qui gonfle                                                                                                                        |
| **Animations**  | Respiration (scale 1↔1.02 lent et continu), apparition "eclosion" (scale 0→1 + opacity, spring curve), particules flottantes type spores/pollen                                                                                  |
| **Navigation**  | Pills arrondies avec icones organic (goutte, feuille, fleur, soleil…). Progression = plante qui pousse (ou creature qui grandit d'etape en etape)                                                                                |
| **Force**       | **Moyenne-forte** — l'empathie, la douceur. On veut proteger cette petite creature qui apprend                                                                                                                                   |

### Recherche psychologique

La recherche sur l'esthetique kawaii confirme que les formes rondes + pastels "narrow attentional focus" (van Schneider, Kawaiization of Product Design). Les images mignonnes favorisent le comportement prudent et la concentration. Ideal pour un public 10-14 ans en apprentissage.

### Recherche typographique

- **Fredoka** : bold, bubbly, rounded letterforms avec axe variable de poids. Fun sans etre enfantin. Fonctionne en display sans ressembler a un magasin de jouets.
- **Quicksand** : sans-serif geometrique arrondi avec lettres clairement definies et bonne hauteur d'x. Plus leger et retenu que Fredoka, gere bien le texte en paragraphe tout en maintenant le meme ADN doux.

---

## Proposition 4 — "La Machine Doree"

**Direction** : Art Deco / automate mecanique / or sur noir

**Metaphore** : Le reseau de neurones est un automate de precision, une merveille d'ingenierie des annees 1920. Chaque rouage a sa place. L'entrainement fait tourner la machine. L'or revele la beaute cachee des mathematiques.

| Dimension       | Vision                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette**     | Noir profond `oklch(0.12 0.01 60)`, or bruni `oklch(0.75 0.12 85)`, ivoire chaud `oklch(0.92 0.03 85)`, ambre electrique `oklch(0.80 0.15 80)`, cuivre `oklch(0.60 0.10 55)` |
| **Typographie** | Poiret One (display — Art Deco geometrique pur, elegant) + DM Mono (donnees — monospace propre, moderne)                                                                     |
| **Layout**      | Symetrie forte, colonnes centrees, proportions dorees. Lignes de separation fines en or. Sensation de monument, de machine de precision                                      |
| **Fond**        | Noir mat + motif geometrique Art Deco en filigrane (SVG repeat, opacite 5-8%) — chevrons, sunbursts, losanges en or                                                          |
| **Panneaux**    | Bordure 1px or, coins angulaires (2px radius max), fond noir profond. Lisere dore au sommet (4px border-top gold). Hover : filigrane s'illumine                              |
| **Tokens**      | Plaques dorees gravees — lettres en relief (text-shadow or + noir), bordure en biseau. Hover : rotation 3D legere (perspective + rotateY)                                    |
| **Heatmap**     | Rampe noir→cuivre→or→ivoire. Bordures fines dorees entre cellules. Hover : cellule qui s'illumine en ambre                                                                   |
| **Animations**  | Engrenages qui tournent (SVG anime en arriere-plan du NN), revelation doree (mask radial qui s'ouvre), shimmer dore (gradient anime)                                         |
| **Navigation**  | Tabs horizontaux avec typography Art Deco, numero en petit au-dessus. Progression = cadran d'horloge / jauge circulaire doree                                                |
| **Force**       | **Tres forte** — l'elegance inattendue. Gatsby rencontre GPT                                                                                                                 |

### Motifs Art Deco CSS

Les motifs Art Deco classiques (chevrons, sunbursts, losanges, eventails) peuvent etre realises en SVG inline repetes en `background-image`. Le contraste noir/or cree un impact visuel maximal avec un minimum de couleurs. Les symetries strictes et les proportions dorees renforcent la sensation de precision mecanique — parfait pour illustrer un reseau de neurones comme une machine de precision.

---

## Proposition 5 — "Tableau Noir"

**Direction** : Neo-brutaliste / craie sur ardoise / salle de classe

**Metaphore** : Tu es en cours. Le prof dessine le reseau a la craie sur le tableau noir. C'est brut, direct, pas de fioritures — mais c'est la que tu comprends vraiment. L'erreur est visible (raturee !), le processus est transparent.

| Dimension       | Vision                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette**     | Ardoise `oklch(0.25 0.02 200)`, craie blanche `oklch(0.92 0.01 90)`, craie bleue `oklch(0.65 0.12 240)`, craie rose `oklch(0.70 0.12 350)`, craie jaune `oklch(0.82 0.12 95)`, craie verte `oklch(0.65 0.12 155)`. Light : tableau blanc + feutres vifs |
| **Typographie** | Permanent Marker (titres — ecriture au feutre, brute) + Architects Daughter (corps — ecriture d'eleve) + Source Code Pro (donnees)                                                                                                                      |
| **Layout**      | Brutaliste : blocs massifs, pas de bordures arrondies (0 radius), espacement genereux mais irregulier. Elements legerement de travers (rotate 0.5-1deg)                                                                                                 |
| **Fond**        | Texture ardoise (CSS gradient bruit + teinte verdâtre-sombre), legeres traces de craie effacee (fantomes de texte en opacite 3%)                                                                                                                        |
| **Panneaux**    | Bordure 3px solid craie (style "trace a la main" — legerement irreguliere via border-image), fond ardoise. Pas d'ombre. Pas de blur. Raw                                                                                                                |
| **Tokens**      | Lettres ecrites a la craie — leger tremblement (animation jitter 0.5px), entourees d'un cercle dessine a la main (SVG wobbly). Selection = souligne double jaune                                                                                        |
| **Heatmap**     | Rampe craie bleue→blanche→rose. Cellules avec bordure fine craie, gap 2px. Hover : cercle de craie anime                                                                                                                                                |
| **Animations**  | Ecriture progressive (stroke-dasharray), effacement de craie (swipe + opacity), apparition "prof qui dessine" (paths SVG traces en sequence)                                                                                                            |
| **Navigation**  | En-tete massif : "ETAPE 3 — PROPAGATION" en Permanent Marker, numero encercle. Progression = coches de craie (check check check circle circle circle)                                                                                                   |
| **Force**       | **Tres forte** — l'authenticite brute. L'odeur de la craie. On n'est pas dans une app — on est en classe                                                                                                                                                |

### Recherche tendances

Le neo-brutalisme est le style dominant de la Gen Alpha (2025-2026). Les 3 piliers CSS :

1. Hard shadows : `box-shadow: 4px 4px 0 #000`
2. Thick borders : `border: 3px solid #000`
3. High-contrast flat colors (pas de gradients, pas de blur, pas de glassmorphism)

La philosophie brutaliste d'"exposer les materiaux" s'applique parfaitement a l'education sur l'IA : on expose comment la machine fonctionne, sans vernis. C'est aussi la direction la plus accessible nativement — les ratios de contraste eleves sont integres au style.

### Recherche typographique

- **Permanent Marker** : ecriture au marqueur, brute et directe. Parfaite pour les titres massifs type tableau noir.
- **Architects Daughter** : ecriture blocky, carree, inspiree du dessin architectural. Plus structuree que les polices manuscrites classiques, lisible en corps tout en paraissant authentiquement dessinee a la main.
- **Source Code Pro** (Adobe) : monospace propre et lisible, parfaite pour les donnees numeriques.

---

## Tableau comparatif

| #   | Nom                 | Tone                     | Force artistique | Memorable par…         | Fonts                                                    |
| --- | ------------------- | ------------------------ | ---------------- | ---------------------- | -------------------------------------------------------- |
| 0   | Digital Explorer    | Futuriste / spatial      | Forte            | Mesh gradient + glass  | Plus Jakarta Sans + Space Mono                           |
| 1   | Le Cahier du Savant | Organique / scientifique | **Tres forte**   | L'anti-tech chaleureux | Architects Daughter + Caveat + Fira Code                 |
| 2   | Borne d'Arcade      | Retro gaming / pixel     | **Tres forte**   | Le "son mental" du CRT | Press Start 2P + VT323                                   |
| 3   | Atelier Vivant      | Kawaii / doux / vivant   | Moyenne-forte    | L'empathie, la douceur | Fredoka + Quicksand + Fira Code                          |
| 4   | La Machine Doree    | Art Deco / luxe          | **Tres forte**   | L'elegance inattendue  | Poiret One + DM Mono                                     |
| 5   | Tableau Noir        | Neo-brutaliste / craie   | **Tres forte**   | L'authenticite brute   | Permanent Marker + Architects Daughter + Source Code Pro |

---

## Sources de recherche

### Design educatif et gamification

- [Lollypop: Top Education App Design Trends 2025](https://lollypop.design/blog/2025/august/top-education-app-design-trends-2025/)
- [NN/G: Neobrutalism Definition and Best Practices](https://www.nngroup.com/articles/neobrutalism/)
- [Clovertechnology: Neo-Brutalism in 2025](https://www.clovertechnology.co/insights/how-neo-brutalism-took-over-digital-design-in-2025)
- [ColorWhistle: Neo-Brutalism in Higher Ed](https://colorwhistle.com/neo-brutalism-higher-education-web-ux/)

### Esthetique et psychologie

- [van Schneider: Kawaiization of Product Design](https://vanschneider.medium.com/the-kawaiization-of-product-design-1f0b1269e1d4)
- [DEV Community: Retro CRT Terminal in CSS + JS](https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh)
- [Design Magazine: Raw Rebellion — Brutalist Design](https://designmagazine.com.au/raw-rebellion-how-brutalist-design-is-reshaping-digital-aesthetics/)

### Typographie

- [Buzzcube: Best Google Fonts 2026](https://www.buzzcube.io/best-google-fonts-for-websites-2026/)
- [Muzli: Best Free Google Fonts 2026](https://muz.li/blog/best-free-google-fonts-for-2026/)
- [Brutalist Themes: 35+ Free Fonts for Brutalist Websites](https://brutalistthemes.com/free-fonts-for-brutalist-websites/)
- [DWS Studio: Free Retro Google Fonts](https://designwithshay.com/free-retro-google-fonts-for-your-next-design-project/)

### Visualisation scientifique

- [Nature: Preparing Figures Specifications](https://research-figure-guide.nature.com/figures/preparing-figures-our-specifications/)
- [Conceptviz: Okabe-Ito Palette](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference)
