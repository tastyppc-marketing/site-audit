# Script Audit: `platform/tests/test_technical_seo.py`

Last updated: 2026-04-18

File: [platform/tests/test_technical_seo.py](/root/site-audit/platform/tests/test_technical_seo.py:1)

## Purpose

`test_technical_seo.py` is the major backend test suite for
`TechnicalSeoAnalyzer`.

It covers both the original technical audit features and a later P7 expansion.

Major coverage areas include:

- meta tag auditing
- template detection
- image-alt auditing
- URL structure analysis
- schema summary
- canonical auditing
- redirect-chain analysis
- security headers
- indexability
- mobile usability
- structured-data validation
- sitemap validation

## Inputs

Test dependencies:

- `pytest`
- `TechnicalSeoAnalyzer`

Primary synthetic fixtures:

- `sample_pages`
- `p7_pages`

Those fixtures model crawl/page records with increasingly rich fields such as:

- titles and descriptions
- canonical values
- image counts
- redirect chains
- robots directives
- response headers
- schema payloads
- sitemap URLs

## Outputs

No runtime artifacts. The file asserts analyzer behavior across a very broad
surface area.

## How It Works

### 1. Uses one fixture for early technical-audit behaviors

`sample_pages` drives coverage for:

- meta tags
- title/description duplication
- template detection
- image coverage
- URL structure
- high-level schema summary

### 2. Uses a richer P7 fixture for later technical audits

`p7_pages` introduces fields needed for:

- canonical/header mismatch logic
- redirect-chain and loop detection
- security-header analysis
- indexability rules
- mobile viewport checks
- structured-data validation

### 3. Exercises analyzer subroutines directly

Rather than only testing `analyze(...)`, the suite calls many specialized
methods such as:

- `audit_meta_tags`
- `detect_templates`
- `audit_images`
- `audit_url_structure`
- `audit_canonicals`
- `audit_redirect_chains`
- `audit_security_headers`
- `audit_indexability`
- `audit_mobile_usability`
- `validate_structured_data`
- `audit_sitemap`

## Strengths

- one of the broadest and most detailed analyzer test files in the repo
- fixtures are concrete and intentionally designed to trigger specific issues
- covers both high-level output keys and lower-level sub-audits
- does a good job of proving technical-audit rule semantics

## Weaknesses

### Very large, multi-concern file

This suite is effectively several test modules living in one file. It is
organized with sections, but it still covers a huge number of distinct
technical-audit domains at once.

### Highly implementation-shaped fixtures

The fixtures are useful, but they are clearly handcrafted to fit the analyzer’s
current field names and assumptions. That can make the tests less resilient to
contract changes.

### Limited scale / performance coverage

The suite validates rule behavior well, but not how the analyzer behaves on very
large crawls or messy semi-realistic page datasets.

## Failure Modes

- fixture changes can ripple across many unrelated technical-audit assertions
- a refactor of page-record shape can break large portions of the suite at once
- analyzer behavior on big real crawls may differ from these compact handcrafted
  examples

## Improvement Targets

### High priority

- keep the breadth, but consider splitting this into smaller test modules by
  audit family
- add a few larger mixed-fixture cases that resemble real crawl output more
  closely
- use this suite as the reference contract for upstream page-record shape

### Medium priority

- add more assertions around summary schemas consumed downstream by reporting
- add regression fixtures for the specific technical data inconsistencies showing
  up in current audits

## Bottom Line

`test_technical_seo.py` is one of the most valuable test files in the backend.

It demonstrates that `TechnicalSeoAnalyzer` is intended to do a lot of the real
technical interpretation upstream. That makes it an important reference point
when deciding which data problems should be fixed in analyzers versus report
renderers.
