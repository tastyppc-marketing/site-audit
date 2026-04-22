# Script Audit: `platform/scripts/generate_oauth_token.py`

Last updated: 2026-04-18

File: [platform/scripts/generate_oauth_token.py](/root/site-audit/platform/scripts/generate_oauth_token.py:1)

## Purpose

`generate_oauth_token.py` is a helper script for bootstrapping Google OAuth
credentials for the Python audit platform.

It runs a local OAuth consent flow and prints the resulting refresh token and
client credentials for use in `.env`.

## Inputs

### CLI inputs

- required `--client-secrets-file`
- optional `--scopes`
- optional `--port`

### Runtime dependencies

- a valid Google OAuth client secrets file
- `google-auth-oauthlib`
- browser access for the user completing consent

## Outputs

- prints the refresh token, client ID, and client secret to stdout
- exits non-zero if the flow fails or no refresh token is returned

## How It Works

### 1. Validates the secrets file

It checks the client-secrets path before importing the heavier OAuth library.

### 2. Chooses scopes

By default it requests the broad set of scopes needed by multiple platform
connectors.

### 3. Runs a local-server OAuth flow

It uses `InstalledAppFlow.run_local_server()` and opens the browser for consent.

### 4. Prints usable environment values

If a refresh token is returned, it prints copy-pasteable `.env` values.

## Strengths

- practical bootstrap utility for a multi-Google-connector platform
- clear default scope set
- imports heavy dependencies lazily for fast CLI help and better failure
  messages

## Weaknesses

### Prints secrets directly to stdout

That is practical, but it means shell history, logs, or terminal capture can
expose sensitive credentials if this script is used carelessly.

### Broad default scope bundle

The default scope set is convenient for the platform, but broader than
necessary for single-connector usage.

### Tightly tied to manual operator workflow

This is necessarily interactive, but that also makes credential bootstrap more
manual and less reproducible.

## Failure Modes

- missing or malformed client secrets
- no refresh token returned because prior consent already exists
- local redirect port conflicts
- secrets being mishandled after printing

## Improvement Targets

### High priority

- Document credential-handling precautions clearly
- Consider an option to write directly to a local `.env` fragment file instead
  of only printing secrets
- Support narrower preset scope bundles for specific connector families

### Medium priority

- Add a post-consent summary explaining which connectors the chosen scopes
  enable

## Bottom Line

`generate_oauth_token.py` is a practical operator bootstrap script.
Its main tradeoff is that convenience comes with sensitive secret handling, so
the process should be documented and used carefully.
