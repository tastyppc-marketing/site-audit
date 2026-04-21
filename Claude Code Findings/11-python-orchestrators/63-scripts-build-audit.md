# Deep Dive #63 — `platform/scripts/build_audit.py`

**File:** [`build_audit.py`](/root/site-audit/platform/scripts/build_audit.py) (891 lines)
**Layer:** 11 — Python orchestrator (THE Python-side pipeline)
**Date:** 2026-04-20

---

## 1. Purpose

The central Python orchestrator. Runs 10+ analyzers (findings #51-#62), collects their outputs, writes to `audit-data.json`. `/seo-audit` skill Step 4 invokes this.

Class structure:
- `StepResult` (line 44) — per-step result wrapper.
- `AuditStep` (line 53) — step definition.
- `AuditOrchestrator` (line 82) — main runner.

Runs 10 steps (one per analyzer):
1. `_run_content_quality` (line 188)
2. `_run_internal_linking` (line 206) — **line 216 has the KEY BUG from INDEX addendum.**
3. `_run_technical_seo` (line 223)
4. `_run_backlinks` (line 237)
5. `_run_competitor` (line 263)
6. `_run_local_seo` (line 284)
7. `_run_indexation` (line 310)
8. `_run_eeat` (line 332)
9. `_run_content_gap` (line 345)
10. `_run_reporting` (line 402) — meta-analyzer synthesis
11. `_run_ppc_audit` (line 438) — only if PPC data present

Plus research-file loaders: `_load_crawl_data` (line 480), `_load_link_graph` (line 485), `_load_research_file` (line 490).

## 2. Key bugs

**LINE 216: THE BUG.** `edges = link_graph or {}` — passes the whole `{domain, crawlDate, notes, edges}` dict to `InternalLinkAnalyzer`. Should be `link_graph.get("edges", {})`. Already documented in INDEX addendum + finding #52 + multiple findings.

**LINE 217: SITEMAP SCOPE.** `sitemap_urls = [p.get("url", "") for p in (crawl_data or {}).get("pages", [])]` — inherits the 11-page cap from agent-overwritten crawl-data.json. For orphan detection to be real, should use the full sitemap from `link-graph.json` or a separate sitemap-urls file. Finding #52 bug #2.

**LINE 218: HARDCODED `https://www.` PREFIX.** `homepage = f"https://www.{self.args.domain}"`. For Matt this is `https://www.mattwallmow.com` — but his actual crawl uses `https://mattwallmow.com/` (no www). Normalizer strips both to the same key, but worth verifying across clients with www-less setups.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **CRITICAL** | 216 | **Passes raw link_graph dict instead of `link_graph["edges"]`.** Analyzer iterates non-edge keys as if they were edges → processes 0 edges. Cascades to empty internalLinking across the report. |
| 2 | **H** | 217 | **sitemap_urls inherits crawl-data page cap.** Orphan detection against incomplete sitemap. |
| 3 | **H** | 218 | **Hardcoded `https://www.` prefix.** Breaks BFS depth computation for non-www canonical sites. Verify per client. |
| 4 | **M** | 143 | **`_run_step` error handling** — likely catches and logs, continuing with other steps. Good resilience; but errors must be surfaced in `audit-data.json.apiErrors[]` for the normalizer's propagation (finding #21 #714). |
| 5 | **M** | — | **10-step sequential** execution. Could parallelize independent steps (content_quality + backlinks + local_seo don't depend on each other). |
| 6 | **M** | — | **No pre-flight validation of research files.** If crawl-data.json is absent, content_quality returns `{}` and downstream all fail silently. A "required files present" check at the top would be helpful. |

## 4. Integration map

**Invoked by:** `/seo-audit` skill Step 4.

**Inputs:**
- `--domain` / `--research-dir` / `--audit-data-path` CLI args.
- `seo/audit-data.json` (existing + writes back).
- `seo/research/*.json` files.

**Outputs:** `seo/audit-data.json` (updated in-place).

**Dependencies:** `audit_platform.analyzers.*`, `audit_platform.connectors.*`.

## 5. Fix / improve suggestions

1. **CRITICAL: Fix line 216** — `link_graph.get("edges", {})`. One-line fix. Cascades through the whole internal-linking display on every client.
2. **Fix line 217** — derive sitemap_urls from the sitemap fetch, not the analyzed-pages subset.
3. **Parameterize homepage prefix** (line 218) — read from client-config.json or derive from crawl-data's `domain` field.
4. **Add pre-flight research-file check.**
5. **Parallelize independent steps.**

## Additional Information

### 2026-04-21 — Fix shipped (Tier 1)

Committed as `76e8535` on branch `site-audit-fixes`.

Final form (chose null-safe variant over the raw `link_graph.get(...)` recommendation so a missing `link-graph.json` path stays graceful):
```python
edges = (link_graph or {}).get("edges", {})
```

**Empirical verification on matt-wallmow** (isolated run: `python platform/scripts/build_audit.py --type seo --domain mattwallmow.com --research-dir clients/matt-wallmow/seo/research --output /tmp/matt-audit-data.post-fix1.json --skip-api`):

| Field | Before | After |
|---|---|---|
| `internalLinking.total_pages` | 0 | 52 |
| `internalLinking.total_internal_links` | 0 | 93 |
| `internalLinking.orphans` count | 11 | 5 |
| `internalLinking.nodes` count | 0 | 52 |

Log confirms correct extraction: `internal_link_analysis_start edge_count=11 sitemap_url_count=11` → `build_graph_complete edge_count=93 node_count=11` → analyzer produced hubs, orphans, pagerank, depth.

Fix verified end-to-end on the reference client.
