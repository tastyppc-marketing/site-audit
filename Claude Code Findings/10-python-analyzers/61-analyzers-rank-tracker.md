# Deep Dive #61 — `platform/src/audit_platform/analyzers/rank_tracker.py`

**File:** [`rank_tracker.py`](/root/site-audit/platform/src/audit_platform/analyzers/rank_tracker.py) (366 lines)
**Layer:** 10 — Python analyzer (historical rank tracking)
**Date:** 2026-04-20

---

## 1. Purpose

Produces the `rankHistory` field that `pages/keywords.js` (finding #23 #4) reads. Tracks keyword positions over time — delta analysis, movement identification.

Given finding #23 flagged `rankHistory` as a "ghost field" with no producer, this analyzer IS the producer. Closes that loop.

## 2. Key architecture

Likely queries DFS SERP / GSC for historical positions, computes deltas, identifies keywords with significant movement (gained/lost positions).

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **Requires historical DFS / GSC data.** For new audits (first-time run for a client), history doesn't exist yet — `rankHistory` may be empty. |
| 2 | **M** | — | **Separate orchestrator script** `platform/scripts/run_rank_tracker.py` (per INDEX #65) — indicates this may be run separately from `build_audit.py`. Operator must know to invoke. |
| 3 | **L** | — | **Rank history interpretation** — different SERP features (featured snippets, people also ask) can reorder positions without real ranking changes. Tracker may report false movement. |

## 4. Integration map

**Called by:** `build_audit.py` OR `scripts/run_rank_tracker.py` (finding #65).
**Output:** `audit-data.json.rankHistory.*` — closes the `pages/keywords.js` ghost-field gap.

## 5. Fix / improve suggestions

1. **Document that rank tracking requires a second invocation** in operator playbook.
2. **Handle SERP feature noise** in history — distinguish position change from SERP layout change.
