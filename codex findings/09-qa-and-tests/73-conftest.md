# Script Audit: `platform/tests/conftest.py`

Last updated: 2026-04-18

File: [platform/tests/conftest.py](/root/site-audit/platform/tests/conftest.py:1)

## Purpose

`conftest.py` provides the shared pytest fixtures for the backend
`audit_platform` test suite.

It centralizes:

- safe `Settings` construction
- mocked OAuth credentials
- mocked service-account credentials
- a patched `httpx.Client` fixture

## Inputs

Runtime dependencies:

- `pytest`
- `unittest.mock`
- `audit_platform.config.Settings`

## Outputs

Shared fixtures:

- `settings`
- `mock_oauth_credentials`
- `mock_service_account_credentials`
- `httpx_mock`

## How It Works

### 1. Creates safe test settings

The `settings` fixture constructs a `Settings` object with:

- `_env_file=None`
- explicit test values for Google, GA4, Search Console, DataForSEO, GBP, and
  logging fields

This prevents accidental real-credential loading during tests.

### 2. Provides mock credential objects

The OAuth and service-account fixtures return `MagicMock` objects that imitate
Google credential instances well enough for most unit tests.

### 3. Patches `httpx.Client`

`httpx_mock` replaces `httpx.Client` with a `MagicMock` instance and gives all
HTTP verbs a default 200-like response object.

That ensures tests do not hit the network unless they explicitly opt out of
this pattern.

## Strengths

- fixture design is clear and safe
- prevents accidental network access
- provides a single place to standardize test environment behavior
- test settings are explicit instead of relying on whatever exists in the shell

## Weaknesses

### HTTP mocking is broad but shallow

The fixture patches `httpx.Client`, but the returned response is a generic
`MagicMock`, not a real `httpx.Response`.

That is convenient, but it can hide interface mismatches that would surface with
real response objects.

### Async HTTP is not covered

This fixture only patches `httpx.Client`. If the codebase uses
`httpx.AsyncClient` anywhere, those paths are not protected by this shared
fixture.

### Transport behavior is not realistic

The fixture is good for unit isolation, but it does not model redirects,
timeouts, status handling, streaming, or response parsing behavior very
faithfully.

## Failure Modes

- tests can pass against `MagicMock` response semantics but fail in production
  with real `httpx.Response` objects
- HTTP code paths using async clients or lower-level transports may escape the
  shared mocking pattern
- broad patching can make it harder to spot which code path actually issued an
  HTTP request

## Improvement Targets

### High priority

- add shared support for `httpx.AsyncClient`
- consider using a more realistic transport-level mock such as `httpx.MockTransport`
  or `respx`
- keep the credential fixtures, but tighten the HTTP fixture so tests are closer
  to real runtime behavior

### Medium priority

- add a "fail if unexpected network method is called" mode for stricter tests

## Bottom Line

`conftest.py` is solid test infrastructure.

Its main risk is realism: it makes backend tests safe and easy to write, but it
can also make HTTP behavior look simpler than it really is.
