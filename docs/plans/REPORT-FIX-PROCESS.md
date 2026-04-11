# Report Fix Process — Living Document

Date: 2026-04-09
Source: `docs/ERRORS-TO-FIX.md`

---

## Governing Principles

1. **Systematic debugging** — no fixes without root cause investigation first (Phase 1 of systematic-debugging skill).
2. **Silent failure hunting** — every fix round includes silent-failure-hunter scanning all error handling, catch blocks, fallback logic.
3. **Loop until clean** — fix → QA/review/silent-failure → fix again → loop until all three pass.
4. **No AI references** — zero tolerance in any client-facing output.
5. **Every empty section must explain why** — user-facing language, never developer messages.

---

## Phase 1: Audit — Segregate Working vs Broken

Before fixing anything, the agents must scan the ENTIRE report system and classify every section/feature into:

### WORKING (do not touch unless a fix breaks it)
- Sections that render correctly with real, accurate data
- Navigation between pages
- Styling and layout (where correct)
- Data normalization pipeline (where it produces correct output)

### BROKEN (needs fixing)
- Sections with missing data
- Sections with wrong data
- Sections with developer-facing messages instead of user-facing
- Missing pagination
- Missing explanations for empty states
- AI references
- Workflow gaps (scripts/agents not being called)

**Output:** A checklist document per page, with every section marked WORKING or BROKEN with root cause.

---

## Phase 2: Root Cause Investigation

For each BROKEN item, apply systematic-debugging:

1. Read error messages / empty state text
2. Trace data flow backward: renderer → normalizer → data file → gather script → API
3. Identify WHERE in the chain the data drops
4. Classify the root cause:
   - **Data exists but normalizer doesn't map it** (normalizer fix)
   - **Data exists but renderer doesn't display it** (renderer fix)
   - **Data was never gathered** (gather script fix or workflow gap)
   - **API not available** (empty state message fix)
   - **Template/display issue** (CSS/HTML/JS fix)

---

## Phase 3: Fix Loop

### Round Structure

```
┌─────────────────────┐
│   Code Fixer Agent   │ ← Implements fixes based on root cause
│  (CX-Executor / CC)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   QA Agent           │ ← Runs tests, checks report output
│   (qa-tester)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Silent Failure      │ ← Scans for hidden errors, swallowed exceptions,
│  Hunter Agent        │   wrong fallback behavior
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Code Reviewer       │ ← Reviews diff for quality, security, conventions
│  Agent               │
└──────────┬──────────┘
           │
           ▼
     ┌─────┴─────┐
     │ All pass?  │
     └─────┬─────┘
       NO  │  YES
       │   │
       │   └──► Phase 4
       │
       └──► Back to Code Fixer with findings
```

### Rules
- Code fixer NEVER marks own work as done — QA/reviewer/silent-failure-hunter must approve
- If any of the three checkers find issues, it loops back
- Maximum 3 fix attempts per issue before escalating to architecture review
- Each loop must produce a clear delta: what was fixed, what still fails

---

## Phase 4: Workflow Deployment

For BROKEN items that are workflow gaps (data never gathered):

1. Identify which scripts/agents need to run
2. Run them against the Liane Jamason client
3. Verify the data files are populated
4. Feed back into the normalizer

---

## Phase 5: Report Regeneration

After all fixes are applied:

1. Regenerate the full report: `node generate-multipage-report.js`
2. Verify all 9 pages generated
3. Check file sizes are reasonable

---

## Phase 6: Visual Verification (Claude)

Claude visually inspects EVERY page of the regenerated report:

### Per-page checklist:
- [ ] All sections have data or a clear user-facing explanation
- [ ] No NaN, undefined, null, or placeholder text visible
- [ ] No AI references (Claude, Codex, GPT, Anthropic, etc.)
- [ ] No Calgary/wrong-domain references
- [ ] No developer-facing error messages
- [ ] Pagination present on large tables
- [ ] Badges aligned consistently
- [ ] Charts render with correct data
- [ ] Navigation highlights correct section when scrolled
- [ ] Numbers make sense (no negative page counts, no 0% for things that aren't 0%)

### If issues found:
- Document in ERRORS-TO-FIX.md (append, don't overwrite)
- Loop back to Phase 3

---

## Phase 7: Code Verification (Codex)

Codex reviews all modified code:

- Silent failure patterns
- Error handling completeness
- Data flow integrity
- Regression risk

### If issues found:
- Loop back to Phase 3

---

## Phase 8: Final Commit

Only after Phases 6 and 7 pass with zero findings:

1. Create save point commit
2. Update HANDOFF.md
3. Document what was fixed
