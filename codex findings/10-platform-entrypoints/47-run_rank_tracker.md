# Script Audit: `platform/scripts/run_rank_tracker.py`

Last updated: 2026-04-18

File: [platform/scripts/run_rank_tracker.py](/root/site-audit/platform/scripts/run_rank_tracker.py:1)

## Purpose

`run_rank_tracker.py` is a Python CLI for SERP rank tracking with history
support.

It supports three primary modes:

- check mode with live API calls
- compare mode between two stored snapshots
- inject mode into `audit-data.json`

## Inputs

### CLI inputs

- `--domain`
- optional `--competitors`
- optional `--keywords-file`
- optional `--keywords`
- required `--history`
- optional `--label`
- optional `--location`
- optional `--device`
- optional `--compare`
- optional `--inject`

### Runtime dependencies

- `audit_platform.analyzers.rank_tracker.RankTracker`
- `DataForSEOConnector` for live check mode
- configured DataForSEO credentials for live mode

## Outputs

- prints comparison summaries or rank-check summaries to stdout
- stores or reads historical rank snapshots
- optionally injects `rankHistory` into `audit-data.json`

## How It Works

### 1. Resolves the operating mode

It switches behavior based on:

- `--compare`
- `--inject`
- otherwise defaulting to live rank-check mode

### 2. Loads keywords

Keywords can come from:

- a JSON file using `targetKeywords`
- comma-separated CLI input

### 3. Uses history-aware rank tracking

In live mode it queries rankings, stores history, and prints summary output.

### 4. Supports offline compare/inject behavior

For compare and inject modes, it bypasses live connector setup and works
directly from the saved history file.

## Strengths

- clear multi-mode operational tool
- useful separation between live tracking and offline history/report usage
- practical ability to inject report-ready rank history

## Weaknesses

### `__new__` shortcut for offline modes

In compare and inject modes, the script instantiates `RankTracker` using
`RankTracker.__new__(RankTracker)` and then manually sets internals.

That works, but it is a brittle shortcut around the class constructor and
suggests the underlying class is not designed cleanly for offline utility use.

### Mixed responsibilities

This one script handles:

- API-driven rank checks
- history comparison
- report injection

Those are closely related, but still distinct concerns.

### Output and history contracts are implicit

The script assumes the shape of:

- `targetKeywords`
- history snapshots
- report `rankHistory`

without central visible schema enforcement here.

## Failure Modes

- history file shape drifting from what compare/inject mode expects
- `__new__`-based offline initialization breaking if `RankTracker` internals
  change
- keywords missing or inconsistent across different invocation styles

## Improvement Targets

### High priority

- Add first-class offline constructors or helper functions instead of using
  `__new__`
- Separate report injection from rank-check orchestration if the script keeps
  growing
- Document the history file schema and injected `rankHistory` contract

### Medium priority

- Add dry-run output for inject mode
- Emit more structured output for automation and CI

## Bottom Line

`run_rank_tracker.py` is a useful operational tool with a strong feature set.
Its main architectural smell is the manual `__new__` construction path, which
indicates the class and CLI responsibilities have grown together a bit too
tightly.
