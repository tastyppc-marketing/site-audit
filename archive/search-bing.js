const { chromium } = require('playwright');

async function searchBing(query) {
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
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=30`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('#b_results > li.b_algo').forEach((el, idx) => {
        const titleEl = el.querySelector('h2 a');
        const snippetEl = el.querySelector('.b_caption p, .b_algoSlug');
        if (titleEl) {
          const href = titleEl.href;
          let domain = '';
          try { domain = new URL(href).hostname; } catch(e) {}
          items.push({
            position: items.length + 1,
            title: titleEl.textContent.trim(),
            url: href,
            domain: domain,
            snippet: snippetEl ? snippetEl.textContent.trim().substring(0, 200) : '',
          });
        }
      });

      // Related searches (similar to PAA)
      const related = [];
      document.querySelectorAll('.b_rs ul li a, .b_algo .b_vList li a').forEach(el => {
        const text = el.textContent.trim();
        if (text && !related.includes(text)) related.push(text);
      });

      // Local results
      const localPack = [];
      document.querySelectorAll('.b_localA .b_promtxt, .b_entityTitle').forEach(el => {
        const text = el.textContent.trim();
        if (text) localPack.push(text);
      });

      return { organic: items, relatedSearches: related, localPack };
    });

    console.log(`=== BING RESULTS FOR: "${query}" ===\n`);

    if (results.localPack.length > 0) {
      console.log('--- Local Pack ---');
      results.localPack.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
      console.log('');
    }

    console.log(`--- Organic Results (${results.organic.length}) ---`);
    results.organic.forEach(r => {
      console.log(`  #${r.position}: ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Domain: ${r.domain}`);
      if (r.snippet) console.log(`    Snippet: ${r.snippet}`);
      console.log('');
    });

    if (results.relatedSearches.length > 0) {
      console.log('--- Related Searches ---');
      results.relatedSearches.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
    }

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
  console.error('Usage: node search-bing.js "<query>"');
  process.exit(1);
}
searchBing(query);
