# Deep Dive #60 — `platform/src/audit_platform/analyzers/reporting_intelligence.py`

**File:** [`reporting_intelligence.py`](/root/site-audit/platform/src/audit_platform/analyzers/reporting_intelligence.py) (684 lines)
**Layer:** 10 — Python analyzer (cross-analyzer synthesis — top issues, action plan, overall grade)
**Date:** 2026-04-20

---

## 1. Purpose

The **meta-analyzer.** Consumes outputs of ALL other analyzers (content_quality, technical_seo, backlinks, internal_linking, local_seo, indexation_crawlability, eeat_signals, content_gap) to produce:
- **Top 5 critical issues** (ranked cross-analyzer)
- **Overall grade** (A-F)
- **Action plan** (quick wins, short/medium/long-term)
- **Key stats** for the hero block
- **Next steps**

These are exactly the agent-authored fields from #18 / #22 / #29 findings — this may be the producer!

## 2. Key architecture

**Rubric-based grading** — per-analyzer score → weighted aggregate → letter grade.

**Issue prioritization** — cross-analyzer severity × blast radius.

**Action plan synthesis** — groups recommendations from all analyzers into 4-phase timeline.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Could be the producer of ghost fields** (`keyStats, pillars, quickWins, mediumTermRoadmap, longTermColumns, nextSteps, gradeSummary, advantages`) that findings #18, #22, #29 flagged as agent-authored. Worth grepping for these field names in this file. If confirmed, updates documentation across those findings. |
| 2 | **H** | — | **Every input bug propagates.** Findings #5, #8, #10, #12, #21 all corrupt analyzer outputs → this meta-analyzer's synthesis is corrupt. Garbage-in, garbage-out at the highest level. |
| 3 | **M** | — | **Weighting / rubric** not exposed as config — if business wants to prioritize backlinks over content, requires code edit. |

## 4. Integration map

**Called by:** `build_audit.py::_run_reporting_intelligence` (probably last).
**Output:** Populates multiple `audit-data.json` top-level fields (topIssues, actionPlan, overallGrade, etc.).
**Consumed by:** every page renderer.

## 5. Fix / improve suggestions

1. **Grep for the ghost field names** (bug #1) and update related findings.
2. **Upstream fixes cascade here** — priority order.
3. **Config-driven rubric** for customizable prioritization.
