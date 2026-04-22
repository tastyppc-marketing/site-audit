# Script Audit: `platform/src/audit_platform/auth/__init__.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/auth/__init__.py](/root/site-audit/platform/src/audit_platform/auth/__init__.py:1)

## Purpose

`auth/__init__.py` is the public export surface for the backend auth helpers.

It re-exports the two credential-construction helpers so callers can import from
`audit_platform.auth` instead of from the individual files.

## Inputs

Primary dependencies:

- `oauth.py`
- `service_account.py`

## Outputs

This file exports:

- `get_oauth_credentials`
- `get_service_account_credentials`

## Strengths

- simple public auth surface
- makes the common credential helpers easy to import

## Weaknesses

### The public surface is incomplete

`oauth.py` also defines `run_oauth_consent_flow(...)`, but this package file does
not export it.

That is not necessarily wrong, but it does mean the public package surface does
not fully reflect the actual auth helper set.

## Bottom Line

`auth/__init__.py` is simple and fine. Its only real architectural note is that
the exported surface is narrower than the underlying module capabilities.
