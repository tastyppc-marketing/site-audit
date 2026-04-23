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

---

## Additional Information

### Bug #1 prediction — falsified (2026-04-23)

This finding's bug #1 predicted that `analyzers/local_seo.py` writes the
literal string `"audit-synthesis"` somewhere as a provenance source label.
**Repo-wide grep returns ZERO matches** across all `*.js`, `*.py`, `*.md`,
and `*.json` sources in both `template/` and `platform/`. The literal does
not exist anywhere — not in this analyzer, not in `populate-audit-data.js`,
not in any agent prompt definition.

The "Trace Matt's `businessProfile.source: 'audit-synthesis'`" item in
finding #13 (gather-local-seo) §8 is therefore also resolved-as-spurious.
A fresh `gather-local-seo.js --config client-config.json` run on Matt
produces `businessProfile.source: "web-research"` (the script's default),
not `"audit-synthesis"`. Whatever produced the original sighting may have
been a one-off agent intervention or a since-removed code path; no current
production code emits this label.

Recommend striking bug #1 from the active backlog. Bug #2 (merge precedence
documentation) is unaffected and remains valid follow-up.
