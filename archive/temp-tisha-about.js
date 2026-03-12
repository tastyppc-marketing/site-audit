const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.livingparkcityutah.com/about/", { waitUntil: "networkidle", timeout: 60000 });

  // Word count
  const text = await page.evaluate(() => document.body.innerText);
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  console.log("=== FULL PAGE WORD COUNT: " + words + " ===");

  // Schema
  const schemas = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => s.textContent);
  });
  console.log("\n=== SCHEMA MARKUP (" + schemas.length + ") ===");
  schemas.forEach(s => console.log(s));

  // Images
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).map(img => ({ src: img.src, alt: img.alt })).filter(i => i.src);
  });
  console.log("\n=== IMAGES (" + images.length + ") ===");
  images.slice(0, 15).forEach(i => console.log("  " + i.alt + " -> " + i.src.substring(0, 100)));

  // Forms
  const forms = await page.evaluate(() => {
    const formEls = document.querySelectorAll("form");
    return Array.from(formEls).map(f => ({ action: f.action, id: f.id }));
  });
  console.log("\n=== FORMS (" + forms.length + ") ===");
  forms.forEach(f => console.log("  " + JSON.stringify(f)));

  // CTAs
  const ctas = await page.evaluate(() => {
    const btns = document.querySelectorAll('a.btn, a.button, button, .cta, a[class*="btn"], a[class*="button"]');
    return Array.from(btns).map(b => ({ text: b.innerText.trim(), href: b.href || "" })).filter(b => b.text);
  });
  console.log("\n=== CTAs ===");
  ctas.forEach(c => console.log("  " + c.text + " -> " + c.href));

  // Social
  const socialLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="facebook"], a[href*="instagram"], a[href*="linkedin"], a[href*="youtube"], a[href*="twitter"], a[href*="zillow"], a[href*="yelp"]');
    return Array.from(links).map(l => ({ text: l.innerText.trim(), href: l.href }));
  });
  console.log("\n=== SOCIAL LINKS ===");
  socialLinks.forEach(s => console.log("  " + s.text + " -> " + s.href));

  await browser.close();
})();
