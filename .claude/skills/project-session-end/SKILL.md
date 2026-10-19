---
name: project-session-end
description: Use when the user's message is « reprise » (mode RESUME — never write a memo then), or on T1 post-task-long (task > 30 min OR > 5 tool-calls OR 1+ commit), T2 fatigue ALERT, T3 fatigue STOP, T4 design/plan approved OR plan task shipped OR Vercel prod deploy, T5 user-explicit ("memo update" / "doc de reprise" / "session-end" / "STOP" / "pause" / "fin de session"), or right after an auto-compaction (the session ends there).
---

# `microgpt-visualizer-fr` — Project Session-End (projected 2026-10-20)

Projection of `C:/Dev/skills-templates/project-session-end/SKILL.md` (template revision 2026-10-10).
Profile: **mature-no-discipline** (no prior memo / fatigue discipline; project `CLAUDE.md` created with
this projection). Step 0 matrix: `README.md` next to this file.

> Stack: React 19.3 + TS 6 + Vite 8, pnpm only, static SPA on Vercel (git-linked, production =
> `main` once pushed). Single gate: `pnpm run check`. Engine `src/engine/` = upstream Karpathy port.

Paths used below:

- `PROJECT=C:/Dev/microgpt-visualizer-fr`
- `MEMORY_DIR=C:/Users/pierr/.claude/projects/C--Dev-microgpt-visualizer-fr/memory`

## Two modes — pick the mode FIRST

| Mode       | Trigger                     | Does                                       | Never                     |
| ---------- | --------------------------- | ------------------------------------------ | ------------------------- |
| **RESUME** | user message is « reprise » | resume from the CURRENT memo (below)       | write a memo              |
| **MEMO**   | T1-T5 or post-compaction    | write the end-of-segment memo (Steps 1-11) | fire on « reprise » alone |

## Invariants (template § « Invariants communs », all kept)

1. Re-read **from disk** (Read tool, whole file), never from the copy injected at session start.
2. The memo's resume block carries a **« À lire en entier »** list; each file is read whole; proof in
   the resume answer: table `lignes lues / total` (`wc -l`). Paths absolute or project-root-relative;
   memory files prefixed with `MEMORY_DIR`.
3. Fatigue is **counted** from the table, never estimated; on resume the counter **restarts at 0**.
4. **Commit everything, then write the memo last**; the HEAD in the memo is read after the last commit.
5. Every check prints a value compared with an expected value written next to it.
6. Reference check = the command in Step 7, not an inspection.
7. Next action split: **local** part (run now) / **external** part — `git push` (= Vercel prod deploy),
   any Vercel action, any publication — waits for the user's explicit go.
8. Persona = `CLAUDE.md ## Role`, never copied into the memo.
9. Drift check before writing the memo (§10).
10. The memo names its own file in the resume block.

## Mode RESUME — « reprise »

1. Read from disk, whole: `$MEMORY_DIR/MEMORY.md`, the memo it marks **CURRENT**, `$PROJECT/CLAUDE.md`,
   every `$MEMORY_DIR/feedback_*.md`.
2. Run the memo's resume block **literally**. A failing check (HEAD differs, gate red, dirty tree) stops
   the resume: say it, fix it first; a fix that is a write outside the next action → propose and wait.
3. Read whole every file of « À lire en entier » (files over the tool limit: consecutive slices to the last line).
4. Answer with: checks + outputs; `lignes lues / total` table; where work stopped (from the memo);
   next action and what the reading changes about it; every memo ↔ files contradiction (files win),
   including injected copy ↔ disk drift; fatigue line, counter reset to 0.
5. Start the local part of the next action. The external part waits for the explicit go.

## Mode MEMO — 11 steps

### Step 1 — Sources

Read `$PROJECT/CLAUDE.md` (## Standing procedure), `$MEMORY_DIR/feedback_session_end_template.md`,
`$MEMORY_DIR/feedback_post_task_procedure_and_fatigue.md`.

### Step 2 — State (each line: value vs expected)

```bash
cd C:/Dev/microgpt-visualizer-fr
git rev-parse --short HEAD                                  # report in memo
git status --short | wc -l                                  # expected: 0 (commit first)
git rev-list --count origin/main..HEAD                      # commits not pushed = not deployed
pnpm run check > /tmp/check.log 2>&1; echo "exit=$?"        # expected: exit=0
grep -E "Tests +[0-9]+ passed" /tmp/check.log               # expected: current test count
grep -c "Found 0 clones" /tmp/check.log                     # expected: 1
```

Skip `pnpm run check` (write `N/A — docs-only segment, last green run: <hash>`) only when the segment
touched no file outside `docs/` and memory.

### Step 3 — Segment scope

Commits since session start, `git diff --stat <session-start-hash>..HEAD`, test delta, user-corrective
loops (user flag → my fix) counted.

### Step 4-5 — Tag and filename

Kebab-case tag (e.g. `visual-overhaul-brainstorm`, `design-spec-approved`, `plan-task-3-tokenizer-page`).
File: `$MEMORY_DIR/project_session_end_<YYYY-MM-DD>-<tag>.md`.

### Step 6 — Sections retained by the Step 0 matrix (12 of 18)

| §   | Section                   | Content                                                                                                                    |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 4   | Hard signals              | only project-specific ones not already in `CLAUDE.md` / global `CLAUDE.md` / feedback files — cite those files, don't copy |
| 5   | Next decision options A-D | effort + ship gate + rollback + recommendation                                                                             |
| 6   | Quality status            | values from Step 2                                                                                                         |
| 7   | Vercel runtime state      | absolute values: prod URL, last prod deployment ID + commit, READY or not                                                  |
| 8   | Commit ↔ deployment       | each commit cited as shipped: deployed YES/NO + deployment ID; unpushed → `⚠ local-ship-only`                              |
| 9   | Ship contract             | `pnpm run check` exit 0 AND prod visually verified after deploy AND user's explicit push go                                |
| 10  | Drift check               | `PLAN.md`, `docs/plans/*`, `docs/superpowers/specs/*`, `MEMORY.md` vs git log; fix now or list                             |
| 14  | Read order                | "if you want X → read Y"                                                                                                   |
| 15  | Remaining critique / TODO | incl. push pending user OK                                                                                                 |
| 16  | OPEN QUESTION             | question + hypotheses + default recommendation + switch condition                                                          |
| 17  | Fatigue                   | 6 indicators counted (fatigue file) + 1-line verdict                                                                       |
| 18  | Resume block              | doctrine §18 format, with invariants 2, 3, 5, 7, 8, 10                                                                     |

### Step 7 — Checks before writing

Self-contained criteria applicable to retained sections (doctrine checklist). Reference check:

```bash
cd C:/Dev/microgpt-visualizer-fr; MEMORY_DIR=C:/Users/pierr/.claude/projects/C--Dev-microgpt-visualizer-fr/memory
grep -o '`[^` ]*\(/\|\.md\|\.ts\|\.tsx\|\.json\|\.html\)[^` ]*`' <memo> | tr -d '`' | sed 's/:[0-9]*$//' | sort -u |
  while read p; do [ -e "$p" ] || [ -e "$MEMORY_DIR/$p" ] || echo "MISSING $p"; done
# expected: no output
```

### Step 8 — Write the memo (LAST, after the last commit)

### Step 9 — MEMORY.md

Native auto-memory is the index: entry **CURRENT** at the top of `MEMORY.md` (one paragraph, ends with
"on « reprise » : skill project-session-end, mode RESUME"); previous CURRENT → one line "SUPERSEDED".
Keep `MEMORY.md` < 24.4 KB.

### Step 10 — Archive

Prepend `## YYYY-MM-DD` + one paragraph to `$MEMORY_DIR/project_session_history_archive.md`
(create with header `# microgpt-visualizer-fr session history archive` if absent).

### Step 11 — User-facing recap (French)

Memo file + sections count · MEMORY.md CURRENT verified · archive verified · criteria X/N PASS ·
open questions · fatigue line · "Reprise : dire « reprise »".

## Anti-patterns (refuse)

- Writing a memo on « reprise ». Resuming from the injected copy. "Read" via grep/head/offset.
- Memo before the last commit. External action (push/deploy) on resume without the explicit go.
- Continuing product work after an auto-compaction (user rule 2026-10-20, `feedback_compaction_ends_session.md`).
- Empty / "TBD" section; deployment values replaced by "see Vercel".
- Re-implementing this procedure by hand when it applies.

## Cross-references

- `C:/Dev/microgpt-visualizer-fr/CLAUDE.md` — Role + Standing procedure.
- `C:/Users/pierr/.claude/projects/C--Dev-microgpt-visualizer-fr/memory/feedback_session_end_template.md` — doctrine (projected).
- `C:/Users/pierr/.claude/projects/C--Dev-microgpt-visualizer-fr/memory/feedback_post_task_procedure_and_fatigue.md` — fatigue table.
- `C:/Dev/skills-templates/project-session-end/` — canonical template + README (projection workflow, cold-start simulation).
- `feedback_diagnostic_first_doctrine.md` — not created (no stub); create on the first codified anti-pattern.
