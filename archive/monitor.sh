#!/bin/bash
# SEO Audit Agent Monitor - watches task progress and result files
RESULTS_DIR="/mnt/c/Dev/site audit/results"
TASKS_DIR="/home/mjfos/.claude/tasks/seo-audit"
TEAM_CONFIG="/home/mjfos/.claude/teams/seo-audit/config.json"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

while true; do
    clear
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║       SEO AUDIT TEAM - AGENT MONITOR            ║${NC}"
    echo -e "${BOLD}${CYAN}║   Client: livingparkcityutah.com                ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""

    # Show task status
    echo -e "${BOLD}📋 TASK STATUS:${NC}"
    echo -e "────────────────────────────────────────────────────"
    for f in "$TASKS_DIR"/*.json; do
        if [ -f "$f" ]; then
            id=$(basename "$f" .json)
            subject=$(python3 -c "import json; d=json.load(open('$f')); print(d.get('subject','?'))" 2>/dev/null)
            status=$(python3 -c "import json; d=json.load(open('$f')); print(d.get('status','?'))" 2>/dev/null)
            owner=$(python3 -c "import json; d=json.load(open('$f')); print(d.get('owner','unassigned'))" 2>/dev/null)

            case "$status" in
                "completed") icon="✅"; color=$GREEN ;;
                "in_progress") icon="🔄"; color=$YELLOW ;;
                "pending") icon="⏳"; color=$BLUE ;;
                *) icon="❓"; color=$NC ;;
            esac

            # Truncate subject to fit
            short_subject=$(echo "$subject" | cut -c1-45)
            printf "  ${color}${icon} #%-2s %-45s [%-11s] %s${NC}\n" "$id" "$short_subject" "$status" "$owner"
        fi
    done

    echo ""
    echo -e "${BOLD}📁 RESULT FILES:${NC}"
    echo -e "────────────────────────────────────────────────────"
    for f in "$RESULTS_DIR"/*.md; do
        if [ -f "$f" ]; then
            fname=$(basename "$f")
            size=$(du -h "$f" 2>/dev/null | cut -f1)
            lines=$(wc -l < "$f" 2>/dev/null)
            mod=$(stat -c %Y "$f" 2>/dev/null)
            now=$(date +%s)
            ago=$(( (now - mod) ))
            if [ $ago -lt 60 ]; then
                age="${ago}s ago"
            elif [ $ago -lt 3600 ]; then
                age="$(( ago / 60 ))m ago"
            else
                age="$(( ago / 3600 ))h ago"
            fi
            echo -e "  ${GREEN}📄 ${fname}${NC} (${size}, ${lines} lines, updated ${age})"
        fi
    done
    if ! ls "$RESULTS_DIR"/*.md &>/dev/null; then
        echo -e "  ${RED}No result files yet...${NC}"
    fi

    echo ""
    echo -e "${BOLD}👥 TEAM MEMBERS:${NC}"
    echo -e "────────────────────────────────────────────────────"
    if [ -f "$TEAM_CONFIG" ]; then
        python3 -c "
import json
d = json.load(open('$TEAM_CONFIG'))
colors = {'blue': '\033[0;34m', 'green': '\033[0;32m', 'yellow': '\033[1;33m', 'red': '\033[0;31m'}
nc = '\033[0m'
for m in d.get('members', []):
    c = colors.get(m.get('color',''), '')
    name = m.get('name','?')
    atype = m.get('agentType','?')
    backend = m.get('backendType','')
    print(f'  {c}🤖 {name:<20} [{atype}] {backend}{nc}')
" 2>/dev/null
    fi

    echo ""
    echo -e "${CYAN}Refreshing every 10s... (Ctrl+C to exit)${NC}"
    sleep 10
done
