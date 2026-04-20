# Deep Dive #29 — `template/reports/multipage/pages/action-plan.js`

**File:** [`template/reports/multipage/pages/action-plan.js`](/root/site-audit/template/reports/multipage/pages/action-plan.js) (477 lines)
**Layer:** 07 — page renderer (Action Plan page — quick wins → long-term roadmap)
**Cross-reference:** [`codex findings/06-page-renderers/42-action_plan_page.md`](/root/site-audit/codex findings/06-page-renderers/42-action_plan_page.md)
**Template-vs-client drift:** laura-willis 477 lines (identical).
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Action Plan page. Main sections:
1. **Action Plan Tabs** (line 175) — 4 phased tabs: Quick Wins / Short Term / Medium Term / Long Term.
2. **Content Calendar** (line 203) — 3-month content schedule.
3. **Strategy Pillars** (line 248) — 4 pillars of growth strategy.
4. **Medium-Term Roadmap** (line 267) — month 2-4 items.
5. **Long-Term Strategy** (line 287) — month 4+ columnar layout.
6. **Advantages** (line 317) — "What client does better" list.
7. **Deliverables** (line 356) — ready-to-deploy items.

## 2. Inputs

- `data.actionPlan.{quickWins, shortTerm, mediumTerm, longTerm}[]` — each item `{action, why, effort, impact}`. From agent-authored (skill Phase 3) + `populate-audit-data.js`.
- `data.contentCalendar.{month1Label, month1, month2Label, month2, month3Label, month3}` — populate-audit-data.js parses FINAL-AUDIT-REPORT.md Section 8.
- `data.pillars[].{title, desc, time}` — agent-authored (ghost field, see finding #18 #4).
- `data.mediumTermRoadmap[].{title, detail}` — agent-authored ghost field.
- `data.longTermColumns[].{title, items[]}` — agent-authored ghost field.
- `data.advantages[].{title, detail}` — populate-audit-data.js parseAdvantages.
- `data.deliverables[].{name, scope, score, status}` + `data.keyPagesCreated[]` + `data.blogPostsCreated[]` — agent-authored deliverables manifest.

## 3. Key sections

**`renderActionPlanTabs` (line 175).** Tabbed interface for 4 action phases. Reads `data.actionPlan.{quickWins, shortTerm, mediumTerm, longTerm}[]`.

**`renderContentCalendar` (line 203).** 3-month grid. Reads `data.contentCalendar.monthN`. **Downstream of finding #15 bug #1** — if populate-audit-data.js couldn't find "## Section 8: Content Calendar" literal heading, this section is empty.

**`renderStrategyPillars` (line 248).** 4-pillar card layout. Reads `data.pillars`. Same field as `generate-presentation.js` #18 Slide 7 — identical "pillars" ghost field, hardcoded assumption of 4.

**`renderDeliverables` (line 356).** Reads `data.deliverables[]` + 2 separate arrays `keyPagesCreated` and `blogPostsCreated`. HANDOFF.md:91 notes content calendar badges were a previous bug ("badges overflowing") — fixed by rebuilt table layout (HANDOFF.md:24).

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #15 bug #1.** Content Calendar populates via exact heading match "## Section 8: Content Calendar." If an agent wrote it differently, calendar is empty. |
| 2 | **M** | 248-266 | **`pillars` is a ghost field.** No gather script produces it. If agent didn't author it, section hidden. |
| 3 | **M** | 267-286 | **`mediumTermRoadmap` ghost field.** Same. |
| 4 | **M** | 287-316 | **`longTermColumns` ghost field.** Same. |
| 5 | **M** | — | **`data.actionPlan.quickWins` on THIS page** — unlike `generate-presentation.js` #18 bug #3 which reads `data.quickWins`. Cross-page inconsistency: presentation uses top-level, HTML action-plan uses nested. If the two ever diverge, report and presentation show different data. |
| 6 | **M** | 317-355 | **`advantages` read from populate-audit-data's parseAdvantages** — finding #15 bug #9 brittle regex. If parsing fails, section empty. |
| 7 | **L** | — | **No "next action" highlight** — with 30+ actions across 4 tabs, users have no guide on what to do FIRST. A "top 3 recommended next actions" header could guide. |

## 5. Integration map

**Data chain — many producers:**
- `populate-audit-data.js` → `actionPlan.*`, `contentCalendar`, `advantages` (parsed from MD).
- Skill agent (report-compilation phase) → authors `pillars, mediumTermRoadmap, longTermColumns, deliverables, keyPagesCreated, blogPostsCreated` directly into audit-data.json.
- No Python involvement.

**This is the single most agent-authored page.** If the skill's report-compilation step produces inconsistent fields, Action Plan is the page that shows it.

## 6. Fix / improve suggestions

1. **Harmonize `quickWins` field path** with #18 and index.js (#22).
2. **Document required ghost fields** in the skill prompt so agents know to write them.
3. **Add content calendar empty-state** with actionable suggestion: "Run populate-audit-data.js --force after editing heading format."
4. **Visual "do this first" highlight** — mark top 3 actions across all tabs.

## 7. What to verify before we touch this file

- **Open Matt's Action Plan page** — does he have content calendar (3 months populated)? Pillars? Long-term columns? Any empty sections indicate finding #15 + missing-agent-authored fields.
- **Check `populate-audit-data.js --force`** run for Matt — log showed `(keywords, competitorComparison, siteComparison)` populated; contentCalendar + advantages not mentioned → parsing likely failed.
