# Script Audit: `platform/src/audit_platform/auth/service_account.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/auth/service_account.py](/root/site-audit/platform/src/audit_platform/auth/service_account.py:1)

## Purpose

`service_account.py` provides the backend helper for Google service-account
credentials.

This is primarily used by the GA4 connector when a service-account JSON file is
configured.

## Inputs

Primary dependencies:

- `google.oauth2.service_account`
- JSON key path
- optional scopes

## Outputs

This file returns `service_account.Credentials` instances from
`get_service_account_credentials(...)`.

## Strengths

- very small and clear
- keeps service-account creation separate from OAuth logic
- default scopes align with the read-only Google products this repo uses for
  service-account access

## Weaknesses

### Validation is delegated entirely downstream

The helper does not validate file existence, path correctness, or access scope
compatibility before calling the Google library.

### The helper is intentionally narrow

There is no support here for more advanced patterns like delegation or
impersonation. That is fine for current usage, but it limits future extension.

## Bottom Line

`service_account.py` is straightforward and low risk. It is one of the cleaner
support files in the repo.
