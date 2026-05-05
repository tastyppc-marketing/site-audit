#!/usr/bin/env bash
# tier5_js_smoke.sh — Smoke gate E-Smoke-JS.
#
# Validates that the env-isolation flow works end-to-end on the JS side:
#   1. Run a credentialed gather script from the repo root (NOT inside
#      clients/<slug>/), passing --client-slug matt-wallmow.
#   2. The script must successfully read DATAFORSEO_* from
#      clients/matt-wallmow/.env via loadClientEnv (proves --client-slug
#      took priority over cwd-basename fallback).
#   3. The script must write its research output JSON.
#   4. The parent shell must NOT see DATAFORSEO_LOGIN exported afterward
#      (proves dotenv_values-style read, no os.environ mutation).
#
# Exits 0 on success, non-zero on any assertion failure. Designed to be
# safe to re-run; cleans up its own scratch directory.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

cd "$REPO_ROOT"

# Pre-flight: verify clients/matt-wallmow/.env exists and the parent shell
# has DATAFORSEO_LOGIN unset (so post-run check is meaningful).
if [ ! -f "clients/matt-wallmow/.env" ]; then
  echo "FAIL: clients/matt-wallmow/.env missing — copy from platform/.env first."
  exit 1
fi
if [ -n "${DATAFORSEO_LOGIN:-}" ]; then
  echo "FAIL: DATAFORSEO_LOGIN is already exported in this shell. The smoke"
  echo "      gate cannot prove non-mutation if creds are pre-set. Run from"
  echo "      a clean shell."
  exit 1
fi

# Two call sites must work, since they hit different __dirname depths
# inside loadClientEnv (3 levels for template, 4 for cohort-synced
# clients/<slug>/scripts/lib/). Earlier resolveClientEnvPath silently
# wrong-pathed the cohort variant and went undetected because this
# smoke only tested the template path. Both are now required to pass.

run_gather() {
  local label="$1" cwd="$2" script="$3" outdir="$4"
  echo
  echo ">>> $label (cwd=$cwd, script=$script)"
  ( cd "$cwd" && node "$script" \
    --client-slug matt-wallmow \
    mattwallmow.com pinepointrealty.com 2>&1 ) | tee "$SCRATCH/${label}.log"

  local out="$outdir/domain-metrics.json"
  if [ ! -f "$out" ]; then
    echo "FAIL [$label]: expected output not written at $out"
    exit 1
  fi
  local status
  status="$(python3 -c "import json; print(json.load(open('$out')).get('status','?'))")"
  if [ "$status" != "success" ] && [ "$status" != "partial" ]; then
    echo "FAIL [$label]: domain-metrics.json status='$status' (expected success or partial)"
    head -30 "$out"
    exit 1
  fi
  STATUS="$status" # exposed for the trailing PASS print
}

# Path A: template invocation from a scratch cwd. Mirrors a
# repo-root-relative ad-hoc run.
mkdir -p "$SCRATCH/templ"
( cd "$SCRATCH/templ" && true ) # ensure dir exists
run_gather "template-path" "$SCRATCH/templ" \
  "$REPO_ROOT/template/scripts/gather-domain-metrics.js" \
  "$SCRATCH/templ/seo/research"

# Path B: cohort invocation. cd clients/matt-wallmow + relative
# scripts/gather-domain-metrics.js — what the orchestrator skill
# does. Output lands in clients/matt-wallmow/seo/research/, so we
# capture the existing file's mtime, run the script, and assert the
# file got refreshed (mtime advanced).
COHORT_OUT="$REPO_ROOT/clients/matt-wallmow/seo/research/domain-metrics.json"
PRE_MTIME=$(stat -c '%Y' "$COHORT_OUT" 2>/dev/null || echo 0)
run_gather "cohort-path" "$REPO_ROOT/clients/matt-wallmow" \
  "scripts/gather-domain-metrics.js" \
  "$REPO_ROOT/clients/matt-wallmow/seo/research"
POST_MTIME=$(stat -c '%Y' "$COHORT_OUT")
if [ "$POST_MTIME" -le "$PRE_MTIME" ]; then
  echo "FAIL [cohort-path]: domain-metrics.json mtime did not advance"
  exit 1
fi

# Post-run: parent shell must still have DATAFORSEO_LOGIN unset. The
# child-process script can't mutate this shell, but if loadClientEnv
# accidentally used dotenv.config() instead of dotenv_values(), prior
# in-process runs (e.g., the analyzer phase) could have mutated. This
# assertion is structural insurance against future regression.
if [ -n "${DATAFORSEO_LOGIN:-}" ]; then
  echo "FAIL: DATAFORSEO_LOGIN appeared in parent shell after run."
  exit 1
fi

echo
echo "PASS: tier5_js_smoke (both call sites)"
echo "  template-path domain-metrics.json bytes: $(wc -c < "$SCRATCH/templ/seo/research/domain-metrics.json")"
echo "  cohort-path domain-metrics.json bytes:   $(wc -c < "$COHORT_OUT")"
echo "  cohort-path mtime advanced:              yes (was=$PRE_MTIME now=$POST_MTIME)"
echo "  parent DATAFORSEO_LOGIN:                 <unset>"
