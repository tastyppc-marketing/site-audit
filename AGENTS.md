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
