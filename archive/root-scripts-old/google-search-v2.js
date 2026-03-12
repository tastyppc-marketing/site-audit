const { chromium } = require('playwright');

async function searchGoogle(query) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    timezoneId: 'America/Denver',
  });

  // Remove webdriver flag
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  try {
    // First visit Google homepage
    await page.goto('https://www.google.com', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Accept cookies if present
    try {
      const acceptBtn = await page.$('button:has-text("Accept all"), button:has-text("I agree")');
      if (acceptBtn) {
        await acceptBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    // Type the query into the search box
    const searchBox = await page.$('textarea[name="q"], input[name="q"]');
    if (searchBox) {
      await searchBox.click();
      await page.waitForTimeout(500);
      // Type slowly like a human
      for (const char of query) {
        await searchBox.type(char, { delay: 50 + Math.random() * 100 });
      }
      await page.waitForTimeout(500 + Math.random() * 1000);
      await page.keyboard.press('Enter');
    } else {
      // Fallback: direct URL
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=20&gl=us`, { waitUntil: 'networkidle', timeout: 30000 });
    }

    await page.waitForTimeout(3000 + Math.random() * 2000);

    // Check for CAPTCHA
    const content = await page.content();
    if (content.includes('unusual traffic') || content.includes('captcha')) {
      console.log(`=== GOOGLE RESULTS FOR: "${query}" ===`);
      console.log('STATUS: BLOCKED BY CAPTCHA');
      await browser.close();
      return null;
    }

    const results = await page.evaluate(() => {
      const items = [];
      // Try multiple selector patterns
      const resultEls = document.querySelectorAll('#search .g, #rso .g, #rso > div > div.g, div[data-hveid] .g');
      resultEls.forEach((el, idx) => {
        const titleEl = el.querySelector('h3');
        const linkEl = el.querySelector('a[href^="http"]');
        const snippetEl = el.querySelector('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"], .lEBKkf');
        if (titleEl && linkEl) {
          const url = linkEl.href;
          let domain = '';
          try { domain = new URL(url).hostname; } catch(e) {}
          items.push({
            position: items.length + 1,
            title: titleEl.textContent.trim(),
            url: url,
            domain: domain,
            snippet: snippetEl ? snippetEl.textContent.trim().substring(0, 200) : '',
          });
        }
      });

      const paa = [];
      document.querySelectorAll('[data-sgrd] [role="heading"], .related-question-pair [role="heading"], [jsname="Cpkphb"]').forEach(el => {
        const text = el.textContent.trim();
        if (text && !paa.includes(text)) paa.push(text);
      });

      const localPack = [];
      document.querySelectorAll('.VkpGBb, [data-local-attribute], .rllt__details').forEach(el => {
        const name = el.querySelector('.OSrXXb, .dbg0pd, [role="heading"]')?.textContent?.trim() || el.textContent.trim().split('\n')[0];
        if (name && name.length < 100) localPack.push(name);
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
      if (r.snippet) console.log(`    Snippet: ${r.snippet}`);
      console.log('');
    });

    if (results.peopleAlsoAsk.length > 0) {
      console.log('--- People Also Ask ---');
      results.peopleAlsoAsk.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
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
  console.error('Usage: node google-search-v2.js "<query>"');
  process.exit(1);
}
searchGoogle(query);
