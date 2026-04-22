# Script Audit: `platform/tests/test_rank_tracker.py`

Last updated: 2026-04-18

File: [platform/tests/test_rank_tracker.py](/root/site-audit/platform/tests/test_rank_tracker.py:1)

## Purpose

`test_rank_tracker.py` validates the `RankTracker` analyzer / utility that
tracks keyword ranking history over time.

The suite covers:

- position checks
- null vs zero semantics
- summary computation
- milestone storage
- history persistence
- change detection
- snapshot comparison
- report export
- domain normalization
- API failure handling

## Inputs

Test dependencies:

- `pytest`
- `tmp_path`
- `MagicMock`
- `RankTracker`

Primary synthetic dependency:

- `mock_connector.get_serp(...)`

## Outputs

No runtime artifacts beyond temp history files created during tests.

## How It Works

### 1. Creates a tracker with temp-backed history

The main fixture instantiates `RankTracker` with:

- a mocked connector
- a temporary `rank-history.json`
- a target client domain

### 2. Tests SERP-position extraction

The file checks that `check_positions()`:

- finds client positions
- finds competitor positions
- returns `None` when a domain is missing
- stores `None`, not `0`, for missing positions

### 3. Tests persistence and milestone behavior

The suite verifies:

- history is written to disk
- prior history is loaded on init
- labeled milestones are stored once
- duplicate milestones are avoided

### 4. Tests rank-change semantics

It covers four important states:

- improved
- declined
- new
- lost

### 5. Tests report-shaping methods

The file checks:

- snapshot comparison
- `get_history_for_report()`
- chart label generation
- domain normalization

## Strengths

- good persistence coverage, not just pure in-memory behavior
- explicit null-handling tests are valuable because ranking data often confuses
  "not found" with `0`
- change-direction coverage is practical and well chosen
- ties directly into the rank-history/reporting features used elsewhere in the
  repo

## Weaknesses

### History corruption and malformed files are not stressed

The suite tests normal history loading, but not:

- corrupt JSON
- partially missing keys
- mixed schema versions

### Mostly single-shape SERP mocks

The mocked SERP results are simple and stable. They do not explore tougher
cases like:

- duplicate domain appearances
- non-organic clutter
- canonical / subdomain ambiguity

### White-box normalization checks are light

Domain normalization is tested, but only with a few very basic cases.

## Failure Modes

- rank history can still break on malformed persisted files
- edge-case SERP layouts may produce incorrect position tracking while these
  tests still pass
- report export can remain structurally valid while being semantically wrong for
  mixed-history situations

## Improvement Targets

### High priority

- add malformed / legacy history-file fixtures
- add more SERP edge cases:
  - repeated domains
  - subdomains
  - mixed organic/local result noise
- keep the null-vs-zero assertions, because those are especially important

### Medium priority

- add more direct assertions around the report payload consumed by the report
  layer

## Bottom Line

`test_rank_tracker.py` is a solid, practical suite.

It gives good confidence in the mechanics of historical rank tracking, but it
still needs harsher persistence and SERP-shape scenarios if this subsystem is
going to be relied on heavily.
