# Deep Dive #49 — `platform/src/audit_platform/connectors/social_audit.py`

**File:** [`social_audit.py`](/root/site-audit/platform/src/audit_platform/connectors/social_audit.py) (417 lines)
**Layer:** 09 — Python connector (social media profile presence check)
**Date:** 2026-04-20

---

## 1. Purpose

Detects client presence across social platforms: Facebook, Instagram, YouTube, LinkedIn, TikTok. Two modes:
1. **Construct-URL-and-HEAD** — builds `https://instagram.com/{name}` and checks if it returns 200.
2. **Scrape-and-regex** — reads client website homepage/contact page, extracts linked social URLs via regex.

Hardcoded platform list at lines 40-45. Regexes at lines 51-56.

## 2. Key architecture

**`_safe_head` (line 96).** HEAD request with status check. Used for constructed-URL probing.

**`_safe_get` (line 110).** GET with status check. Used for page scraping.

**`_is_excluded_url` (line 131).** Filters out non-primary social URLs (e.g., share buttons, sponsor logos).

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 40-45 | **Hardcoded name substitution** — `https://www.facebook.com/{name}` works ONLY if the client's social handle matches their business name exactly. Many clients have handles that differ (e.g., `@mattwallmowrealtor` not `@matt_wallmow`). Miss rate is high. Scraping the website for linked URLs is more reliable — but this connector does BOTH and the constructed-URL path produces false negatives. |
| 2 | **M** | 51-56 | **Regex-based extraction** — loose patterns match share-button URLs not just profile URLs. `_is_excluded_url` tries to filter but likely imperfect. |
| 3 | **M** | 96 | **HEAD requests may be blocked** by social platforms (Instagram, TikTok) with "Method Not Allowed" or silent 403. False negatives. Facebook similar. |
| 4 | **L** | — | **No structured auth** — these platforms don't offer public APIs for presence check anyway. Can't do better without scraping. |

## 4. Integration map

**Consumed by:** `analyzers/eeat_signals.py` or local_seo analyzer — social presence is a trust signal.

**Matt's case:** his `client-config.json` lists 6 social URLs (Zillow, Realtor, YouTube, TikTok, Facebook, Instagram). Connector would probe 5 of those (no Zillow/Realtor platform).

## 5. Fix / improve suggestions

1. **Primary path: scrape client site for linked URLs**; constructed-URL fallback only (bug #1).
2. **Use GET instead of HEAD** for platforms that block HEAD (bug #3). Slower but more reliable.
3. **Validate URLs match `social-config.json` in client-config** — ground truth.
