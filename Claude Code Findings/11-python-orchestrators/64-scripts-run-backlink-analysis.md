# Deep Dive #64 — `platform/scripts/run_backlink_analysis.py`

**File:** [`run_backlink_analysis.py`](/root/site-audit/platform/scripts/run_backlink_analysis.py) (103 lines)
**Layer:** 11 — Python orchestrator (standalone backlink analysis runner)
**Date:** 2026-04-20

---

## 1. Purpose

Small standalone runner for `BacklinkAnalyzer` (finding #54). Provides a CLI to re-run backlink analysis WITHOUT running the full `build_audit.py` pipeline.

Exists because: backlink analysis can be re-run independently (new backlinks gathered later, want to re-score quality without re-crawling). Pattern consistent with `run_rank_tracker.py` (#65).

## 2. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **Tribal knowledge invocation.** Not in skill. Operator must know to run this when refreshing backlink data without full audit. |
| 2 | **M** | — | **Must write same output shape as build_audit.py's `_run_backlinks`** to avoid audit-data.json schema drift. Code duplication risk. |

## 3. Fix / improve suggestions

1. **Document standalone runners in a PPL (Python Playbook Link)** — operator reference.
2. **Share code with build_audit._run_backlinks** to avoid drift.
