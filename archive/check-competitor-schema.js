const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.laurawillisrealestate.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const schemas = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => {
      try { return JSON.parse(s.textContent); } catch(e) { return s.textContent; }
    });
  });
  console.log('=== HOMEPAGE SCHEMA ===');
  console.log(JSON.stringify(schemas, null, 2));

  const imgData = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt === '');
    return {
      total: imgs.length,
      missingAlt: noAlt.length
    };
  });
  console.log('\n=== HOMEPAGE IMAGE ALT ===');
  console.log(JSON.stringify(imgData, null, 2));

  const socialMeta = await page.evaluate(() => {
    const metas = {};
    document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(m => {
      metas[m.getAttribute('property') || m.getAttribute('name')] = m.getAttribute('content');
    });
    return metas;
  });
  console.log('\n=== SOCIAL META ===');
  console.log(JSON.stringify(socialMeta, null, 2));

  const perfData = await page.evaluate(() => {
    return {
      totalDomElements: document.querySelectorAll('*').length,
      totalScripts: document.querySelectorAll('script').length,
      totalIframes: document.querySelectorAll('iframe').length,
    };
  });
  console.log('\n=== TECHNICAL ===');
  console.log(JSON.stringify(perfData, null, 2));

  // Check blog post schema
  await page.goto('https://www.laurawillisrealestate.com/blog/deer-valley-expansion-luxury-real-estate-east-village/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const blogSchemas = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => {
      try { return JSON.parse(s.textContent); } catch(e) { return s.textContent; }
    });
  });
  console.log('\n=== BLOG POST SCHEMA ===');
  console.log(JSON.stringify(blogSchemas, null, 2));

  await browser.close();
})();
