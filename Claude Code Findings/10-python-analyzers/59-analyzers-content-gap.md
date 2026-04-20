# Deep Dive #59 — `platform/src/audit_platform/analyzers/content_gap.py`

**File:** [`content_gap.py`](/root/site-audit/platform/src/audit_platform/analyzers/content_gap.py) (342 lines)
**Layer:** 10 — Python analyzer (content gap analysis vs competitors)
**Date:** 2026-04-20

---

## 1. Purpose

Identifies topics/keywords competitors rank for that the client doesn't. Feeds content strategy recommendations + blog topic ideas. Output likely `audit-data.json.contentGap.*`.

## 2. Key architecture

**Cross-references competitor organic keywords** (from DFS `ranked_keywords`, finding #10) against client's keyword set. Gaps = competitor-ranks minus client-ranks.

Needs:
- Client organic keywords (from GSC + DFS)
- Competitor organic keywords (from DFS — finding #10's `organic-metrics.json`)

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #10 cap** — `gather-organic-metrics.js` returns top-100 keywords per competitor. Gap analysis misses long-tail opportunities. |
| 2 | **M** | — | **Requires GSC access for client-side comparison.** Most clients (Matt included) don't have it. Fallback: use DFS for client too → less accurate. |

## 4. Integration map

**Called by:** `build_audit.py`.
**Output:** `audit-data.json.contentGap.*`.

## 5. Fix / improve suggestions

1. **Raise `gather-organic-metrics.js` limit** (finding #10 #6) for deeper gap analysis.
2. **Onboard GSC access** for reliable client-side comparison.
