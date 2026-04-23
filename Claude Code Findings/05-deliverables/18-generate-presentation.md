# Deep Dive #18 — `template/scripts/generate-presentation.js`

**File:** [`template/scripts/generate-presentation.js`](/root/site-audit/template/scripts/generate-presentation.js) (298 lines)
**Layer:** 05 — deliverables (PowerPoint generation via `pptxgenjs`)
**Cross-reference:** [`codex findings/04-report-generators/16-generate_presentation.md`](/root/site-audit/codex findings/04-report-generators/16-generate_presentation.md)
**Template-vs-client drift:** **None — all 9 clients + Backup identical at 298 lines.** Fourth consecutive zero-drift finding.
**Template-vs-skill drift:** Invoked via `npm run presentation` + `npm run generate` (spreadsheet + presentation chained). Also referenced in `/seo-audit` skill Step 8.
**Date:** 2026-04-20

---

## 1. Purpose

The **PowerPoint deliverable generator.** Reads `seo/audit-data.json` and produces a **15-slide** client-facing deck at `seo/reports/SEO-Audit-Presentation.pptx`. Uses `pptxgenjs@^4.0.1` (package.json:30).

**Slide-by-slide:** 1) Title, 2) Overall Grade + Key Stats, 3) Top Issues, 4) Keyword Visibility, 5) Competitor Gap, 6) Competitor Strategies, 7) 4 Pillars, 8) Quick Wins, 9) Content Strategy Short-Term, 10) Content Calendar, 11) Deliverables, 12) Medium-Term Roadmap, 13) Long-Term Vision, 14) Competitive Advantages, 15) Next Steps.

Sibling to `generate-spreadsheet.js` (finding #17) — same CLI pattern, same `__dirname`-relative output, same bug patterns.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--data <path>` | flag+value | `__dirname/../seo/audit-data.json` | Source JSON |

**Dependencies:** `pptxgenjs@^4.0.1` only for the generation logic.

## 3. Outputs

`path.join(__dirname, '..', 'seo', 'reports', 'SEO-Audit-Presentation.pptx')` (line 293). `__dirname`-relative (good — CWD-safe).

Matt's output: 533 KB, 15 slides, Apr 15 11:54.

## 4. Annotated walk (selected)

**Lines 19-34 — `pptxgenjs` init + color palette.** Wide layout. Custom 10-color palette (DARK, ACCENT, BLUE, HIGHLIGHT, WHITE, LIGHT_GRAY, MED_GRAY, GREEN, RED, ORANGE). `SEVERITY` color map (line 35) drives per-stat coloring on slide 2.

**Lines 37-40 — `addTitleBar(slide, title)`.** Shared helper for 14 slides' top bars. Slide 1 and 15 bypass for full-width title treatment.

**Slide 1 (42-53).** Title + metadata. Reads `d.client.{website, name, company, auditDate}`.

**Slide 2 (55-67).** Overall Grade + `d.keyStats` iteration. `d.keyStats[i].{value, label, severity}` — 3 fields per stat. `severity` keys into `SEVERITY` color map (`red/orange/green`).

**Slide 3 (69-78).** Top Issues. **Title says "Top 5" but iterates `d.topIssues.forEach` without slicing** — if the array has 8 items, 8 overflow onto the slide (cut off visually).

**Slide 4 (80-107).** Keyword Visibility. Reads `d.keywords`.
- Line 82: counts keywords where `clientRank !== 'Not found'` — string literal comparison. Brittle if populate-audit-data writes differently ("Not Found", "N/A", "—").
- Line 95: **`d.keywords.slice(0, 8)`** — only top 8 shown. 25-keyword audit shows 8.

**Slide 5 (109-132). THE COMPETITOR BUG (sibling of #17 bug #1).**
- Lines 116-117: headers `d.competitor.all[0]?.name || 'Comp 1'`, `d.competitor.all[1]?.name || 'Comp 2'` — **only 2 competitors.** If `d.competitor.all` has 5 items, items 3-5 are silently dropped from the headers.
- Lines 122-123: row data `row.comp1 || ''`, `row.comp2 || ''` — matches 2-competitor shape. But this is the PRESENTATION slide, which the client presents to their stakeholders. Truncation is a content quality issue.

**Slide 6 (134-141).** Competitor Strategies. `d.competitorStrategies.forEach` — no count limit. Each strategy shows `strategy` (title, e.g., "Content Strategy") + `detail` (the standout approach text).

**Slide 7 (143-156).** 4 Pillars. `d.pillars.forEach` — but `pillarColors` (line 146) is a 4-color array. If `d.pillars.length > 4` → wraps back to BLUE (defensible). If `< 4` → empty pillar columns visually. Design assumes exactly 4.

**Slide 8 (158-180).** Quick Wins. Reads `d.quickWins` — **NOT `d.actionPlan.quickWins`.** Two places the data could live; presentation uses top-level. Codex weakness #2 (mixed field conventions).

**Slide 9 (182-190).** Short-term content strategy. Reads `d.actionPlan.shortTerm` — nested under `actionPlan`. Mismatch with slide 8's `d.quickWins` (not `d.actionPlan.quickWins`). **`actionPlan` nesting is INCONSISTENT.**

**Slide 10 (192-211).** Content Calendar. Table with month-group header rows (colSpan:4). Reads `d.contentCalendar.{month1Label, month1, month2Label, month2, month3Label, month3}`.

**Slide 11 (213-239).** Deliverables. Reads `d.deliverables, d.keyPagesCreated, d.blogPostsCreated`.

**Slide 12 (241-249).** Medium-term roadmap. Reads `d.mediumTermRoadmap[i].{title, detail}`.

**Slide 13 (251-262).** Long-term vision. Reads `d.longTermColumns[i].{title, items[]}`. **3-column layout** assumed via `0.4 + i * 3.15` spacing (line 255). No dynamic sizing.

**Slide 14 (264-277).** The Opportunity. Reads `d.advantages[i].{title, detail}` (from populate-audit-data finding #15 parseAdvantages). Also hardcoded copy line 275-276: "The site is not broken — it just needs content." This copy is **hardcoded, not in data.** Always says this regardless of actual state.

**Slide 15 (279-290).** Next Steps. Reads `d.nextSteps[i].{text, sub}`.

**Lines 292-298 — save.** `pptx.writeFile({fileName: outPath})` — returns promise. No parent-dir creation.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 116-117, 122-123 | **Competitor table capped at 2 competitors.** Headers and row data both hardcoded to comp1/comp2. Client with 3+ competitors sees only 2 in the presentation. Same bug as finding #17 #1 — coordinated fix needed. |
| 2 | **H** | — | **No schema validation. ~18 required top-level fields.** `d.client, keyStats, topIssues, keywords, competitor, competitorComparison, competitorStrategies, pillars, quickWins, actionPlan.shortTerm, contentCalendar, deliverables, keyPagesCreated, blogPostsCreated, mediumTermRoadmap, longTermColumns, advantages, nextSteps`. Any missing field → TypeError at that slide's render. Partial audit-data crashes the script with no helpful error. Same bug family as #17 #2. |
| 3 | **H** | 166, 186 | **Mixed field conventions (`d.quickWins` vs `d.actionPlan.shortTerm`).** Slide 8 reads top-level `quickWins`, Slide 9 reads nested `actionPlan.shortTerm`. Presentation treats `quickWins` and `actionPlan.quickWins` as if they could be different data. Codex #2. Standardize on `d.actionPlan.quickWins` (the path finding #15 #12 and #17 use). |
| 4 | **H** | — | **Fields used here but not produced by any script:** `pillars, quickWins, keyStats, longTermColumns, mediumTermRoadmap, nextSteps, gradeSummary, advantages (partially)`. These must be hand-authored in audit-data.json or generated by an agent prompt in the skill. Silent breakage for any client whose audit-data.json lacks these. Check `/seo-audit` skill for where these fields are produced (likely Phase 3 report-compilation agent). |
| 5 | **M** | 72 | **"Top 5" title + unbounded iteration** mismatch. Slide 3 title claims "Top 5 Critical Issues" but `d.topIssues.forEach` iterates all. 6th+ issue overflows visually. Fix: `.slice(0, 5)` to match title, or rename title. |
| 6 | **M** | 95 | **`d.keywords.slice(0, 8)` truncation on Slide 4.** 25-keyword audit shows 8. Either add pagination ("Top 8 of 25 — see spreadsheet for full list") or bump to 15 with smaller font. |
| 7 | **M** | 82 | **String-literal "Not found" comparison.** If populate-audit-data writes "Not Found" (capitalized) or "N/A", counts are wrong. Defensive comparison should be case-insensitive or normalize. |
| 8 | **M** | 146, 147 | **Hardcoded 4-pillar assumption.** `pillarColors` has 4 entries; `d.pillars.forEach` iterates all. Overflow wraps to BLUE; underflow leaves gaps. Design-breaking for counts ≠ 4. |
| 9 | **M** | 254 | **Hardcoded 3-column long-term layout.** `d.longTermColumns.forEach((col, i) => { x = 0.4 + i * 3.15 })`. >3 columns overflow the slide right edge silently. |
| 10 | **M** | 275-276 | **Hardcoded prose: "The site is not broken..."** Plays regardless of actual audit findings. For a client who DOES have broken technical SEO, this copy is misleading. Move into data (e.g., `d.opportunityCallout`) or remove. |
| 11 | **M** | 293 | **Output dir not auto-created.** `pptx.writeFile` errors if `seo/reports/` doesn't exist. Same as #17 #3. |
| 12 | **L** | 294-298 | **Error branch just logs.** Process exits 0 even on failed generation. Silent failure for CI. |
| 13 | **L** | 33-34 | **Color palette hardcoded** — fine for template design, limits client-specific branding. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill (Step 8 — same block as generate-spreadsheet.js).
- `npm run presentation` (template + all clients' `package.json:11`).
- `npm run generate` chains spreadsheet + presentation.
- Matt Wallmow: presentation file exists, 533 KB.

**Files read:** `seo/audit-data.json`.
**Files written:** `seo/reports/SEO-Audit-Presentation.pptx`.

**Contract:** The 18+ field list above. Multiple fields are "ghost" in the sense that nothing produces them automatically:
- `pillars[]` — agent-authored (skill Phase 3 output).
- `quickWins` (top-level) — agent-authored, duplicates `actionPlan.quickWins`.
- `keyStats[]` — agent-authored.
- `longTermColumns[]` — agent-authored.
- `mediumTermRoadmap[]` — agent-authored.
- `nextSteps[]` — agent-authored.
- `gradeSummary` — agent-authored.

Tracing who authors these is a skill deep-dive concern (#67). Deep-dives of agents should reveal which agent's prompt populates which field.

**Drift table:** all 298-line copies identical. Zero drift.

**Skill-inline:** no stub.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Coordinate competitor-column fix with #17.** Single PR fixes both generate-spreadsheet (bug #1) and generate-presentation (bug #1 here).
2. **Shared schema validator + documentation of required fields** (bug #2, #4). Before either deliverable renders, run `validateAuditData(d)` that lists missing fields; exit 1 with clear message. Documents the expected shape.
3. **Harmonize `quickWins` field path** (bug #3). Decide: top-level OR `actionPlan.quickWins`. Pick one, update everywhere, deprecate the other.
4. **Align title/data on Slide 3** (bug #5) — `.slice(0, 5)` to match the "Top 5" title.
5. **Expand Slide 4 keyword display** (bug #6) — show 10-15 keywords, add footer note for full list in spreadsheet.
6. **Audit each "ghost" field's producer** (bug #4). Where does `d.keyStats` come from? Deep-dive #67 (skill) will reveal which agent writes it.
7. **Auto-create output dir** (bug #11). `fs.mkdirSync` one-liner.
8. **Case-insensitive rank string comparison** (bug #7). `.toLowerCase().includes('not found')`.
9. **Dynamic slide layouts for pillars/long-term** (bugs #8, #9). Compute x-spacing from array length.
10. **Externalize hardcoded opportunity prose** (bug #10).

## 8. What to verify before we touch this file

- **Open Matt's presentation** and confirm Slide 5 shows exactly 2 competitor columns despite him having 5.
- **Trace `pillars, keyStats, longTermColumns, mediumTermRoadmap, nextSteps, gradeSummary`** in the skill (`commands/seo-audit.md`). Identify the agent prompt responsible for each.
- **Check if `d.quickWins` and `d.actionPlan.quickWins` ever DIVERGE** across clients — if not, the duplication is just inefficient, not a data integrity issue.
- **Cross-reference fix #1 with the HTML report's competitor page** (`pages/competitors.js`) — the same multi-competitor logic exists there too. Solution should be consistent across XLSX, PPTX, and HTML.

---

## Additional Information

### Tier 3 Fix 8 — dynamic competitor-column iteration (commit `257ee52`, 2026-04-23)

Slide 5 "Competitor Gap" hardcoded comp1/comp2 in both header (lines 116-117)
and body rows (lines 122-123). With matt's 5 competitors, only comp1 and
comp2 appeared on the slide; comp3-5 were completely missing. With his
`competitorComparison` rows containing comp1..comp6 keys (one extra slot
beyond `competitor.all`), iterating `competitor.all` would still have lost
the comp6 data — so the fix mirrors the canonical pattern from
`pages/competitors.js:64-71` (derive column count from row keys).

Header fallback for missing competitor metadata is `'Comp ' + (i + 1)`,
matching `getCompetitorName`'s convention.

### Slide-overflow handling

PPTX `addTable` requires explicit column widths. The hardcoded
`colW: [2.5, 2, 2.5, 2.5, 2.5]` (5 columns, 12in slide width) was
incompatible with N-competitor layouts. Replaced with dynamic widths:
- Metric column: 2.5in
- Client column: 1.5in
- Each competitor column: `Math.max(0.7, 6.5 / compCount)` — equal share
  of the remaining 6.5in budget with a 0.7in floor
- Gap column: 1.5in

For matt's 6 comps: ~1.08in per comp column. Tight but readable. For 2
comps: 3.25in each (plenty). Eyeball check on the generated PPTX confirmed
no overflow or text clipping in matt's output.

### Tier 3 Fix 8 prep — null-safe kwTable (commit `d98fc43`, 2026-04-23)

Pre-existing bug discovered while verifying Fix 8: when audit-data.json
has any keyword with `volume=null`, `clientRank=''`, `competitorRank=''`,
or `topResult=null`, `generate-presentation.js` crashed with
`TypeError: Cannot read properties of null (reading 'options')` inside
pptxgenjs (the addTable iterator tried `cell.options` on the literal null).

matt-wallmow has 4 of 8 top keywords with `volume=null` (brand-name
queries with no DFS data) plus all 8 with `competitorRank=''`. PPTX
generation has been failing silently for matt's audit since the
keyword-volume normalizer started emitting nulls.

Hardened the row-builder to coerce nulls to `'—'` / `'Not found'` /
`String(value)`. This is a strict pre-requisite for Fix 8's PPTX
verification — without it the generator can't run end-to-end on matt
regardless of competitor-column logic. Shipped as a separate commit so
the Fix 8 commit stays narrowly scoped.
