# Deep Dive #67 — `commands/seo-audit.md` (THE SKILL)

**File:** [`commands/seo-audit.md`](/root/site-audit/commands/seo-audit.md) (1360 lines)
**Layer:** 12 — workflow (the `/seo-audit` slash-command skill)
**Date:** 2026-04-20

---

## 1. Purpose

The master workflow. Orchestrates 9 phases from "client gave me a website URL" to "multipage HTML report + XLSX + PPTX delivered." Every other file in this audit exists to serve one of these phases.

## 2. Phase map

| Phase | Lines | Purpose |
|---|---|---|
| Step 0 | 17-42 | Gather client info (name, domain, competitors, goal) |
| Step 1 | 43-77 | Project setup — `cp -r template/ clients/<slug>/` + populate client-config.json |
| Step 2 | 78-281 | **Inline Playwright script definitions** — `browse.js`, `crawl-sitemap.js`, `ddg-search.js`, `check-technical.js`, `extract-text.js`. This is the problematic `seo-audit.md:153-212` (finding #5 bug #5) where the skill-inline stub is a 59-line reduction of crawl-sitemap.js. |
| Step 3 | 282-293 | Build keyword list from client goal |
| Step 4 | 294-672 | **Spawn 6 parallel research agents.** Each has an embedded prompt: keyword-researcher, **site-crawler (341-410 — the crawl-data.json OVERWRITE culprit, INDEX addendum)**, content-auditor, competitor-analyzer, best-practices-researcher, backlink-researcher. |
| Step 5 | 673-805 | Monitor agents + run data-gathering scripts (`gather-*.js` 686-747) + populate-audit-data (750-762) + build_audit.py (763-781) + optional rank tracking (782-805). |
| Step 6 | 806-892 | Compile FINAL-AUDIT-REPORT.md |
| Step 7 | 893-1107 | Generate deliverables — meta-tags, schema-markup, community-pages, blog-posts. |
| Step 8 | 1108-1295 | **Generate client deliverables** — XLSX + PPTX + multipage HTML report |
| Step 9 | 1296-1360 | Final delivery + operator checklist |

## 3. Critical bugs surfaced here

| # | Sev | Line | Issue | Ref |
|---|---|---|---|---|
| 1 | **CRITICAL** | 391-397 | **Site-crawler agent writes its own `crawl-data.json` + `link-graph.json`** AFTER `crawl-sitemap.js --analyze` runs (line 355). Overwrites the 40-page rich JSON with a curated 11-page version. This is Matt Wallmow's blog undercount root cause. | INDEX addendum |
| 2 | **H** | 153-212 | **Inline `crawl-sitemap.js` is a 59-line stub** — not the 493-line template. If a client's `scripts/crawl-sitemap.js` ever falls back to this stub (murray-gardner per finding #5), they produce zero research JSONs. | Finding #5 bug #5 |
| 3 | **H** | 692 | `gather-pagespeed.js` invocation — `{COMPETITOR_URLS_SPACE_SEPARATED}`. Finding #7 bug #11: Matt's 5th competitor (northwoodshomefinder) missing from output. This is where the substitution happens. Worth tracing how the orchestrator fills this variable. | Finding #7 bug #11 |
| 4 | **H** | 698 | `gather-domain-metrics.js` passes `{COMPETITOR_DOMAINS_SPACE_SEPARATED}` — same substitution. | Finding #8 §6 |
| 5 | **H** | 704 | `gather-organic-metrics.js` invocation — hardcoded US English via the script defaults (finding #10 bug #1). | Finding #10 bug #1 |
| 6 | **H** | 712 | `gather-backlinks.js --limit 200` — caps backlinks. Template crashes at runtime with Semaphore undefined (finding #9 bug #1). | Finding #9 bug #1 |
| 7 | **H** | 724 | `gather-keyword-volumes.js --from-audit` — enables the in-place audit-data.json mutation (finding #11 bug #1). | Finding #11 bug #1 |
| 8 | **H** | 738 | `gather-local-pack.js --location 2840` — country-level location code, 0 pack hits for Matt. | Finding #12 bug #1 |
| 9 | **H** | 753-754 | `populate-audit-data.js` — brittle heading literals; in-place rewrite. | Finding #15 bug #1 |
| 10 | **H** | — | **`analyze-backlink-quality.js` NOT referenced anywhere in this file.** Orphan. | Finding #14 bug #1 |
| 11 | **H** | — | **No `ppc-audit.md` sibling skill.** parse-google-ads.js + generate-ppc-*.js orphaned. | Findings #16, #19, #20 |
| 12 | **M** | 298-672 | **Agent prompt contents** — the 6 research agents each have embedded prompts authoring ghost fields (`pillars, keyStats, longTermColumns, nextSteps, gradeSummary, mediumTermRoadmap, advantages`). Exact agent responsible for each field needs to be traced. Finding #60 (reporting_intelligence.py) may also produce some. Dual-path authoring risk. | Findings #18, #22, #29 |

## 4. Integration map — this file orchestrates EVERYTHING

All 66 prior deep-dives converge here. This single Markdown file is the architecture document for the entire audit system.

## 5. Fix / improve suggestions (cross-cutting)

1. **Remove the `crawl-data.json` + `link-graph.json` overwrite instruction** from Agent 2 prompt (lines 391-397). Biggest-blast-radius fix. Already in INDEX addendum as crawl-sitemap.js finding #5 addendum.
2. **Replace inline script stubs** with "see `template/scripts/<script>.js`" references for crawl-sitemap.js etc. Finding #5 bug #5. Prevents stub-execution for new clients.
3. **Add `analyze-backlink-quality.js` invocation** in Step 5 after `gather-backlinks.js`. Finding #14.
4. **Create `commands/ppc-audit.md`** sibling skill for PPC workflow. Findings #16, #19, #20.
5. **Document heading conventions** for research agents' MD outputs — so `populate-audit-data.js` can reliably parse. Finding #15 bug #1.
6. **Trace variable substitution** for `{COMPETITOR_URLS_SPACE_SEPARATED}` — debug Matt's missing 5th competitor. Finding #7 bug #11.
7. **Parameterize `--location` per client-config** — close finding #10 + #12 hardcoded-location bugs.
8. **Pass `--location 9030069` (or actual Rhinelander code) for local-pack** instead of country code. Finding #12 #7.1.

## 6. What to verify before we touch this file

- **Trace every script invocation's argument substitution** — which orchestrator layer fills `{CLIENT_SITE}`, `{COMPETITOR_DOMAINS_SPACE_SEPARATED}`, etc. Finding #7 bug #11's missing 5th competitor reveals a real gap.
- **Document which agent authors each ghost field** — the 8+ fields that findings #18, #22, #29 flagged as "no automated producer."
- **Test one audit end-to-end with a fixed skill** (bugs #1, #10, #11 minimally) on a reference client to measure improvement.

---

## FINAL SUMMARY — All 67 Deep-Dives

With this finding, we have complete coverage of:
- 1 shared utility (fetch-with-retry) — #1
- 4 diagnostic scripts — #2-#5 (crawl-sitemap getting an addendum in INDEX)
- 8 API gathering scripts — #6-#13
- 2 analysis-population scripts — #14-#15
- 5 deliverables — #16-#20
- 1 generator (multipage report) — #21
- 9 page renderers — #22-#30
- 9 shared renderers — #31-#39
- 11 Python connectors — #40-#50
- 12 Python analyzers — #51-#62
- 4 Python orchestrators — #63-#66
- 1 workflow skill — #67

**Total: 67 files, ~50k+ lines of code surveyed.**

**Next phase per INDEX.md:** synthesize the cross-cutting patterns into a fix queue with blast-radius × effort scoring.

Ready for the synthesis phase.
