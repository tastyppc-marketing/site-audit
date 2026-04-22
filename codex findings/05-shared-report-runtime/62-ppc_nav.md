# Script Audit: `template/reports/multipage-ppc/shared/nav.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/nav.js](/root/site-audit/template/reports/multipage-ppc/shared/nav.js:1)

## Purpose

`shared/nav.js` renders and controls navigation for the PPC multipage report.

It owns:

- top navigation
- side navigation
- mobile drawer
- scrollspy section highlighting

## Inputs

Runtime dependencies:

- `window.TPPC.currentPage`
- DOM containers:
  - `#top-nav`
  - `#side-nav`
  - `#mobile-drawer`
- optional `window.TPPC.search.openModal`

Hard-coded configuration:

- dashboard
- structure
- quality score
- wasted spend
- search terms
- budget
- action plan

## Outputs

- `window.TPPC.NAV_CONFIG`
- `window.TPPC.nav.init()`

## How It Works

### 1. Defines page and section config inline

Every PPC page and its section anchors are declared in `NAV_CONFIG`.

### 2. Renders the top bar

The top nav includes:

- TastyPPC branding
- page links
- search button
- mobile drawer button

### 3. Renders page-specific side navigation

The side nav uses the current page to decide which section links should appear.

### 4. Adds mobile drawer and scrollspy

It also handles:

- opening / closing the mobile drawer
- section activation using `IntersectionObserver`

## Strengths

- configuration-driven navigation is better than hardcoding links in each HTML
  page
- side-nav section mapping is clear
- mobile and desktop nav are handled together consistently

## Weaknesses

### Duplicated navigation engine

The PPC file is obviously adapted from the SEO nav implementation. The logic is
mostly generic, but it is copied instead of shared.

### Brand and structure are coupled to code

The file hardcodes:

- TastyPPC branding
- logo path
- page set
- section labels

That makes reuse across clients or report families harder.

### DOM contract is strict

This nav depends on exact element IDs and exact anchor IDs on each page. That
is workable, but brittle.

## Failure Modes

- page renames or section ID changes silently break scrollspy or side-nav links
- SEO/PPC nav bugs need to be fixed in two places
- branding or page-order changes require code edits instead of pure config

## Improvement Targets

### High priority

- Split the navigation engine from the page config
- Reuse one shared nav runtime across SEO and PPC
- Move brand metadata and page list into data/config rather than hardcoded JS

### Medium priority

- Add sanity checks that warn when configured sections do not exist in the DOM

## Bottom Line

`shared/nav.js` is functional and fairly clear, but it is another duplicated
runtime engine that should be shared instead of forked.
