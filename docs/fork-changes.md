# Fork Changes Registry

> Tracks all divergences from upstream ([enescang/microgpt-visualizer](https://github.com/enescang/microgpt-visualizer)). Each entry is commit-linked and justified, to facilitate future PRs or cherry-picks.

## Localization (FR)

| Change | Commit | Justification |
|--------|--------|---------------|
| All UI strings translated to French (5 pages + sidebar + LossChart) | `19a3d1e` | Target audience: French learners (10-14 ans, programme tuto-llm) |
| French accents added to all translated text | `fd323e8` | Initial translation omitted diacritics — invalid French (modèle vs modele) |
| French typographic conventions (guillemets, etc.) | `fd323e8` | Respect des conventions typographiques françaises |

## Datasets (planned)

| Change | Commit | Justification |
|--------|--------|---------------|
| Dataset selector UI in sidebar | `efc9b85` | Allow switching between FR/EN datasets without code change |
| French datasets: prénoms-simple (50), prénoms (1000), pokémon-fr (1022), dinosaures (1530) | `135b53e` | FR training data, reused from microgpt-ts-fr. All a-z ASCII only — vocabulary unchanged (27 tokens) |
| `createModel(docs?)` accepts optional docs parameter | `efc9b85` | Minimal engine change (2 lines) to support dataset selection |

## Infrastructure

| Change | Commit | Justification |
|--------|--------|---------------|
| ESLint + Husky pre-commit + lint-staged | `6fad5e0` | Enforce code quality on commit |
| Vitest + test script in `check` pipeline | `4fe9edd` | Dataset integrity tests (18 tests) |

## Engine modifications

> `src/engine/` is upstream code, treated as read-only. Exceptions documented here.

| File | Change | Commit | Justification |
|------|--------|--------|---------------|
| `src/engine/model.ts` | `createModel()` → `createModel(docs?)` (1 optional param) | `efc9b85` | Required for dataset selection. Backward-compatible — no param = original behavior. Module-level vocabulary derivation (`uchars`, `vocabSize`) unchanged |
| `src/engine/data.ts` | No change | — | Original NAMES_RAW kept as-is. New datasets live in `src/datasets/` |
