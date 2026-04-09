#!/usr/bin/env node
'use strict';

/**
 * extract-text.js — Extracts page text via Playwright and computes Flesch-Kincaid
 * readability scores. Produces research/page-text-analysis.json.
 *
 * Usage:
 *   node scripts/extract-text.js [--input research/crawl-data.json] [--limit 50]
 *
 * Output shape (what the normalizer expects at generate-multipage-report.js:852-886):
 * {
 *   pages: [{
 *     url, title, wordCount, sentenceCount, syllableCount,
 *     fleschReadingEase, fleschKincaidGrade, avgWordsPerSentence, avgSyllablesPerWord
 *   }],
 *   summary: { totalPages, avgFleschReadingEase, avgFleschKincaidGrade, avgWordCount },
 *   errors: [{ url, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 *
 * IMPORTANT: Output includes BOTH avgWordsPerSentence AND avgSentenceLength (same value, different name).
 * The normalizer reads pta.avgSentenceLength at generate-multipage-report.js line 873.
 */

const fs = require('fs');
const path = require('path');

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  // Remove trailing silent-e
  word = word.replace(/e$/, '');
  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

function analyzeText(text) {
  // Split into sentences (. ! ? followed by space or end)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Split into words
  const words = text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
  const wordCount = words.length;
  if (wordCount === 0) return null;

  // Count syllables
  let syllableCount = 0;
  for (const w of words) {
    syllableCount += countSyllables(w);
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschReadingEase = Math.round((206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord) * 10) / 10;

  // Flesch-Kincaid Grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
  const fleschKincaidGrade = Math.round((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10;

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    fleschReadingEase,
    fleschKincaidGrade,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentenceLength: Math.round(avgWordsPerSentence * 10) / 10, // alias — normalizer reads this at line 873
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

async function main() {
  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch {
    console.error('ERROR: Playwright not installed. Run: npm install playwright');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;

  const inputIdx = args.indexOf('--input');
  const inputPath = inputIdx >= 0
    ? path.resolve(args[inputIdx + 1])
    : path.resolve('seo', 'research', 'crawl-data.json');

  if (!fs.existsSync(inputPath)) {
    console.error('ERROR: Input file not found: ' + inputPath);
    process.exit(1);
  }

  const crawlData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let urls = [];
  if (Array.isArray(crawlData.pages)) {
    urls = crawlData.pages.map(p => p.url).filter(Boolean);
  } else if (Array.isArray(crawlData.urls)) {
    urls = crawlData.urls.filter(Boolean);
  } else if (Array.isArray(crawlData)) {
    urls = crawlData.map(p => p.url || p).filter(Boolean);
  }

  if (urls.length === 0) {
    console.error('ERROR: No URLs found in crawl data');
    process.exit(1);
  }

  const urlsToProcess = urls.slice(0, limit);
  console.error('Processing ' + urlsToProcess.length + ' of ' + urls.length + ' URLs (limit: ' + limit + ')');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)' });
  const pages = [];
  const errors = [];

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    console.error('  [' + (i + 1) + '/' + urlsToProcess.length + '] ' + url);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Extract body text, stripping non-content elements
      const result = await page.evaluate(() => {
        // Remove non-content elements
        const removeSelectors = ['script', 'style', 'noscript', 'nav', 'footer', 'header', 'aside', '.nav', '.footer', '.header', '.sidebar'];
        const clone = document.body.cloneNode(true);
        removeSelectors.forEach(sel => {
          clone.querySelectorAll(sel).forEach(el => el.remove());
        });
        return {
          title: document.title || '',
          text: (clone.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      });

      await page.close();

      const metrics = analyzeText(result.text);
      if (metrics) {
        pages.push({ url, title: result.title, ...metrics });
      } else {
        console.error('    Skipped: no extractable text');
      }
    } catch (err) {
      errors.push({ url, reason: err.message });
      console.error('    ERROR: ' + err.message);
    }

    // Rate limit: 500ms between pages
    if (i < urlsToProcess.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  await browser.close();

  // Compute status
  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (pages.length === 0 && errors.length > 0) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  // Compute summary
  const avgFRE = pages.length ? Math.round(pages.reduce((s, p) => s + p.fleschReadingEase, 0) / pages.length * 10) / 10 : 0;
  const avgFKG = pages.length ? Math.round(pages.reduce((s, p) => s + p.fleschKincaidGrade, 0) / pages.length * 10) / 10 : 0;
  const avgWC = pages.length ? Math.round(pages.reduce((s, p) => s + p.wordCount, 0) / pages.length) : 0;

  const output = {
    pages,
    summary: {
      totalPages: pages.length,
      avgFleschReadingEase: avgFRE,
      avgFleschKincaidGrade: avgFKG,
      avgWordCount: avgWC,
    },
    errors,
    status,
    gatheredAt: new Date().toISOString(),
  };

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'page-text-analysis.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error('Written: ' + outputPath + ' (' + pages.length + ' pages analyzed)');
  if (errors.length > 0) console.error('  Errors: ' + errors.length + ' (status: ' + status + ')');
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
