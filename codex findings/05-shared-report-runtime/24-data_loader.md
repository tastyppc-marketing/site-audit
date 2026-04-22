# Script Audit: `template/reports/multipage/shared/data-loader.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/data-loader.js](/root/site-audit/template/reports/multipage/shared/data-loader.js:1)

## Purpose

`data-loader.js` is the browser-side bootstrap and orchestration layer for the
multipage report runtime.

It initializes the global namespace, verifies that report data exists, exposes
the shared boot function, and coordinates startup of shared UI modules and the
current page renderer.

This is one of the most important client-side runtime files in the repo.

## Inputs

Runtime dependencies:

- `window.AUDIT_DATA`
- `window.SEARCH_INDEX`
- `window.TPPC.currentPage`
- `window.TPPC.utils`
- shared modules such as `nav`, `search`, `print`, `explainer`, `pagination`
- page-specific modules inside `window.TPPC.pages`

## Outputs

- initializes `window.TPPC`
- stores `window.TPPC.data`
- defines `window.TPPC.boot()`
- optionally injects `shared/debug-data.js`
- replaces the document body with an error state if no data is available

## How It Works

### 1. Initializes the global namespace

It ensures:

- `window.TPPC`
- `window.TPPC.pages`

exist.

### 2. Validates the presence of report data

If `window.AUDIT_DATA` is missing, it attempts to load:

- `shared/debug-data.js`

and only proceeds if that script provides usable data.

### 3. Stores shared runtime state

It copies the active payload into:

- `window.TPPC.data`
- `window.TPPC.searchIndex`

### 4. Defines the one-time boot orchestrator

`window.TPPC.boot()` initializes shared modules first, then the current page
renderer, then post-render helpers such as collapsibles, responsive tables, and
pagination.

### 5. Auto-boots when loaded late

If setup runs after DOM readiness, it schedules a delayed boot automatically.

## Strengths

- cleanly centralizes browser-side startup order
- prevents repeated boot execution with an internal guard
- provides a single namespace for shared runtime features
- makes page modules pluggable through `window.TPPC.pages`

## Weaknesses

### Namespace branding drift

The runtime namespace is `TPPC`, even though this same report stack appears to
be used across SEO multipage reports too.
That naming mismatch makes the architecture harder to reason about.

### Debug fallback is not a real preview system

It tries to load `shared/debug-data.js`, but the checked-in fallback is
effectively empty.
So the preview path exists structurally, but not meaningfully.

### Hard coupling to global state

The loader depends entirely on globals and script order instead of module
imports or explicit dependency injection.

### Error state replaces the entire body

That is simple, but it can make debugging partial runtime failures harder
because it discards the existing DOM.

## Failure Modes

- `window.AUDIT_DATA` missing and debug fallback still null
- `currentPage` not set, so no page-specific renderer runs
- shared modules load in the wrong order and boot partially succeeds
- renderer exceptions are logged but not surfaced in a stronger UI-visible way

## Improvement Targets

### High priority

- Rename or generalize the runtime namespace if this stack is not PPC-only
- Replace the null debug fallback with a real minimal preview dataset
- Add a runtime diagnostics panel showing loaded modules and active page

### Medium priority

- Make boot dependency ordering more explicit
- Surface renderer failures in the visible UI, not only `console.error`

### Low priority

- Add structured runtime events for debugging and QA

## Bottom Line

`data-loader.js` is the browser orchestration hub for the multipage report
system.
It is conceptually sound, but it also reveals several architectural tensions:
global-state coupling, namespace drift, and a debug pathway that exists in name
more than in practice.
