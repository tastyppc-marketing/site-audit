# Script Audit: `template/reports/multipage-ppc/shared/utils.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/utils.js](/root/site-audit/template/reports/multipage-ppc/shared/utils.js:1)

## Purpose

`shared/utils.js` provides generic utility helpers for the PPC multipage report.

It includes:

- HTML escaping
- severity / grade / rank CSS helpers
- DOM query shorthands
- collapsible builder
- number / percent formatting
- collapsible event wiring

## Inputs

This file is mostly self-contained. It expects:

- the browser DOM
- CSS class conventions used across the PPC report

## Outputs

- `window.TPPC.utils`
- `window.TPPC.esc`

## How It Works

The file defines a small set of helpers and then publishes them under
`window.TPPC.utils`.

Page renderers consume these helpers heavily as their base API.

## Strengths

- simple and readable
- HTML escaping uses DOM text assignment, which is safer than manual regex
- centralizes several class-mapping helpers used across many pages

## Weaknesses

### Another duplicated utility layer

This is a near-copy of the SEO runtime utilities, but not an identical one.
That matters because the PPC pages depend on these helpers as a stable contract.

### Less capable than the SEO utils layer

The PPC copy does not expose the extra API-error rendering helpers already used
in the SEO report stack. That means the two runtime layers are already diverging
in functionality.

### Global convenience export

It also publishes `window.TPPC.esc`, which is convenient, but broad global
exports make the runtime harder to reason about over time.

## Failure Modes

- utility drift between SEO and PPC can break pages in subtle ways
- CSS helper mappings become stale if class names evolve in one stack but not
  the other
- repeated use of local page fallbacks suggests pages do not fully trust the
  utils contract

## Improvement Targets

### High priority

- Move shared formatting and class helpers into one common report-runtime
  library
- Keep PPC-only helpers separate from generic helpers
- Reduce global exports to the minimum necessary surface

### Medium priority

- Add fixture coverage around `severityClass`, `pillClass`, and `rankClass`
  because those helpers silently control visual semantics

## Bottom Line

`shared/utils.js` is small and serviceable, but it is another copy in a growing
SEO/PPC duplication pattern.

It should be treated as shared runtime infrastructure, not maintained as an
independent fork unless PPC truly needs different semantics.
