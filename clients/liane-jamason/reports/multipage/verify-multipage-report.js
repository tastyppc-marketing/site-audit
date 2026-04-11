#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const CLIENT_ROOT = path.resolve(__dirname, '..', '..');
const REPORT_ROOT = path.join(CLIENT_ROOT, 'reports', 'multipage');
const DATA_PATH = path.join(CLIENT_ROOT, 'seo', 'audit-data.json');
const OUTPUT_DIR = path.join(CLIENT_ROOT, 'troubleshooting', 'screenshots', 'verified');
const BUILD_DIR = path.join('/tmp', 'liane-jamason-multipage-verification-build');
const SERVER_URL = 'http://localhost:8080';
const SERVER_PORT = 8080;
const REPORT_DATE = '2026-04-08';

const PAGES = [
  'index.html',
  'keywords.html',
  'content.html',
  'technical.html',
  'links.html',
  'backlink-opportunities.html',
  'competitors.html',
  'local.html',
  'action-plan.html',
];

const TARGET_COMPETITORS = [
  'Avalon Group',
  'Eagan Luxury',
  'Smith & Associates',
];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function uniqueTexts(values) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const text = cleanText(value);
    if (!text) return;

    const key = text.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    result.push(text);
  });

  return result;
}

function clipText(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function escapeTableCell(value) {
  return cleanText(value || 'Not found').replace(/\|/g, '\\|');
}

function extractSnippet(text, matcher, radius) {
  const source = cleanText(text);
  const regex = new RegExp(matcher.source, matcher.flags.includes('g') ? matcher.flags : `${matcher.flags}g`);
  const match = regex.exec(source);

  if (!match) return '';

  const start = Math.max(0, match.index - radius);
  const end = Math.min(source.length, match.index + match[0].length + radius);
  return cleanText(source.slice(start, end));
}

function findFirstMatch(candidates, matchers) {
  for (const candidate of candidates) {
    const text = cleanText(candidate);
    if (!text) continue;

    for (const matcher of matchers) {
      if (matcher.test(text)) {
        return text;
      }
    }
  }

  return '';
}

function collectMatcherHits(candidates, matchers) {
  const hits = [];

  candidates.forEach((candidate) => {
    const text = cleanText(candidate);
    if (!text) return;

    if (matchers.some((matcher) => matcher.test(text))) {
      hits.push(text);
    }
  });

  return uniqueTexts(hits);
}

function sanitizeFailureText(text) {
  const value = cleanText(text);
  return value || 'Not found';
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateReportBuild() {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });

  const generatorPath = path.join(REPORT_ROOT, 'generate-multipage-report.js');
  const result = spawnSync(
    process.execPath,
    [generatorPath, '--data', DATA_PATH, '--output', BUILD_DIR, '--inline'],
    {
      cwd: REPORT_ROOT,
      encoding: 'utf8',
    }
  );

  if (result.status !== 0) {
    const detail = cleanText([result.stdout, result.stderr].filter(Boolean).join('\n'));
    throw new Error(`Failed to generate report build. ${detail}`);
  }
}

async function fulfillLocalRoute(route, rootDir) {
  const url = new URL(route.request().url());
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/favicon.ico') {
    await route.fulfill({ status: 204, body: '' });
    return;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const resolvedPath = path.resolve(rootDir, `.${pathname}`);
  if (!resolvedPath.startsWith(rootDir)) {
    await route.fulfill({
      status: 403,
      contentType: 'text/plain; charset=utf-8',
      body: 'Forbidden',
    });
    return;
  }

  let filePath = resolvedPath;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    await route.fulfill({
      status: 404,
      contentType: 'text/plain; charset=utf-8',
      body: 'Not found',
    });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const body = await fs.promises.readFile(filePath);

  await route.fulfill({
    status: 200,
    contentType: mimeType,
    body,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function canReachServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.setTimeout(2500, () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => resolve(false));
  });
}

function buildMarkdown(results) {
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = results.length - passed;

  const lines = [
    '# Liane Jamason Report Verification',
    `Date: ${REPORT_DATE}`,
    `Server: ${SERVER_URL}`,
    '',
    '## Results',
    '',
    '| Page | Client Name | Location | Grade | Competitors | Status |',
    '|------|------------|----------|-------|-------------|--------|',
  ];

  results.forEach((result) => {
    lines.push(
      `| ${escapeTableCell(result.page)} | ${escapeTableCell(result.clientName)} | ${escapeTableCell(result.location)} | ${escapeTableCell(result.grade)} | ${escapeTableCell(result.competitors)} | ${result.status} |`
    );
  });

  lines.push('');
  lines.push('## Summary');
  lines.push(`- Total pages: ${results.length}`);
  lines.push(`- Passed: ${passed}`);
  lines.push(`- Failed: ${failed}`);
  lines.push('');

  if (failed > 0) {
    lines.push('## Failures');
    lines.push('');
    results
      .filter((result) => result.status === 'FAIL')
      .forEach((result) => {
        lines.push(`- ${result.page}: ${result.failReasons.join('; ')}`);
      });
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function evaluatePageSnapshot(pageName, snapshot) {
  const candidateTexts = uniqueTexts(
    []
      .concat(snapshot.title || [])
      .concat(snapshot.prominentTexts || [])
      .concat(snapshot.headingTexts || [])
      .concat(snapshot.gradeTexts || [])
      .concat(snapshot.competitorTexts || [])
  );

  const bodyText = cleanText(snapshot.bodyText);

  const clientName =
    findFirstMatch(candidateTexts, [/Liane Jamason/i]) ||
    extractSnippet(bodyText, /Liane Jamason/i, 70) ||
    'Not found';

  const location =
    findFirstMatch(candidateTexts, [/St\.?\s*Petersburg/i, /\bSt\.?\s*Pete\b/i]) ||
    extractSnippet(bodyText, /St\.?\s*Petersburg|St\.?\s*Pete/i, 70) ||
    'Not found';

  const grade =
    findFirstMatch(snapshot.gradeTexts || [], [/\bD\+\b/i]) ||
    extractSnippet(bodyText, /\bD\+\b/i, 40) ||
    'Not found';

  const foundCompetitors = TARGET_COMPETITORS.filter((name) => {
    const matcher = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return matcher.test(bodyText) || (snapshot.competitorTexts || []).some((text) => matcher.test(text));
  });

  const competitors = foundCompetitors.length ? foundCompetitors.join(', ') : 'Not found';

  const legacyClientTexts = collectMatcherHits(
    candidateTexts.concat(bodyText ? [extractSnippet(bodyText, /Jamie Kelly/i, 70)] : []),
    [/Jamie Kelly/i]
  );
  const legacyLocationTexts = collectMatcherHits(
    candidateTexts.concat(bodyText ? [extractSnippet(bodyText, /Mammoth Lakes/i, 70)] : []),
    [/Mammoth Lakes/i]
  );
  const badGradeTexts = collectMatcherHits(snapshot.gradeTexts || [], [/\bB\+\b/i]);
  const mammothCompetitorTexts = collectMatcherHits(
    snapshot.competitorTexts || [],
    [/\bMammoth\b/i]
  );

  const failReasons = [];

  if (clientName === 'Not found') {
    failReasons.push('Client name missing: expected visible "Liane Jamason"');
  }

  if (legacyClientTexts.length) {
    failReasons.push(`Legacy client text found: "${sanitizeFailureText(legacyClientTexts[0])}"`);
  }

  if (location === 'Not found') {
    failReasons.push('Location missing: expected visible "St. Petersburg" or "St Pete"');
  }

  if (legacyLocationTexts.length) {
    failReasons.push(`Legacy location text found: "${sanitizeFailureText(legacyLocationTexts[0])}"`);
  }

  if (grade === 'Not found') {
    failReasons.push('Grade missing: expected visible "D+"');
  }

  if (badGradeTexts.length) {
    failReasons.push(`Unexpected grade text found: "${sanitizeFailureText(badGradeTexts[0])}"`);
  }

  if (!foundCompetitors.length) {
    failReasons.push('Competitor text missing: expected Avalon Group, Eagan Luxury, or Smith & Associates');
  }

  if (mammothCompetitorTexts.length) {
    failReasons.push(`Legacy competitor text found: "${sanitizeFailureText(mammothCompetitorTexts[0])}"`);
  }

  return {
    page: pageName,
    clientName: clipText(clientName, 140) || 'Not found',
    location: clipText(location, 140) || 'Not found',
    grade: clipText(grade, 80) || 'Not found',
    competitors: clipText(competitors, 140) || 'Not found',
    status: failReasons.length ? 'FAIL' : 'PASS',
    failReasons,
  };
}

async function verifyPage(context, pageName) {
  const pageUrl = `${SERVER_URL}/${pageName}`;
  const screenshotPath = path.join(OUTPUT_DIR, pageName.replace(/\.html$/, '.png'));
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.tailwind = window.tailwind || {};

    if (typeof window.Chart === 'undefined') {
      function ChartStub(ctx, config) {
        this.ctx = ctx;
        this.config = config || {};
      }

      ChartStub.prototype.destroy = function destroy() {};
      ChartStub.prototype.update = function update() {};
      ChartStub.defaults = {};
      window.Chart = ChartStub;
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      fullPage: true,
      path: screenshotPath,
    });

    const snapshot = await page.evaluate(() => {
      function clean(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
      }

      function collect(selectors, limit) {
        const values = [];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((element) => {
            const text = clean(element.innerText || element.textContent || '');
            if (text) values.push(text);
          });
        });

        const seen = new Set();
        const unique = [];

        values.forEach((value) => {
          const key = value.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          unique.push(value);
        });

        return unique.slice(0, limit);
      }

      return {
        title: clean(document.title || ''),
        bodyText: clean(document.body ? (document.body.innerText || document.body.textContent || '') : ''),
        prominentTexts: collect(
          ['h1', 'header', 'nav', '.client-name', '.hero-title', '.report-client', '.section-heading', '.section-sub'],
          80
        ),
        headingTexts: collect(['h1', 'h2', 'h3', 'h4'], 80),
        gradeTexts: collect(
          ['.grade', '.overall-grade', '.score-badge', '.grade-badge', '#hero-grade', '[class*="grade"]', '[class*="score"]'],
          40
        ),
        competitorTexts: collect(
          ['[class*="competitor"]', '[id*="competitor"]', 'table', 'li', 'h2', 'h3', 'h4', 'p'],
          200
        ),
      };
    });

    return evaluatePageSnapshot(pageName, snapshot);
  } catch (error) {
    return {
      page: pageName,
      clientName: 'Not found',
      location: 'Not found',
      grade: 'Not found',
      competitors: 'Not found',
      status: 'FAIL',
      failReasons: [`Runtime error: ${cleanText(error.message)}`],
    };
  } finally {
    await page.close();
  }
}

function logResult(result) {
  console.log(`\nPage: ${result.page}`);
  console.log(`Client Name: ${result.clientName}`);
  console.log(`Location: ${result.location}`);
  console.log(`Grade: ${result.grade}`);
  console.log(`Competitors: ${result.competitors}`);
  console.log(`Status: ${result.status}`);

  if (result.failReasons.length) {
    console.log(`Fail Reasons: ${result.failReasons.join(' | ')}`);
  }
}

async function main() {
  ensureOutputDir();
  generateReportBuild();

  const usingExistingServer = await canReachServer(`${SERVER_URL}/index.html`);
  console.log(
    usingExistingServer
      ? `Using existing server at ${SERVER_URL}`
      : `Using Playwright route fulfillment for ${SERVER_URL} from ${BUILD_DIR}`
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
  });

  if (!usingExistingServer) {
    await context.route(`${SERVER_URL}/**`, (route) => fulfillLocalRoute(route, BUILD_DIR));
  }

  const results = [];

  try {
    for (const pageName of PAGES) {
      const result = await verifyPage(context, pageName);
      results.push(result);
      logResult(result);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const markdown = buildMarkdown(results);
  const reportPath = path.join(OUTPUT_DIR, 'VERIFICATION.md');
  fs.writeFileSync(reportPath, markdown, 'utf8');

  const failed = results.filter((result) => result.status === 'FAIL').length;
  const passed = results.length - failed;

  console.log('\nSummary');
  console.log(`Total pages: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Verification report: ${reportPath}`);

  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(cleanText(error && error.stack ? error.stack : error));
  process.exit(1);
});
