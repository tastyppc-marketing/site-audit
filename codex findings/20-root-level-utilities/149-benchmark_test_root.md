# Script Audit: `benchmark_test.py`

Last updated: 2026-04-18

File: [benchmark_test.py](/root/site-audit/benchmark_test.py:1)

## Purpose

Standalone scenario benchmark for `ContentQualityAnalyzer`.

It validates behavior across:

- high-quality long-form content
- thin pages
- keyword stuffing
- duplicate detection
- structure scoring
- readability formulas
- audit-mode limitations
- cannibalization detection

## How It Works

The script inserts `platform/src` onto `sys.path`, creates synthetic test data,
runs the analyzer, prints expectations, and exits non-zero on failure.

## Weaknesses

- not integrated into pytest even though it functions like a test suite
- imports some models that are not meaningfully used in the script
- uses large inline fixtures instead of reusable fixture files

## Bottom Line

Strong manual validation script, but architecturally it lives in an in-between
state: richer than a quick probe, yet outside the formal test harness.
