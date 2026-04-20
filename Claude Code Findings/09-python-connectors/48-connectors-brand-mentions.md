# Deep Dive #48 — `platform/src/audit_platform/connectors/brand_mentions.py`

**File:** [`brand_mentions.py`](/root/site-audit/platform/src/audit_platform/connectors/brand_mentions.py) (615 lines)
**Layer:** 09 — Python connector (Reddit + web mentions via DuckDuckGo + YouTube)
**Date:** 2026-04-20

---

## 1. Purpose

Searches for brand-name mentions across multiple sources. Unlike most connectors, this one aggregates 3+ sources into a unified mention feed. Key methods:
- `search_reddit` (line 116) — Reddit API search for brand mentions.
- `search_web_mentions` (line 188) — DuckDuckGo HTML scrape for web mentions.
- Likely `search_youtube` or similar.

Feeds the Content/E-E-A-T signals analyzer with off-site brand-presence data.

## 2. Key architecture

**`_safe_get` (line 62).** Defensive HTTP wrapper with timeout + status check.

**`search_reddit` (line 116).** Likely uses public Reddit JSON endpoints (no auth required) or PRAW if configured.

**`search_web_mentions` (line 188).** Scrapes DuckDuckGo HTML results — no official API. Fragile to DDG's HTML changes.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 188 | **DuckDuckGo HTML scraping.** Same fragility as JS `gather-local-seo.js` (finding #13) for directory scraping. DDG layout changes break parsing silently. |
| 2 | **M** | — | **Reddit search** may require auth for high-volume; public endpoints throttled. |
| 3 | **M** | — | **Brand-match logic** — likely string-based. Risk of false positives/negatives (e.g., Matt Wallmow matches every "Matt" reference). |
| 4 | **L** | 615 | **Largest connector besides DFS** — suggests a lot of parsing/normalization logic. Consider splitting per-source. |

## 4. Integration map

**Consumed by:** `analyzers/eeat_signals.py` (#58) — E-E-A-T (Expertise-Authoritativeness-Trustworthiness) scoring.

## 5. Fix / improve suggestions

1. **Replace DDG scrape with SerpAPI or similar** (bug #1). Stable API cost >>> fragility.
2. **Stronger brand matching** — full brand + domain matching, not just first-name.
