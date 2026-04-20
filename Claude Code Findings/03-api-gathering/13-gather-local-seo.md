# Deep Dive #13 — `template/scripts/gather-local-seo.js`

**File:** [`template/scripts/gather-local-seo.js`](/root/site-audit/template/scripts/gather-local-seo.js) (359 lines)
**Layer:** 03 — API / data gathering (no auth — pure HTML scraping)
**Cross-reference:** [`codex findings/02-data-gathering/13-gather_local_seo.md`](/root/site-audit/codex findings/02-data-gathering/13-gather_local_seo.md)
**Template-vs-client drift:** **Same three-client cohort at 372 lines (chris-nevada, laura-willis, liane-jamason — byte-identical). matt-wallmow identical to template. 4 clients missing.** See §6.
**Template-vs-skill drift:** No inline stub. Invoked at `seo-audit.md` with `--domain --name --location`.
**Date:** 2026-04-20

---

## 1. Purpose

The **no-auth local SEO fallback**. When a client doesn't have Google Business Profile API credentials, this script does best-effort HTML scraping to populate:
- **NAP from client website** (name/address/phone via JSON-LD, `tel:` links, regex address patterns).
- **Directory presence checks** against Yelp, BBB, Facebook, Google Maps (+ Realtor.com and Zillow for real-estate clients).

Writes `seo/research/local-seo.json`. When GBP API access IS configured, the Python `BusinessProfileConnector` runs instead and overrides the rating/reviews/hours/pack data — but this script's NAP + directory scaffolding is always produced.

**Explicitly documented non-coverage** (header lines 18-22): GBP rating, review text, photos, hours, verification status, map-pack positions. Those fields are emitted as `rating: null, reviewCount: 0, gbpVerified: false` so consumers don't confuse with real data.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--domain <domain>` | flag+value | — required | Client domain (with or without scheme) |
| `--name "<Client Name>"` | flag+value | — | Business name for directory search |
| `--location "<City, ST>"` | flag+value | — | Location for directory search |
| `--config <path>` | flag+value | — | Alternative to above three: read from `client-config.json` |

**Env vars:** None.
**Files read:** `client-config.json` (if `--config` provided).
**Network:** Client website (contact/about pages) + directory search URLs.

`loadConfig()` (lines 62-86) reads `--config` if present; falls back to flags. The config reader tolerates two field-name conventions: `cfg.domain || cfg.clientDomain`, `cfg.clientName || cfg.name`, `cfg.location || cfg.targetLocation`.

## 3. Outputs

Written to `seo/research/local-seo.json` (line 349).

```
{
  businessProfile: {
    name, address, phone, website, category: '',
    rating: null,         // always null — script cannot determine
    reviewCount: 0,       // always 0
    gbpVerified: false,   // always false
    source: "web-research",
    note: "GBP data gathered from public web research..."
  },
  napConsistency: {
    websiteNap: { name, address, phone },
    directoryListings: [{ directory, found, url, napMatch: false }]
  },
  citations: {
    totalFound, consistent: (= totalFound), inconsistent: 0, missing: [...], issues: []
  },
  competitorGbp: [],
  reviews: [],
  errors,
  status, gatheredAt
}
```

**Note the `napMatch: false` default** (line 184): every `directoryListings[i]` row has `napMatch: false` since this script never actually extracts directory NAP to compare. The field exists in the schema but is a dead field.

## 4. Annotated walk

**Lines 44-48 — setup.** Imports `requestText` (text variant of fetch-with-retry). Module-level `errors = []`.

**Lines 52-86 — CLI + config.** `--config` takes precedence; fallback to `--domain` / `--name` / `--location` flags.

**Lines 90-111 — `fetchHtml(url, timeoutMs)`.** Wraps `requestText`. 15s timeout default, 12s at call sites. `followRedirects: 1` — only follows ONE redirect.
- Line 97: UA `'Mozilla/5.0 (compatible; SiteAuditBot/1.0)'` — **explicit bot UA**. Same issue as `extract-text.js` (finding #6 #7) but even more severe here because we're scraping directory search pages (Yelp, BBB) that AGGRESSIVELY block bot-identified UAs. Cloudflare and similar will 403 every directory check.

**Lines 121-175 — `extractNapFromHtml(html, domain)`.** Three-layer NAP extraction:

1. **JSON-LD primary (lines 126-160).** Parses every `<script type="application/ld+json">` block.
   - Line 134: type regex `(LocalBusiness|RealEstateAgent|RealEstateListing|Organization|Person|ProfessionalService)`. **Misses:** `Restaurant`, `Dentist`, `AutoDealer`, `LegalService`, `MedicalBusiness`, `Store`, `Corporation`, etc. For real-estate clients fine; non-RE clients may have schema that doesn't match.
   - Line 139-153: address object → joined string. `addressCountry` included — optional. Joins with commas.
   - Line 155: `entry.telephone` → `nap.phone`.
2. **`tel:` link fallback (lines 163-166).** Regex `href=["']tel:([^"']+)["']` finds first tel link. Good.
3. **Address regex fallback (line 170).** **US-only format:** street number + street + `Ave|St|Blvd|...` + city + state (2 letters) + ZIP (5 digits). Fails on:
   - Canadian postal codes (`M5V 3H1`)
   - UK postcodes
   - Non-ZIP international addresses
   - Addresses on multiple lines (not collapsed before regex)
   - Suite/apartment prefixes

**Lines 183-212 — `checkDirectory(dirName, searchUrl, clientDomain, clientName)`.** The directory-presence check.

- Line 188: fetches the directory search URL (e.g., `https://www.yelp.com/search?find_desc=...`).
- **Line 201: `domainFound = lowerBody.includes(lowerDomain)`**. A substring match of the client's domain anywhere on the directory search page. The page may reference the domain in an ad, sponsored result, related-business listing, or random tangential content. **Very high false-positive rate** for any common or popular domain. For mattwallmow.com this is probably specific enough; for a generic domain like `realestate.com`, every Yelp search result page would match.
- **Line 202: `nameFound = lowerName.length > 3 && lowerBody.includes(lowerName.split(' ')[0].toLowerCase())`.** **First name only.** "Matt Wallmow" → searches for `"matt"`. Every single Yelp result page with ANY business named "Matt's" or containing the word "matt" is a positive match. For Matt Wallmow, Yelp's search results would include any Matt-named business in WI as a "hit." Huge FP risk.
- Line 204: `result.found = domainFound || nameFound` — OR, so either path triggers.
- Line 205: `result.url = searchUrl` — records the SEARCH URL, not the client's actual directory listing URL. The report's Citations section therefore links back to search pages, not listings.

**Lines 216-225 — main init.** Required: `--domain`.

**Lines 233-260 — NAP-from-contact-page.** Tries 5 URLs in order: `/contact/, /contact-us/, /about/, /about-us/, /` (homepage). First one with any extracted NAP wins. Fallback on `name` config if no name extracted.

**Lines 267-298 — directories to check.**
- Base: Yelp, BBB, Facebook, Google Maps (lines 268-284).
- **Line 287: real-estate vertical regex** — `/real.?estate|realtor|realt|property|homes|housing/i` on `name + ' ' + location`.
  - Matt's case: name="Matt Wallmow", location="Rhinelander, WI 54501". Concatenated: `"Matt Wallmow Rhinelander, WI 54501"`. **No real-estate word** → regex fails → Realtor.com and Zillow NOT checked. But Matt IS a realtor and has listings on both. **Missed directories for Matt.** Fix: also consider `client-config.json.clientCompany` or `serviceType`. Matt's `clientCompany` is "Wallmow Realty, Inc / Lakeland Realty" — that WOULD match.
- **Line 295: Zillow URL construction.** `encodedLocation.replace(/%20/g, '-').toLowerCase()`. For "Rhinelander, WI 54501" → `encodedLocation = "Rhinelander%2C%20WI%2054501"` → `.replace(/%20/g, '-')` = `"rhinelander%2c-wi-54501"`. **`%2C` (comma) is NOT replaced** — URL is malformed. Zillow URLs look like `/professionals/real-estate-agent-reviews/rhinelander-wi/` without ZIP and without encoded commas. URL broken.

**Lines 300-305 — directory loop.** Sequential with `sleep(1000)` between each (line 189 per-check).

**Lines 311-344 — output assembly.** `businessProfile.source: 'web-research'` (line 321). `citations.consistent = foundCount` — **bug implicit:** "consistent" means "NAP matches across directories," but since we never check NAP in directory listings, consistent == found is misleading. All found directories are counted as consistent even if their NAP differs.

**Line 342 — status.** `errors === 0 → success`; else `(foundCount > 0 || websiteNap.phone ? "partial" : "failed")`.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 97 | **Explicit "SiteAuditBot" UA.** Directory search pages (Yelp, BBB, Google Maps) aggressively block bot-identified UAs. Cloudflare/similar return 403, not the actual search HTML. The `checkDirectory` then sees an empty/403 body and reports `found: false`. Real positives get filtered to negatives before any matching occurs. Biggest single-variable improvement: switch to real Chrome UA. |
| 2 | **H** | 202 | **Directory-presence name match uses first name only.** `lowerBody.includes(name.split(' ')[0].toLowerCase())`. "Matt Wallmow" → substring match on "matt" anywhere on the directory page. Produces false positives on every directory page containing ANY mention of anyone/anything named "Matt." Fix: full-name match, optionally token-set ratio. |
| 3 | **H** | 201 | **Domain substring check also too loose.** Any reference to the client domain (ad, sponsored result, editorial mention) triggers a positive. Combined with bug #2, directory "found: true" results have high FP rate; "found: false" has the blocking-UA FN risk. |
| 4 | **H** | 287 | **Real-estate regex misses realtor clients whose `name` doesn't contain RE words.** Tests `name + ' ' + location`, not `clientCompany` or `serviceType`. Matt Wallmow is a realtor but his name doesn't include "realty." Result: Realtor.com + Zillow not checked for him despite having Zillow/Realtor.com listings. Fix: also test `clientCompany` field (has "Wallmow Realty, Inc / Lakeland Realty"). |
| 5 | **H** | 295 | **Zillow URL construction is broken.** `encodedLocation.replace(/%20/g, '-').toLowerCase()` leaves `%2C` (URL-encoded comma) intact AND appends ZIP code — resulting in a URL like `/professionals/real-estate-agent-reviews/rhinelander%2c-wi-54501/`, which is 404. Zillow's actual URL pattern is `/rhinelander-wi/`. Bug doesn't manifest because (a) bug #4 prevents Zillow check from running for Matt, (b) even when it runs, bug #1 would block the fetch anyway. Combined these three bugs make Zillow coverage effectively nonexistent. |
| 6 | **H** | — | **Three-client cohort drift** (chris-nevada, laura-willis, liane-jamason at 372 lines — identical byte-for-byte fork). Raw `https.request()`, no retry. Same systemic pattern as the 5 previous scripts. |
| 7 | **H** | — | **4 clients missing the script** (calgary-castles, mammoth-lakes, murray-gardner, p3realtync). No `local-seo.json` for them. Local page Citations section is blank. |
| 8 | **M** | — | **Provenance mismatch in Matt's output.** Script emits `source: "web-research"` (line 321). Matt's `local-seo.json` has `source: "audit-synthesis"` AND `rating: 5.0, reviewCount: 182` — values the script never produces. Something else (likely a content-auditor agent or post-processor) rewrote Matt's file. Which process and when? Needs tracing — either `populate-audit-data.js` (deep-dive #15) or an agent in the skill. |
| 9 | **M** | 184, 332-338 | **`napMatch: false` and `citations.consistent == totalFound` are dead/misleading.** The script never extracts directory NAP to compare. Every found directory is counted as "consistent" regardless of whether its NAP differs. Misleading when downstream renderers show "4/4 directories consistent" — the claim has no basis. |
| 10 | **M** | 170 | **Address regex is US-only.** Canadian/UK/non-US clients get no address from fallback path. Small config-driven regex library would help. |
| 11 | **M** | 134 | **Schema type regex misses many LocalBusiness subtypes.** `Restaurant`, `Dentist`, `AutoDealer`, etc. Non-real-estate clients may have schemas that don't match. Expand to `LocalBusiness|.*Service|.*Business|Organization|Person` — or accept any type and score by presence of address+phone. |
| 12 | **M** | 94 | **`followRedirects: 1` — only 1 hop.** Some directories redirect twice (http→https→canonical). A 2-hop chain breaks the fetch. |
| 13 | **M** | 267-284 | **Directory list is hardcoded, not config-driven.** Can't add, remove, or reorder without editing code. |
| 14 | **L** | 48 | **Module-level `errors` array.** CLI-only; fine. |
| 15 | **L** | 189, 256 | **Hardcoded delays 1000ms + 500ms.** Not configurable. |
| 16 | **L** | 350 | **Non-atomic write.** |
| 17 | **L** | 205 | **`result.url = searchUrl`** records the search URL, not the client's actual listing URL on the directory. Reports link to search pages. Minor UX issue. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill: `node scripts/gather-local-seo.js --domain {CLIENT_DOMAIN} --name "{CLIENT_NAME}" --location "{LOCATION}"`.
- Matt Wallmow: `[04:16]` in audit-log: `local-seo.json ✓ (thin — no GBP access)`.

**Consumers of `local-seo.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:2886` | Auto-populates `localSeo.businessProfile` + `napConsistency`. |
| `pages/local.js` | `:51, :92` | Reads `data.localSeo || data.local_seo` — tolerates both key casings. |
| `build_audit.py` | `:293` | `_load_research_file("local-seo.json")` for audit synthesis. |
| **`connectors/business_profile.py`** | — | When GBP API creds are configured in `client-config.json`, THIS takes precedence. Overrides rating/reviews/hours/pack data but keeps this script's NAP + directory scaffolding. |

**Contract:**
- `businessProfile.source` documents data provenance. Consumers should check this BEFORE displaying rating/reviewCount as authoritative.
- `napConsistency.directoryListings[i].found` is the presence bit. Currently noisy on both sides (FP from loose matching, FN from UA blocking).
- `napConsistency.directoryListings[i].napMatch` is always `false` — **do not trust**.
- `citations.consistent` equals `totalFound` — **misleading**.

**Drift table:**

| Version | Lines | Transport | Delay | Status |
|---|---|---|---|---|
| Template | 359 | `requestText` | N/A | current |
| matt-wallmow | 359 | = template | = template | Identical |
| chris-nevada | 372 | raw `https.request()` | (hardcoded) | Old cohort |
| laura-willis | 372 | raw | (hardcoded) | Old cohort (byte-identical) |
| liane-jamason | 372 | raw | (hardcoded) | Old cohort (byte-identical) |
| calgary-castles | — | — | — | MISSING |
| mammoth-lakes | — | — | — | MISSING |
| murray-gardner | — | — | — | MISSING |
| p3realtync | — | — | — | MISSING |

**Skill-inline:** no stub.

**Matt Wallmow data inspection:**
- `businessProfile.source: "audit-synthesis"` (NOT `"web-research"` — overwritten post-script).
- `rating: 5.0, reviewCount: 182` populated from another source (script doesn't produce these).
- Directories: Yelp `found: false`, BBB `false`, Facebook `true` (the first-name-match probably triggered correctly on `facebook.com/MattWallmowRealtor`), Google Maps `false`.
- `citations.totalFound: 1` — only Facebook.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Switch to real Chrome UA** (bug #1). Zero-cost fix. Immediately unblocks Yelp/BBB/Google Maps scraping. Biggest single-line improvement; likely changes Matt's 1/4 to 3/4 or 4/4 directories found.
2. **Full-name match + domain-match dedup** (bugs #2, #3). Replace loose substring with token-set match and require BOTH "domain present" AND "name present" for confidence. OR add a confidence score instead of binary found.
3. **Real-estate detection via `clientCompany` + `serviceType`** (bug #4). Small regex change unlocks Zillow/Realtor.com for realtor clients whose name doesn't contain "real estate."
4. **Fix Zillow URL construction** (bug #5). Drop the ZIP from encoded location, URL-decode commas. Matches Zillow's actual URL pattern.
5. **Trace Matt's "audit-synthesis" source** (bug #8). Find the process that rewrote Matt's `local-seo.json` after this script ran. Likely in `populate-audit-data.js` (deep-dive #15) or a content-auditor subagent. Deep-dive blind spot — must establish provenance before fixing anything else in the local path.
6. **Re-template three-client cohort + restore 4 missing clients** (bugs #6, #7). Same bulk operation flagged across every finding this session.
7. **Implement real NAP-match in directory listings** (bug #9). Fetch the listing URL (not just search URL), extract NAP, compare via token-set ratio. Requires schema update so `napMatch` becomes meaningful.
8. **Expand schema type regex + add non-US address patterns** (bugs #10, #11). Supports non-real-estate and international clients.
9. **Increase `followRedirects` to 3-5** (bug #12). Handles typical http→https→canonical chains.
10. **Make directory list config-driven** (bug #13). Users can add industry-specific directories without editing code.

## 8. What to verify before we touch this file

- **Trace Matt's `businessProfile.source: "audit-synthesis"`.** Grep for any code that writes that literal string. Check `populate-audit-data.js`, the content-auditor agent's tool definitions, and any post-processing hook. Could be a markdown-parser in `populate-audit-data.js:137+` reading `content-audit.md`.
- **Inventory each client's `local-seo.json`**. Check `source` field and whether rating/reviews are populated. If multiple clients have been rewritten by the same "audit-synthesis" process, the provenance trace becomes simpler.
- **Run the UA fix on one client (Matt) in a staging env.** Measure Yelp/BBB/Google Maps response codes before and after. If still 403, a headless browser (Playwright) may be required for the more protected directories.
- **Confirm GBP API path is used for any current client.** If `business_profile.py` has never run successfully on any client, this script's output IS the only local data — making every bug above user-facing. If GBP IS configured for some client, we have a reference for what "full data" should look like.
- **Check `pages/local.js:51,92`** to confirm the consumer handles `napMatch: false` on every listing. If it renders "consistent" badges based on this, the fix #7 needs coordinated UI change.
