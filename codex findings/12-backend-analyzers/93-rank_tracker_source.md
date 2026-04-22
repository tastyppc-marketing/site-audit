# Script Audit: `platform/src/audit_platform/analyzers/rank_tracker.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/rank_tracker.py](/root/site-audit/platform/src/audit_platform/analyzers/rank_tracker.py:1)

## Purpose

`rank_tracker.py` provides SERP rank tracking with historical persistence.

Unlike the more report-oriented analyzers, this file behaves like a small state
manager around DataForSEO SERP results. It checks current positions for a set of
keywords, stores date-based history on disk, and reshapes that history for the
report layer.

## Inputs

Primary dependencies:

- `DataForSEOConnector`
- `structlog`
- local JSON file storage

Constructor inputs:

- `connector`
- `history_path`
- `client_domain`

Primary runtime inputs:

- keyword list
- competitor domains
- optional snapshot date
- optional milestone label
- location code
- device

## Outputs

`check_positions(...)` returns:

- `date`
- `label`
- `results`
- `summary`

`get_history_for_report(...)` returns report-ready rank history under a schema
intended for `rankHistory` in the audit payload.

`compare_snapshots(...)` returns per-keyword deltas between two dates.

The class also persists history JSON to the configured `history_path`.

## How It Works

### 1. Normalizes domains up front

The tracker normalizes the client domain once during construction and also
normalizes competitor domains and SERP result domains during comparisons.

That keeps `www.` and URL-format inconsistencies from polluting the history map.

### 2. Uses one SERP call per keyword

For each keyword, `_fetch_positions(...)` requests one SERP and scans the
results for all tracked domains.

That is a good efficiency choice because the API cost scales with keywords, not
with keywords multiplied by domains.

### 3. Persists a nested date history structure

History is stored in the shape:

- `history["keywords"][keyword]["positions"][domain][date] = rank_or_none`

Milestones are stored separately and later reused as chart labels.

### 4. Builds per-check summaries

`_build_check_summary(...)` computes:

- ranking vs not ranking
- top 3 and top 10 counts
- improved vs declined counts
- average position

That makes each check usable immediately without reprocessing the raw results.

### 5. Prepares report-friendly time series

`get_history_for_report(...)` reshapes the raw history into a chart-oriented
payload with:

- ordered snapshots
- milestone labels
- selected competitor domains
- per-keyword historical positions

### 6. Saves atomically

`_save_history(...)` writes to a temporary file and then replaces the real file
with `os.replace(...)`, which is the right basic strategy for avoiding partial
writes.

## Interactions With Other Scripts

This source file sits behind:

- `platform/run_rank_tracker.py`
- tests in `platform/tests/test_rank_tracker.py`
- report consumers that render rank history charts

It is one of the few backend modules in this repo that owns durable local state.

## Strengths

- efficient one-call-per-keyword design
- simple and understandable JSON persistence model
- atomic save behavior is better than naive overwrite logic
- report export format is straightforward for frontend consumers

## Weaknesses

### The class stores placeholders it never populates

`get_history_for_report(...)` returns `volume` and `difficulty` for each
keyword, but this class never writes either value into keyword history.

That means those fields are effectively always absent unless another writer
mutates the same file format.

### "New entry" change semantics are awkward

When a keyword was previously unranked and is now ranking,
`_compute_change(...)` returns:

- `direction: "new"`
- `delta: new_pos`

That does not behave like the rest of the delta logic, where positive values
mean improvement. A new rank at `#3` and a new rank at `#47` are both "new,"
but the delta number is not directly comparable in a meaningful way.

### Competitor history is truncated at report time

`get_history_for_report(...)` includes only the first `max_competitors`
competitor domains, sorted alphabetically.

That keeps the charts manageable, but it also means report output is not a full
reflection of stored history.

### Failure handling on load is quiet

`_load_history(...)` swallows JSON-read failures and falls back to an empty
history structure.

That makes the tracker resilient, but it also means history corruption can go
unnoticed and appear as "no history."

### Temporary files are not cleaned up on failed save

The atomic-write pattern is good, but if `_save_history(...)` fails after
writing the temp file and before replacement, cleanup is not attempted.

That is a small operational issue rather than a product bug, but it is still
worth noting.

## Failure Modes

- corrupted history can silently reset to an empty in-memory structure
- history and report payload can diverge because only a subset of competitors is
  surfaced
- delta semantics for new and lost rankings are hard to compare analytically
- report consumers may assume keyword metadata exists when it does not

## Improvement Targets

### High priority

- decide whether keyword `volume` and `difficulty` belong in this class; either
  populate them or remove them from the report payload
- make change semantics more consistent for `new` and `lost` cases
- log or surface history-read corruption more explicitly

### Medium priority

- make competitor selection for report export configurable by relevance rather
  than alphabetical order
- clean up temp files on failed saves

## Bottom Line

`rank_tracker.py` is a pragmatic, cleaner-than-average backend utility with a
clear job and a sensible persistence model.

It is not as analytically complex as the main SEO analyzers, but it is an
important stateful component in the architecture and a good example of where the
backend is strongest when it stays focused and explicit.
