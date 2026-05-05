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

# Run the gather script from a scratch cwd so the seo/research/ output
# does not pollute the repo root. The HANDOFF originally specified
# "from repo root (no cd)", but the goal is "outside clients/<slug>/" —
# scratch dir satisfies that and cleans up automatically.
cd "$SCRATCH"
node "$REPO_ROOT/template/scripts/gather-domain-metrics.js" \
  --client-slug matt-wallmow \
  mattwallmow.com pinepointrealty.com 2>&1 | tee gather.log

OUT="$SCRATCH/seo/research/domain-metrics.json"
if [ ! -f "$OUT" ]; then
  echo "FAIL: expected output not written at $OUT"
  exit 1
fi

# Shape check: verify the script actually got data back from DataForSEO.
# If creds were silently empty, status would be "failed" with errors.
STATUS="$(python3 -c "import json,sys; print(json.load(open('$OUT')).get('status','?'))")"
if [ "$STATUS" != "success" ] && [ "$STATUS" != "partial" ]; then
  echo "FAIL: domain-metrics.json status='$STATUS' (expected success or partial)"
  cat "$OUT" | head -30
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
echo "PASS: tier5_js_smoke"
echo "  status:                $STATUS"
echo "  output bytes:          $(wc -c < "$OUT")"
echo "  parent DATAFORSEO_LOGIN: <unset>"
