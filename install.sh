#!/usr/bin/env bash
# ============================================================================
#  Site Audit Platform — Installer
#  Run this once after cloning the repo to set up everything.
#
#  Usage:
#    bash install.sh          # Full install
#    bash install.sh --check  # Just verify what's installed
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECK_ONLY=false

if [ "$1" = "--check" ]; then
  CHECK_ONLY=true
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Site Audit Platform — Installer${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# ── 1. Check prerequisites ─────────────────────────────────────────────

MISSING=()

echo -e "${YELLOW}Checking prerequisites...${NC}"

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  echo -e "  ${GREEN}✓${NC} Node.js $NODE_VER"
else
  echo -e "  ${RED}✗${NC} Node.js — not found"
  MISSING+=("Node.js (https://nodejs.org)")
fi

# npm
if command -v npm &>/dev/null; then
  NPM_VER=$(npm -v)
  echo -e "  ${GREEN}✓${NC} npm $NPM_VER"
else
  echo -e "  ${RED}✗${NC} npm — not found"
  MISSING+=("npm")
fi

# Python 3.11+
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version 2>&1)
  echo -e "  ${GREEN}✓${NC} $PY_VER"
else
  echo -e "  ${RED}✗${NC} Python 3 — not found"
  MISSING+=("Python 3.11+ (https://python.org)")
fi

# pip
if command -v pip3 &>/dev/null || python3 -m pip --version &>/dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} pip"
else
  echo -e "  ${RED}✗${NC} pip — not found"
  MISSING+=("pip")
fi

# git
if command -v git &>/dev/null; then
  GIT_VER=$(git --version)
  echo -e "  ${GREEN}✓${NC} $GIT_VER"
else
  echo -e "  ${RED}✗${NC} git — not found"
  MISSING+=("git")
fi

echo ""

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${RED}Missing prerequisites:${NC}"
  for m in "${MISSING[@]}"; do
    echo -e "  ${RED}•${NC} $m"
  done
  echo ""
  echo "Install the missing tools above, then re-run this script."
  exit 1
fi

if [ "$CHECK_ONLY" = true ]; then
  echo -e "${YELLOW}Checking installed components...${NC}"
fi

# ── 2. Install Node.js dependencies ────────────────────────────────────

echo -e "${YELLOW}[1/5] Node.js dependencies...${NC}"

if [ -d "$SCRIPT_DIR/template/node_modules" ]; then
  echo -e "  ${GREEN}✓${NC} template/node_modules exists"
else
  if [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${RED}✗${NC} template/node_modules missing — run without --check to install"
  else
    cd "$SCRIPT_DIR/template"
    npm install --no-audit --no-fund 2>&1 | tail -3
    echo -e "  ${GREEN}✓${NC} npm install complete"
  fi
fi

# ── 3. Install Playwright browser ──────────────────────────────────────

echo -e "${YELLOW}[2/5] Playwright browser...${NC}"

if npx playwright install --help &>/dev/null 2>&1; then
  CHROMIUM_CHECK=$(npx playwright install --dry-run chromium 2>&1 || true)
  if echo "$CHROMIUM_CHECK" | grep -qi "already installed\|up to date\|browsers look"; then
    echo -e "  ${GREEN}✓${NC} Playwright Chromium installed"
  else
    if [ "$CHECK_ONLY" = true ]; then
      echo -e "  ${YELLOW}?${NC} Playwright Chromium may need install — run without --check"
    else
      cd "$SCRIPT_DIR/template"
      npx playwright install chromium 2>&1 | tail -3
      echo -e "  ${GREEN}✓${NC} Playwright Chromium installed"
    fi
  fi
else
  echo -e "  ${YELLOW}?${NC} Playwright not available — will install with npm deps"
fi

# ── 4. Install Python platform ─────────────────────────────────────────

echo -e "${YELLOW}[3/5] Python platform...${NC}"

if python3 -c "import audit_platform" &>/dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} audit_platform Python package installed"
else
  if [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${RED}✗${NC} audit_platform not installed — run without --check to install"
  else
    cd "$SCRIPT_DIR/platform"
    pip3 install -e . 2>&1 | tail -3
    echo -e "  ${GREEN}✓${NC} audit_platform installed (editable mode)"
  fi
fi

# ── 5. Set up environment file ─────────────────────────────────────────

echo -e "${YELLOW}[4/5] Environment file...${NC}"

ENV_FILE="$SCRIPT_DIR/platform/.env"
ENV_TEMPLATE="$SCRIPT_DIR/platform/.env.template"

if [ -f "$ENV_FILE" ]; then
  echo -e "  ${GREEN}✓${NC} platform/.env exists"

  # Check for required keys
  REQUIRED_KEYS=("DATAFORSEO_LOGIN" "DATAFORSEO_PASSWORD" "PAGESPEED_API_KEY")
  for key in "${REQUIRED_KEYS[@]}"; do
    if grep -q "^${key}=.\+" "$ENV_FILE" 2>/dev/null; then
      echo -e "    ${GREEN}✓${NC} $key is set"
    else
      echo -e "    ${YELLOW}!${NC} $key is empty or missing"
    fi
  done
else
  if [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${RED}✗${NC} platform/.env missing — run without --check to create template"
  else
    cat > "$ENV_FILE" << 'ENVEOF'
# ═══════════════════════════════════════════════════════
#  Site Audit Platform — Environment Variables
#  Fill in your API credentials below
# ═══════════════════════════════════════════════════════

# DataForSEO (REQUIRED — backlinks, keywords, SERP, organic metrics)
# Sign up: https://app.dataforseo.com
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Google PageSpeed Insights (FREE — 25K/day with key)
# Get key: https://console.cloud.google.com/apis/credentials
PAGESPEED_API_KEY=
CRUX_API_KEY=

# Google Custom Search Engine (FREE — 100/day)
# Create: https://programmablesearchengine.google.com/controlpanel/all
GOOGLE_CSE_CX=

# Google OAuth (for GA4 + Search Console + Ads — optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# Google Ads (optional — for PPC audits)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CUSTOMER_ID=

# Google Analytics 4 (optional — per-client override in client-config.json)
GA4_PROPERTY_ID=

# Google Search Console (optional — per-client override in client-config.json)
SEARCH_CONSOLE_SITE_URL=

# Google Business Profile (optional — per-client override in client-config.json)
GBP_ACCOUNT_ID=
GBP_LOCATION_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=

# General
LOG_LEVEL=INFO
HTTP_TIMEOUT=30
ENVEOF
    echo -e "  ${GREEN}✓${NC} platform/.env created — fill in your API credentials"
  fi
fi

# ── 6. Verify everything works ─────────────────────────────────────────

echo -e "${YELLOW}[5/5] Verification...${NC}"

# Check template scripts exist
SCRIPTS=(
  "gather-pagespeed.js"
  "gather-domain-metrics.js"
  "gather-backlinks.js"
  "gather-keyword-volumes.js"
  "gather-organic-metrics.js"
  "gather-local-pack.js"
  "gather-local-seo.js"
  "extract-text.js"
  "populate-audit-data.js"
)

ALL_SCRIPTS_OK=true
for s in "${SCRIPTS[@]}"; do
  if [ -f "$SCRIPT_DIR/template/scripts/$s" ]; then
    echo -e "  ${GREEN}✓${NC} template/scripts/$s"
  else
    echo -e "  ${RED}✗${NC} template/scripts/$s — MISSING"
    ALL_SCRIPTS_OK=false
  fi
done

# Check report generator
if [ -f "$SCRIPT_DIR/template/reports/multipage/generate-multipage-report.js" ]; then
  echo -e "  ${GREEN}✓${NC} Report generator"
else
  echo -e "  ${RED}✗${NC} Report generator — MISSING"
fi

# Check Python scripts
PY_SCRIPTS=("build_audit.py" "run_backlink_analysis.py" "run_rank_tracker.py")
for s in "${PY_SCRIPTS[@]}"; do
  if [ -f "$SCRIPT_DIR/platform/scripts/$s" ]; then
    echo -e "  ${GREEN}✓${NC} platform/scripts/$s"
  else
    echo -e "  ${RED}✗${NC} platform/scripts/$s — MISSING"
  fi
done

# Check workflow
if [ -f "$SCRIPT_DIR/commands/seo-audit.md" ]; then
  echo -e "  ${GREEN}✓${NC} /seo-audit workflow"
else
  echo -e "  ${RED}✗${NC} /seo-audit workflow — MISSING"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ "$CHECK_ONLY" = true ]; then
  echo -e "${BLUE}  Check complete. Run without --check to install.${NC}"
else
  echo -e "${GREEN}  Installation complete!${NC}"
  echo ""
  echo -e "  ${YELLOW}Next steps:${NC}"
  echo "  1. Fill in API credentials in platform/.env"
  echo "  2. Run /seo-audit in Claude Code to start an audit"
  echo ""
  echo -e "  ${YELLOW}API costs per audit:${NC} ~\$0.75 (DataForSEO)"
  echo -e "  ${YELLOW}Docs:${NC} docs/SEO-AUDIT-SYSTEM.md"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
