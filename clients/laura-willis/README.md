# SEO Audit Template

Reusable starter kit for running a full SEO audit on any website using Claude Code.

## Quick Start

```bash
# 1. Copy this template into a new project folder
cp -r template/ clients/new-client-name/
cd clients/new-client-name/

# 2. Install dependencies
npm install
npm run setup   # installs Playwright Chromium

# 3. Run the audit using the /seo-audit skill in Claude Code
#    Just type: /seo-audit <domain>
#    Or follow SEO-AUDIT-PLAYBOOK.md manually
```

## Scripts

| Script | Usage | Purpose |
|--------|-------|---------|
| `browse.js` | `node scripts/browse.js <url> [flags]` | Navigate to any URL, extract meta/links/text/headings, take screenshots |
| `crawl-sitemap.js` | `node scripts/crawl-sitemap.js <domain> [--analyze]` | Parse robots.txt + sitemap.xml, categorize URLs, analyze pages |
| `ddg-search.js` | `node scripts/ddg-search.js "<query>" [--target d1,d2]` | DuckDuckGo SERP scraping with target domain position tracking |
| `check-technical.js` | `node scripts/check-technical.js <url>` | Schema markup, alt text, social meta, heading structure, technical signals |
| `generate-spreadsheet.js` | `npm run spreadsheet` | Generates 6-sheet Excel workbook from `audit-data.json` |
| `generate-presentation.js` | `npm run presentation` | Generates 15-slide PowerPoint from `audit-data.json` |

## Generating Client Deliverables

After completing the audit, fill in `audit-data.json` with your findings, then:

```bash
npm run generate    # creates both .xlsx and .pptx in deliverables/
```

Or generate individually: `npm run spreadsheet` / `npm run presentation`

## Output Directories

- `results/` — Raw research and analysis markdown files
- `deliverables/` — Client-ready content (meta tags, schema, blog posts, spreadsheet, presentation)

## Full Process

See `SEO-AUDIT-PLAYBOOK.md` for the complete 5-phase process with agent definitions and step-by-step instructions.
