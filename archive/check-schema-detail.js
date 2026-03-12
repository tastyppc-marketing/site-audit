const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Check a community page that has schema
  await page.goto('https://www.livingparkcityutah.com/aerie/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  const schemas = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => {
      try { return JSON.parse(s.textContent); } catch(e) { return s.textContent; }
    });
  });
  console.log('=== SCHEMA ON AERIE PAGE ===');
  console.log(JSON.stringify(schemas, null, 2));

  // Also check OG tags on community pages
  const ogTags = await page.evaluate(() => {
    const metas = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(m => {
      metas[m.getAttribute('property')] = m.getAttribute('content');
    });
    return metas;
  });
  console.log('\n=== OG TAGS ===');
  console.log(JSON.stringify(ogTags, null, 2));

  await browser.close();
})();
