// Technical SEO checks via Playwright
// Usage: node scripts/check-technical.js <url> [--headed]
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  if (!url) {
    console.error('Usage: node scripts/check-technical.js <url> [--headed]');
    process.exit(1);
  }

  const headed = args.includes('--headed');
  const targetUrl = url.startsWith('http') ? url : `https://${url}`;

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 500 : 0,
  });
  const page = await browser.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Check for schema/structured data
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => {
        try { return JSON.parse(s.textContent); } catch(e) { return s.textContent; }
      });
    });
    console.log('=== SCHEMA/STRUCTURED DATA ===');
    console.log(JSON.stringify(schemas, null, 2));

    // Check images for alt text
    const imgData = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt === '');
      const withAlt = Array.from(imgs).filter(i => i.alt && i.alt !== '');
      return {
        total: imgs.length,
        missingAlt: noAlt.length,
        sampleMissing: noAlt.slice(0, 10).map(i => i.src ? i.src.substring(0, 100) : 'no src'),
        sampleWithAlt: withAlt.slice(0, 5).map(i => ({src: i.src ? i.src.substring(0, 80) : '', alt: i.alt}))
      };
    });
    console.log('\n=== IMAGE ALT TEXT ANALYSIS ===');
    console.log(JSON.stringify(imgData, null, 2));

    // Check open graph / twitter cards
    const socialMeta = await page.evaluate(() => {
      const metas = {};
      document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(m => {
        metas[m.getAttribute('property') || m.getAttribute('name')] = m.getAttribute('content');
      });
      return metas;
    });
    console.log('\n=== SOCIAL META TAGS ===');
    console.log(JSON.stringify(socialMeta, null, 2));

    // Check page technical signals
    const perfData = await page.evaluate(() => {
      return {
        totalDomElements: document.querySelectorAll('*').length,
        totalScripts: document.querySelectorAll('script').length,
        totalStylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        totalIframes: document.querySelectorAll('iframe').length,
        viewport: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null,
        charset: document.querySelector('meta[charset]') ? document.querySelector('meta[charset]').getAttribute('charset') : null,
        lang: document.documentElement.lang,
        favicons: Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l => l.href),
      };
    });
    console.log('\n=== PAGE TECHNICAL DATA ===');
    console.log(JSON.stringify(perfData, null, 2));

    // Check for hreflang
    const hreflang = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('link[hreflang]')).map(l => ({
        hreflang: l.getAttribute('hreflang'),
        href: l.href
      }));
    });
    console.log('\n=== HREFLANG TAGS ===');
    console.log(JSON.stringify(hreflang, null, 2));

    // Check canonical tags
    const canonical = await page.evaluate(() => {
      const el = document.querySelector('link[rel="canonical"]');
      return el ? el.href : null;
    });
    console.log('\n=== CANONICAL TAG ===');
    console.log(canonical || 'MISSING');

    // Check heading structure
    const headings = await page.evaluate(() => {
      const results = {};
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
        const els = document.querySelectorAll(tag);
        results[tag] = {
          count: els.length,
          text: Array.from(els).slice(0, 5).map(el => el.textContent.trim().substring(0, 100))
        };
      });
      return results;
    });
    console.log('\n=== HEADING STRUCTURE ===');
    console.log(JSON.stringify(headings, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
