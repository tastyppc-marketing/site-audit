# Site Audit Instructions

## Skills

### Available skills

- `site-audit`: Use when working inside this repository on SEO audits, PPC audits, client scaffolding, audit-data JSON, deliverables, or the Playwright/Node tooling that powers the workflow. The skill is designed to preserve the existing Claude-oriented files while giving Codex a parallel operating path. (file: `C:/Dev/site audit/codex/skills/site-audit/SKILL.md`)

### How to use skills

- Read the skill only when the task matches the description above.
- Follow the skill's references for repo layout, commands, and output guardrails.
- Keep the Claude workflow intact unless the user explicitly asks to change it.

## Repo Rules

- Do not modify `.claude/` or existing `claude-*` deliverables unless the user explicitly asks.
- Treat `Livinginparkcity/` as a local/off-limits folder unless the user explicitly points you there.
- Prefer `template/` for shared tooling changes and `clients/<slug>/` for client-specific work.
- When Claude and Codex outputs may coexist, write Codex-authored markdown deliverables with a `codex-` prefix.
- Keep generated dependency folders such as `node_modules/` out of Git and reinstall them locally as needed.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


<!-- BEGIN TANDEM-MODE OVERRIDE -->
## Beads Integration — TANDEM-mode override

The bd-injected block above is bd's default "exclusive" install — bd as the only task/memory system. **This clone runs bd in TANDEM, not as a replacement.** When the bd block conflicts with this clone's existing rules or with the agent harness's own memory/task systems, the following overrides apply:

1. **Task tracking is multi-source.** Use bd issues for project-scoped follow-ups that benefit from durable cross-session tracking. Use the harness's in-session task tools (TodoWrite / TaskCreate for Claude Code; equivalents for Codex / Gemini) when filing a bd issue would be overhead. Use conversation context when neither fits. Pick the right tool for the work; do not migrate one system to another without explicit user direction.

2. **Memory is multi-source.** The agent's harness-level auto-memory (cross-project context outside this repo) is the canonical home for memory that should persist across sessions AND projects. `bd remember` is appropriate for project-scoped knowledge that benefits from being co-located with bd issues. **Do NOT migrate harness-level memory into bd; both systems coexist.** The bd block's "do NOT use MEMORY.md files" rule does not apply to harness-level memory systems.

3. **Session-end push is NOT mandatory.** The bd block claims "Work is NOT complete until `git push` succeeds." This clone's project pattern is "ask before push," and the user's instructions take precedence. **Never push without explicit user direction.** Surface ready-to-push commits to the user; do not push autonomously.

4. **All Repo Rules above take precedence over the bd block when they conflict.**

The bd-injected block is preserved verbatim above so bd's own management hash is intact for future bd updates. This override block is the operative guidance.
<!-- END TANDEM-MODE OVERRIDE -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **site-audit** (53419 symbols, 76209 relationships, 274 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/site-audit/context` | Codebase overview, check index freshness |
| `gitnexus://repo/site-audit/clusters` | All functional areas |
| `gitnexus://repo/site-audit/processes` | All execution flows |
| `gitnexus://repo/site-audit/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
