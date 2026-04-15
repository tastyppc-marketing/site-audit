// Crawl sitemap.xml and analyze site structure (smart deep crawl)
// Usage: node scripts/crawl-sitemap.js <domain> [--analyze] [--headed] [--max N]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// IDX / filter page patterns — auto-generated thin content to skip
const idxPatterns = [
  /\d+-bedroom/,
  /\d+-bathroom/,
  /price-\d+/,
  /\/\d+\/$/,            // pagination like /3/
  /property-search\/results/,
  /\/filter\//,
  /\/search\?/,
  /\/page\/\d+/,
  /\/mls-/,              // MLS listing pages
  /\/listing\//,
  /\/property\/[A-Z0-9-]+$/i,  // individual property detail pages
  /\/homes-for-sale\/.+\/.+/,  // nested filter combos under homes-for-sale
  /\/condos-for-sale\/.+\/.+/,
  /\/land-for-sale\/.+\/.+/,
  /\/real-estate\/.+\/.+\/.+/, // deeply nested real-estate filter combos
  /\/idx\//,
];

function isContentPage(url) {
  const parsed = new URL(url);
  const pagePath = parsed.pathname;

  // Skip IDX filter pages
  if (idxPatterns.some(p => p.test(pagePath))) return false;

  // Skip if URL has more than 3 path segments with numeric patterns (likely filter combos)
  const segments = pagePath.split('/').filter(Boolean);
  if (segments.length > 3) return false;

  return true;
}

async function fetchText(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    return await page.content();
  } catch (e) {
    return null;
  }
}

// Recursively fetch all URLs from sitemaps (handles sitemap index files)
async function fetchAllSitemapUrls(page, sitemapUrl) {
  const content = await fetchText(page, sitemapUrl);
  if (!content) return [];

  const isSitemapIndex = content.includes('<sitemapindex');

  if (isSitemapIndex) {
    // Extract child sitemap URLs
    const childSitemaps = await page.evaluate(() => {
      const locs = document.querySelectorAll('sitemap > loc, sitemapindex > sitemap > loc');
      return Array.from(locs).map(el => el.textContent.trim());
    });
    console.log(`  Sitemap index with ${childSitemaps.length} child sitemaps`);

    let allUrls = [];
    for (const childUrl of childSitemaps) {
      console.log(`  Fetching: ${childUrl}`);
      const childContent = await fetchText(page, childUrl);
      if (childContent) {
        const childPageUrls = await page.evaluate(() => {
          const locs = document.querySelectorAll('loc');
          return Array.from(locs).map(el => el.textContent.trim());
        });
        allUrls = allUrls.concat(childPageUrls);
        console.log(`    -> ${childPageUrls.length} URLs`);
      }
    }
    return allUrls;
  } else {
    // Simple urlset
    return await page.evaluate(() => {
      const locs = document.querySelectorAll('loc');
      return Array.from(locs).map(el => el.textContent.trim());
    });
  }
}

// Analyze a single page — returns enhanced page data object
async function analyzePage(browserPage, pageUrl) {
  // P7: Capture response headers and redirect chain via response events
  const responseHeaders = {};
  const redirectChain = [];

  browserPage.on('response', response => {
    const status = response.status();
    const url = response.url();

    // Track redirect hops
    if (status >= 300 && status < 400) {
      redirectChain.push({
        url: url,
        status: status,
        location: response.headers()['location'] || null,
      });
    }

    // Capture headers from the final (primary) response matching our target URL
    // Use the last non-redirect response as the "final" response
    if (status < 300 || status >= 400) {
      const headers = response.headers();
      responseHeaders.xRobotsTag = headers['x-robots-tag'] || null;
      responseHeaders.linkHeader = headers['link'] || null;
      responseHeaders.strictTransportSecurity = headers['strict-transport-security'] || null;
      responseHeaders.contentSecurityPolicy = headers['content-security-policy'] || null;
      responseHeaders.xContentTypeOptions = headers['x-content-type-options'] || null;
      responseHeaders.xFrameOptions = headers['x-frame-options'] || null;
      responseHeaders.referrerPolicy = headers['referrer-policy'] || null;
      responseHeaders.permissionsPolicy = headers['permissions-policy'] || null;
      responseHeaders.cacheControl = headers['cache-control'] || null;
      responseHeaders.server = headers['server'] || null;
      responseHeaders.statusCode = status;
    }
  });

  await browserPage.goto(pageUrl, { waitUntil: 'networkidle', timeout: 20000 });
  await browserPage.waitForTimeout(500);

  const pageData = await browserPage.evaluate(() => {
    const getMeta = (name) => {
      const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return el ? el.getAttribute('content') : null;
    };

    // Get all internal links with context
    const hostname = window.location.hostname;
    const internalLinksDetail = Array.from(document.querySelectorAll('a[href]'))
      .filter(a => {
        try { return new URL(a.href).hostname === hostname; } catch { return false; }
      })
      .map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 80),
        inNav: !!a.closest('nav, header, footer'),
      }));

    // Contextual internal links (NOT in nav/header/footer)
    const contextualLinks = internalLinksDetail.filter(l => !l.inNav);

    return {
      url: window.location.href,
      title: document.title,
      titleLength: document.title.length,
      description: getMeta('description'),
      descriptionLength: (getMeta('description') || '').length,
      h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
      h2: Array.from(document.querySelectorAll('h2')).map(el => el.textContent.trim().substring(0, 100)),
      h2Count: document.querySelectorAll('h2').length,
      h3Count: document.querySelectorAll('h3').length,
      wordCount: document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length,
      imgCount: document.querySelectorAll('img').length,
      imgWithoutAlt: document.querySelectorAll('img:not([alt]), img[alt=""]').length,
      totalInternalLinks: internalLinksDetail.length,
      contextualInternalLinks: contextualLinks.length,
      contextualLinkTargets: contextualLinks.map(l => l.href),
      externalLinks: Array.from(document.querySelectorAll('a[href^="http"]'))
        .filter(a => { try { return new URL(a.href).hostname !== hostname; } catch { return false; } }).length,
      // P7: Use getAttribute('href') to preserve relative URLs for canonical audit
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      canonicalResolved: document.querySelector('link[rel="canonical"]')?.href || null,
      canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
      // P7: Robots meta directives
      robotsMeta: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
      googlebotMeta: document.querySelector('meta[name="googlebot"]')?.getAttribute('content') || null,
      // P7: Viewport meta for mobile usability
      viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || null,
      // Schema: collect full JSON-LD for validation (not just types)
      hasSchema: !!document.querySelector('script[type="application/ld+json"]'),
      schemaTypes: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => { try { const d = JSON.parse(s.textContent); return d['@type'] || (d['@graph'] ? 'graph' : 'unknown'); } catch { return 'invalid'; } }),
      schemaData: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => { try { return JSON.parse(s.textContent); } catch(e) { return { _parseError: e.message, _raw: s.textContent.substring(0, 500) }; } }),
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      ogImage: getMeta('og:image'),
      twitterCard: getMeta('twitter:card'),
      issues: [],
    };
  });

  // P7: Attach response headers and redirect chain
  pageData.responseHeaders = responseHeaders;
  pageData.redirectChain = redirectChain;
  pageData.redirectChainLength = redirectChain.length;
  pageData.statusCode = responseHeaders.statusCode || 200;

  // P7: Parse Link header for HTTP canonical
  if (responseHeaders.linkHeader) {
    const canonicalMatch = responseHeaders.linkHeader.match(/<([^>]+)>;\s*rel="canonical"/i);
    pageData.httpCanonical = canonicalMatch ? canonicalMatch[1] : null;
  } else {
    pageData.httpCanonical = null;
  }

  // Post-process issues
  if (!pageData.title) pageData.issues.push('MISSING_TITLE');
  if (pageData.titleLength > 60) pageData.issues.push('TITLE_TOO_LONG');
  if (pageData.titleLength < 20 && pageData.titleLength > 0) pageData.issues.push('TITLE_TOO_SHORT');
  if (!pageData.description) pageData.issues.push('MISSING_META_DESCRIPTION');
  if (pageData.descriptionLength > 160) pageData.issues.push('META_DESCRIPTION_TOO_LONG');
  if (pageData.h1.length === 0) pageData.issues.push('MISSING_H1');
  if (pageData.h1.length > 1) pageData.issues.push('MULTIPLE_H1');
  if (pageData.wordCount < 300) pageData.issues.push('THIN_CONTENT');
  if (!pageData.hasSchema) pageData.issues.push('NO_SCHEMA');
  if (!pageData.canonical) pageData.issues.push('NO_CANONICAL');
  if (!pageData.ogTitle) pageData.issues.push('NO_OG_TAGS');
  if (pageData.contextualInternalLinks === 0) pageData.issues.push('NO_CONTEXTUAL_INTERNAL_LINKS');
  if (pageData.imgWithoutAlt > 0) pageData.issues.push('MISSING_ALT_TEXT');

  // P7: New issue flags
  if (!pageData.viewportMeta) pageData.issues.push('MISSING_VIEWPORT');
  if (pageData.redirectChainLength > 1) pageData.issues.push('REDIRECT_CHAIN');
  if (pageData.canonicalCount > 1) pageData.issues.push('MULTIPLE_CANONICALS');
  if (pageData.robotsMeta && pageData.robotsMeta.toLowerCase().includes('noindex')) pageData.issues.push('NOINDEX');
  if (responseHeaders.xRobotsTag && responseHeaders.xRobotsTag.toLowerCase().includes('noindex')) pageData.issues.push('X_ROBOTS_NOINDEX');
  if (!responseHeaders.strictTransportSecurity) pageData.issues.push('MISSING_HSTS');

  return pageData;
}

// Process pages in batches with concurrency
async function analyzeInBatches(context, pages, concurrency = 3) {
  const results = [];
  const total = pages.length;

  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchPromises = batch.map(async (pageUrl, batchIdx) => {
      const idx = i + batchIdx;
      const browserPage = await context.newPage();
      try {
        console.log(`  [${idx + 1}/${total}] ${pageUrl}`);
        const data = await analyzePage(browserPage, pageUrl);
        return data;
      } catch (e) {
        console.log(`  [${idx + 1}/${total}] ERROR: ${pageUrl} - ${e.message}`);
        return {
          url: pageUrl,
          error: e.message,
          issues: ['CRAWL_ERROR'],
        };
      } finally {
        await browserPage.close();
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Polite delay between batches
    if (i + concurrency < pages.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const domain = args[0];
  if (!domain) {
    console.error('Usage: node scripts/crawl-sitemap.js <domain> [--analyze] [--headed] [--max N]');
    process.exit(1);
  }

  const analyze = args.includes('--analyze');
  const headed = args.includes('--headed');
  const maxIdx = args.indexOf('--max');
  const maxPages = maxIdx !== -1 && args[maxIdx + 1] ? parseInt(args[maxIdx + 1], 10) : Infinity;
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
    const sitemapCandidates = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`, `${baseUrl}/sitemap`];
    let urls = [];
    let foundSitemapUrl = null;

    for (const url of sitemapCandidates) {
      const content = await fetchText(page, url);
      if (content && (content.includes('<urlset') || content.includes('<sitemapindex'))) {
        foundSitemapUrl = url;
        console.log(`Found sitemap at: ${url}`);
        urls = await fetchAllSitemapUrls(page, url);
        break;
      }
    }

    if (!foundSitemapUrl) {
      console.log('No standard sitemap found.');
    }

    // Deduplicate URLs
    urls = [...new Set(urls)];

    if (urls.length > 0) {
      console.log(`\nTotal URLs in sitemap: ${urls.length}`);

      // Smart page selection: separate content pages from IDX/filter pages
      const contentPages = urls.filter(isContentPage);
      const idxPages = urls.filter(u => !isContentPage(u));
      console.log(`Content pages to analyze: ${contentPages.length}`);
      console.log(`IDX/filter pages skipped: ${idxPages.length}\n`);

      // Categorize ALL URLs
      const categories = {};
      urls.forEach(url => {
        const urlPath = new URL(url).pathname;
        const segments = urlPath.split('/').filter(Boolean);
        const category = segments[0] || 'homepage';
        if (!categories[category]) categories[category] = { total: 0, content: 0, idx: 0, urls: [] };
        categories[category].total++;
        if (isContentPage(url)) {
          categories[category].content++;
        } else {
          categories[category].idx++;
        }
        categories[category].urls.push(url);
      });

      console.log('--- URL Categories ---');
      const categorySummary = {};
      Object.entries(categories).sort((a, b) => b[1].total - a[1].total).forEach(([cat, data]) => {
        console.log(`  ${cat}: ${data.total} total (${data.content} content, ${data.idx} IDX/filter)`);
        categorySummary[cat] = { total: data.total, content: data.content, idx: data.idx };
        // Show a few sample content URLs
        const sampleContent = data.urls.filter(isContentPage).slice(0, 3);
        sampleContent.forEach(u => console.log(`    [content] ${u}`));
        if (data.idx > 0) {
          const sampleIdx = data.urls.filter(u => !isContentPage(u)).slice(0, 2);
          sampleIdx.forEach(u => console.log(`    [idx]     ${u}`));
          if (data.idx > 2) console.log(`    ... and ${data.idx - 2} more IDX pages`);
        }
      });

      // Analyze content pages if requested
      if (analyze) {
        // Apply --max limit
        let pagesToAnalyze = contentPages;
        if (maxPages < Infinity) {
          pagesToAnalyze = contentPages.slice(0, maxPages);
          console.log(`\n--max ${maxPages}: analyzing ${pagesToAnalyze.length} of ${contentPages.length} content pages`);
        }

        console.log(`\n=== PAGE ANALYSIS (${pagesToAnalyze.length} pages, concurrency: 3) ===`);
        const startTime = Date.now();

        const analyzedPages = await analyzeInBatches(context, pagesToAnalyze, 3);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\nAnalysis complete in ${elapsed}s`);

        // Print per-page summary to console
        console.log('\n=== PAGE SUMMARIES ===');
        for (const pd of analyzedPages) {
          if (pd.error) {
            console.log(`\n--- ${pd.url} --- ERROR: ${pd.error}`);
            continue;
          }
          console.log(`\n--- ${pd.url} ---`);
          console.log(`  Title (${pd.titleLength} chars): ${pd.title}`);
          console.log(`  Meta Desc (${pd.descriptionLength} chars): ${pd.description || 'MISSING'}`);
          console.log(`  H1: ${pd.h1.join(', ') || 'MISSING'}`);
          console.log(`  H2s: ${pd.h2Count} | H3s: ${pd.h3Count}`);
          console.log(`  Word Count: ${pd.wordCount}`);
          console.log(`  Images: ${pd.imgCount} (${pd.imgWithoutAlt} missing alt)`);
          console.log(`  Links: ${pd.totalInternalLinks} internal (${pd.contextualInternalLinks} contextual) | ${pd.externalLinks} external`);
          console.log(`  Canonical: ${pd.canonical || 'MISSING'}`);
          console.log(`  Schema: ${pd.hasSchema ? pd.schemaTypes.join(', ') : 'NONE'}`);
          console.log(`  OG Tags: ${pd.ogTitle ? 'YES' : 'MISSING'}`);
          if (pd.issues.length > 0) {
            console.log(`  ISSUES: ${pd.issues.join(', ')}`);
          }
        }

        // Build issues summary
        const issuesSummary = {};
        for (const pd of analyzedPages) {
          for (const issue of pd.issues) {
            issuesSummary[issue] = (issuesSummary[issue] || 0) + 1;
          }
        }

        console.log('\n=== ISSUES SUMMARY ===');
        Object.entries(issuesSummary).sort((a, b) => b[1] - a[1]).forEach(([issue, count]) => {
          console.log(`  ${issue}: ${count} pages`);
        });

        // Detect orphaned pages (pages that receive 0 internal contextual links from other crawled pages)
        const allLinkedUrls = new Set();
        for (const pd of analyzedPages) {
          if (pd.contextualLinkTargets) {
            pd.contextualLinkTargets.forEach(u => allLinkedUrls.add(u));
          }
        }
        const orphanedPages = analyzedPages
          .filter(pd => !pd.error && !allLinkedUrls.has(pd.url))
          .map(pd => pd.url);

        if (orphanedPages.length > 0) {
          console.log(`\n=== POTENTIAL ORPHANED PAGES (${orphanedPages.length}) ===`);
          console.log('(No contextual internal links pointing to these from other analyzed pages)');
          orphanedPages.forEach(u => console.log(`  ${u}`));
        }

        // Build structured JSON results
        const results = {
          domain: baseUrl,
          crawlDate: new Date().toISOString(),
          totalSitemapUrls: urls.length,
          contentPages: contentPages.length,
          idxFilterPages: idxPages.length,
          analyzedCount: analyzedPages.length,
          elapsedSeconds: parseFloat(elapsed),
          categories: categorySummary,
          pages: analyzedPages.map(pd => {
            // Remove contextualLinkTargets from output to keep file size reasonable
            const { contextualLinkTargets, ...rest } = pd;
            return rest;
          }),
          issuesSummary,
          orphanedPages,
        };

        // Write JSON output
        const outputPath = path.join(__dirname, '..', 'seo', 'research', 'crawl-data.json');
        // Ensure directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\nCrawl data saved to: ${outputPath}`);

        // Write link graph (edge data for Python InternalLinkAnalyzer)
        const linkGraph = {
          domain: baseUrl,
          crawlDate: new Date().toISOString(),
          edges: Object.fromEntries(
            analyzedPages
              .filter(pd => !pd.error && pd.contextualLinkTargets)
              .map(pd => [pd.url, pd.contextualLinkTargets])
          ),
        };
        const graphOutputPath = path.join(__dirname, '..', 'seo', 'research', 'link-graph.json');
        fs.writeFileSync(graphOutputPath, JSON.stringify(linkGraph, null, 2));
        console.log(`Link graph saved to: ${graphOutputPath}`);
      }
    } else {
      console.log('No URLs found in sitemap.');
    }

    // Output all sitemap URLs as JSON
    console.log('\n=== ALL SITEMAP URLS (JSON) ===');
    console.log(JSON.stringify(urls, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
