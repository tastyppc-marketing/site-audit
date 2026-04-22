# Script Audit: `benchmark_analyzer.py`

Last updated: 2026-04-18

File: [benchmark_analyzer.py](/root/site-audit/benchmark_analyzer.py:1)

## Purpose

Standalone scenario benchmark for `InternalLinkAnalyzer`.

It exercises the analyzer against:

- realistic site structures
- orphan detection
- hub identification
- disconnected components
- thin internal linking
- summary-stat accuracy
- circular links

## How It Works

The file defines a series of `test_*` functions, prints expected vs actual
values, and exits non-zero if any scenario fails.

## Weaknesses

- despite `test_*` naming, this is not integrated into pytest
- assertions are mostly manual pass/fail checks with printed output
- assumes `audit_platform` is importable in the current environment

## Bottom Line

Useful manual validation harness for analyzer development, but not part of the
formal automated test suite.
