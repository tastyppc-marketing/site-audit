// Playwright browser utility - launches Chromium and navigates to a URL
// Usage: node scripts/browse.js <url> [--screenshot <filename>] [--full-page] [--extract-links] [--extract-text] [--extract-meta] [--extract-headings] [--headed] [--wait <ms>]
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  if (!url) {
    console.error('Usage: node scripts/browse.js <url> [options]');
    process.exit(1);
  }

  const flags = {
    screenshot: args.includes('--screenshot') ? args[args.indexOf('--screenshot') + 1] : null,
    fullPage: args.includes('--full-page'),
    extractLinks: args.includes('--extract-links'),
    extractText: args.includes('--extract-text'),
    extractMeta: args.includes('--extract-meta'),
    extractHeadings: args.includes('--extract-headings'),
    headed: args.includes('--headed'),
    wait: args.includes('--wait') ? parseInt(args[args.indexOf('--wait') + 1]) : 2000,
  };

  const browser = await chromium.launch({
    headless: !flags.headed,
    slowMo: flags.headed ? 500 : 0,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(flags.wait);

    if (flags.screenshot) {
      await page.screenshot({ path: flags.screenshot, fullPage: flags.fullPage });
      console.log(`Screenshot saved to ${flags.screenshot}`);
    }

    if (flags.extractMeta) {
      const meta = await page.evaluate(() => {
        const getMeta = (name) => {
          const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return el ? el.getAttribute('content') : null;
        };
        return {
          title: document.title,
          description: getMeta('description'),
          ogTitle: getMeta('og:title'),
          ogDescription: getMeta('og:description'),
          ogImage: getMeta('og:image'),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          robots: getMeta('robots'),
          h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
        };
      });
      console.log('\n=== META DATA ===');
      console.log(JSON.stringify(meta, null, 2));
    }

    if (flags.extractHeadings) {
      const headings = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
          results.push({ tag: el.tagName, text: el.textContent.trim() });
        });
        return results;
      });
      console.log('\n=== HEADINGS ===');
      headings.forEach(h => console.log(`${h.tag}: ${h.text}`));
    }

    if (flags.extractLinks) {
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.textContent.trim().substring(0, 100),
          href: a.href,
          isInternal: a.href.includes(window.location.hostname),
          isExternal: !a.href.includes(window.location.hostname) && a.href.startsWith('http'),
        }));
      });
      const internal = links.filter(l => l.isInternal);
      const external = links.filter(l => l.isExternal);
      console.log(`\n=== LINKS (${links.length} total, ${internal.length} internal, ${external.length} external) ===`);
      console.log('\n--- Internal Links ---');
      const uniqueInternal = [...new Map(internal.map(l => [l.href, l])).values()];
      uniqueInternal.forEach(l => console.log(`  ${l.href} [${l.text || 'no text'}]`));
      console.log('\n--- External Links ---');
      const uniqueExternal = [...new Map(external.map(l => [l.href, l])).values()];
      uniqueExternal.forEach(l => console.log(`  ${l.href} [${l.text || 'no text'}]`));
    }

    if (flags.extractText) {
      const text = await page.evaluate(() => {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
      });
      console.log('\n=== PAGE TEXT ===');
      console.log(text.substring(0, 5000));
      if (text.length > 5000) console.log(`\n... [truncated, total ${text.length} chars]`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
