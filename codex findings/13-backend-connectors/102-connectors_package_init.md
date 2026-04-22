# Script Audit: `platform/src/audit_platform/connectors/__init__.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/__init__.py](/root/site-audit/platform/src/audit_platform/connectors/__init__.py:1)

## Purpose

`connectors/__init__.py` is the public export surface for the backend connector
package.

It defines which API and service connectors are treated as the official package
API for the rest of the platform.

## What It Exposes

The package re-exports:

- `BaseConnector`
- `BrandMentionsConnector`
- `BusinessProfileConnector`
- `CrUXConnector`
- `DataForSEOConnector`
- `GA4Connector`
- `GoogleAdsConnector`
- `LocalSEOConnector`
- `PageSpeedConnector`
- `SearchConsoleConnector`
- `SocialAuditConnector`

## Architectural Role

This file is thin, but it matters because it is the boundary between:

- low-level connector implementations
- analyzers
- runners and platform entrypoints

It defines the "official" connector set the backend expects downstream code to
import.

## Strengths

- explicit public surface
- easy package-level imports for the rest of the backend
- consistent with the analyzer package pattern

## Weaknesses

### It exposes a broad connector set without documenting contract guarantees

The file makes the package easy to import, but it says nothing about:

- sync versus async behavior
- model versus dict return types
- pagination behavior
- retry / rate-limit expectations

That matters because connector inconsistency is exactly where bad pulled data can
start.

## Improvement Targets

### High priority

- document connector return-shape and reliability expectations at the package
  level
- keep export membership aligned with the connectors actually used in the
  current platform pipeline

## Bottom Line

`connectors/__init__.py` is a small control point, not a logic-heavy file.

Its importance is architectural: it defines the connector API surface, and that
surface currently hides a fair amount of behavioral inconsistency underneath it.
