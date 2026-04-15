# Codex QA Report: audit-data.json Integrity

Date: 2026-04-15
Target: `clients/matt-wallmow/seo/audit-data.json`

## Result

Raw `audit-data.json` is valid JSON and all 33 expected top-level keys are present. However, the file does **not** fully pass integrity review as a standalone source payload. Several sections still rely on generator-time backfills, and there are concrete stale-data and completeness defects that should be fixed in the source JSON.

## Passes

- JSON is valid.
- All 33 expected top-level keys are present.
- Client identity is now bound correctly to Matt Wallmow / Wallmow Realty in the `client` object.
- The South Florida issue is now explicitly present in `topIssues`.
- Competitor comparison rows include six named competitor columns in `competitorComparison`.

## Findings

### 1. Critical: top-level `competitor` object still contains placeholder domains from template data

File references:
- `clients/matt-wallmow/seo/audit-data.json:15`
- `clients/matt-wallmow/seo/audit-data.json:20`
- `clients/matt-wallmow/seo/audit-data.json:24`
- `clients/matt-wallmow/seo/audit-data.json:28`
- `clients/matt-wallmow/seo/audit-data.json:32`

Problem:
- `competitor.primary` is still `competitor1.com`.
- `competitor.all` still lists `competitor1.com` through `competitor4.com`.

Why this matters:
- This is direct stale/template data from a non-client-specific scaffold.
- It conflicts with the real competitor set used elsewhere in the same file and in research.

Cross-reference:
- `clients/matt-wallmow/seo/research/competitor-analysis.md:15`
- `clients/matt-wallmow/seo/research/competitor-analysis.md:305`

Expected competitors from research:
- `redmanrealtygroup.com`
- `eliasonrealty.com`
- `pinepointrealty.com`
- `northwoodshomefinder.com`
- `shorewest.com`
- `skagenteam.firstweber.com`

### 2. High: competitor coverage is inconsistent across sections

File references:
- `clients/matt-wallmow/seo/audit-data.json:355`
- `clients/matt-wallmow/seo/audit-data.json:360`
- `clients/matt-wallmow/seo/audit-data.json:1193`
- `clients/matt-wallmow/seo/audit-data.json:1233`
- `clients/matt-wallmow/seo/audit-data.json:2096`
- `clients/matt-wallmow/seo/research/competitor-analysis.md:15`

Problem:
- `competitorComparison` contains six competitors including `skagenteam.firstweber.com`.
- `competitorAnalysis.discoveredCompetitors` contains only five domains.
- `domainMetrics.competitors` contains only five domains.
- `siteComparison.competitor` also summarizes only five competitors.

Why this matters:
- The source data is internally inconsistent about whether the Skagen Team is part of the competitive set.
- Report sections can diverge depending on which path a renderer reads.

Assessment:
- This looks like a partial backfill, not a rendering issue.
- Either include Skagen consistently everywhere, or remove it consistently with an explicit note that metrics were unavailable.

### 3. High: `localSeo` in the raw audit JSON does not contain a business profile or Rhinelander coordinates

File references:
- `clients/matt-wallmow/seo/audit-data.json:1688`
- `clients/matt-wallmow/seo/research/local-seo.json:2`
- `clients/matt-wallmow/seo/research/local-seo.json:4`
- `template/reports/multipage/generate-multipage-report.js:1994`

Problem:
- `audit-data.json` currently has only sparse `localSeo` fields such as `reviewSentiment`, `competitorGbp`, `landingPageScores`, and an empty `serviceAreaMap`.
- It does **not** contain `localSeo.businessProfile`, `napConsistency`, `citations`, `competitorLocations`, or `searchDemandZones`.
- No latitude/longitude values are present in `audit-data.json`.
- The raw `research/local-seo.json` has address and phone for Rhinelander, but it also does not include coordinates.

Why this matters:
- The QA request explicitly asked to verify correct Rhinelander coordinates; they are missing in the source JSON.
- The report can still render because the generator auto-populates parts of `localSeo` from `research/local-seo.json`, but the source payload itself is incomplete.

Assessment:
- This is a real data completeness gap, not a false alarm.
- Current status should be recorded as: Rhinelander business identity present in research, but no coordinates available in `audit-data.json` to validate map centering from source data alone.

### 4. Medium: multiple top-level sections are present but not populated with real source data

File references:
- `clients/matt-wallmow/seo/audit-data.json:828`
- `clients/matt-wallmow/seo/audit-data.json:840`

Problem:
- `contentQuality` is an empty object.
- `backlinks.topBacklinks` is an empty array.
- Additional derived sections are effectively empty in raw JSON even though research files exist:
  - `technicalSeo.coreWebVitals`
  - `technicalSeo.lighthouseResults`
  - `technicalSeo.pageSpeedComparison`
  - `technicalSeo.pageAudits`

Why this matters:
- These sections are restored later by `generate-multipage-report.js`, but the raw `audit-data.json` does not satisfy a strict “all 33 keys have real data” standard on its own.
- This is acceptable for report generation, but not for a pure source-integrity pass.

Assessment:
- Non-blocking for the generated HTML report.
- Blocking only if `audit-data.json` is supposed to be treated as a complete standalone artifact.

### 5. Medium: `siteComparison` contains contradictory and degraded values

File references:
- `clients/matt-wallmow/seo/audit-data.json:112`
- `clients/matt-wallmow/seo/audit-data.json:118`
- `clients/matt-wallmow/seo/research/competitor-analysis.md:22`

Problem:
- `siteComparison` says the client schema status is `Likely (WordPress + IDX)`.
- Elsewhere in the audit, the site is flagged as having zero schema sitewide.
- The `Meta Title Format` competitor value is truncated/degraded compared with the research markdown source.

Why this matters:
- These rows look like lossy markdown-to-JSON transcription.
- They can misstate the actual audit conclusion if reused in other outputs.

Assessment:
- This is not template bleed from another client, but it is source-quality drift and should be normalized.

## Conclusion

Integrity check status: **Fail as raw source JSON, pass as generated-report input**.

Summary:
- `audit-data.json` is syntactically valid and structurally complete.
- The most important remaining source-data defect is the stale placeholder `competitor` object.
- The next biggest issue is missing local business profile/coordinate data in the raw JSON.
- Several sections still depend on generator-time enrichment rather than containing real data directly.

## Recommended fixes

1. Replace the top-level `competitor` object with the real six-domain competitor set from `competitor-analysis.md`.
2. Make competitor coverage consistent across `competitor`, `siteComparison`, `competitorAnalysis`, and `domainMetrics`.
3. Populate `localSeo.businessProfile`, `napConsistency`, and `citations` directly into `audit-data.json`.
4. Add validated Rhinelander latitude/longitude to `localSeo.businessProfile`, or explicitly note that coordinates are unavailable.
5. Normalize `siteComparison` rows so schema status and title-format strings match the actual audit findings.
