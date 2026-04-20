# Deep Dive #55 — `platform/src/audit_platform/analyzers/competitor.py`

**File:** [`competitor.py`](/root/site-audit/platform/src/audit_platform/analyzers/competitor.py) (490 lines)
**Layer:** 10 — Python analyzer (competitor comparison + gap analysis)
**Date:** 2026-04-20

---

## 1. Purpose

Synthesizes competitor data across domains to produce structured comparison + gap analysis. Feeds `audit-data.json.competitorAnalysis.*` — which `pages/competitors.js` (finding #27) reads.

## 2. Key architecture

**Consumes from other analyzers' outputs** (internal_linking, backlinks, content_quality results) OR from gather-*.json research files.

**Produces comparison matrix** with metrics × competitors rows. Likely the source of `competitorComparison[]` normalization that `populate-audit-data.js` (finding #15) also produces. Two paths to the same field — which wins?

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Two paths to `competitorComparison`:** this analyzer AND populate-audit-data.js (which parses the agent-authored `competitor-analysis.md`). Normalizer or merger must pick one. If both populate, last-write wins or merge conflict. |
| 2 | **M** | — | **Local pack counter at line 205 referenced by finding #12 search** — likely unrelated counter, worth checking for naming collision. |
| 3 | **M** | — | **Likely depends on DFS rank scale** (finding #8 #3) for any metric comparison. |

## 4. Integration map

**Called by:** `build_audit.py::_run_competitor_analysis` (expected).
**Output:** `audit-data.json.competitorAnalysis.*`.

## 5. Fix / improve suggestions

1. **Disambiguate `competitorComparison` producer** — Python OR populate-audit-data.js, not both.
