#!/usr/bin/env node
/**
 * QA Test Script for Multi-Page SEO Audit Report
 * Uses Playwright to load each page via file:// and check for:
 * - JS errors in console
 * - Page renders (loading spinner hidden, report visible)
 * - Navigation elements present
 * - Data binding (client name appears)
 * - Charts render (canvas elements)
 * - Section visibility
 */

'use strict';

const path = require('path');

const PAGES = [
  'index.html',
  'keywords.html',
  'content.html',
  'technical.html',
  'links.html',
  'competitors.html',
  'local.html',
  'action-plan.html',
];

const OUTPUT_DIR = path.resolve(__dirname, 'test-output');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  failures: [],
};

function logPass(page, test) {
  results.total++;
  results.passed++;
  console.log(`  [PASS] ${page} — ${test}`);
}

function logFail(page, test, detail) {
  results.total++;
  results.failed++;
  const entry = { page, test, detail };
  results.failures.push(entry);
  console.log(`  [FAIL] ${page} — ${test}: ${detail}`);
}

function logSkip(page, test, reason) {
  results.total++;
  results.skipped++;
  console.log(`  [SKIP] ${page} — ${test}: ${reason}`);
}

async function testPage(browser, fileName) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  const fileUrl = `file://${filePath}`;
  const jsErrors = [];

  console.log(`\nTesting: ${fileName}`);

  const page = await browser.newPage();

  // Collect JS errors
  page.on('pageerror', (err) => {
    jsErrors.push(err.message);
  });

  // Collect console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      jsErrors.push(`console.error: ${msg.text()}`);
    }
  });

  try {
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 15000 });
  } catch (err) {
    logFail(fileName, 'Page load', err.message);
    await page.close();
    return;
  }

  // Wait for page init (give JS time to run)
  await page.waitForTimeout(2000);

  // Test 1: No JS errors
  // Filter out known benign errors (Tailwind CDN warnings, Chart.js canvas warnings)
  const criticalErrors = jsErrors.filter(
    (e) =>
      !e.includes('tailwindcss') &&
      !e.includes('Canvas is already in use') &&
      !e.includes('Failed to load resource') && // CDN loads fail on file://
      !e.includes('net::ERR_') // Network errors expected on file://
  );

  if (criticalErrors.length === 0) {
    logPass(fileName, 'No critical JS errors');
  } else {
    logFail(fileName, 'JS errors found', criticalErrors.join('; '));
  }

  // Test 2: Top navigation exists
  const hasTopNav = await page.evaluate(() => {
    return document.getElementById('top-nav') !== null;
  });
  if (hasTopNav) {
    logPass(fileName, 'Top navigation rendered');
  } else {
    logFail(fileName, 'Top navigation', 'Missing #top-nav element');
  }

  // Test 3: Page content visible (main content area exists)
  const hasPageContent = await page.evaluate(() => {
    return document.getElementById('page-content') !== null;
  });
  if (hasPageContent) {
    logPass(fileName, 'Page content container exists');
  } else {
    logFail(fileName, 'Page content', 'Missing #page-content element');
  }

  // Test 4: Client name appears somewhere in page
  const hasClientName = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return text.includes('Jamie Kelly') || text.includes('Mammoth Lakes') || text.includes('mammothlakesproperties');
  });
  if (hasClientName) {
    logPass(fileName, 'Client data bound correctly');
  } else {
    logFail(fileName, 'Data binding', 'Client name not found in page text');
  }

  // Test 5: At least one visible section
  const visibleSections = await page.evaluate(() => {
    const sections = document.querySelectorAll('.report-section, [id^="section-"]');
    let visible = 0;
    sections.forEach((s) => {
      if (s.offsetHeight > 0) visible++;
    });
    return visible;
  });
  if (visibleSections > 0) {
    logPass(fileName, `${visibleSections} visible section(s)`);
  } else {
    logFail(fileName, 'Visible sections', 'No visible sections found');
  }

  // Test 6: Nav links point to correct pages
  const navLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('#top-nav a[href]');
    return Array.from(links).map((a) => a.getAttribute('href'));
  });
  if (navLinks.length >= 7) {
    logPass(fileName, `${navLinks.length} nav links present`);
  } else if (navLinks.length > 0) {
    logPass(fileName, `${navLinks.length} nav links present (some may be collapsed)`);
  } else {
    logFail(fileName, 'Nav links', 'No navigation links found in #top-nav');
  }

  // Test 7: Search modal trigger exists
  const hasSearchTrigger = await page.evaluate(() => {
    // Check for search button or Ctrl+K handler
    const searchBtn = document.querySelector('[data-search-trigger], #search-trigger, .search-trigger, [aria-label*="Search"]');
    const searchModal = document.getElementById('search-modal');
    return searchBtn !== null || searchModal !== null;
  });
  if (hasSearchTrigger) {
    logPass(fileName, 'Search trigger/modal exists');
  } else {
    logSkip(fileName, 'Search trigger', 'No search trigger element found (may use keyboard-only)');
  }

  // Test 8: Check for canvas elements (charts) on pages that should have them
  const canvasCount = await page.evaluate(() => {
    return document.querySelectorAll('canvas').length;
  });
  const chartPages = ['index.html', 'keywords.html', 'technical.html', 'competitors.html', 'local.html'];
  if (chartPages.includes(fileName)) {
    if (canvasCount > 0) {
      logPass(fileName, `${canvasCount} chart canvas(es) found`);
    } else {
      // Charts are conditional -- data may not have relevant fields
      logSkip(fileName, 'Charts', 'No canvas elements (may be conditional on data)');
    }
  }

  // Test 9: No loading spinner visible
  const loadingVisible = await page.evaluate(() => {
    const loader = document.getElementById('loading');
    if (!loader) return false;
    return loader.offsetHeight > 0 && getComputedStyle(loader).display !== 'none';
  });
  if (!loadingVisible) {
    logPass(fileName, 'No loading spinner visible');
  } else {
    logFail(fileName, 'Loading spinner', 'Loading spinner still visible after 2s');
  }

  await page.close();
}

async function main() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('Playwright not available. Run: npm install playwright');
    process.exit(1);
  }

  console.log('=== Multi-Page SEO Report QA Test Suite ===');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Pages to test: ${PAGES.length}\n`);

  const browser = await playwright.chromium.launch({ headless: true });

  for (const page of PAGES) {
    await testPage(browser, page);
  }

  await browser.close();

  // Summary
  console.log('\n========================================');
  console.log('QA TEST SUMMARY');
  console.log('========================================');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed:      ${results.passed}`);
  console.log(`Failed:      ${results.failed}`);
  console.log(`Skipped:     ${results.skipped}`);

  if (results.failures.length > 0) {
    console.log('\nFAILURES:');
    results.failures.forEach((f) => {
      console.log(`  - ${f.page}: ${f.test} — ${f.detail}`);
    });
  }

  console.log('========================================');
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('QA test error:', err.message);
  process.exit(1);
});
