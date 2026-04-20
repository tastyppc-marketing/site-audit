# Deep Dive #62 — `platform/src/audit_platform/analyzers/ppc_analyzer.py`

**File:** [`ppc_analyzer.py`](/root/site-audit/platform/src/audit_platform/analyzers/ppc_analyzer.py) (693 lines)
**Layer:** 10 — Python analyzer (PPC campaign analysis)
**Date:** 2026-04-20

---

## 1. Purpose

Analyzes Google Ads data — campaigns, ad groups, keywords, search terms, quality score, budget allocation, negative keyword opportunities. Feeds `audit-data.json` PPC sections that `generate-ppc-spreadsheet.js` + `generate-ppc-presentation.js` (#19, #20) consume.

## 2. Key architecture

Consumes either:
- `GoogleAdsConnector` output (finding #50) — when API creds configured.
- `ppc-data.json` (the implicit transformation from `parse-google-ads.js`, finding #16 #2) — for CSV-export workflow.

**Neither path is currently wired to a skill.** Entire PPC analyzer is orphaned, per findings #16 + #19 + #20.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Orphan analyzer — no skill invocation.** Same as the PPC cluster. No `ppc-audit.md`. |
| 2 | **H** | — | **Two input paths** (API vs CSV) — similar dual-path concern as `backlinks.py`/`gather-backlinks.js`. Pick one. |
| 3 | **M** | — | **Expects `ppc-data.json` shape** (finding #19's schema) — 30+ required fields. Without schema validator, partial input crashes. |

## 4. Integration map

**Output:** `audit-data.json.ppc.*` (fields consumed by `generate-ppc-*.js`).
**Connection gap:** No orchestrator currently runs it.

## 5. Fix / improve suggestions

1. **Resolve PPC workflow** (findings #16, #19, #20 + here). One skill. One data path. One analyzer.

---

## Python analyzers cluster wrap (#51-#62)

**Pattern:**
- 12 analyzers fanning out from `build_audit.py` orchestrator.
- Each consumes a mix of: crawl-data.json + research JSON files + connector outputs.
- Each writes to a distinct `audit-data.json` field.
- `reporting_intelligence.py` (#60) is the meta-analyzer that synthesizes all others.

**Cross-cutting bugs:**
1. **All page-based analyzers are capped at 11 pages for Matt** due to finding #5 + #21 agent-overwrite. Not their fault; they're reading what they're given.
2. **internal_linking.py is healthy but corrupted by build_audit.py:216 bug** — fix is upstream.
3. **DR scale** propagates through backlinks.py + content_gap.py + reporting_intelligence.py — a single scale normalization at the connector layer fixes all.
4. **Dual-path redundancy** with JS scripts persists across backlinks, local_seo, PPC paths.

**Next up:** Python orchestrators (#63-#66) — build_audit.py + its siblings.
