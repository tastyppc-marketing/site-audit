# Deep Dive #45 — `platform/src/audit_platform/connectors/business_profile.py`

**File:** [`business_profile.py`](/root/site-audit/platform/src/audit_platform/connectors/business_profile.py) (535 lines)
**Layer:** 09 — Python connector (Google Business Profile API — reviews, performance, keywords)
**Date:** 2026-04-20

---

## 1. Purpose

Google Business Profile (GBP) API wrapper. **Per HANDOFF.md + finding #13**, this is the **authoritative path** for local business data when creds are configured — it OVERRIDES `gather-local-seo.js`'s web-scraped data (finding #13 §4).

Provides:
- `get_locations` — list + detail of GBP locations
- `get_performance` — call views, map views, search impressions
- `get_search_keywords` — the keywords people searched to find the business

## 2. Key architecture

**`_BIZ_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1"` (line 36).** GBP v1 API.

**OAuth auth** (line 96) — requires an authorized user, typically the business owner.

**`_resolve_account_id` (line 139).** Handles multi-account GBP users. Default to settings-configured or prompts.

**`_parse_location` (line 235).** Extracts structured location data: name/address/phone/hours/categories/coordinates. Normalizes to a consistent model.

**`get_performance` (line 289).** Performance metrics over a date range.

**`get_search_keywords` (line 387).** Search-term-level data — what keywords triggered calls/views.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Per-client OAuth — no single client has this set up today.** Matt's config: `businessProfile.hasAccess: false`. All 8 clients likely similar. Result: `gather-local-seo.js` (finding #13) is the de facto path for everyone — with its UA-blocking + fuzzy-match bugs. Unblocking GBP requires per-client OAuth setup, a client-side operation. |
| 2 | **M** | 139 | **Account ID resolution** — heuristic. If user has multiple GBP accounts (agency user), unclear which is picked. |
| 3 | **M** | — | **Rate limits:** GBP API has low quotas. Connector doesn't explicitly surface quota errors. Failed calls may look like network errors. |
| 4 | **L** | 180-190 | **Date proto conversions** — custom serialization for GBP's date format. Works but verbose. |

## 4. Integration map

**Consumed by:** `local_seo.py` analyzer — when `hasAccess: true` in client-config. Overrides `gather-local-seo.js` web-scraped `businessProfile`.

**Finding #13's "audit-synthesis" source label mystery** — could THIS be the source? If GBP was ever run and synthesized data into the report, the label might originate here. Worth checking in deep-dive #56 (local_seo analyzer).

## 5. Fix / improve suggestions

1. **Onboard clients for GBP OAuth.** Operations task, not code. Unblocks real Local page data.
2. **Document multi-account resolution** (bug #2).
3. **Surface quota errors** clearly (bug #3).
