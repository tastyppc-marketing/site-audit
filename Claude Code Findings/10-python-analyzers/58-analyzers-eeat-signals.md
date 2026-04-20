# Deep Dive #58 — `platform/src/audit_platform/analyzers/eeat_signals.py`

**File:** [`eeat_signals.py`](/root/site-audit/platform/src/audit_platform/analyzers/eeat_signals.py) (561 lines)
**Layer:** 10 — Python analyzer (E-E-A-T: Experience-Expertise-Authoritativeness-Trustworthiness signals)
**Date:** 2026-04-20

---

## 1. Purpose

Scores Google's E-E-A-T signals on the client site:
- **Author bios** on content pages.
- **Schema markup** (Person, Organization, Author) for author attribution.
- **About page** quality.
- **Testimonials + reviews** presence.
- **Brand mentions** across the web (via `brand_mentions.py` connector).
- **Social signals** (via `social_audit.py` connector).
- **Trust badges** (SSL, accreditations).

Produces `audit-data.json.eeat.*` — likely rendered on the Content or Technical page.

## 2. Key architecture

Consumes multiple connectors + crawl data. Likely scoring-rubric-based (each signal → points → aggregate score).

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #48 (brand_mentions) DDG scraping fragility** + finding #49 (social_audit) false-negative issues. If those connectors produce garbage signals, E-E-A-T score is garbage. |
| 2 | **M** | — | **Schema check subject to finding #5 bug #8** (array-wrapped schemas). Author/Person schemas in grouped `@graph` blocks missed. |
| 3 | **M** | — | **Subjective scoring** — "quality" of about-page content is hard to automate. Agent-authored interpretation likely needed. |

## 4. Integration map

**Called by:** `build_audit.py::_run_eeat_signals`.
**Output:** `audit-data.json.eeat.*`.

## 5. Fix / improve suggestions

1. **Upstream fixes** to `brand_mentions.py` and `social_audit.py` improve E-E-A-T reliability.
2. **Document scoring rubric** for transparency.
