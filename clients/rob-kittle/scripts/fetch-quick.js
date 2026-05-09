// Lightweight fetch using domcontentloaded for stubborn sites
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const getMeta = (n) => {
        const el = document.querySelector(`meta[name="${n}"], meta[property="${n}"]`);
        return el ? el.getAttribute('content') : null;
      };
      const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent.slice(0, 800));
      return {
        title: document.title,
        description: getMeta('description'),
        ogTitle: getMeta('og:title'),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        h1: Array.from(document.querySelectorAll('h1')).map(e => e.textContent.trim()),
        h2: Array.from(document.querySelectorAll('h2')).map(e => e.textContent.trim()).slice(0, 30),
        h3: Array.from(document.querySelectorAll('h3')).map(e => e.textContent.trim()).slice(0, 30),
        jsonLd: ld,
        navLinks: Array.from(document.querySelectorAll('nav a, header a')).map(a => ({ t: a.textContent.trim().slice(0,80), h: a.href })).slice(0, 60),
        textSnip: document.body.innerText.slice(0, 4000),
        wordCount: document.body.innerText.split(/\s+/).length,
      };
    });
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await browser.close();
  }
})();
