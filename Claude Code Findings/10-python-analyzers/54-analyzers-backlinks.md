# Deep Dive #54 — `platform/src/audit_platform/analyzers/backlinks.py`

**File:** [`backlinks.py`](/root/site-audit/platform/src/audit_platform/analyzers/backlinks.py) (769 lines)
**Layer:** 10 — Python analyzer (backlink profile + quality + opportunities)
**Date:** 2026-04-20

---

## 1. Purpose

Python analyzer that DIRECTLY calls DFS via `DataForSEOConnector` (line 29) — bypassing the JS `gather-backlinks.js` path. Methods:
- `analyze(client, competitors)` (line 40) — fetches domain metrics + backlinks + referring domains via DFS.
- `analyze_intersection` (line 150) — competitor overlap analysis.
- `find_link_opportunities` (line 187) — suggests domains for outreach.
- `_is_spammy_domain` (line 324), `_score_opportunity` (line 419) — quality/priority logic.
- `_compute_anchor_distribution` (line 569) — anchor text categorization.
- `_find_broken_backlinks` (line 672) — 404 detection on referring URLs.

**Duplicates many responsibilities of `gather-backlinks.js` (finding #9) + `analyze-backlink-quality.js` (finding #14).**

## 2. Key architecture

**`analyze` (line 40).** Client + competitors domain metrics. Calls `_fetch_domain_metrics` per domain (line 81, 90) → `DataForSEOConnector::get_backlinks_summary`.

**Line 122: `"qualitySummary": quality_summary`** — builds an in-analyzer spam classification (duplicate of finding #14's rule-based-v1). Different classifier — potentially different labels for same domains between Python and JS paths.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 122 | **Duplicates `analyze-backlink-quality.js` logic** (finding #14). Two spam classifiers, potentially different verdicts. Python-path's `qualitySummary` vs JS-path's could disagree on a given domain. Pick one. |
| 2 | **H** | 81-120 | **DIRECT DFS calls for domain metrics + backlinks + referring domains** — parallel to JS `gather-domain-metrics.js` (finding #8) + `gather-backlinks.js` (finding #9). Double-path risk per finding #8 #1 + #9 #1. |
| 3 | **H** | — | **Subject to finding #8 #3** (DFS rank vs Ahrefs DR scale) — Python analyzer will also see 0-1000 `rank` values. Quality scoring at line 324-358 likely has scale-sensitive thresholds. |
| 4 | **M** | 187-311 | **`find_link_opportunities`** — has its own heuristic. Presentation via `pages/backlink-opportunities.js` (finding #30 `data.backlinkOpportunities`). Is this where `backlinkOpportunities` is populated? Deep-dive #21 per-section pass will clarify. |

## 4. Integration map

**Called by:** `build_audit.py::_run_backlinks` (line 237-247). Runs when DFS creds available.

**Output:** `audit-data.json.backlinks.{domainMetrics, qualitySummary, opportunities, ...}`.

**Consumed by:** `pages/links.js`, `pages/backlink-opportunities.js`, `pages/competitors.js`.

## 5. Fix / improve suggestions

1. **Pick Python OR JS path for backlink gathering.** Retire the other. If keeping Python: delete gather-backlinks.js + analyze-backlink-quality.js. If keeping JS: this analyzer drops to just `_find_broken_backlinks` + opportunity scoring on the JS-produced files.
2. **Scale-normalize DR at model layer** (finding #8 #3).
3. **Document which classifier is authoritative** for qualitySummary.
