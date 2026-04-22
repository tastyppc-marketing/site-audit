# Script Audit: `platform/scripts/test_pagespeed.py`

Last updated: 2026-04-18

File: [platform/scripts/test_pagespeed.py](/root/site-audit/platform/scripts/test_pagespeed.py:1)

## Purpose

`test_pagespeed.py` is a standalone connector test script for PageSpeed
Insights.

It can run either:

- a single strategy analysis
- a combined Core Web Vitals check

and prints both raw JSON and a compact human-readable summary.

## Inputs

### CLI inputs

- required `--url`
- optional `--strategy`
- optional `--cwv`
- optional `--log-level`

### Runtime dependencies

- `PageSpeedConnector`
- platform settings

## Outputs

- prints JSON results
- prints a concise metrics summary
- exits non-zero on failure

## Strengths

- clear and operator-friendly
- useful split between raw output and compact summary
- handles datetime serialization cleanly

## Weaknesses

### Live-API-only validation

Like other connector test scripts, it proves connector functionality against a
live service, not a stable mock or fixture.

### Mostly manual inspection

The script is useful for humans, but not structured as a reusable automated
test harness beyond exit status.

## Bottom Line

`test_pagespeed.py` is a good operator check for the PageSpeed connector. It is
best viewed as a manual verification tool, not a full regression test.
