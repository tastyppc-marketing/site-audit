// Crawl sitemap.xml and analyze site structure
// Usage: node scripts/crawl-sitemap.js <domain> [--analyze]
const { chromium } = require('playwright');

async function fetchText(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    return await page.content();
  } catch (e) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const domain = args[0];
  if (!domain) {
    console.error('Usage: node scripts/crawl-sitemap.js <domain> [--analyze]');
    process.exit(1);
  }

  const analyze = args.includes('--analyze');
  const headed = args.includes('--headed');
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 500 : 0,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    // Check robots.txt
    console.log('=== ROBOTS.TXT ===');
    const robotsContent = await fetchText(page, `${baseUrl}/robots.txt`);
    if (robotsContent) {
      const textContent = await page.evaluate(() => document.body?.textContent || document.documentElement?.textContent || '');
      console.log(textContent.substring(0, 2000));
    } else {
      console.log('No robots.txt found');
    }

    // Try sitemap.xml
    console.log('\n=== SITEMAP ===');
    const sitemapUrls = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`, `${baseUrl}/sitemap`];
    let sitemapContent = null;
    let sitemapUrl = null;

    for (const url of sitemapUrls) {
      const content = await fetchText(page, url);
      if (content && (content.includes('<urlset') || content.includes('<sitemapindex'))) {
        sitemapContent = content;
        sitemapUrl = url;
        break;
      }
    }

    if (!sitemapContent) {
      console.log('No standard sitemap found. Attempting to discover from robots.txt...');
    } else {
      console.log(`Found sitemap at: ${sitemapUrl}`);
    }

    // Extract URLs from sitemap
    const urls = await page.evaluate(() => {
      const locs = document.querySelectorAll('loc');
      return Array.from(locs).map(el => el.textContent.trim());
    });

    if (urls.length > 0) {
      console.log(`\nTotal URLs in sitemap: ${urls.length}\n`);

      // Categorize URLs
      const categories = {};
      urls.forEach(url => {
        const path = new URL(url).pathname;
        const segments = path.split('/').filter(Boolean);
        const category = segments[0] || 'homepage';
        if (!categories[category]) categories[category] = [];
        categories[category].push(url);
      });

      console.log('--- URL Categories ---');
      Object.entries(categories).sort((a, b) => b[1].length - a[1].length).forEach(([cat, catUrls]) => {
        console.log(`  ${cat}: ${catUrls.length} pages`);
        catUrls.slice(0, 5).forEach(u => console.log(`    - ${u}`));
        if (catUrls.length > 5) console.log(`    ... and ${catUrls.length - 5} more`);
      });

      // Analyze individual pages if requested
      if (analyze) {
        console.log('\n=== PAGE ANALYSIS ===');
        const pagesToAnalyze = urls.slice(0, 20); // Analyze first 20 pages
        for (const pageUrl of pagesToAnalyze) {
          try {
            await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(1000);

            const pageData = await page.evaluate(() => {
              const getMeta = (name) => {
                const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return el ? el.getAttribute('content') : null;
              };
              return {
                title: document.title,
                description: getMeta('description'),
                h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
                h2Count: document.querySelectorAll('h2').length,
                h3Count: document.querySelectorAll('h3').length,
                wordCount: document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length,
                imgCount: document.querySelectorAll('img').length,
                imgWithoutAlt: document.querySelectorAll('img:not([alt]), img[alt=""]').length,
                internalLinks: document.querySelectorAll(`a[href*="${window.location.hostname}"]`).length,
                externalLinks: Array.from(document.querySelectorAll('a[href^="http"]')).filter(a => !a.href.includes(window.location.hostname)).length,
                canonical: document.querySelector('link[rel="canonical"]')?.href,
                hasSchema: !!document.querySelector('script[type="application/ld+json"]'),
              };
            });

            console.log(`\n--- ${pageUrl} ---`);
            console.log(`  Title: ${pageData.title}`);
            console.log(`  Meta Desc: ${pageData.description || 'MISSING'}`);
            console.log(`  H1: ${pageData.h1.join(', ') || 'MISSING'}`);
            console.log(`  H2s: ${pageData.h2Count} | H3s: ${pageData.h3Count}`);
            console.log(`  Word Count: ${pageData.wordCount}`);
            console.log(`  Images: ${pageData.imgCount} (${pageData.imgWithoutAlt} missing alt)`);
            console.log(`  Internal Links: ${pageData.internalLinks} | External: ${pageData.externalLinks}`);
            console.log(`  Canonical: ${pageData.canonical || 'MISSING'}`);
            console.log(`  Schema Markup: ${pageData.hasSchema ? 'YES' : 'NO'}`);
          } catch (e) {
            console.log(`\n--- ${pageUrl} --- ERROR: ${e.message}`);
          }
        }
      }
    } else {
      console.log('No URLs found in sitemap. The site may not have one.');
    }

    // Output all URLs as JSON for further processing
    console.log('\n=== ALL SITEMAP URLS (JSON) ===');
    console.log(JSON.stringify(urls, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
