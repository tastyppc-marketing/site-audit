const { chromium } = require('playwright');

const pages = [
  'https://www.livingparkcityutah.com/jeremy-ranch/',
  'https://www.livingparkcityutah.com/jordanelle/',
  'https://www.livingparkcityutah.com/kimball-junction/',
  'https://www.livingparkcityutah.com/lower-deer-valley-resort/',
  'https://www.livingparkcityutah.com/midway/',
  'https://www.livingparkcityutah.com/old-ranch-road/',
  'https://www.livingparkcityutah.com/park-meadows/',
  'https://www.livingparkcityutah.com/pinebrooksummit-park/',
  'https://www.livingparkcityutah.com/red-ledges/',
  'https://www.livingparkcityutah.com/salt-lake-county/',
  'https://www.livingparkcityutah.com/silver-creek-estatessilver-creek-village/',
  'https://www.livingparkcityutah.com/silver-springs/',
  'https://www.livingparkcityutah.com/sun-peakbear-hollow/',
  'https://www.livingparkcityutah.com/sundance-provo-canyon/',
  'https://www.livingparkcityutah.com/thaynes-canyon/',
  'https://www.livingparkcityutah.com/trailside-park-area/',
  'https://www.livingparkcityutah.com/tuhaye/',
  'https://www.livingparkcityutah.com/upper-deer-valley-resort/',
  'https://www.livingparkcityutah.com/sellers/marketing-your-home/',
  'https://www.livingparkcityutah.com/sellers/adding-value/',
  'https://www.livingparkcityutah.com/sellers/pricing-your-home/',
  'https://www.livingparkcityutah.com/sellers/showing-your-home/',
  'https://www.livingparkcityutah.com/buyers/mortgage-calculator/',
  'https://www.livingparkcityutah.com/buyers/mortgage-pre-approval/',
  'https://www.livingparkcityutah.com/buyers/escrow-now-what/',
  'https://www.livingparkcityutah.com/buyers/financial-terms-glossary/',
  'https://www.livingparkcityutah.com/buyers/what-are-closing-costs/',
  'https://www.livingparkcityutah.com/buyers/personalized-home-search/',
  'https://www.livingparkcityutah.com/contact/thank-you/',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  for (const url of pages) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      const data = await page.evaluate(() => {
        const getMeta = (name) => {
          const el = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
          return el ? el.getAttribute('content') : null;
        };
        const noAltImgs = document.querySelectorAll('img:not([alt]), img[alt=""]');
        return {
          title: document.title,
          description: getMeta('description'),
          h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
          h2Count: document.querySelectorAll('h2').length,
          wordCount: document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length,
          imgCount: document.querySelectorAll('img').length,
          imgWithoutAlt: noAltImgs.length,
          canonical: document.querySelector('link[rel="canonical"]') ? document.querySelector('link[rel="canonical"]').href : null,
          hasSchema: document.querySelector('script[type="application/ld+json"]') ? true : false,
          internalLinks: document.querySelectorAll('a[href*="' + window.location.hostname + '"]').length,
          externalLinks: Array.from(document.querySelectorAll('a[href^="http"]')).filter(a => a.href.indexOf(window.location.hostname) === -1).length,
        };
      });

      console.log('--- ' + url + ' ---');
      console.log('  Title: ' + data.title);
      console.log('  Meta Desc: ' + (data.description || 'MISSING'));
      console.log('  H1: ' + (data.h1.join(', ') || 'MISSING'));
      console.log('  H2s: ' + data.h2Count + ' | Words: ' + data.wordCount);
      console.log('  Images: ' + data.imgCount + ' (' + data.imgWithoutAlt + ' missing alt)');
      console.log('  Canonical: ' + (data.canonical || 'MISSING'));
      console.log('  Schema: ' + (data.hasSchema ? 'YES' : 'NO'));
      console.log('  Internal Links: ' + data.internalLinks + ' | External: ' + data.externalLinks);
      console.log('');
    } catch (e) {
      console.log('--- ' + url + ' --- ERROR: ' + e.message);
      console.log('');
    }
  }

  await browser.close();
})();
