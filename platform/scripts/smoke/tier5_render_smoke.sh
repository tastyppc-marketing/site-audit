#!/usr/bin/env bash
# tier5_render_smoke.sh — Smoke gate E-Smoke-Render.
#
# Renders the multipage report for matt-wallmow into a scratch directory
# and verifies the bundle structure. This is local-only — no network or
# credential dependency — and is meant to catch regressions in the
# normalizer/template chain that would otherwise only surface after
# regenerating a real client report.
#
# Validations:
#   1. Generator exits 0.
#   2. All 9 expected HTML pages exist (index, technical, content,
#      keywords, competitors, links, local, action-plan,
#      backlink-opportunities).
#   3. Each page has a closing </html> tag (well-formed enough).
#   4. With --inline, no <link rel="stylesheet" href="...shared/..."> or
#      <script src="...shared/..."> remains in any page.
#
# Exits 0 on success, non-zero otherwise. Cleans up scratch on exit.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

cd "$REPO_ROOT"

DATA="clients/matt-wallmow/seo/audit-data.json"
if [ ! -f "$DATA" ]; then
  echo "FAIL: $DATA missing — re-run build_audit.py for matt-wallmow first."
  exit 1
fi

OUT="$SCRATCH/report"
node template/reports/multipage/generate-multipage-report.js \
  --data "$DATA" \
  --output "$OUT" \
  --inline 2>&1 | tee "$SCRATCH/render.log"

EXPECTED_PAGES=(
  index.html
  technical.html
  content.html
  keywords.html
  competitors.html
  links.html
  local.html
  action-plan.html
  backlink-opportunities.html
)

for page in "${EXPECTED_PAGES[@]}"; do
  if [ ! -f "$OUT/$page" ]; then
    echo "FAIL: $OUT/$page missing"
    exit 1
  fi
  if ! grep -q '</html>' "$OUT/$page"; then
    echo "FAIL: $page has no </html> close tag"
    exit 1
  fi
done

# --inline guarantee: shared/ resources must be inlined, not linked.
LEAKS="$(grep -lE '(href|src)="[^"]*shared/' "$OUT"/*.html 2>/dev/null || true)"
if [ -n "$LEAKS" ]; then
  echo "FAIL: --inline did not inline shared/ assets in:"
  echo "$LEAKS"
  exit 1
fi

echo
echo "PASS: tier5_render_smoke"
echo "  pages rendered:     ${#EXPECTED_PAGES[@]}"
echo "  output dir size:    $(du -sh "$OUT" | cut -f1)"
echo "  inline assets:      no shared/ leaks"
