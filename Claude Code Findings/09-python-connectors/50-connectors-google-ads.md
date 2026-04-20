# Deep Dive #50 — `platform/src/audit_platform/connectors/google_ads.py`

**File:** [`google_ads.py`](/root/site-audit/platform/src/audit_platform/connectors/google_ads.py) (565 lines)
**Layer:** 09 — Python connector (Google Ads API)
**Date:** 2026-04-20

---

## 1. Purpose

Wraps Google Ads API for campaign audit data. Replaces the CSV-parsing workflow (`parse-google-ads.js`, finding #16) with direct API access when credentials are configured. Exposes:
- `get_campaigns` (line 147)
- `get_ad_groups` (line 220)
- `get_keywords` (line 291)
- `get_search_terms` (line 370)

## 2. Key architecture

**`GoogleAdsClient` (line 53).** Uses the official `google-ads` Python library. Handles token refresh, query batching.

**`_search` (line 114).** Executes GAQL (Google Ads Query Language) — more expressive than the CSV export.

**`_default_customer_id` (line 100).** Pulls from `Settings.GOOGLE_ADS_CUSTOMER_ID`. Raises if unset.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Coexists with JS `parse-google-ads.js`** (finding #16). Two PPC paths. `parse-google-ads` reads CSV exports; this one calls the API directly. Unknown which is authoritative — neither is wired into a skill. |
| 2 | **H** | — | **Requires Google Ads API OAuth + developer token.** No client has it set up (same pattern as GSC, GBP). PPC audits today rely on CSV exports → `parse-google-ads.js`. |
| 3 | **M** | 100 | **Single customer_id per setting.** For agency workflows (multiple clients in one Google Ads account), doesn't support customer switching. |
| 4 | **L** | 114 | **`_search` pagination** — probably handles it, but worth verifying for 10k+ keyword accounts. |

## 4. Integration map

**Consumed by:** `analyzers/ppc_analyzer.py` (#62 — upcoming).

**NOT consumed when:** no API creds → PPC workflow falls back to CSV export path (`parse-google-ads.js`).

## 5. Fix / improve suggestions

1. **Pick CSV-export OR API** as authoritative path (bug #1). Same pattern as DFS dual-path concern.
2. **Document OAuth setup** for operators (bug #2).
3. **Multi-customer support** for agency users (bug #3).

---

## Python connectors cluster wrap (#40-#50)

**Pattern:**
- All 10 connectors extend `BaseConnector` (#40).
- 5 require OAuth creds (search_console, ga4, business_profile, google_ads, arguably crux with API key) — which most clients don't have.
- 2 run without auth (local_seo, social_audit, brand_mentions do scraping).
- 1 wraps DFS (dataforseo.py) which is the backbone for most data.
- 1 calls PSI API (pagespeed.py).

**Cross-cutting bugs:**
1. **Dual-path risk:** DFS / PSI / GBP / Google Ads all have BOTH Python AND JS paths. Redundant billing + inconsistent data.
2. **Base retry doesn't cover 5xx** (#40 #1).
3. **Sync path has no retry** (#40 #2).
4. **OAuth onboarding is blocker** for most authoritative data (GSC, GA4, GBP, GAds).

**Fix priorities for the cluster:**
1. Fix base retry (#40 #1, #2).
2. Pick Python OR JS for each API. Retire redundant path.
3. Onboard client OAuth for at least one "reference client" to prove the Python path works end-to-end.

**Next up: Python analyzers (#51-#62)** — which consume the connectors + research JSON files.
