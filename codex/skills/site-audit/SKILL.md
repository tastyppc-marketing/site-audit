---
name: site-audit
description: Run and extend the SEO/PPC audit toolkit in this repository. Use when Codex needs to scaffold a new client from the template, run the Playwright/Node audit scripts, analyze a client site or competitors, fill `seo/audit-data.json` or `ppc/ppc-data.json`, or generate markdown, spreadsheet, and presentation deliverables while keeping the existing Claude workflow intact.
---

# Site Audit

Use this skill as the Codex-native operating guide for this repo. It translates the existing Claude-oriented playbook into a repeatable Codex workflow without overwriting the Claude path.

## Quick Start

1. Pick the project root.
   - Use `clients/<slug>/` when working on a specific client.
   - Use `template/` when updating shared scripts or skeleton files.
   - Use `scripts/create-client.ps1 <slug>` to scaffold a new client from `template/` without copying `node_modules/`.
2. Install dependencies in that project folder if needed.
   - `npm install`
   - `npm run setup`
3. Read `../../../../docs/SEO-AUDIT-PLAYBOOK.md` for the end-to-end audit flow.
4. Read [references/repo-layout.md](references/repo-layout.md) for folder conventions.
5. Read [references/commands.md](references/commands.md) for exact script usage.
6. Read [references/output-guardrails.md](references/output-guardrails.md) before generating deliverables.

## Workflow

### 1. Choose scope

- Confirm whether the user wants SEO, PPC, or both.
- Confirm the client site, main competitor, target geography, business type, and goal.
- Translate the Claude phrasing in the playbook into normal Codex execution. Use parallel tool calls and subagents only when they help.

### 2. Run research

- Use the scripts in the chosen project's `scripts/` folder instead of rewriting browser automation from scratch.
- Save raw SEO findings into `seo/research/`.
- Save raw PPC findings into `ppc/research/` and imported source files into `ppc/exports/`.

### 3. Fill structured data

- Put synthesized SEO findings into `seo/audit-data.json`.
- Put synthesized PPC findings into `ppc/ppc-data.json`.
- Keep values auditable. Do not invent rankings, traffic, costs, claims, or client metrics.

### 4. Generate deliverables

- Use the existing Node generators for spreadsheet and presentation outputs.
- Write Codex-authored markdown deliverables into `seo/content/` with `codex-` prefixes when Claude versions may sit beside them.
- Preserve existing `claude-*` files unless the user explicitly wants them updated or replaced.

### 5. Validate outputs

- Re-check meta title and description lengths before finalizing.
- Validate schema JSON-LD for malformed values, consistent `@id` usage, and placeholder URLs.
- Verify any claims such as sales volume, ratings, awards, close rates, or ROI numbers against supplied evidence before publishing them.

## Guardrails

- Do not modify `.claude/`, Claude-specific docs, or `claude-*` outputs unless the user explicitly asks.
- Do not touch `Livinginparkcity/` unless the user explicitly points you there.
- Prefer `template/` for shared tooling changes, then mirror to a client folder only if the task calls for it.
- Keep generated dependencies out of Git. Reinstall them locally per project instead.

## References

- [references/repo-layout.md](references/repo-layout.md)
- [references/commands.md](references/commands.md)
- [references/output-guardrails.md](references/output-guardrails.md)
- `../../../../docs/SEO-AUDIT-PLAYBOOK.md`
*** Add File: C:\Dev\site audit\codex\skills\site-audit\references\repo-layout.md
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
*** Add File: C:\Dev\site audit\codex\skills\site-audit\references\commands.md
# Commands

## Setup

Run these commands from the chosen project root such as `template/` or `clients/murray-gardner/`:

```powershell
npm install
npm run setup
```

`npm run setup` installs the Playwright Chromium browser.

## Scaffold a new client

Run this from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\codex\skills\site-audit\scripts\create-client.ps1 <slug>
```

Add `-DryRun` first if you want to preview the copy plan.

## SEO research commands

Run these from the chosen project root:

```powershell
node scripts\crawl-sitemap.js <domain> --analyze
node scripts\check-technical.js <url>
node scripts\browse.js <url> --extract-meta --extract-headings --extract-links --extract-text
node scripts\browse.js <url> --screenshot page.png --full-page
node scripts\ddg-search.js "<query>"
```

Useful examples:

```powershell
node scripts\crawl-sitemap.js livingparkcityutah.com --analyze
node scripts\check-technical.js https://livingparkcityutah.com/
node scripts\browse.js https://livingparkcityutah.com/about/ --extract-meta --extract-headings --extract-text
node scripts\browse.js https://livingparkcityutah.com/ --screenshot homepage.png --full-page
```

## SEO deliverable generation

Run these from the chosen project root after `seo/audit-data.json` is ready:

```powershell
npm run spreadsheet
npm run presentation
npm run generate
```

`npm run generate` creates both the workbook and the deck.

## PPC commands

Run these from the chosen project root:

```powershell
node scripts\parse-google-ads.js .\ppc\exports
npm run ppc-spreadsheet
npm run ppc-presentation
npm run ppc-generate
```

`parse-google-ads.js` reads exported CSV/TSV files and produces structured JSON you can use to populate `ppc/ppc-data.json`.

## Notes

- Use `npm run <script> -- <args>` only when you need to pass arguments through npm.
- Prefer calling `node scripts\...` directly when the script requires many flags.
- Install dependencies separately inside each project folder after a fresh clone.
*** Add File: C:\Dev\site audit\codex\skills\site-audit\references\output-guardrails.md
# Output Guardrails

## Meta tags

- Re-check title and description lengths before finalizing.
- Prefer full page coverage over partial page sets.
- Include enough evidence for QA, such as per-row counts or another explicit validation method.
- Verify any performance claims before using them in titles or descriptions.

## Schema markup

- Validate JSON-LD after drafting it.
- Keep entity `@id` values consistent across pages.
- Watch for corrupted numeric text, missing currency symbols, or malformed string values.
- Do not publish placeholder `sameAs`, ratings, or review data unless the user confirms they are real.
- Prefer complete contact and business fields over partial schema blocks.

## Community pages and blog posts

- Keep factual details aligned across title, description, body copy, and schema.
- Include FAQ-style sections when they improve search and AI-overview usefulness.
- Include internal linking suggestions or embedded internal links for deployment.
- Favor specific local details over generic lifestyle copy.

## Data discipline

- Treat `seo/audit-data.json` and `ppc/ppc-data.json` as the structured source of truth for generated decks and spreadsheets.
- Do not invent rankings, budgets, conversion rates, review counts, or sales stats.
- Flag missing verification instead of silently guessing.

## Parallel-output rule

- Keep Claude outputs intact unless asked to replace them.
- When generating Codex-authored markdown deliverables beside Claude ones, use `codex-` prefixes so both versions can coexist cleanly.
*** Add File: C:\Dev\site audit\codex\skills\site-audit\scripts\create-client.ps1
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Slug,

    [switch]$Force,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Slug -notmatch '^[a-z0-9-]+$') {
    throw "Slug must use lowercase letters, digits, and hyphens only."
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$templateRoot = Join-Path $repoRoot 'template'
$clientsRoot = Join-Path $repoRoot 'clients'
$destinationRoot = Join-Path $clientsRoot $Slug

if (-not (Test-Path -LiteralPath $templateRoot)) {
    throw "Template folder not found: $templateRoot"
}

if ((Test-Path -LiteralPath $destinationRoot) -and -not $Force) {
    throw "Destination already exists: $destinationRoot"
}

function Test-ExcludedPath {
    param(
        [string]$RelativePath
    )

    $normalized = $RelativePath -replace '\\', '/'
    return $normalized -match '(^|/)node_modules(/|$)'
}

function Ensure-Directory {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

$items = Get-ChildItem -LiteralPath $templateRoot -Recurse -Force
$copyCount = 0

if (-not $DryRun) {
    Ensure-Directory -Path $clientsRoot
    if ($Force -and (Test-Path -LiteralPath $destinationRoot)) {
        Remove-Item -LiteralPath $destinationRoot -Recurse -Force
    }
    Ensure-Directory -Path $destinationRoot
}

foreach ($item in $items) {
    $relativePath = $item.FullName.Substring($templateRoot.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
        continue
    }

    if (Test-ExcludedPath -RelativePath $relativePath) {
        continue
    }

    $targetPath = Join-Path $destinationRoot $relativePath

    if ($DryRun) {
        Write-Host "[DRY RUN] $relativePath"
        $copyCount++
        continue
    }

    if ($item.PSIsContainer) {
        Ensure-Directory -Path $targetPath
    } else {
        Ensure-Directory -Path (Split-Path -Parent $targetPath)
        Copy-Item -LiteralPath $item.FullName -Destination $targetPath -Force
    }

    $copyCount++
}

if ($DryRun) {
    Write-Host "Dry run complete. $copyCount items would be copied to $destinationRoot"
} else {
    Write-Host "Client scaffold created at $destinationRoot"
    Write-Host "Next steps:"
    Write-Host "  1. cd `"$destinationRoot`""
    Write-Host "  2. npm install"
    Write-Host "  3. npm run setup"
}
