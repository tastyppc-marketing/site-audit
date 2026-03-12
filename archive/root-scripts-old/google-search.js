// Google search via Playwright - searches Google and extracts results
// Usage: node scripts/google-search.js "<query>" [--num <results>]
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const query = args[0];
  if (!query) {
    console.error('Usage: node scripts/google-search.js "<query>" [--num <n>]');
    process.exit(1);
  }

  const numResults = args.includes('--num') ? parseInt(args[args.indexOf('--num') + 1]) : 20;
  const headed = args.includes('--headed');

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 800 : 0,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    geolocation: { latitude: 40.6461, longitude: -111.498 }, // Park City, UT
    permissions: ['geolocation'],
  });
  const page = await context.newPage();

  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}&gl=us`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for consent/captcha
    const consentBtn = await page.$('button:has-text("Accept all")');
    if (consentBtn) {
      await consentBtn.click();
      await page.waitForTimeout(2000);
    }

    const results = await page.evaluate(() => {
      const items = [];
      // Organic results
      document.querySelectorAll('#search .g, #rso .g').forEach((el, idx) => {
        const titleEl = el.querySelector('h3');
        const linkEl = el.querySelector('a[href]');
        const snippetEl = el.querySelector('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"]');
        if (titleEl && linkEl) {
          items.push({
            position: idx + 1,
            title: titleEl.textContent.trim(),
            url: linkEl.href,
            domain: new URL(linkEl.href).hostname,
            snippet: snippetEl ? snippetEl.textContent.trim() : '',
          });
        }
      });

      // People Also Ask
      const paa = [];
      document.querySelectorAll('[data-sgrd] [role="heading"], .related-question-pair [role="heading"]').forEach(el => {
        paa.push(el.textContent.trim());
      });

      // Local pack results
      const localPack = [];
      document.querySelectorAll('.VkpGBb, [data-local-attribute]').forEach(el => {
        const name = el.querySelector('.OSrXXb, .dbg0pd')?.textContent?.trim();
        if (name) localPack.push(name);
      });

      return { organic: items, peopleAlsoAsk: paa, localPack };
    });

    console.log(`=== GOOGLE RESULTS FOR: "${query}" ===\n`);

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
      if (r.snippet) console.log(`    Snippet: ${r.snippet.substring(0, 200)}`);
      console.log('');
    });

    if (results.peopleAlsoAsk.length > 0) {
      console.log('--- People Also Ask ---');
      results.peopleAlsoAsk.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
    }

    // Check if our target sites appear
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

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
