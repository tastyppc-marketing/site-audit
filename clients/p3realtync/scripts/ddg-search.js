// DuckDuckGo search via Playwright - CAPTCHA-free alternative to Google
// Usage: node scripts/ddg-search.js "<query>" [--headed] [--target domain1,domain2]
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const query = args[0];
  if (!query) {
    console.error('Usage: node scripts/ddg-search.js "<query>" [--headed] [--target domain1,domain2]');
    process.exit(1);
  }

  const headed = args.includes('--headed');
  const targetIdx = args.indexOf('--target');
  const targets = targetIdx !== -1 ? args[targetIdx + 1].split(',') : [];

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 500 : 0,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[data-testid="result"]').forEach((el, idx) => {
        const titleEl = el.querySelector('h2 a, [data-testid="result-title-a"]');
        const snippetEl = el.querySelector('[data-result="snippet"], .kY2IgmnCmOGjharHErah');
        if (titleEl) {
          items.push({
            position: idx + 1,
            title: titleEl.textContent.trim(),
            url: titleEl.href,
            domain: titleEl.href ? new URL(titleEl.href).hostname : '',
            snippet: snippetEl ? snippetEl.textContent.trim() : '',
          });
        }
      });
      return items;
    });

    console.log(`=== DUCKDUCKGO RESULTS FOR: "${query}" ===\n`);
    console.log(`--- Results (${results.length}) ---`);
    results.forEach(r => {
      console.log(`  #${r.position}: ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Domain: ${r.domain}`);
      if (r.snippet) console.log(`    Snippet: ${r.snippet.substring(0, 200)}`);
      console.log('');
    });

    if (targets.length > 0) {
      console.log('\n--- TARGET SITE POSITIONS ---');
      targets.forEach(target => {
        const found = results.filter(r => r.domain.includes(target.replace('www.', '')));
        if (found.length > 0) {
          found.forEach(f => console.log(`  ${target}: Position #${f.position} - "${f.title}"`));
        } else {
          console.log(`  ${target}: NOT FOUND in results`);
        }
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
