# Visual overhaul — brainstorm handoff (2026-10-20)

File: `docs/plans/2026-10-20-visual-overhaul-handoff.md`. Status: **brainstorming in progress, no design
written, no product code.** Base commit: `3e32b3c` (recon doc). Hard gate: nothing is built before the
user approves a written design (`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`).

## Decisions taken by the user (their words, in French)

1. Full rebuild of the UI ("on refait tout"). Order: this repo first (project 1), 3D "wow" twin in
   microgpt-xray later (project 2).
2. Audience: mostly kids alone at home on PC/tablet, plus adults. Non-school. Must spark curiosity
   and the urge to click and understand.
3. Common thread: the user types their name once; **their** letters travel through every step.
   Each page = the inside of one step of the computation (the "atelier" principle was validated).
4. Real terminology only (Tokenisation, Plongements, Attention…), no kid-ified names.
5. **Illustrations show technical reality down to the machine, never metaphors** ("pas des voitures
   et des tiroirs"). Showing matrices with their values is NOT enough: "c'est paresseux, c'est le
   montage actuel".
6. Level chosen: **the program as it really runs** — JS `number` = IEEE 754 float64
   (`src/engine/autograd.ts:7`), each weight wrapped in a `Value` heap object (data, grad, parent
   links); CPU drawn as a faithful but generic schematic (V8 JIT internals are not observable from a page).
7. Pre-baked renders allowed for deterministic cases (`createRng(42)`, `src/engine/model.ts:60`);
   what the user manipulates (name, temperature, training) is computed live.
8. Critical verification pass of all pedagogical content is required.

## Anti-goals (user's list)

Gadget / babyish with no real understanding · Anatomy skill not used · cheap / slop rendering ·
visuals disconnected from bare-metal computer science.

## Anatomy skill — how it applies

Source: `C:\Dev\wiki\raw\web\hermes-anatomy-skill.md`. Keep its craft (dense, 40–80+ purposeful parts,
every number from the real model, 4× close-up check). **Drop its metaphor step** (§ "The object is the
explanation", line 86: drawers, locks): the depicted object is the real machine — memory, float64 bits,
`Value` objects, multiply-add sequence, CPU schematic.

## Known content-audit items

- `tokenize` maps unknown chars to 0 = 'a' silently (`src/engine/model.ts:29`, `charToId[c] ?? 0`).
- Prototype claim "letters used alike get close embeddings" — not measured on this model.

## Communication feedback (2026-10-20)

User lost track when given a dense two-option technical dilemma and called it disloyal. Next
messages: short, one plain-language point at a time, recommendation first.

## Open / next

1. Show a visual mockup of ONE step drawn at machine level (suggest Tokenisation: name → char codes →
   token ids → float64 bits of the embedding row in memory) for the user to react to.
2. Remaining territory: visual identity (palette, typography), UX (tablet nav, transitions), stack
   (benchmark tree-shaken bundle before choosing; pin latest stables).
3. Then: written design → builder-check subagent → user approval → writing-plans.

Brainstorm mockups (gitignored): `.superpowers/brainstorm/5700-1792436088/content/` —
`proto-atelier-v2.html` is the latest; its isometric "machines" are metaphors and are now rejected.

## Read in full before resuming

- `docs/plans/2026-10-20-visual-overhaul-handoff.md` (this file)
- `docs/research/2026-10-19-visual-overhaul-recon.md`
- `C:\Dev\wiki\raw\web\hermes-anatomy-skill.md`
- `C:\Users\pierr\.claude\projects\C--Dev-microgpt-visualizer-fr\memory\feedback_real_terminology.md`
- `src/engine/autograd.ts`, `src/engine/model.ts`

## Checks

```bash
git log --oneline -1 -- docs/plans/2026-10-20-visual-overhaul-handoff.md   # expected: docs(plans) handoff commit
git status --short | wc -l                                                  # expected: 0
grep -c "data: number" src/engine/autograd.ts                               # expected: 1 (float64 fact)
```
