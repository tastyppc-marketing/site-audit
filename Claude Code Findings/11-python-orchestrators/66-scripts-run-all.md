# Deep Dive #66 — `platform/scripts/run_all.py`

**File:** [`run_all.py`](/root/site-audit/platform/scripts/run_all.py) (224 lines)
**Layer:** 11 — Python orchestrator (top-level: runs build_audit + generators)
**Date:** 2026-04-20

---

## 1. Purpose

Wraps `build_audit.py` + any downstream Python-side generation into a single command. Typical orchestration: gather → build_audit → generate deliverables.

At 224 lines, it's the thinnest orchestrator — essentially a CLI + step-sequencer.

## 2. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **Relationship with `/seo-audit` skill unclear.** Skill runs its own orchestration (Phases 1-5 with parallel research agents). Does run_all.py replicate that? Or is it a dev tool? |
| 2 | **M** | — | **If runs the same steps as the skill**, coordinate to prevent duplicated work. |

## 3. Integration map

**Invoked by:** operator CLI.
**Likely composes:** build_audit.py + gather-*.js invocations (via subprocess?).

## 4. Fix / improve suggestions

1. **Clarify relationship to the `/seo-audit` skill** — deprecate run_all.py if redundant, OR promote it and deprecate the skill.
2. **Document invocation context** — when to use run_all vs skill.

---

## Python orchestrators cluster wrap (#63-#66)

- `build_audit.py` (#63) is the central analyzer orchestrator — invoked by skill Step 4.
- 3 standalone runners for specific subsystems (backlinks, rank-tracker, run-all).
- The CRITICAL line 216 bug in build_audit.py is the single-largest-blast-radius bug in the entire codebase.

**Priority fix order for the orchestrator layer:**
1. `build_audit.py:216` — `link_graph.get("edges", {})`.
2. `build_audit.py:217` — sitemap_urls from full sitemap.
3. Clarify run_all.py vs skill relationship.
