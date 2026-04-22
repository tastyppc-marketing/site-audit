# Script Audit: `template/reports/multipage/shared/debug-data.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/debug-data.js](/root/site-audit/template/reports/multipage/shared/debug-data.js:1)

## Purpose

`debug-data.js` is supposed to provide a development fallback when the
multipage report is opened without injected audit data.

In the checked-in template, it does not provide mock data.
It explicitly sets:

- `window.AUDIT_DATA = null`

## Inputs

- none

## Outputs

- sets `window.AUDIT_DATA` to `null`

## How It Works

It does not implement real preview logic.
It simply confirms that no fallback payload exists.

## Strengths

- honest in its current state
- avoids pretending mock data is valid production data

## Weaknesses

### Not actually a useful debug fallback

`data-loader.js` treats this file as a possible development recovery path, but
this file guarantees that recovery will fail.

### Misleading architecture signal

The existence of this file implies a local preview mode that does not really
exist in the checked-in template.

## Failure Modes

- developers assume preview mode exists
- data-loader injects this file and still ends in the no-data error state

## Improvement Targets

### High priority

- Either replace this file with a minimal valid mock payload or remove the
  fallback flow from `data-loader.js`

### Medium priority

- Add comments documenting whether preview mode is intentionally disabled

## Bottom Line

`debug-data.js` is currently a stub, not a working tool.
It matters because it makes the runtime look more development-friendly than it
actually is.
