const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.parkcityluxuryrealestate.com/about/about-us/", { waitUntil: "networkidle", timeout: 60000 });

  // Schema
  const schemas = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => s.textContent);
  });

  // Images
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).map(img => ({ src: img.src, alt: img.alt })).filter(i => i.src && i.alt);
  });

  // Videos
  const videos = await page.evaluate(() => {
    const vids = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]');
    return Array.from(vids).map(v => ({ tag: v.tagName, src: v.src }));
  });

  // Forms
  const forms = await page.evaluate(() => {
    const formEls = document.querySelectorAll("form");
    return Array.from(formEls).map(f => ({ action: f.action, id: f.id, class: f.className }));
  });

  // CTAs
  const ctas = await page.evaluate(() => {
    const btns = document.querySelectorAll('a.btn, a.button, button, .cta, a[class*="btn"], a[class*="button"]');
    return Array.from(btns).map(b => ({ text: b.innerText.trim(), href: b.href || "", cls: b.className })).filter(b => b.text);
  });

  // Social links
  const socialLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="facebook"], a[href*="instagram"], a[href*="linkedin"], a[href*="youtube"], a[href*="twitter"], a[href*="zillow"], a[href*="yelp"]');
    return Array.from(links).map(l => ({ text: l.innerText.trim(), href: l.href }));
  });

  // Google Reviews widget
  const reviewWidget = await page.evaluate(() => {
    const elems = document.querySelectorAll('[class*="review"], [class*="Review"], .google-reviews, [data-widget]');
    return Array.from(elems).map(e => ({ tag: e.tagName, class: e.className, id: e.id, text: e.innerText.substring(0, 200) }));
  });

  // "As Featured In" logos/media mentions
  const mediaLogos = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).map(img => ({ src: img.src, alt: img.alt })).filter(i => {
      const s = (i.alt + " " + i.src).toLowerCase();
      return s.includes("vogue") || s.includes("wsj") || s.includes("yahoo") || s.includes("wall street") || s.includes("ski") || s.includes("featured") || s.includes("logo") || s.includes("press");
    });
  });

  // Full page word count
  const text = await page.evaluate(() => document.body.innerText);
  const words = text.split(/\s+/).filter(w => w.length > 0).length;

  // Bio content word count
  const bioText = await page.evaluate(() => {
    const main = document.querySelector("main") || document.querySelector("#content") || document.querySelector(".page-content");
    return main ? main.innerText : "";
  });
  const bioWords = bioText.split(/\s+/).filter(w => w.length > 0).length;

  console.log("=== FULL PAGE WORD COUNT: " + words + " ===");
  console.log("=== BIO SECTION WORD COUNT: " + bioWords + " ===");

  console.log("\n=== SCHEMA MARKUP (" + schemas.length + ") ===");
  schemas.forEach(s => console.log(s));

  console.log("\n=== IMAGES WITH ALT TEXT (" + images.length + ") ===");
  images.slice(0, 25).forEach(i => console.log("  " + i.alt + " -> " + i.src.substring(0, 120)));

  console.log("\n=== VIDEOS (" + videos.length + ") ===");
  videos.forEach(v => console.log("  " + v.tag + ": " + v.src));

  console.log("\n=== FORMS (" + forms.length + ") ===");
  forms.forEach(f => console.log("  " + JSON.stringify(f)));

  console.log("\n=== CTAs ===");
  ctas.forEach(c => console.log("  " + c.text + " [" + c.cls + "] -> " + c.href));

  console.log("\n=== SOCIAL LINKS ===");
  socialLinks.forEach(s => console.log("  " + s.text + " -> " + s.href));

  console.log("\n=== MEDIA/FEATURED IN LOGOS ===");
  mediaLogos.forEach(m => console.log("  " + m.alt + " -> " + m.src.substring(0, 120)));

  console.log("\n=== REVIEW ELEMENTS ===");
  reviewWidget.forEach(r => console.log("  " + JSON.stringify(r)));

  await browser.close();
})();
