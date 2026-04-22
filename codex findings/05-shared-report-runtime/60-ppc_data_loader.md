# Script Audit: `template/reports/multipage-ppc/shared/data-loader.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/data-loader.js](/root/site-audit/template/reports/multipage-ppc/shared/data-loader.js:1)

## Purpose

`shared/data-loader.js` is the PPC multipage runtime boot loader.

It:

- initializes the `window.TPPC` namespace
- validates that report data exists
- falls back to `shared/debug-data.js` in preview mode
- registers `window.TPPC.boot()`
- coordinates shared runtime init and page init

## Inputs

Runtime dependencies:

- `window.AUDIT_DATA`
- `window.SEARCH_INDEX`
- optional `shared/debug-data.js`
- shared runtime modules:
  - `window.TPPC.nav`
  - `window.TPPC.search`
  - `window.TPPC.print`
  - `window.TPPC.utils`

## Outputs

- `window.TPPC.data`
- `window.TPPC.searchIndex`
- `window.TPPC.boot()`

## How It Works

### 1. Initializes namespace and validates data

If `window.AUDIT_DATA` is missing, it injects `shared/debug-data.js` as a
development fallback.

### 2. Stores shared references

Once data exists, it writes:

- `window.TPPC.data`
- `window.TPPC.searchIndex`

### 3. Defines the runtime boot sequence

`window.TPPC.boot()` initializes:

- nav
- search
- print
- the current page renderer
- collapsibles

### 4. Auto-boots if setup happens after DOM readiness

If debug-data fallback loads late, it auto-calls `window.TPPC.boot()`.

## Strengths

- small and easy to understand
- handles preview fallback cleanly
- keeps page boot sequence centralized

## Weaknesses

### Duplicate of the SEO loader

This is clearly a PPC fork of the SEO shared loader, not a separately designed
runtime.

### No idempotence guard

Unlike the SEO loader variant already documented, this PPC copy does not appear
to guard against repeated boot calls. That increases the chance of duplicated
event listeners or repeated initialization if scripts are loaded oddly.

### Wrong error text

The missing-data error tells the user to run
`generate-multipage-report.js`, which is the SEO generator name, not the PPC
generator.

That is a concrete copy-paste drift issue.

## Failure Modes

- repeated booting can double-bind listeners
- misleading error text can send operators to the wrong build script
- fallback behavior depends on `shared/debug-data.js` existing in a PPC bundle,
  even though the error and comments still reference the SEO build flow

## Improvement Targets

### High priority

- Merge SEO and PPC boot-loader logic into one shared implementation
- Add a `_booted` guard so boot is idempotent
- Fix the missing-data guidance to reference the PPC generator correctly

### Medium priority

- Treat preview fallback and production boot as explicit modes instead of
  loosely mixing both flows in one file

## Bottom Line

`shared/data-loader.js` is a small but important file.

Its main issue is not complexity, but duplication: it is a near-copy of the SEO
loader that has already started to drift in behavior and messaging.
