# Script Audit: `template/reports/multipage/ARCHITECTURE.md`

Last updated: 2026-04-17

File: [template/reports/multipage/ARCHITECTURE.md](/root/site-audit/template/reports/multipage/ARCHITECTURE.md:1)

## Purpose

`ARCHITECTURE.md` is the design document for the multipage SEO audit report
system.

It explains the intended file structure, boot sequence, shared runtime, search
layer, navigation, and page breakdown for the browser-delivered report.

This is not executable code, but it is a key architecture artifact because it
defines intended system behavior.

## What It Documents Well

- the eight-page report model
- shared runtime file responsibilities
- build-time data injection strategy
- the expected global namespace and boot pattern
- the page-level information architecture

## What It Reveals

### The system was designed as a modular static app

The intended architecture is:

- build-time injected data
- no fetch dependency on `file://`
- shared browser runtime
- per-page renderers

That aligns with what the actual codebase is doing.

### The runtime still carries TastyPPC branding

The architecture doc itself frames the SEO report system under TastyPPC naming,
which matches the namespace and UI branding drift seen in the shared runtime.

### The documented system is cleaner than the repo reality

The doc presents a coherent multipage report architecture, but the repo also
contains:

- a separate single-file HTML report generator
- client-specific copies and forks of the multipage generator
- parallel SEO and PPC export scripts

So the document describes one major subsystem well, but not the full reporting
architecture now present in the repo.

## Gaps Between Doc And Reality

### Debug fallback is described more optimistically than implemented

The doc describes a real `shared/debug-data.js` preview path.
The checked-in fallback is effectively null.

### Search matching claims are stronger than the implementation

The document references fuzzy matching, but the current search runtime uses
simple substring matching.

### Canonical path ambiguity is not addressed

The doc explains the multipage system, but not whether it is the canonical
report path versus the single-file HTML generator.

## Why This Matters

This document is useful as the "intended architecture" reference point while
auditing runtime problems.
When code behavior diverges from this document, the mismatch is often a strong
signal of:

- scope drift
- partial implementation
- architecture duplication

## Improvement Targets

### High priority

- Update this doc so it reflects the actual repo-level report architecture, not
  just the idealized multipage subsystem
- Note the existence of the single-file HTML generator and PPC report path
- Correct claims that no longer match implementation, especially preview and
  search behavior

### Medium priority

- Add a "canonical vs legacy paths" section
- Add data-contract documentation for `AUDIT_DATA`, `SEARCH_INDEX`, and
  `apiErrors`

## Bottom Line

`ARCHITECTURE.md` is useful and mostly coherent for the multipage subsystem.
Its value is highest when treated as the intended design, not the current whole
system truth.
