# Script Audit: `template/reports/multipage/shared/nav.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/nav.js](/root/site-audit/template/reports/multipage/shared/nav.js:1)

## Purpose

`nav.js` owns the multipage report navigation system.

It defines the full page map, renders:

- top navigation
- side navigation
- mobile drawer
- section scrollspy behavior

## Inputs

Runtime dependencies:

- `window.location`
- page containers such as `#top-nav`, `#side-nav`, and `#mobile-drawer`
- the existence of report section IDs listed in the nav config
- optional `window.TPPC.search`

## Outputs

- defines `window.TPPC.NAV_CONFIG`
- defines `window.TPPC.currentPage`
- renders navigation UI into the DOM
- binds drawer and scrollspy behavior

## How It Works

### 1. Defines a full hard-coded navigation map

The file embeds the report's full page list and section hierarchy directly in
code.

### 2. Detects the current page from the URL

It derives the active page from the current filename.

### 3. Renders desktop and mobile navigation

It generates:

- top page links
- current-page side navigation
- a mobile drawer menu

### 4. Tracks active sections with scrollspy

Using `IntersectionObserver` plus a throttled scroll listener, it highlights
the section link nearest the top of the viewport.

## Strengths

- centralizes navigation structure in one obvious place
- the hard-coded config is easy to inspect
- scrollspy behavior is pragmatic and understandable

## Weaknesses

### Strong brand and domain coupling

The nav hard-codes:

- TastyPPC branding
- a specific page architecture
- report sections that blend SEO and PPC naming history

This makes reuse and template evolution harder.

### Hard-coded information architecture

Any page or section changes require manual code edits here.
There is no generated navigation manifest.

### Another example of namespace mismatch

The file is clearly used in a broader report system than just PPC, but still
brands the namespace and UI around `TPPC`.

### Asset assumptions

The logo path and page filenames are assumed to exist in specific locations.

## Failure Modes

- page templates drift from `NAV_CONFIG`
- missing section IDs break scrollspy highlighting
- branding assets missing
- new pages added elsewhere but forgotten here

## Improvement Targets

### High priority

- Decide whether nav structure should be generated from report metadata instead
  of hard-coded
- Remove brand-specific assumptions from the shared runtime if this template is
  meant to serve multiple clients or report types
- Validate page and section IDs during report generation

### Medium priority

- Move SVG icons and nav metadata into a dedicated manifest file
- Add diagnostics when a configured section cannot be found on a page

### Low priority

- Improve accessibility around drawer state and active navigation announcements

## Bottom Line

`nav.js` works, but it is a strong example of architectural hard-coding in the
browser layer.
It is not just a nav helper.
It is an embedded information architecture and branding definition.
