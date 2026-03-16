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
