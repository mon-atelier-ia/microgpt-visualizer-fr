# Major dependency upgrades — 2026-10-19

Context: after `npm audit fix` + semver-minor updates (commit `a6d41a0`), 12 packages
still had a newer major. One upgrade per commit, full `npm run check` after each.

## Compatibility research (source: `npm view <pkg>@<major> peerDependencies engines`)

Runtime: Node v24.20.0, npm 11.19.0.

| Package                     | From    | Target  | Constraint found                                                        | Decision                                                |
| --------------------------- | ------- | ------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| jscpd                       | 4.3.0   | 5.4.1   | node >=18                                                               | Upgrade — fixes the 5 remaining audit findings          |
| vitest                      | 4.1.12  | 5.0.5   | vite ^6.4 \|\| ^7 \|\| ^8, node ^24                                     | Upgrade                                                 |
| vite                        | 7.3.7   | 8.3.4   | node >=22.12                                                            | Upgrade together with plugin-react 6                    |
| @vitejs/plugin-react        | 5.2.0   | 6.1.2   | peer vite ^8.0.0                                                        | Upgrade with vite 8                                     |
| eslint + @eslint/js         | 9.39.5  | 10.x    | node >=24 ok                                                            | Upgrade together                                        |
| globals                     | 16.5.0  | 17.13.0 | —                                                                       | Upgrade with eslint 10                                  |
| eslint-plugin-react-refresh | 0.4.26  | 0.5.7   | eslint ^9 \|\| ^10                                                      | Upgrade with eslint 10                                  |
| jsdom                       | 28.1.0  | 30.1.3  | node ^24.15 ok                                                          | Upgrade                                                 |
| lint-staged                 | 16.4.0  | 17.6.0  | node >=22.22.1 ok                                                       | Upgrade                                                 |
| typescript                  | 5.9.3   | 7.0.2   | **typescript-eslint 8.71.2 (latest) peer: `typescript >=4.8.4 <6.1.0`** | **Blocked at 6.0.3** until typescript-eslint supports 7 |
| @types/node                 | 24.19.2 | 26.x    | runtime is Node 24                                                      | **Stay on 24.x** — types must match the runtime         |

Replay: `npm view typescript-eslint@latest peerDependencies` → expect `typescript: '>=4.8.4 <6.1.0'`.

## Results

Baseline (after minor updates): 202 tests, 0 lint errors, 0 clones, build OK,
`react-dom` 212.97 kB (gzip 66.19), `index` 455.69 kB (gzip 142.01), 5 high audit findings.

| Step                                             | Commit    | Tests  | Lint  | Audit | Build (index / react-dom, kB)         | Notes                                                                                                              |
| ------------------------------------------------ | --------- | ------ | ----- | ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| jscpd 5                                          | `48d1fce` | 202 ✅ | 0 err | **0** | 455.70 / 212.97                       | v5 found 3 clones v4 missed (theme tokens, Term modal, ProbabilityBar test) — fixed                                |
| vitest 5                                         | `8979d39` | 202 ✅ | 0 err | 0     | unchanged                             | no change needed                                                                                                   |
| vite 8 + plugin-react 6                          | `835641b` | 202 ✅ | 0 err | 0     | 382.63 / 210.54 (gzip 143.03 / 65.69) | `manualChunks` → `codeSplitting.groups`; same chunk hashes as manualChunks build; dev + preview checked in browser |
| eslint 10 (+ @eslint/js, globals, react-refresh) | `4044572` | 202 ✅ | 0 err | 0     | unchanged                             | 3 new findings fixed at source; `exhaustive-deps` → error                                                          |
| jsdom 30                                         | `966bef7` | 202 ✅ | 0 err | 0     | unchanged                             | —                                                                                                                  |
| lint-staged 17                                   | `ea5fddb` | 202 ✅ | 0 err | 0     | unchanged                             | ran on its own commit                                                                                              |
| typescript 6.0.3                                 | `63960a2` | 202 ✅ | 0 err | 0     | unchanged                             | probe type error still fails `tsc -b`                                                                              |

**Net bundle effect of the whole session (gzip, the transfer size):** index 141.99 → 143.03 kB (+1.04),
react-dom 57.63 → 65.69 kB (+8.06, from React 19.3). Raw index size drops 455.60 → 382.63 kB with Vite 8,
but gzip does not follow — no real gain to claim.

Replay: `npm run check` → exit 0, `202 passed`, `Found 0 clones.`; `npm audit` → `found 0 vulnerabilities`;
`npm outdated` → only `@types/node` (26, kept on 24 on purpose) and `typescript` (7, blocked).

## Findings logged as debt (not fixed in this pass)

- `react-hooks/refs` off: 10 render-time ref writes in canvas components (PLAN #7).
- Horizontal overflow at 1038 px viewport on 4 pages (PLAN #8) — **pre-existing**, identical on production
  (`index-fIeMhvWU.js`): Tokenisation +323 px, Propagation +271, Modèle complet +166, Plongements +34.
- Prettier drift in 4 files never staged since creation, incl. upstream `src/engine/autograd.ts` (PLAN #9);
  Prettier is not part of `npm run check`.
- `@typescript-eslint/no-explicit-any` warning in `app.config.ts:8` (PLAN #1, accepted).
