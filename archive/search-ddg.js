const { chromium } = require('playwright');

async function searchDDG(query) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.result').forEach((el) => {
        const titleEl = el.querySelector('.result__title a, .result__a');
        const snippetEl = el.querySelector('.result__snippet');
        const urlEl = el.querySelector('.result__url, .result__extras__url');
        if (titleEl) {
          let href = titleEl.href || '';
          // DuckDuckGo sometimes uses redirects
          if (href.includes('duckduckgo.com/l/?')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) href = decodeURIComponent(match[1]);
          }
          let domain = '';
          try { domain = new URL(href).hostname; } catch(e) {
            if (urlEl) domain = urlEl.textContent.trim();
          }
          items.push({
            position: items.length + 1,
            title: titleEl.textContent.trim(),
            url: href,
            domain: domain,
            snippet: snippetEl ? snippetEl.textContent.trim().substring(0, 200) : '',
          });
        }
      });
      return { organic: items };
    });

    console.log(`=== DDG RESULTS FOR: "${query}" ===\n`);
    console.log(`--- Organic Results (${results.organic.length}) ---`);
    results.organic.forEach(r => {
      console.log(`  #${r.position}: ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Domain: ${r.domain}`);
      if (r.snippet) console.log(`    Snippet: ${r.snippet}`);
      console.log('');
    });

    console.log('\n--- TARGET SITE POSITIONS ---');
    const targets = ['livingparkcityutah.com', 'laurawillisrealestate.com'];
    targets.forEach(target => {
      const found = results.organic.filter(r => r.domain.includes(target.replace('www.', '')));
      if (found.length > 0) {
        found.forEach(f => console.log(`  ${target}: Position #${f.position} - "${f.title}"`));
      } else {
        console.log(`  ${target}: NOT FOUND in top ${results.organic.length} results`);
      }
    });

    return results;
  } catch (err) {
    console.error('Error:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}

const query = process.argv[2];
if (!query) {
  console.error('Usage: node search-ddg.js "<query>"');
  process.exit(1);
}
searchDDG(query);
