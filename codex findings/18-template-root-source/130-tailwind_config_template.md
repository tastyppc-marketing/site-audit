# Script Audit: `template/tailwind.config.js`

Last updated: 2026-04-18

File: [template/tailwind.config.js](/root/site-audit/template/tailwind.config.js:1)

## Purpose

`tailwind.config.js` defines Tailwind's content scan scope for the template
layer.

It appears to exist as support for the newer multi-page reporting template, not
for the older single-page report.

## Inputs

Primary dependencies:

- Tailwind CSS tooling

Primary runtime context:

- template HTML files
- multipage JS source under `reports/multipage`

## Outputs

This file exports a Tailwind config object with:

- `content`
- `theme.extend`
- `plugins`

## How It Works

The config scans:

- `./reports/multipage/**/*.html`
- `./reports/multipage/pages/**/*.js`
- `./reports/multipage/shared/**/*.js`

and otherwise leaves the Tailwind theme and plugin list empty.

## Strengths

- very simple and easy to understand
- scoped to the multi-page template tree rather than the whole repo

## Weaknesses

### The content globs are narrow

The config does not include:

- `reports/multipage-ppc/**/*.html`
- legacy single-page report files
- root-level template scripts

That may be intentional, but it means Tailwind content discovery is incomplete
if those other template surfaces ever rely on Tailwind classes.

### The config looks underused

`template/package.json` includes Tailwind dependencies, but there is no obvious
build script that uses this config directly.

That suggests the config is either scaffolding for future use or part of a
workflow that is not well surfaced through the package scripts.

### There is no design-system intent encoded here

`theme.extend` and `plugins` are empty, so this file is purely a scan config,
not a meaningful style system definition.

## Failure Modes

- Tailwind can miss classes outside the narrow multipage scan scope
- future maintainers can assume Tailwind is a first-class build step when the
  package scripts do not make that obvious

## Improvement Targets

### Medium priority

- decide whether Tailwind is truly part of the active build workflow
- if so, align the content globs with the full set of template surfaces that use
  Tailwind classes
- if not, document that this is limited scaffolding rather than an active
  styling backbone

## Bottom Line

`tailwind.config.js` is a tiny file, but it reveals some ambiguity in the
template-layer tooling.

Right now it looks more like partial infrastructure for the multipage template
than a fully integrated styling system for the repo as a whole.
