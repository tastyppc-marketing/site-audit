# Changelog

All notable changes to this project will be documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-05-24

First cut. Nine experiments, a runner CLI, a test suite, a landing page, and CI.

### Added
- Runner CLI (`tinker.py`) with `list`, `run`, `new`, and `test` subcommands.
- Experiments:
  - `sparkline` — unicode sparkline from numbers
  - `conway` — Game of Life animated in the terminal
  - `palette` — 5-color HLS ramp from a hex seed
  - `dice` — `NdM±K` notation with ASCII pip art for d6
  - `markov` — Markov chain text generator with configurable order
  - `maze` — perfect maze via recursive backtracking
  - `huffman` — encode/decode + compression ratio summary
  - `entropy` — Shannon entropy + byte histogram
  - `histogram` — horizontal bar chart from numbers or `label:value` pairs
- Test suite (43 tests, stdlib `unittest`) covering every experiment's pure functions.
- Landing page at `docs/index.html` with a live in-browser sparkline demo.
- GitHub Actions workflow running tests across Python 3.9–3.12.
