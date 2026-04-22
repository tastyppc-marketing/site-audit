# Script Audit: `archive/keyword-research.py`

Last updated: 2026-04-18

File: [archive/keyword-research.py](/root/site-audit/archive/keyword-research.py:1)

## Purpose

Archived Python keyword-research utility that queries DuckDuckGo HTML results
for a hardcoded keyword set and emits structured JSON.

## How It Works

It:

- loops over a fixed keyword list
- shells out to `curl`
- parses HTML with regex
- records result rows and appearances for two hardcoded target domains
- builds a simple competitor frequency summary

## Weaknesses

- hardcoded keywords and targets
- depends on `curl` via subprocess instead of using a native HTTP library
- regex parsing of search HTML is brittle
- effectively replaced by later JS-based and pipeline-based search tooling

## Bottom Line

Historical research script that shows an earlier DDG-based keyword workflow. It
is useful context, but not active architecture.
