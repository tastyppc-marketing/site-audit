# Script Audit: `template/package.json`

Last updated: 2026-04-18

File: [template/package.json](/root/site-audit/template/package.json:1)

## Purpose

Primary Node manifest for the template/reporting layer.

It defines the runnable script surface for:

- data gathering
- spreadsheet/presentation generation
- PPC generation
- legacy single-page reporting
- Playwright setup

## How It Works

The package exposes one-command wrappers over the scripts under `template/`.

## Strengths

- clear entrypoint list for the Node template workflow
- script surface reflects the main template capabilities well

## Weaknesses

### It still exposes both legacy and newer report paths

The manifest includes legacy `report` / `report:pdf` scripts alongside the
newer multipage reporting architecture. That keeps old functionality available,
but it also blurs which path is canonical.

### Tailwind tooling is not fully surfaced

Tailwind dependencies are present, but there is no obvious build script using
`tailwind.config.js`. That makes the styling toolchain story ambiguous.

### There is no obvious test script for the template runtime

The package is oriented around generation commands, not validation.

## Bottom Line

`template/package.json` is a key architecture file because it defines the active
Node command surface. Its main issue is not brokenness, but ambiguity between
legacy and newer template workflows.
