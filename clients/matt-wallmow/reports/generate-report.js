#!/usr/bin/env node
/**
 * generate-report.js
 *
 * Reads audit-data.json + the HTML template, injects the data as
 * window.AUDIT_DATA, and writes a self-contained HTML report.
 * Optionally renders to PDF via Playwright.
 *
 * Usage:
 *   node generate-report.js --data ../seo/audit-data.json --output ./reports/ [--pdf]
 *
 * If --data is omitted it defaults to ../seo/audit-data.json relative to this script.
 * If --output is omitted it writes next to the data file.
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/*  Parse CLI arguments                                                */
/* ------------------------------------------------------------------ */
const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
}

const wantPdf = args.includes('--pdf');
const dataPath = path.resolve(getArg('--data', path.join(__dirname, '..', 'seo', 'audit-data.json')));
const outputDir = path.resolve(getArg('--output', path.dirname(dataPath)));
const templatePath = path.join(__dirname, 'seo-audit-report.html');
const stylesPath = path.join(__dirname, 'report-styles.css');

/* ------------------------------------------------------------------ */
/*  Validate inputs                                                    */
/* ------------------------------------------------------------------ */
if (!fs.existsSync(dataPath)) {
  console.error(`\x1b[31mError:\x1b[0m Data file not found: ${dataPath}`);
  process.exit(1);
}

if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError:\x1b[0m Template not found: ${templatePath}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  Read files                                                         */
/* ------------------------------------------------------------------ */
console.log(`\x1b[36mReading data:\x1b[0m  ${dataPath}`);
const auditData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`\x1b[36mReading template:\x1b[0m ${templatePath}`);
let html = fs.readFileSync(templatePath, 'utf-8');

// Read custom CSS and inline it into the HTML so the output is truly self-contained
let customCSS = '';
if (fs.existsSync(stylesPath)) {
  customCSS = fs.readFileSync(stylesPath, 'utf-8');
}

/* ------------------------------------------------------------------ */
/*  Inject data + inline CSS                                           */
/* ------------------------------------------------------------------ */
const dataScript = `<script>window.AUDIT_DATA = ${JSON.stringify(auditData, null, 0)};</script>`;

// Insert data script right after <head> opening and before any other script
html = html.replace('<head>', `<head>\n  ${dataScript}`);

// Inline the CSS: replace the external stylesheet link with a <style> block
if (customCSS) {
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="report-styles\.css"\s*\/?>/,
    `<style>\n${customCSS}\n  </style>`
  );
}

/* ------------------------------------------------------------------ */
/*  Derive output filename from client data                            */
/* ------------------------------------------------------------------ */
const clientName = (auditData.client?.name || auditData.client?.company || auditData.client?.website || 'report')
  .replace(/[^a-zA-Z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

const dateStr = new Date().toISOString().slice(0, 10);
const baseName = `seo-audit-${clientName}-${dateStr}`;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const htmlOutPath = path.join(outputDir, `${baseName}.html`);
fs.writeFileSync(htmlOutPath, html, 'utf-8');
console.log(`\x1b[32m  HTML report written:\x1b[0m ${htmlOutPath}`);

/* ------------------------------------------------------------------ */
/*  PDF rendering (optional)                                           */
/* ------------------------------------------------------------------ */
async function renderPDF() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\x1b[31mError:\x1b[0m Playwright is required for PDF generation.');
    console.error('  Run: npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  const pdfPath = path.join(outputDir, `${baseName}.pdf`);
  console.log(`\x1b[36mRendering PDF...\x1b[0m`);

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  // Navigate to the generated HTML file
  await page.goto(`file://${htmlOutPath}`, { waitUntil: 'networkidle' });

  // Wait for the report to render (loading spinner gone)
  await page.waitForSelector('#report:not(.hidden)', { timeout: 30000 });

  // Give charts a moment to finish animating
  await page.waitForTimeout(2000);

  // Expand all collapsibles for print
  await page.evaluate(() => {
    document.querySelectorAll('.collapsible-header').forEach(h => {
      h.classList.add('open');
      h.nextElementSibling?.classList.add('open');
    });
    // Show all tab panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('active'));
  });

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="font-size:8px; color:#94a3b8; width:100%; text-align:center; padding:0 0.5in;">
        <span>SEO Audit Report</span>
        <span style="margin-left:2em;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();
  console.log(`\x1b[32m  PDF report written:\x1b[0m  ${pdfPath}`);
}

if (wantPdf) {
  renderPDF().catch(err => {
    console.error('\x1b[31mPDF generation failed:\x1b[0m', err.message);
    process.exit(1);
  });
} else {
  console.log(`\n\x1b[90mTip: Add --pdf to also generate a PDF version.\x1b[0m`);
}
