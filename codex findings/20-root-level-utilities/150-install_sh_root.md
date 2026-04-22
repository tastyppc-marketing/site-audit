# Script Audit: `install.sh`

Last updated: 2026-04-18

File: [install.sh](/root/site-audit/install.sh:1)

## Purpose

Cross-stack bootstrap script for the repo.

It checks prerequisites, installs template dependencies, installs Playwright,
installs the Python platform package, creates `platform/.env`, and verifies key
files.

## How It Works

The script runs five stages:

1. prerequisite checks
2. `npm install` under `template/`
3. Playwright Chromium install
4. editable Python install under `platform/`
5. file/workflow verification

## Strengths

- covers both Node and Python setup
- useful for onboarding
- `--check` mode is practical

## Weaknesses

### The generated `.env` template has drift from the real settings schema

`install.sh` writes `GOOGLE_CSE_CX` into `platform/.env`, but
`platform/src/audit_platform/config/settings.py` does not define that field.

That is a concrete config-contract mismatch.

### Python version is not really enforced

The comments and messages say Python 3.11+, but the script only checks that
`python3` exists.

### Installation is global-environment oriented

The script uses `pip3 install -e .` directly and does not create or manage a
virtual environment.

### Some install checks are coarse

Checking whether `template/node_modules` exists is not the same as verifying the
correct dependency state.

## Bottom Line

`install.sh` is useful, but it needs tighter alignment with the actual config
schema and a clearer environment-management story.
