#!/bin/bash
# Watch a specific result file as it gets written
# Usage: ./scripts/watch-results.sh <filename>
# Example: ./scripts/watch-results.sh keyword-research.md

FILE="$1"
RESULTS_DIR="/mnt/c/Dev/site audit/results"

if [ -z "$FILE" ]; then
    echo "Usage: $0 <filename>"
    echo "Available: keyword-research.md, client-site-structure.md, content-audit.md, competitor-analysis.md"
    exit 1
fi

FILEPATH="$RESULTS_DIR/$FILE"

BOLD='\033[1m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}Watching: $FILEPATH${NC}"
echo -e "${CYAN}Waiting for file to appear...${NC}"

# Wait for file to exist
while [ ! -f "$FILEPATH" ]; do
    sleep 2
done

echo -e "${CYAN}File found! Streaming content...${NC}"
echo "────────────────────────────────────────────────"

# Tail the file as it grows
tail -f "$FILEPATH"
