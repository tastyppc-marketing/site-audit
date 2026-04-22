# Script Audit: `template/scripts/browse.js`

Last updated: 2026-04-17

File: [template/scripts/browse.js](/root/site-audit/template/scripts/browse.js:1)

## Purpose

`browse.js` is the general-purpose Playwright inspection utility in the repo.
It is not a batch pipeline script. It is a single-URL operator tool used to:

- open a page
- optionally take a screenshot
- extract metadata
- extract headings
- extract links
- extract body text

This is the manual inspection layer the agents and operators can use when they
need a quick read on one page without running the full crawl pipeline.

## Inputs

### CLI inputs

- positional `url`
- `--screenshot <filename>`
- `--full-page`
- `--extract-links`
- `--extract-text`
- `--extract-meta`
- `--extract-headings`
- `--headed`
- `--wait <ms>`

### Runtime dependencies

- Playwright Chromium
- reachable target page

## Outputs

This script does not write structured JSON research files by default.

It writes to:

- stdout
- optional screenshot file path if `--screenshot` is used

That means it is primarily an inspection and debugging tool, not a pipeline
contract producer.

## How It Works

### 1. Opens one page

It launches Chromium, creates a browser context with a desktop browser user
agent and fixed viewport, then navigates to the target URL.

### 2. Waits for page settle

It uses:

- `waitUntil: 'networkidle'`
- then an explicit `waitForTimeout(flags.wait)`

That gives the operator a basic way to handle pages with lazy content.

### 3. Emits only requested data

Depending on flags, it prints:

- metadata block
- heading list
- internal/external links
- stripped body text preview

It only performs the requested extractions, which keeps it practical as an
interactive utility.

## What Other Scripts Depend On

No other checked-in script directly imports or consumes `browse.js`.

Its role is operational rather than programmatic:

- agent workflows
- manual inspections
- ad hoc validation
- one-off content checks

## Strengths

- simple and fast to use
- multiple extraction modes behind one utility
- useful for agent-driven research steps
- screenshot support makes it useful outside pure SEO checks

## Weaknesses

### No structured output mode

Everything is printed to stdout. That makes the script easy to use manually but
hard to plug into automated downstream processing.

### Internal link classification is naive

It treats a link as internal if `a.href.includes(window.location.hostname)`,
which can misclassify some URLs and is looser than hostname equality.

### Text extraction is broad

It removes `script`, `style`, and `noscript`, but not broader boilerplate like
navigation, footer, sidebar, or cookie banners.

### Error handling is shallow

Errors print one message and the script exits after browser close. There is no
machine-readable error mode.

## Failure Modes

- Playwright missing
- page timeout or navigation failure
- misleading text extraction on heavily dynamic or boilerplate-heavy pages
- link classification edge cases

## Improvement Targets

### High priority

- Add a `--json` mode so results can be consumed by other scripts or agents
- Tighten internal/external link classification

### Medium priority

- Add optional boilerplate stripping presets for content extraction
- Add section-targeted extraction instead of whole-page only

### Low priority

- Add output schemas for each extraction mode

## Bottom Line

`browse.js` is a useful operator-facing utility, not a true pipeline producer.
Its main limitation is that it stops at human-readable stdout. If this repo
wants a stronger scripted research layer, `browse.js` should eventually grow a
structured output mode.
