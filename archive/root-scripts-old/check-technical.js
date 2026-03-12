const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.livingparkcityutah.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
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

  await browser.close();
})();
