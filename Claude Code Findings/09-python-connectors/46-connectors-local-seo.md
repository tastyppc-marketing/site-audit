# Deep Dive #46 — `platform/src/audit_platform/connectors/local_seo.py`

**File:** [`local_seo.py`](/root/site-audit/platform/src/audit_platform/connectors/local_seo.py) (526 lines)
**Layer:** 09 — Python connector (local SEO helpers + directory/pack checks)
**Date:** 2026-04-20

---

## 1. Purpose

Mixed-purpose local SEO helper. Unlike other connectors which wrap one API, this one:
- Scores NAP consistency (`check_nap_consistency`) via text similarity.
- Checks if the client is in Google Local Pack (`check_local_pack`) — **via DataForSEO, not direct**.
- Analyzes GBP completeness (`analyze_gbp_completeness`) given a profile dict.
- Finds citation opportunities (`find_citation_opportunities`).

Hardcoded directory list at lines 31+: Yelp, BBB, Facebook Business.

## 2. Key architecture

**`_check_local_pack_via_dataforseo` (line 275).** Internal DFS wrapper — duplicates logic from `dataforseo.py::get_local_pack` (finding #41) AND from JS `gather-local-pack.js` (finding #12). **Third parallel path to DFS SERP.**

**`_normalize_text`, `_normalize_phone`, `_text_similarity` (lines 174-199).** Defensive NAP comparison utilities. Better than JS `gather-local-seo.js`'s bidirectional-substring (finding #13 #4) — uses proper similarity scoring.

**`analyze_gbp_completeness` (line 330).** Scores a GBP profile dict against a completeness rubric (has hours, photos, description, etc.).

**`find_citation_opportunities` (line 448).** Suggests directories the client isn't listed on.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 275 | **Third DFS path for local pack.** Alongside JS `gather-local-pack.js` and Python `dataforseo.py::get_local_pack`. Likely duplicates cost. Single source of truth needed. |
| 2 | **M** | 31-60 | **Hardcoded directory list** — 3 directories. JS `gather-local-seo.js` has 4-6 (finding #13). Mismatch — Python and JS paths check different directory sets. |
| 3 | **M** | 214-274 | **`check_local_pack` likely shares finding #12's location_code bug.** If it passes `location_code: 2840` by default, same 0-hit problem. Not verified. |
| 4 | **M** | 193-199 | **Text similarity is better than JS's** but still not perfect. Algorithm (line 193-199) — likely Jaccard or similar. |

## 4. Integration map

**Consumed by:** `analyzers/local_seo.py` (#57 — upcoming).
**Orchestrator:** `build_audit.py`.

## 5. Fix / improve suggestions

1. **Single DFS local pack path** (bug #1).
2. **Harmonize directory list** between Python and JS (bug #2).
3. **Verify location_code parameterization** (bug #3).
