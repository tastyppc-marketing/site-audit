# Deep Dive #56 — `platform/src/audit_platform/analyzers/local_seo.py`

**File:** [`local_seo.py`](/root/site-audit/platform/src/audit_platform/analyzers/local_seo.py) (491 lines)
**Layer:** 10 — Python analyzer (local SEO scoring using LocalSEOConnector + BusinessProfileConnector)
**Date:** 2026-04-20

---

## 1. Purpose

Synthesizes local SEO inputs into `audit-data.json.localSeo.*`. Consumes:
- `LocalSEOConnector` (finding #46) for NAP + local-pack + citations.
- `BusinessProfileConnector` (finding #45) for authoritative GBP data when creds present.
- `local-seo.json` research file (from JS `gather-local-seo.js`) as fallback.

Outputs the shape that `pages/local.js` (finding #28) reads.

## 2. Key architecture

**Merges GBP API data (when available) with web-scraped fallback.** The "audit-synthesis" source label (finding #13 #8 — open mystery) likely originates here — the analyzer combines web-research + GBP + agent findings into a single `businessProfile` dict and stamps `source: "audit-synthesis"` to indicate "multi-source merged."

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Likely source of the "audit-synthesis" provenance label** (finding #13 #8 mystery). Worth grepping this file for the literal string. If confirmed, closes the open question. |
| 2 | **H** | — | **Downstream of finding #12 #1** (local-pack country-level location). Regardless of which connector is called, if location_code is wrong, no pack hits. |
| 3 | **M** | — | **Dual-input merge** (GBP + web scrape + research file) — merge precedence not verified. Risk: GBP data overwritten by stale web scrape, or vice versa. |

## 4. Integration map

**Called by:** `build_audit.py::_run_local_seo` (expected).
**Output:** `audit-data.json.localSeo.*`.

## 5. Fix / improve suggestions

1. **Confirm provenance label origin** (bug #1) — grep for `"audit-synthesis"` string literal in this file. Document data-merge path.
2. **Document merge precedence.**
