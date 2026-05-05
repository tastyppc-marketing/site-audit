# Handoff — Post Phase E

**Written:** 2026-05-05
**State:** Phase E merged. North-star work remaining: `bd i57` (renderer/pipeline filename mismatch). Read this top-to-bottom and you can resume cold.

---

## 1. The North Star

The user's stated end-state, verbatim from session 2026-05-05 wrap-up:

> "By the end of our fixes, we should be able to run the site audit with no issues. I shouldn't have to come back and say, 'Hey, this broke.' Let's fix it. It should just work; it should be accurate data. There should be no conflicts within the scripts or any friction whatsoever. It should all work smoothly."

Every decision should weigh against this. If a "fix" technically works but leaves a future surprise, it isn't done.

---

## 2. What landed in Phase E (now on `site-audit-fixes-tier-5`)

PR: https://github.com/tastyppc-marketing/site-audit/pull/1 (merged)
Backup tag pre-Phase-E: `pre-gitnexus-2026-05-05`.

### Env isolation (the original Phase E goal)
- `ClientContext.from_slug(<slug>)` reads `clients/<slug>/.env` via `dotenv_values()` (no `os.environ` mutation).
- `BaseConnector` accepts `ctx`; 10 connector subclasses forward.
- `build_audit.py` accepts `--client-slug`, threads `ClientContext` through orchestrator + `DataForSEOConnector` + `GoogleAdsConnector`.
- `reporting_intelligence.py` reads `ANTHROPIC_API_KEY` via `ctx`, falls back to `os.environ` only when no `ctx`.
- All 6 JS gather scripts (`gather-{domain-metrics,keyword-volumes,pagespeed,organic-metrics,backlinks,local-pack}.js`) import `loadClientEnv` + `resolveClientSlug`, prefer `env.X || process.env.X`, surface slug-aware error when creds missing, consume `--client-slug <slug>` in their parsers.
- Orchestrator skill `commands/seo-audit.md` Step 5.5 threads `--client-slug {CLIENT_NAME_SLUG}` to every gather invocation.
- `loadClientEnv` repo-root resolution uses `findRepoRoot` (sibling-marker walk) — works from both `template/scripts/lib/` (3 deep) and cohort-synced `clients/<slug>/scripts/lib/` (4 deep). The first attempt at this used a fixed `..,..,..` walk that was silently wrong on the cohort path; that bug is fixed.
- 7 non-Calgary client `scripts/` dirs are zero-drift from `template/scripts/` (Calgary's documented fork preserved).

### Renderer fixes surfaced during Phase E validation
- `template/reports/multipage/generate-multipage-report.js` section 5d now propagates `cb.qualitySummary` from `client-backlinks.json` into `data.backlinks.qualitySummary` when research has data. Previously the analyzer's verdict was silently dropped — rendered reports always showed `0 dofollow / 0 nofollow / 0 high-quality / 0 medium-quality / 0 low-quality`.

### Smoke gates
Three commit-able assertion scripts under `platform/scripts/smoke/`:
- `tier5_python_smoke.py` — `ClientContext` → credentialed `DataForSEOConnector.get_domain_metrics` → asserts `os.environ` unmutated before/during/after.
- `tier5_js_smoke.sh` — runs `gather-domain-metrics.js` from BOTH the template path AND the cohort path (`cd clients/matt-wallmow + scripts/gather-...`). Snapshots+restores `domain-metrics.json` so it doesn't clobber matt-wallmow's real research data.
- `tier5_render_smoke.sh` — local-only render of all 9 multipage pages with `--inline`; asserts no `shared/` href/src leaks.

### Cohort data refreshes (committed to non-Calgary clients)
- 6 clients had `analyze-backlink-quality.js` run + per-competitor `backlinks-*.json` gathered. ~$1.80 in DFS.
- 4 clients had `gather-keyword-volumes.js` rerun (3 had no kv file, mammoth-lakes had a malformed bare-list shape). ~$0.30 in DFS. The corruption symptom (`"~2"`, `"Low"`, `"Not found"` in keyword `volume`) is gone.

### bd issues handled
- `dxp` closed (test_atomic_write passes after editable install).
- `c6r` closed (.bak files already cleaned in prior tier; gitignore covers).
- `8d2` closed (`git rm -rf .collab/` shipped).
- `5hy` open, P2 — SOP doc deferred. The qualitySummary-not-propagating bug + the loadClientEnv 3-vs-4-depth bug are excellent raw material.
- `i57` open, P2 — **see §3, this is the next session's target.**

### Per-client classification snapshot (from the data refresh commit)
| Client | Total | Legit | Suspicious | Spam | Spam % |
|---|---:|---:|---:|---:|---:|
| matt-wallmow | 42 | 1 | 6 | 35 | 83% |
| p3realtync | 29 | 0 | 7 | 22 | 76% |
| murray-gardner | 44 | 0 | 20 | 24 | 55% |
| mammoth-lakes | 43 | 2 | 20 | 21 | 49% |
| liane-jamason | 200 | 7 | 117 | 76 | 38% |
| laura-willis | 161 | 39 | 88 | 34 | 21% |

All six clients now have populated `backlinks.qualitySummary` in their rendered reports.

---

## 3. The next-session target: `bd i57`

**Issue:** the multipage renderer reads research files using JS-gather naming. The Python `build_audit.py` pipeline writes its own filenames. Clients audited via the Python path leave data the renderer never asks for.

**Concrete name pairs (renderer-name / Python-pipeline-name):**

| Renderer expects | Python pipeline writes |
|---|---|
| `pagespeed-data.json` | `pagespeed.json` + `pagespeed-interior.json` |
| `ga4-data.json` | `ga4-acquisition.json` + `ga4-devices.json` + `ga4-landing-pages.json` + `ga4-page-performance.json` |
| `search-console.json` | `gsc-pages.json` + `gsc-queries.json` + `gsc-devices.json` + `gsc-query-pages.json` |
| `keyword-research.json` | `keyword-suggestions.json` |
| (no JS analog) | `crux.json`, `brand-mentions.json`, `social-audit.json`, `client-rankings.json`, `competitor-domain-metrics.json`, `competitor-domains.json`, `competitor-pagespeed.json`, `competitor-serp-comparison.json`, `serp-results.json` |

**Direct evidence (run this on a fresh chat to reproduce):**

```bash
# mammoth-lakes is the canonical demo of the bug: 30 research JSON files,
# mostly Python-pipeline names. The renderer log will warn about
# missing data even though the underlying files are there.
cd /root/site-audit-fix-work
node template/reports/multipage/generate-multipage-report.js \
  --data clients/mammoth-lakes/seo/audit-data.json \
  --output /tmp/mam-out --inline 2>&1 | grep -i "missing\|empty\|warning"
# Expected warnings: lighthouseResults empty, coreWebVitals missing,
# contentQuality missing, internalLinking.totalPages missing
```

**Two viable directions** (the issue lists both — pick one before coding):

**A) Unify on the producer side.** Modify `build_audit.py` and the Python connectors to emit consolidated files matching the renderer's expected names (single `ga4-data.json`, single `search-console.json`, `pagespeed-data.json` with the same shape the JS gather produces). Renderer stays simple.
- Pros: one source of truth for filenames; simpler renderer; matches the existing JS gather convention which is already the default for new audits.
- Cons: rewrites Python connector output paths; risks invalidating saved Python research data on existing clients (mammoth-lakes especially).
- Migration story: the renderer already auto-populates from research files on every render, so re-running `build_audit.py` on existing clients with the new names is the migration. Old files can stay as gitignored noise or be renamed mechanically.

**B) Unify on the consumer side.** Extend the renderer to fall back to Python-pipeline names when the renderer-style file is absent. Each existing `if (fs.existsSync(<rendererName>))` block gets an `else if (fs.existsSync(<pythonName>))` companion that reads the same data, possibly via a small adapter to normalize shape.
- Pros: zero risk to existing client research data; backwards compatible; smaller code change.
- Cons: doubles the auto-populate code paths; hides the dual-path forever as institutional knowledge; the consolidation work for split files (4 ga4-* → 1 ga4-data.json shape) still has to happen somewhere.

**Recommendation (carry into the brainstorm):** option A is the right end-state for the North Star ("no friction"); option B is the right step-1 if the user wants tested incremental progress before touching producer-side. A reasonable plan is to do B first as a safety net (so old data renders), then migrate producers to A, then remove the B fallbacks. But this is a brainstorm-worthy decision — start the next session with a brainstorm.

---

## 4. Other gaps surfaced (lower priority than i57)

| Symptom | Cause | Fix scope |
|---|---|---|
| `chris-nevada` has no audit at all | Never had one run | Run a full audit when ready. Out of band. |
| `laura-willis` has 4 competitor backlink files with `status="failed"` referencing real domains, but her `audit-data.json` has placeholder competitor domains (`competitor1.com`, ...) | audit-data + research drift from a prior incomplete audit | Either re-run her competitor research with real domains and overwrite audit-data, or re-populate audit-data from her real client-config. Worth surfacing to the user before fixing — they'll know what her real competitor list is. |
| `murray-gardner` audit-data is the thinnest in the cohort: contentQuality, coreWebVitals, lighthouseResults, internalLinking.totalPages, localSeo all empty | Audit cycle never finished for him | Re-run audit. Out of band. |
| `keywords` table for some clients still shows null volumes for hyper-specific branded queries | DFS legitimately has no data on those queries | Not a bug. Renders as N/A which is correct. If desired, `gather-keyword-volumes.js` could be enhanced to omit zero-volume keywords entirely from the table, but that's a UX choice. |

---

## 5. Repo state and resume checklist

```bash
# Reach the right repo and branch
cd /root/site-audit-fix-work
git checkout site-audit-fixes-tier-5
git pull --ff-only

# Confirm Phase E is in (look for the env-isolation + qualitySummary commits)
git log --oneline | grep -E "tier-5/E-|qualitySummary|loadClientEnv" | head -10

# Editable install (CONFTEST GUARD WILL FAIL FAST IF YOU SKIP THIS)
pip install -e platform/ --break-system-packages
python3 -c "import audit_platform; print(audit_platform.__file__)"
# Expected: /root/site-audit-fix-work/platform/src/audit_platform/__init__.py

# Sanity gates
python3 -m pytest platform/tests/ --tb=no -q
# Expected: 416 passed (the test_atomic_write exclusion is no longer needed)
npx jest template/scripts/lib/load-client-env.test.js
# Expected: 15 passed
./platform/scripts/smoke/tier5_render_smoke.sh
./platform/scripts/smoke/tier5_js_smoke.sh
python3 platform/scripts/smoke/tier5_python_smoke.py
# All three: PASS

# Read references in order
cat "Claude Code Findings/HANDOFF-POST-PHASE-E.md"   # this file
bd show site-audit-fix-work-i57                       # the next target
cat "Claude Code Findings/TIER-5-EXECUTION-PLAN.md"   # broader Tier 5 context
```

---

## 6. Locked decisions (carry forward — do not relitigate without a specific reason)

From prior handoffs + this session:

| ID | Decision | Status |
|---|---|---|
| 5a | `.collab/.md` files | RESOLVED — `git rm -rf .collab/` shipped in Phase E; .gitignore already had `.collab/` |
| 5b | `rank_tracker.py` orphan | DEFERRED — build out properly in a future tier; do NOT delete during Tier 5 |
| 5c | Phase C dual classifier | STRICT: omit all three (JS + Python + renderer heuristic). Leave room to build later |
| 5d | Phase C backlinks page redesign | DEFERRED — user thinking. Unrelated to i57 |
| matt-wallmow | Reference client for verification | UNCHANGED — every functional fix verifies against him |
| analyze-backlink-quality.js | Runs after gather-backlinks per Step 5.5 | UNCHANGED — orchestrator already wires it |

---

## 7. Hard rules (carried forward — do not override)

1. **One fix per commit.** Cohort/data refresh commits (e.g., propagating template across clients) are the only batched form, and only when the operation is mechanical.
2. **Don't modify finding text.** Append under `## Additional Information` only.
3. **Stage explicitly by path.** Never `git add .`.
4. **Don't push without explicit user direction (TANDEM §3).** PR was authorized by the user during Phase E close-out; do not generalize.
5. **`gh auth setup-git` before any `git push`.**
6. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
7. **bd is the project task tracker (TANDEM mode).** Use `bd ready`/`show`/`update`/`close` for project-scoped work; use TodoWrite for in-session tracking only.
8. **GitNexus rules from CLAUDE.md remain in force:** run `mcp__gitnexus__impact` before editing a symbol; run `mcp__gitnexus__detect_changes` before each commit. The repo is indexed (53k symbols, 76k edges, 274 flows) and tools are registered.
9. **Trust empirical re-verification, not prior audit framings.** The qualitySummary bug + the loadClientEnv path bug both passed prior smoke gates that didn't actually exercise the failing code path. Whenever a bug "should" already be fixed, run it.
10. **Don't burn matt-wallmow's data with smoke runs.** The hardened `tier5_js_smoke.sh` snapshots `domain-metrics.json` before the cohort-path test; if you write a new smoke that touches real research data, mirror that pattern.

---

## 8. Persistent artifacts

| Artifact | Location | State |
|---|---|---|
| Tier 5 plan v2 | `Claude Code Findings/TIER-5-EXECUTION-PLAN.md` (commit `a4def6b`) | Authoritative |
| Phase 0 + D + F handoff | `Claude Code Findings/HANDOFF-TIER-5-WIP.md` (commit `6d8b038`) | Pre-Phase-E context |
| Phase E WIP handoff | `Claude Code Findings/HANDOFF-PHASE-E-WIP.md` (commit `3bbe354`) | Mid-Phase-E context |
| This handoff | `Claude Code Findings/HANDOFF-POST-PHASE-E.md` | Resume doc |
| GitNexus skills | `.claude/skills/gitnexus/` | Six skill files committed |
| Smoke gates | `platform/scripts/smoke/tier5_*.{py,sh}` | Three scripts; all PASS |
| 6 fresh client reports (untracked, build artifacts) | `clients/<slug>/seo/multipage-report-<slug>-2026-05-05/` | Open in a browser to verify the fixes |
| matt-wallmow `.env` (gitignored) | `clients/matt-wallmow/.env` | Has DFS + Google creds; copied from `platform/.env`. Same setup for the other 5 active clients. |
| bd issues open | `i57` (P2, dual-path), `5hy` (P2, SOP doc) | i57 is next session's target |

---

## 9. Resume prompt for fresh session

```
Resuming site-audit work post Phase E.

Repo: /root/site-audit-fix-work/
Branch: site-audit-fixes-tier-5 (Phase E merged)

Read in order:
1. Claude Code Findings/HANDOFF-POST-PHASE-E.md (this file)
2. bd show site-audit-fix-work-i57 (next target — dual-path filename mismatch)
3. CLAUDE.md (fix-work hard rules + TANDEM override + GitNexus rules)

State at handoff:
- Phase E env isolation merged (Python + JS + cohort + smoke + 416 pytest pass).
- qualitySummary now propagates from research → renderer.
- 6 active clients have classified backlinks + numeric keyword volumes.
- Open bd i57 (P2): renderer asks for JS-pipeline filenames (pagespeed-data.json,
  ga4-data.json, search-console.json), Python pipeline writes Python names
  (pagespeed.json, ga4-acquisition.json + 3 siblings, gsc-pages.json + 3 siblings,
  crux.json, etc.). Mammoth-lakes is the canonical reproducer.

Next action: brainstorm direction A (unify on producer) vs direction B
(unify on consumer with renderer fallbacks) for bd i57. Then plan + execute
on a new branch off site-audit-fixes-tier-5. Reference client throughout
remains matt-wallmow but mammoth-lakes is the primary verification target
for i57 specifically.

Pre-flight (always before trusting test output):
  pip install -e platform/ --break-system-packages
  python3 -m pytest platform/tests/ --tb=no -q
  npx jest template/scripts/lib/load-client-env.test.js
  ./platform/scripts/smoke/tier5_render_smoke.sh
  ./platform/scripts/smoke/tier5_js_smoke.sh
  python3 platform/scripts/smoke/tier5_python_smoke.py

The user's North Star (verbatim):
  "By the end of our fixes, we should be able to run the site audit with
   no issues. I shouldn't have to come back and say, 'Hey, this broke.'
   It should just work; it should be accurate data. There should be no
   conflicts within the scripts or any friction whatsoever."

Solve i57 well, then verify the full audit-from-scratch on matt-wallmow
end-to-end before declaring done.
```
