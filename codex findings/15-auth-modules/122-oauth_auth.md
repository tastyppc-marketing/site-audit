# Script Audit: `platform/src/audit_platform/auth/oauth.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/auth/oauth.py](/root/site-audit/platform/src/audit_platform/auth/oauth.py:1)

## Purpose

`oauth.py` provides the backend's OAuth credential helpers for Google APIs.

It has two jobs:

- build refresh-token-backed credentials for connector usage
- run an installed-app consent flow for local token acquisition

## Inputs

Primary dependencies:

- `google.oauth2.credentials.Credentials`
- `google_auth_oauthlib.flow.InstalledAppFlow`
- client ID / client secret / refresh token inputs
- optional scopes

## Outputs

This file returns Google credential objects from:

- `get_oauth_credentials(...)`
- `run_oauth_consent_flow(...)`

## How It Works

### 1. Defines a shared default-scope bundle

`DEFAULT_SCOPES` includes scopes for:

- Google Ads
- GA4
- Search Console
- Business Profile

### 2. Builds refresh-token-backed credentials

`get_oauth_credentials(...)` creates a `Credentials` object directly from the
stored OAuth client and refresh token values.

### 3. Supports a local browser-based consent flow

`run_oauth_consent_flow(...)` starts an installed-app OAuth flow on a local
port and returns the resulting credentials.

## Strengths

- small and easy to reason about
- clearly separates credential construction from consent-flow acquisition
- works well as a shared helper for multiple Google connectors

## Weaknesses

### The default scope bundle is broad

If callers do not pass explicit scopes, they receive a multi-product union of
scopes. That is convenient, but it is not least-privilege by default.

### The consent-flow helper is not the canonical path in practice

`run_oauth_consent_flow(...)` exists here, but `scripts/generate_oauth_token.py`
duplicates the consent-flow logic instead of reusing this helper.

That creates unnecessary drift risk between the library helper and the script.

### Validation is minimal

The helper assumes the provided client ID, client secret, and refresh token are
well-formed. That is reasonable for a low-level helper, but it means most
credential validation happens later at connector call time.

## Failure Modes

- callers can request broader Google access than they actually need
- consent-flow behavior can drift between this helper and the standalone script
- invalid token configuration surfaces only when downstream API calls are made

## Improvement Targets

### Medium priority

- decide whether the default scope strategy should favor convenience or
  least-privilege behavior
- either reuse `run_oauth_consent_flow(...)` from the script or remove the
  duplicate path

## Bottom Line

`oauth.py` is a useful shared helper, but it shows a broader repo pattern:
clean primitives exist, yet not all of them are being used consistently by the
rest of the system.
