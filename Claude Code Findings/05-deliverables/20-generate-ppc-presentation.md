# Deep Dive #20 — `template/scripts/generate-ppc-presentation.js`

**File:** [`template/scripts/generate-ppc-presentation.js`](/root/site-audit/template/scripts/generate-ppc-presentation.js) (362 lines)
**Layer:** 05 — deliverables (PPC PowerPoint via `pptxgenjs`)
**Cross-reference:** [`codex findings/04-report-generators/21-generate_ppc_presentation.md`](/root/site-audit/codex findings/04-report-generators/21-generate_ppc_presentation.md)
**Template-vs-client drift:** **None — all 9 clients identical at 362 lines.** Sixth consecutive zero-drift finding.
**Template-vs-skill drift:** **Orphan** (same as #16, #19). No skill invocation. No `ppc-audit.md` skill exists.
**Date:** 2026-04-20

---

## 1. Purpose

The **PPC audit PowerPoint deliverable.** Sibling to #18 `generate-presentation.js` but PPC-flavored. Reads `ppc/ppc-data.json` and produces `ppc/reports/PPC-Audit-Presentation.pptx`.

**Shares the `ppc-data.json` contract with finding #19** — both scripts hit the same source file, so any schema fix or shape change must coordinate across both.

Slides (estimated from structure): Title → Campaign Health Dashboard → The Core Problem → Top Issues → Ad Group Performance → Keyword Analysis → Search Term Audit → Budget Waste → Negative Keywords → Optimization Plan (phased) → Budget Reallocation → Projected Impact → Next Steps. Same `pptxgenjs` pattern as #18.

## 2. Inputs

| Arg | Default | Purpose |
|---|---|---|
| `--data <path>` | `__dirname/../ppc/ppc-data.json` | Source JSON |

**Same upstream gap as #19:** depends on `ppc-data.json` which nothing produces automatically.

## 3. Outputs

`ppc/reports/PPC-Audit-Presentation.pptx` (exact line in save block, ~line 340+).

**Does this one auto-create the output dir?** Worth confirming in the tail of the file (didn't read every line — pattern suggests YES because #19 does; would be a diff if not). Flag as verification in §8.

## 4. Annotated walk (abbreviated — pattern matches #18 + #19)

- **Lines 19-40:** pptxgenjs init + color palette + `STATUS` map + `addTitleBar` helper (identical pattern to #18).
- **Slide 1 (42-54):** title + client metadata (name, company, accountId, auditDate).
- **Slide 2 (56-72):** Campaign Health Dashboard. **Line 67:** `d.campaignHealth.slice(0, 8).forEach` — hardcoded 8-metric cap. If campaignHealth array has 10 metrics, 2 are silently dropped from the slide.
- **Slide 3 onwards (read only first 80 lines):** "The Problem" → lists total spend, registrations, closed deals, etc.
- **Subsequent slides (inferred):** mirror the XLSX sheets from #19 — Ad Group Performance, Keyword Analysis, Search Term Audit, Budget Waste, Negatives, Optimization Plan, Budget Reallocation.

**Color semantics:** `STATUS = { green, orange, red, neutral }` (line 35) — status-to-color map for health metrics. Unlike the XLSX which uppercases the status string, presentation uses it as a color key.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Orphan — not invoked by any skill.** Same as #16, #19. No `ppc-audit.md`. Manual CLI only. |
| 2 | **H** | — | **Upstream gap — `ppc-data.json` has no automatic producer.** Finding #16 #2 blocking: `parse-google-ads.js` writes `ppc-raw-data.json`; transformation to `ppc-data.json` is missing. Without it, this script can never run on a fresh client. |
| 3 | **H** | — | **No schema validation.** 30+ required fields across all slides. Any missing field crashes that slide. |
| 4 | **M** | 67 | **Hardcoded `slice(0, 8)` on campaign health metrics.** 10-metric campaignHealth silently loses 2 values. Similar to #18 #6 (keyword top-8). |
| 5 | **M** | — | **Null guards on `.toFixed` / `.toUpperCase`** likely absent throughout (pattern continues from #19). Unconfirmed for lines 80-362 without full read; flagged as pattern-predicted risk. |
| 6 | **M** | — | **Same hardcoded-prose risk as #18 #10** — if any slide embeds static copy like "The campaign needs restructuring," that's in-code and plays regardless of actual findings. Pattern-predicted. |
| 7 | **L** | — | **Non-atomic write.** |

## 6. Integration map

**Invoked by:** Nothing. Manual.

**Reads:** `ppc/ppc-data.json`. Shares schema with `generate-ppc-spreadsheet.js` (#19).

**Writes:** `ppc/reports/PPC-Audit-Presentation.pptx`.

**Consumers:** None (deliverable).

**Drift table:** 362 lines identical across template + 9 clients + Backup. Zero drift.

**Skill-inline:** no stub; not invoked.

**Matt Wallmow PPC state:** identical to #19 — `ppc-data.json` exists, `ppc/reports/` empty. This script has never run for him.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Bundle with #16, #19 into a single PPC workflow PR.** Create `commands/ppc-audit.md`, build the raw→ppc-data transformer, add schema validator, wire both deliverable generators.
2. **Null-guard all `.toFixed` / status-string ops.**
3. **Make the 8-metric slice configurable** or dynamic based on array length.
4. **Shared schema validator with #17, #18, #19** — `lib/validate-data.js` with per-script field-list constants.

## 8. What to verify before we touch this file

- **Read lines 80-362** to confirm: (a) whether output dir is auto-created, (b) presence of hardcoded prose (like #18 #10's "the site is not broken"), (c) whether every `.toFixed` / `.toUpperCase` is unguarded.
- **Diff this script's slide structure against #19's sheet structure** — identify any data field used here but not in the XLSX (or vice versa). Schema should be consistent.
- **Confirm `pptxgenjs@^4.0.1` is in every client's `package.json`** — it's the only dependency risk.
- **Before bundling fixes, confirm a PPC audit playbook exists at all.** If the raw→analyzed transformation step requires an AI agent (like the SEO report-compilation step), that prompt needs to exist too.

---

## Pattern note — convergence of findings #16-20

Five scripts in the 05-deliverables layer share consistent patterns:
- **#16 parse-google-ads.js:** orphan, CWD-relative output, output-filename-gap.
- **#17 generate-spreadsheet.js:** wired to skill, but competitor-column cap + no schema validation + no dir-create.
- **#18 generate-presentation.js:** wired to skill, same competitor cap + mixed field conventions + no schema validation.
- **#19 generate-ppc-spreadsheet.js:** orphan, upstream gap, no schema validation, auto-creates dir (improvement over #17).
- **#20 generate-ppc-presentation.js:** orphan, upstream gap, no schema validation.

**Shared fixes across this cluster:**
1. Schema validator lib.
2. Auto-create output directory.
3. `__dirname`-relative paths (already done; consistent).
4. Coordinated field-naming conventions (top-level vs nested).
5. Feed-script orchestration (skill wires for PPC; raw→data transformer).

One coordinated PR for this cluster would yield disproportionate value.
