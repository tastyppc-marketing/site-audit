# Repo Layout

## Top-level folders

- `docs/`: Main process documentation. Start with `docs/SEO-AUDIT-PLAYBOOK.md`.
- `template/`: Reusable project skeleton and shared scripts.
- `clients/`: Client-specific audit workspaces.
- `archive/`: Historical scripts, reports, and older snapshots. Read when useful; avoid treating it as the current source of truth.
- `Livinginparkcity/`: Local workspace left out of Git on purpose. Do not touch unless the user explicitly asks.
- `.claude/`: Claude-specific local configuration. Leave it alone unless asked.

## Client project anatomy

Each client folder mirrors the template layout:

- `scripts/`: Node/Playwright utilities for browsing, crawling, technical checks, data parsing, and deliverable generation.
- `seo/audit-data.json`: Structured input for SEO spreadsheet and presentation generation.
- `seo/research/`: Research markdown and raw analysis notes.
- `seo/content/`: Client-facing SEO markdown deliverables such as meta tags, schema, blog posts, and community pages.
- `seo/reports/`: Generated spreadsheet and presentation outputs.
- `ppc/ppc-data.json`: Structured input for PPC spreadsheet and presentation generation.
- `ppc/exports/`: Raw PPC exports, usually CSV downloads from Google Ads.
- `ppc/research/`: PPC analysis notes.
- `ppc/reports/`: Generated PPC spreadsheet and presentation outputs.

## Where to make changes

- Change `template/` when improving shared scripts or reusable scaffolding.
- Change `clients/<slug>/` when doing client-specific work.
- Read `archive/` when you need historical context or prior output examples.

## Naming conventions

- Use `claude-*` filenames for existing Claude-authored deliverables.
- Use `codex-*` filenames for new Codex-authored markdown deliverables when a parallel Claude version may exist.
- Keep research filenames descriptive and aligned with the playbook, for example `keyword-research.md` or `competitor-analysis.md`.

## Safety rules

- Do not overwrite `claude-*` outputs unless the user asks.
- Do not assume `node_modules/` exists after a fresh clone; reinstall dependencies locally.
- Do not use `archive/` output as the default destination for new work.
