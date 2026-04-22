# Script Audit: `platform/src/audit_platform/utils/__init__.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/utils/__init__.py](/root/site-audit/platform/src/audit_platform/utils/__init__.py:1)

## Purpose

`utils/__init__.py` is the public export surface for the backend utility layer.

It re-exports:

- `setup_logging`
- `retry`

## Strengths

- simple package-level convenience surface

## Weaknesses

### The exported retry helper is not the retry path most connectors use

The backend has a retry utility here, but `BaseConnector` imports Tenacity
directly instead of using `audit_platform.utils.retry.retry`.

That makes the package surface look more central than it really is.

## Bottom Line

`utils/__init__.py` is fine as a package shim, but it also exposes an
architectural inconsistency: the shared utility surface is not consistently used
by the layers that would benefit from it most.
