const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });
  const p = await c.newPage();
  await p.goto('https://www.google.com/search?q=park+city+real+estate&num=20&gl=us', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(3000);

  const html = await p.content();
  console.log('Page length:', html.length);
  console.log('Has #search:', html.includes('id="search"'));
  console.log('Has #rso:', html.includes('id="rso"'));
  console.log('Has captcha:', html.includes('captcha'));
  console.log('Has consent:', html.includes('consent'));
  console.log('Has sorry:', html.includes('sorry'));
  console.log('Has unusual traffic:', html.includes('unusual traffic'));

  // Try different selectors
  const h3count = await p.$$eval('h3', els => els.length);
  console.log('H3 count:', h3count);

  const gCount = await p.$$eval('.g', els => els.length);
  console.log('.g count:', gCount);

  const allLinks = await p.$$eval('a[href]', els => els.slice(0, 30).map(e => ({ href: e.href, text: e.textContent.substring(0, 80) })));
  console.log('First 30 links:');
  allLinks.forEach((l, i) => console.log(`  ${i}: ${l.text} -> ${l.href.substring(0, 100)}`));

  // Save screenshot
  await p.screenshot({ path: '/mnt/c/Dev/site audit/results/google-debug.png', fullPage: true });
  console.log('\nScreenshot saved to results/google-debug.png');

  await b.close();
})();
