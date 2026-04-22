# Script Audit: `template/reports/multipage/pages/backlink-opportunities.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/backlink-opportunities.js](/root/site-audit/template/reports/multipage/pages/backlink-opportunities.js:1)

## Purpose

`pages/backlink-opportunities.js` renders the backlink-opportunities page of the
SEO multipage report.

It is not a small page renderer. At roughly 2,200 lines, it acts as a
mini-application inside the report.

It covers:

- backlink profile summary cards
- backlink inventory grouped by domain
- spam / suspicious referring-domain analysis
- opportunity summary and competitor gap explanation
- top backlink opportunities with overlap and effort tagging
- competitor intelligence comparisons
- detailed filters / matrix views / explainers
- PDF-print preparation hook

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.print`
- `window.TPPC.explainer`
- `Chart.js`
- multiple DOM containers across the backlink page

Primary data dependencies:

- `window.AUDIT_DATA.backlinkOpportunities`
- `window.AUDIT_DATA.backlinks`
- `window.AUDIT_DATA.client`
- API error metadata surfaced through `window.TPPC.utils.getApiErrors(...)`

Important data subsets read locally:

- `_bo.client`
- `_bo.competitors`
- `_bo.opportunities`
- `_bo.clientBacklinks`
- `_bo.spamAnalysis`

## Outputs

- defines `window.TPPC.pages.backlinkOpportunities`
- also registers `window.TPPC.pages['backlink-opportunities']`
- renders every visible section of the backlink-opportunities page
- owns interactive state for filters, matrix selection, expand/collapse rows,
  charts, explainers, and PDF button behavior

## How It Works

### 1. Builds a browser-side data model

The file immediately maps raw audit objects into local structures for:

- `COMPETITORS`
- `CLIENT`
- `MOCK_OPPORTUNITIES`
- `MOCK_BACKLINKS`
- `SPAM_DATA`

That mapping includes field aliasing such as:

- `domainRating` vs `domain_rating`
- `anchorText` vs `anchor_text`
- `firstSeen` vs `first_seen`
- `isDofollow` vs `is_dofollow`

This is another strong example of page-level normalization instead of pure
rendering.

### 2. Recomputes report metrics in-browser

Before rendering, it derives:

- missing domains
- shared domains
- high-priority domains
- local opportunities
- competitor averages and backlink gaps
- backlink groups by referring domain
- spam lookup tables

Those numbers drive the narrative copy and card values shown to the user.

### 3. Renders multiple large sections itself

The file contains bespoke renderers for the full page experience, including:

- insight / explainer sections
- backlink inventory and expansion rows
- referring-domain spam analysis
- opportunity summary
- top-opportunity table
- intelligence charts and comparisons
- detailed filtered views

This means almost the entire page contract lives in one monolith instead of a
set of smaller modules.

### 4. Handles missing-data logic inline

If backlink opportunity data is missing, `init()` checks API error state and
connector availability, then renders a no-data explanation listing the missing
connector sources.

That is useful for operators, but it also means operational troubleshooting is
embedded directly into the page renderer.

## Strengths

- much more informative than a simple table-based backlink report
- provides useful operator-facing missing-data messaging
- backlink inventory grouping by referring domain is a sensible UX choice
- top-opportunity overlap visualization is easy to understand
- spam-analysis section gives users context beyond raw backlink counts

## Weaknesses

### Massive monolith

At around 2,189 lines, this is one of the largest report-side files in the
repo. It mixes:

- data shaping
- narrative copy
- filter state
- chart setup
- DOM event wiring
- section rendering
- PDF behavior

That makes changes risky and review difficult.

### Heavy string-concatenation UI

Large portions of the page are built from hand-written HTML strings with inline
styles. That makes visual tweaks, reuse, and testing harder than they need to
be.

### Page layer is still doing schema repair

The file aliases multiple field names and reconstructs higher-level structures
from raw arrays. That means upstream contract drift is being absorbed late in
the browser.

### Namespace / product drift

This is an SEO backlink page, but it still runs inside the `window.TPPC`
namespace. That confirms the shared runtime branding mismatch already seen in
other report files.

## Failure Modes

### Data-shape drift produces visually valid but semantically weak output

Because the page accepts multiple aliases and computes narrative metrics locally,
it can still "work" when upstream data is inconsistent. That hides contract
breakage.

### Small UI edits carry high regression risk

Any change in one section can accidentally affect:

- filter state
- chart rendering
- explainer registration
- PDF behavior
- no-data behavior

because the logic is tightly packed into one file.

### Hard to test meaningfully

This file wants component-level tests, but its current structure pushes toward
manual browser verification.

## Improvement Targets

### High priority

- Split the file into section modules:
  - profile
  - spam analysis
  - opportunities
  - intelligence
  - details / matrix
- Move all contract repair upstream into the generator or analyzer layer
- Replace large inline-style HTML builders with shared UI helpers or templates

### Medium priority

- Separate operator troubleshooting UI from end-user narrative rendering
- Reduce dependence on global mutable page state
- Add page-level fixture-driven tests for common data shapes:
  - complete data
  - missing connector data
  - backlink-only partial data

## Bottom Line

`pages/backlink-opportunities.js` is powerful and useful, but it is far too
large and far too responsible for one browser file.

It is currently a renderer, a normalizer, a troubleshooting surface, and an
interaction controller all at once. If this page needs fixes, it should be
broken apart before the next major round of changes.
