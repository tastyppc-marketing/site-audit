# Handoff — Post bd 1pq + ukr + 8dr + eel

**Written:** 2026-05-09
**Branch:** `1pq-ga4-gsc-producers` (forked from `i57-b-then-a` which contains the i57 work merged into the broader `site-audit-fixes-tier-5` thread)
**State:** 4 bd issues closed, 12 commits, ready to push (push not yet performed — pending user direction).

This handoff is self-sufficient. Read it + `Claude Code Findings/HANDOFF-POST-PHASE-E.md` and you can resume cold.

---

## 1. The North Star (from prior handoff, still operative)

> "By the end of our fixes, we should be able to run the site audit with no issues. I shouldn't have to come back and say, 'Hey, this broke.' Let's fix it. It should just work; it should be accurate data. There should be no conflicts within the scripts or any friction whatsoever. It should all work smoothly."

**Progress this session:**
- GA4 + Search Console now produce canonical research files for any client with creds (1pq closed).
- `build_audit.py` no longer silently skips index-orphan + cannibalization analysis (ukr closed).
- `crawl-sitemap.js` no longer hangs on Sierra-Interactive-style IDX bloat (the bug that made the site-crawler agent pivot to a manual methodology mid-flight).
- 6 active clients re-synced from template so the IDX-regex fix applies cohort-wide (8dr closed).
- Pre-commit max-kb policy aligned with realistic research-bundle sizes (eel closed).

---

## 2. What landed (12 commits on `1pq-ga4-gsc-producers`, oldest → newest)

| Commit | Subject |
|---|---|
| `200ae60` | `fix(client-context)`: treat empty .env values as missing |
| `e3fc35a` | `fix(connectors)`: narrow OAuth scopes per-connector to avoid invalid_scope |
| `7f5daed` | `feat(1pq)`: add canonical GA4 + Search Console gather scripts |
| `45047bb` | `docs(1pq)`: wire GA4 + Search Console gathers into /seo-audit Step 5.5 |
| `f01b13f` | `fix(crawl-sitemap)`: detect `<city>-homes-for-sale` IDX bloat as filter pages |
| `b733b28` | `data(rob-kittle)`: onboard new client + bd 1pq end-to-end verification |
| `dc1bd95` | `feat(gather-sc)`: emit queryPages field for cannibalization detection |
| `e93c0b4` | `fix(ukr)`: build_audit.py reads canonical search-console.json with legacy fallback |
| `77354ee` | `data(8dr)`: cohort sync IDX regex fix to 6 active clients |
| `a712c96` | `fix(gather-sc)`: cap allQueries/allPages/queryPages at 1000 rows each |
| `b0b44e5` | `chore(precommit)`: raise check-added-large-files max-kb from 500 to 5000 |
| `b62ff7d` | `data(rob-kittle)`: commit audit-data.json + capped search-console.json |

**bd issues closed:** site-audit-fix-work-1pq, site-audit-fix-work-ukr, site-audit-fix-work-8dr, site-audit-fix-work-eel.

---

## 3. What was built — high level

### bd 1pq — GA4 + Search Console producers

- `platform/scripts/gather_ga4.py` — wraps the existing `GA4Connector` (Phase E), takes `--client-slug`, fetches landing-page / acquisition / device / page-performance reports over a 90-day window, writes canonical `clients/<slug>/seo/research/ga4-data.json` matching the shape p3realtync established.
- `platform/scripts/gather_search_console.py` — wraps `SearchConsoleConnector`, fetches query / page / query+page reports, writes canonical `clients/<slug>/seo/research/search-console.json`. Caps allQueries/allPages/queryPages at 1000 rows each (totalQueries / totalPages preserve true counts).
- Wired into `commands/seo-audit.md` Step 5.5 alongside the existing `gather-*.js` invocations.

**Side-fixes shipped along the way:**
- `ClientContext.from_slug` now treats empty `.env` values as missing — was coercing `GOOGLE_SERVICE_ACCOUNT_JSON=""` into `Path(".")` and breaking the GA4 connector.
- `GA4Connector` and `SearchConsoleConnector` now request only their specific OAuth scopes — was failing on refresh tokens not granted the full default scope set (analytics + webmasters + adwords + business.manage).

### bd ukr — build_audit.py reader fix

- New helper `_load_search_console_section(canonical_field, legacy_filename)` on `BuildAuditOrchestrator`. Prefers `search-console.json` and falls back to legacy `gsc-pages.json` / `gsc-query-pages.json`.
- Re-routed two reads:
  - `IndexCrawlabilityAnalyzer` for orphan detection (was reading `search-console-pages.json` which nothing writes).
  - `detect_cannibalization` for keyword cannibalization (was reading `search-console-query-pages.json` which nothing writes).
- **Verified:** cannibalization 0 → 509 records; `indexOrphans.summary` populated with totalOrphans=25,000, highPriority=1,573, scPagesAnalyzed=25,000.

### IDX regex fix (no separate bd issue — surfaced live)

- `template/scripts/crawl-sitemap.js`'s IDX-pattern regex required a literal `/homes-for-sale/` segment, but Sierra Interactive sites (and likely others) use `/<city>-homes-for-sale/<filter>/`. On Kittle, 96.8% of 16,280 URLs slipped past the filter and the analyzer hung trying to Playwright-load 15K+ thin filter pages.
- Added two patterns: `/[^/]+-homes-for-sale/[^/]+` and `/[^/]+-condos-for-sale/[^/]+`.
- Cohort-synced to 6 active clients (8dr).

### bd eel — research bundle vs pre-commit cap

- Capped `allQueries` / `allPages` / `queryPages` at 1000 rows each in `gather_search_console.py` (search-console.json: 8.3MB → 597KB on rob-kittle).
- Bumped `.pre-commit-config.yaml` `check-added-large-files --maxkb` from 500 → 5000.

---

## 4. Rob Kittle audit — first end-to-end pipeline run

Used Rob (kittlerealestate.com, Fort Collins / Northern Colorado) as the bd 1pq verification client because he had fresh GA4 + GSC creds. Now committed with full research bundle.

**Pipeline outputs (all in `clients/rob-kittle/`):**
- `client-config.json` — Northern Colorado RE, 5 competitors locked in
- `seo/audit-data.json` — Grade F, 18 findings, 25 keywords, 509 cannibalization records, 25K indexOrphans
- `seo/research/` — 16 JSON + 5 markdown research files (ga4-data, search-console, pagespeed-data, domain-metrics, organic-metrics, keyword-volumes, local-pack-data, local-seo, crawl-data, link-graph, client-backlinks + 5 competitor-backlinks files, page-text-analysis, backlink-opportunities + 5 markdown reports)
- `seo/reports/FINAL-AUDIT-REPORT.md` — 817-line compiled audit
- `seo/reports/multipage/` — **the rendered client-ready report (9 HTML pages, fully inlined)**

**Headline findings on Kittle:**
1. **`$COUNT$ Listing$S$"&gt;Search Listings` template bug** rendering as raw H2 text on 29 of 57 sampled pages (including Rob's own bio page).
2. **96.8% of 16,280 indexed URLs are auto-generated IDX bloat** — all self-canonicalling, textbook index-bloat pattern.
3. **Homepage title is 220 characters** with typo "Fort Collin" and out-of-market reference "Colorado Springs."
4. **Zero dedicated landing pages** for any of Kittle's four specialty programs (Buy-Before-You-Sell, Cash Offer, Remodel-on-our-Dime, Sell-and-Stay). "Sell-and-Stay" appears nowhere on the site.
5. **Mullenberg has 6 named seller-program pages** including "Mully Move-Up Method" (BBYS equivalent) and "Buyers-In-Waiting" — direct competitive gap.
6. **Brand-strong but Chamber/local-press light on backlinks**; The Group is link-authority leader (LeadingRE, LuxuryPortfolio, ZoomInfo, LoopNet, Coloradoan, VisitFtCollins, Chamber).

**Renderer log (proves bd 1pq end-to-end):**
```
Auto-populated searchConsoleData: 50 queries, 50 pages
Auto-populated trafficData: 8 channels, 3 devices, 25 pages
```

---

## 5. Open bd queue

| ID | Pri | Title | Status / next-action |
|---|---|---|---|
| `046` | P2 | Remove i57 legacy filename fallback from generate-multipage-report.js | **Deferred.** Prereq: migrate mammoth-lakes' legacy gsc-*/ga4-* files to canonical names (and p3realtync's pagespeed.json → pagespeed-data.json). Without that, removing the fallback silently breaks those clients' renders. |
| `5hy` | P2 | Project SOP for AI-assisted feature/data additions | **Deferred.** Best after more dead-code-yet-tested incidents accrue. The qualitySummary-not-propagating bug + the loadClientEnv path bug + the ukr search-console-pages reader bug are good raw material when the SOP gets written. |
| `p2a` | P3 | populate-audit-data.js: brittle MD heading parsers | Filed during Rob's audit. competitorComparison / contentCalendar / advantages couldn't parse from the agents' MD output. Either tighten agent prompts or move to JSON handoff. |

---

## 6. Push status

**12 commits unpushed on branch `1pq-ga4-gsc-producers`** (forked from local-only `i57-b-then-a`).

Per project TANDEM override: "Never push without explicit user direction." User went to bed without explicit push direction at end-of-session — these commits remain durable on disk but not on the remote.

To push when ready:
```bash
cd /root/site-audit-fix-work
gh auth setup-git
git push -u origin 1pq-ga4-gsc-producers
```

Note: branch forks from `i57-b-then-a` (local-only) which forks from the merged-and-pushed `tier-5-phase-E`. Pushing `1pq-ga4-gsc-producers` will also bring along the i57 commits (`df08e1e`, `92cb9ce`) that are on the parent branch but not yet on a pushed branch.

---

## 7. Resume checklist (paste-ready for next session)

```bash
# Reach the right repo and branch
cd /root/site-audit-fix-work
git checkout 1pq-ga4-gsc-producers
git status   # expect: clean, 12 commits ahead of i57-b-then-a

# Confirm editable install (CONFTEST GUARD WILL FAIL FAST IF SKIPPED)
pip install -e platform/ --break-system-packages
python3 -c "import audit_platform; print(audit_platform.__file__)"
# Expected: /root/site-audit-fix-work/platform/src/audit_platform/__init__.py

# Sanity gates
python3 -m pytest platform/tests/ --tb=no -q
# Expected: 416 passed (Phase E baseline)
npx jest template/scripts/lib/load-client-env.test.js
# Expected: 15 passed
./platform/scripts/smoke/tier5_render_smoke.sh
./platform/scripts/smoke/tier5_js_smoke.sh
python3 platform/scripts/smoke/tier5_python_smoke.py
# All three: PASS

# Read references in order
cat "Claude Code Findings/HANDOFF-POST-1PQ.md"           # this file
cat "Claude Code Findings/HANDOFF-POST-PHASE-E.md"       # prior session
bd ready                                                  # see open queue
cat CLAUDE.md                                             # fix-work + TANDEM + GitNexus rules
```

---

## 8. Scratch notes (don't forget)

- Rob Kittle's `.env` lives at `clients/rob-kittle/.env` — gitignored, contains GA4 + GSC + DataForSEO + PageSpeed + GBP creds. The `GOOGLE_REFRESH_TOKEN` was minted this session via the OAuth helper at `platform/scripts/generate_oauth_token.py` (script can't auto-open a browser on this VPS — used a manual code-paste flow).
- Rob's GBP API quota is 0 on the GCP project; `googleAccess.businessProfile.hasAccess: false` in his `client-config.json` so the audit skips GBP cleanly. Flip to `true` once the GCP quota request is approved.
- The `commands/seo-audit.md` runbook expected order is **Step 5.6 (populate-audit-data) before Step 5.7 (build_audit.py)** — but populate-audit-data requires audit-data.json to exist, so 5.7 actually has to run first. Worth a doc fix on a future pass.
- Slash commands like `/seo-audit` aren't registered in this repo — the file is a runbook, not a Claude Code skill. Past sessions invoked it by saying "Claude, read commands/seo-audit.md and execute." We did the same this session manually-orchestrated.

---

## 9. Resume prompt for fresh session

```
Resuming site-audit work post bd 1pq + ukr + 8dr + eel.

Repo: /root/site-audit-fix-work/
Branch: 1pq-ga4-gsc-producers (12 commits unpushed)

Read in order:
1. Claude Code Findings/HANDOFF-POST-1PQ.md (this file)
2. Claude Code Findings/HANDOFF-POST-PHASE-E.md (prior context)
3. bd ready (3 issues open: 046, 5hy, p2a)
4. CLAUDE.md (fix-work hard rules + TANDEM override + GitNexus rules)

State at handoff:
- 4 bd issues closed this session: 1pq (GA4/GSC producers), ukr (build_audit
  reader fix), 8dr (cohort sync IDX regex), eel (pre-commit max-kb)
- Rob Kittle (kittlerealestate.com) onboarded as the 1pq verification client;
  full audit ran and committed (Grade F, 18 findings, 509 cannibalization
  records, 25K indexOrphans). Multipage HTML report at
  clients/rob-kittle/seo/reports/multipage/index.html
- Open follow-ups: 046 deferred (needs mammoth-lakes legacy migration),
  5hy deferred (more incidents needed for good SOP), p2a P3
- Push not yet performed; 12 commits durable locally

Next action options (pick based on user direction):
- Push the branch: gh auth setup-git && git push -u origin 1pq-ga4-gsc-producers
- Tackle 046 (legacy migration for mammoth-lakes + p3realtync's pagespeed.json)
- Tackle p2a (populate-audit-data parser brittleness)
- Run a fresh audit on another active client to keep proving end-to-end

Pre-flight (always before trusting test output):
  pip install -e platform/ --break-system-packages
  python3 -m pytest platform/tests/ --tb=no -q

The user's North Star (verbatim):
  "By the end of our fixes, we should be able to run the site audit with
   no issues. I shouldn't have to come back and say, 'Hey, this broke.'
   It should just work; it should be accurate data. There should be no
   conflicts within the scripts or any friction whatsoever."
```
