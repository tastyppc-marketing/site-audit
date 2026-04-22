# Script Audit: `platform/src/audit_platform/analyzers/eeat_signals.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/eeat_signals.py](/root/site-audit/platform/src/audit_platform/analyzers/eeat_signals.py:1)

## Purpose

`eeat_signals.py` attempts to translate Google's quality-rater concepts into
backend audit signals.

It scores site trust, per-page expertise cues, YMYL exposure, and a weighted
E-E-A-T summary that can be surfaced in the report layer.

## Inputs

Primary dependencies:

- `structlog`
- crawl-page dictionaries
- optional `site_html`

Primary runtime inputs:

- page URL, title, description, headings
- schema types and schema data
- internal / external link counts
- image and word-count metadata

## Outputs

The main `analyze(...)` method returns:

- `summary`
- `siteTrust`
- `pageSignals`
- `eeatScore`
- `issues`

## How It Works

### 1. Builds site-level trust signals

The analyzer derives trust signals such as:

- About page
- Contact page
- Privacy policy
- Terms
- secure connection
- organization-related schema

### 2. Scores per-page E-E-A-T signals

For each page it estimates:

- YMYL status
- author attribution
- publication-date presence
- expertise schema
- effort score
- expertise score

### 3. Computes a weighted composite

`_compute_eeat_score(...)` weights:

- trust
- expertise
- authority
- experience

and then converts that into a grade.

### 4. Produces issue-level guidance

`_generate_issues(...)` surfaces sitewide problems such as:

- missing About / Contact / Privacy pages
- low author attribution
- YMYL pages with low expertise signals
- high amounts of low-effort content

## Interactions With Other Scripts

This module depends on crawl output quality and schema extraction quality.
Downstream, it can influence:

- report summaries
- trust / authority sections
- reporting-intelligence synthesis

## Strengths

- clear attempt to operationalize an otherwise fuzzy concept
- explicit weighting model
- useful YMYL-sensitive issue generation
- page-level and site-level analysis are separated cleanly

## Weaknesses

### `site_html` is accepted but not used

The public API takes `site_html`, and the module defines `TRUST_SIGNALS`
regexes for HTML checks, but `_analyze_site_trust(...)` never uses them.

That means the function contract promises a richer input path than the
implementation actually provides.

### Several declared signals are effectively dead

The module defines:

- `TRUST_SIGNALS`
- `AUTHOR_PATTERNS`
- `DATE_PATTERNS`

but the active implementation does not use those regex patterns.

It also includes `hasPhysicalAddress` and `hasPhoneNumber` in the site-trust
map, yet nothing sets them to `True`.

So parts of the trust model are present in concept only.

### Author and date detection are narrower than advertised

`_has_author_signal(...)` and `_has_date_signal(...)` rely on structured fields
and extracted schema data, not the HTML regex paths the file appears designed to
support.

That makes the analyzer highly dependent on upstream extraction instead of
performing the detection work itself.

### Report payload truncates page-level detail

`analyze(...)` returns only the first 50 `pageSignals`.

That is fine for rendering, but it means the module is doing a full-page pass
and then immediately collapsing detail. Callers need to know the report payload
is not the full analysis set.

## Failure Modes

- trust score is understated because some defined trust signals can never become
  true
- HTML-only trust / author / date evidence is ignored if upstream extraction did
  not already normalize it
- E-E-A-T output can look more rigorous than it really is because several
  conceptual signals are not wired up

## Improvement Targets

### High priority

- either use `site_html` and the declared regex signals or remove them from the
  contract
- implement real physical-address and phone detection if those fields remain in
  the trust model
- use HTML pattern fallbacks for author and date detection when structured data
  is absent

### Medium priority

- make it explicit when the returned page list is truncated for report
  consumption
- tighten the mapping between declared guidelines references and actual runtime
  checks

## Bottom Line

`eeat_signals.py` has a reasonable structure and a useful goal, but it is only
partially wired through.

The important takeaway is that this file's current output is more heuristic and
more extraction-dependent than the docstring initially suggests.
