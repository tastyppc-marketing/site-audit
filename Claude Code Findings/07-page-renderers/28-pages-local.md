# Deep Dive #28 — `template/reports/multipage/pages/local.js`

**File:** [`template/reports/multipage/pages/local.js`](/root/site-audit/template/reports/multipage/pages/local.js) (755 lines)
**Layer:** 07 — page renderer (Local SEO page — map + GBP + map-pack keywords + citations)
**Cross-reference:** [`codex findings/06-page-renderers/41-local_page.md`](/root/site-audit/codex findings/06-page-renderers/41-local_page.md)
**Template-vs-client drift:** laura-willis 755 lines (identical).
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Local SEO page. Main sections:
1. **Map** — Leaflet-based interactive map with client pin + competitors + service area polygons.
2. **Business Profile** (GBP card) — name/address/phone/rating/reviews/hours.
3. **NAP Consistency** — website vs directory listings match.
4. **Citations** — directory presence (Yelp, BBB, Facebook, Google Maps, Realtor.com, Zillow).
5. **Map Pack Keywords** — which keywords the client appears in Google's Local Pack for.
6. **Competitor GBP** — peer comparison.

## 2. Inputs

- `data.localSeo.{businessProfile, napConsistency, citations, competitorGbp, reviews, mapPackKeywords, serviceAreaMap}` — primary.
- Tolerates `data.local_seo` (snake_case) or `localSeo` (camelCase) at line 51 — pre-`deepCamelCaseKeys` legacy.
- `localSeo.businessProfile.{latitude, longitude}` — required for map center. HANDOFF.md:88 notes "Map shows wrong location" bug was fixed by requiring these fields.
- `localSeo.serviceAreaMap` — GeoJSON with Features (Point for center fallback, Polygons for service areas).
- `localSeo.mapPackKeywords[].{keyword, foundInPack, position, packItems[]}` — from `gather-local-pack.js` (finding #12) + normalizer.

## 3. Key sections

**Map rendering (~line 259+).** Leaflet integration.
- Center derivation: (1) `profile.latitude/longitude`, (2) `serviceAreaMap` GeoJSON Point feature, (3) fallback.
- Line 287: empty-state if no coordinates — HANDOFF.md:97 documented this as the fix for Matt's "Mammoth Lakes" bug.
- Service-area polygons rendered via Leaflet's `L.geoJSON`.
- Competitor pins likely red; client pin blue.

**Business Profile card (~line 410+).**
- Reads `localSeo.businessProfile`.
- **Matt's case: `source: "audit-synthesis"`** — finding #13 bug #8's mystery. Card displays `rating: 5.0, reviewCount: 182` despite script not producing those fields (no GBP access).

**Map Pack Keywords (~line 694+).**
- Reads `localSeo.mapPackKeywords` (normalizer auto-populates from `local-pack-data.json` per finding #12 §6).
- **Matt's case: 0/25 keywords in pack** — confirmed by his data. Section shows "no keywords in local pack" — which IS the data, but the ROOT CAUSE is finding #12 bug #1 (US country-level location code), not actual absence.

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #12 bug #1.** Map Pack Keywords section shows 0/25 for Matt — looks like "client isn't ranking" but is actually "location_code 2840 broke the query." Misleading UX. |
| 2 | **H** | — | **Downstream of finding #13 bug #8.** Business Profile card shows rating/reviews sourced from "audit-synthesis" (unknown provenance). Credibility of the data is unverified. |
| 3 | **H** | — | **Downstream of finding #13 bugs #1, #2, #3.** Citations section shows false negatives (UA-blocked directories → not found) and false positives (substring matches → found). Matt shows 1/4 citations (only Facebook) — likely a false-negative-heavy picture. |
| 4 | **M** | 287 | **Empty-state when coordinates missing is helpful, but normalizer doesn't warn when businessProfile is missing lat/long.** Silent report-time fallback to "no location." Deep-dive #21 #2 validator should flag this. |
| 5 | **M** | 275-283 | **GeoJSON fallback for center** — iterates features, picks first Point. If the GeoJSON has multiple Points in arbitrary order, pick is non-deterministic across runs. |
| 6 | **M** | — | **Map display logic has historical bug "wrong location"** (HANDOFF.md:88 — pre-fix showed Mammoth Lakes for other clients because coordinates were hardcoded in a previous-client template). The current code avoids this by requiring actual data. But any client audit that doesn't provide lat/long silently falls to empty state with no clear error. |
| 7 | **L** | 51 | **Dual-path read `localSeo || local_seo`** — legacy compatibility; `deepCamelCaseKeys` in the normalizer should eliminate snake_case, but defensive. |

## 5. Integration map

**Data chain:**
- `gather-local-seo.js` → `local-seo.json` → normalizer section 2886 → `data.localSeo`.
- `gather-local-pack.js` → `local-pack-data.json` → normalizer section 2931-2945 → `data.localSeo.mapPackKeywords`.
- **IF GBP API access configured** → `platform/connectors/business_profile.py` OVERRIDES the web-research output with real GBP data (rating, reviews, hours).
- Client-config.json provides `location` → coordinates must be separately populated somehow (HANDOFF.md:97: "You must provide coordinates" — no geocode step).

## 6. Fix / improve suggestions

1. **Fix finding #12 #1** (country-level location code) to make Map Pack Keywords actually work. Highest-impact Local-page improvement.
2. **Surface data provenance** — display the `businessProfile.source` field next to the data (e.g., "via Google Business Profile API" vs "via web research" vs "via audit-synthesis"). Tells the client where the numbers came from.
3. **Coordinate-required warning** at generate time — block the Local page if businessProfile has neither lat/long nor serviceAreaMap Point.
4. **Add a geocode helper** in `gather-local-seo.js` to populate lat/long from the `location` string (Nominatim or similar).

## 7. What to verify before we touch this file

- **Open Matt's Local page** — is the map centered on Rhinelander, WI (coordinates 45.636, -89.411)? Does Business Profile show "audit-synthesis" source?
- **Confirm Map Pack Keywords section** — 0 of 25 showing? Does it have messaging explaining "no pack presence" or is it ambiguous?
- **Verify Citations** — 1 of 4? Which directory is green (Facebook) and which are false-negatives?
