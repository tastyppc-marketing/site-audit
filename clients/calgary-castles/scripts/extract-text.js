#!/usr/bin/env node
/**
 * extract-text.js — Crawl all 36 pages on sellingcalgarycastles.com,
 * extract body text (stripped of boilerplate), compute readability metrics.
 * Output: seo/research/page-text-analysis.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const CRAWL_DATA = path.join(BASE_DIR, 'seo', 'research', 'crawl-data.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'seo', 'research', 'page-text-analysis.json');

// ── Syllable counter (vowel-group heuristic) ──
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// ── Readability level label ──
function getReadabilityLevel(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

// ── Grade label for explanation ──
function getGradeLabel(fkGrade) {
  if (fkGrade <= 5) return '5th grade';
  if (fkGrade <= 6) return '6th grade';
  if (fkGrade <= 7) return '7th grade';
  if (fkGrade <= 8) return '8th grade';
  if (fkGrade <= 9) return '9th grade';
  if (fkGrade <= 10) return '10th grade';
  if (fkGrade <= 11) return '11th grade';
  if (fkGrade <= 12) return '12th grade';
  if (fkGrade <= 16) return 'college';
  return 'graduate';
}

// ── Build plain-English explanation ──
function buildExplanation(avgSentLen, avgSylPerWord, fleschScore, url) {
  const parts = [];

  // Sentence length commentary
  if (avgSentLen > 25) {
    parts.push(`an average sentence length of ${avgSentLen} words (ideal: 15-20), which is quite long`);
  } else if (avgSentLen > 20) {
    parts.push(`an average sentence length of ${avgSentLen} words (ideal: 15-20), slightly above optimal`);
  } else if (avgSentLen >= 15) {
    parts.push(`an average sentence length of ${avgSentLen} words, within the ideal 15-20 range`);
  } else {
    parts.push(`an average sentence length of ${avgSentLen} words, which is short and easy to follow`);
  }

  // Syllable commentary
  if (avgSylPerWord > 1.6) {
    parts.push(`${avgSylPerWord} syllables per word indicating heavy use of multi-syllable terminology`);
  } else if (avgSylPerWord > 1.4) {
    parts.push(`${avgSylPerWord} syllables per word reflecting moderate technical vocabulary`);
  } else {
    parts.push(`${avgSylPerWord} syllables per word suggesting simple, everyday language`);
  }

  // Content type detection from URL
  let contentNote = '';
  if (url.includes('/blog/')) {
    contentNote = 'Blog content ';
  } else if (url.includes('/buyers/') || url.includes('/sellers/')) {
    contentNote = 'Real estate guidance content ';
  } else if (url.includes('/contact/')) {
    contentNote = 'Contact page content ';
  } else if (url.includes('/about/')) {
    contentNote = 'About page content ';
  } else if (url.includes('/property-search/')) {
    contentNote = 'Property search page content ';
  }

  let explanation = `This page has ${parts.join(' and ')}.`;

  if (fleschScore >= 70) {
    explanation += ` ${contentNote}reads at an accessible level for most visitors.`;
  } else if (fleschScore >= 50) {
    explanation += ` ${contentNote}${avgSentLen > 20 ? 'The longer sentences and' : 'The'} multi-syllable real estate terminology bring the score down.`;
  } else {
    explanation += ` ${contentNote}Dense sentence structure and specialized vocabulary make this harder to read quickly.`;
  }

  return explanation;
}

// ── Split text into sentences ──
function splitSentences(text) {
  // Split on .!? followed by whitespace or end of string
  const raw = text.split(/[.!?]+(?:\s|$)/);
  // Filter out empty/whitespace-only entries and entries with fewer than 2 words
  return raw.filter(s => s.trim().length > 0 && s.trim().split(/\s+/).length >= 2);
}

// ── Extract words from text ──
function extractWords(text) {
  return text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
}

// ── Main ──
async function main() {
  console.log('[extract-text] Reading crawl-data.json...');
  const crawlData = JSON.parse(fs.readFileSync(CRAWL_DATA, 'utf-8'));
  const urls = crawlData.pages.map(p => p.url);
  console.log(`[extract-text] Found ${urls.length} pages to analyze.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[extract-text] (${i + 1}/${urls.length}) ${url}`);

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Give dynamic content a moment to render
      await page.waitForTimeout(2000);

      // Extract body text with boilerplate stripped
      const bodyText = await page.evaluate(() => {
        // Remove boilerplate elements
        const selectorsToRemove = [
          'nav', 'footer', 'header', 'aside',
          'script', 'style', 'noscript', 'iframe',
          '[class*="menu"]', '[class*="nav"]', '[class*="footer"]',
          '[class*="sidebar"]', '[class*="widget"]',
          '[id*="menu"]', '[id*="nav"]', '[id*="footer"]',
          '[id*="sidebar"]', '[id*="widget"]',
          '[class*="Menu"]', '[class*="Nav"]', '[class*="Footer"]',
          '[class*="Sidebar"]', '[class*="Widget"]',
          '[id*="Menu"]', '[id*="Nav"]', '[id*="Footer"]',
          '[id*="Sidebar"]', '[id*="Widget"]'
        ];

        // Clone body so we don't destroy the page
        const clone = document.body.cloneNode(true);

        for (const sel of selectorsToRemove) {
          const els = clone.querySelectorAll(sel);
          els.forEach(el => el.remove());
        }

        // Try main/article/section first
        let contentEl = clone.querySelector('main') || clone.querySelector('article');
        if (!contentEl) {
          // Fall back to sections
          const sections = clone.querySelectorAll('section');
          if (sections.length > 0) {
            contentEl = document.createElement('div');
            sections.forEach(s => contentEl.appendChild(s.cloneNode(true)));
          }
        }
        if (!contentEl) {
          contentEl = clone;
        }

        // Get paragraphs for paragraph count
        const paragraphs = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        const pCount = contentEl.querySelectorAll('p').length;

        // Get text
        const text = contentEl.innerText || contentEl.textContent || '';
        // Clean up whitespace
        return {
          text: text.replace(/\s+/g, ' ').trim(),
          paragraphCount: Math.max(pCount, 1)
        };
      });

      const text = bodyText.text;
      const paragraphCount = bodyText.paragraphCount;

      // Compute metrics
      const words = extractWords(text);
      const wordCount = words.length;
      const sentences = splitSentences(text);
      const sentenceCount = Math.max(sentences.length, 1);

      let syllableCount = 0;
      for (const w of words) {
        syllableCount += countSyllables(w);
      }

      const avgSentenceLength = parseFloat((wordCount / sentenceCount).toFixed(1));
      const avgSyllablesPerWord = parseFloat((syllableCount / Math.max(wordCount, 1)).toFixed(2));

      // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
      const fleschReadingEase = parseFloat(
        (206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / Math.max(wordCount, 1))).toFixed(1)
      );

      // Flesch-Kincaid Grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
      const fleschKincaidGrade = parseFloat(
        (0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / Math.max(wordCount, 1)) - 15.59).toFixed(1)
      );

      const readabilityLevel = getReadabilityLevel(fleschReadingEase);
      const scoreExplanation = buildExplanation(avgSentenceLength, avgSyllablesPerWord, fleschReadingEase, url);

      results.push({
        url,
        bodyText: text.substring(0, 500),
        wordCount,
        sentenceCount,
        syllableCount,
        paragraphCount,
        avgSentenceLength,
        avgSyllablesPerWord,
        fleschReadingEase,
        fleschKincaidGrade,
        readabilityLevel,
        scoreExplanation
      });

      console.log(`    Words: ${wordCount} | Sentences: ${sentenceCount} | FRE: ${fleschReadingEase} | FK Grade: ${fleschKincaidGrade} | ${readabilityLevel}`);
    } catch (err) {
      console.error(`    ERROR on ${url}: ${err.message}`);
      results.push({
        url,
        bodyText: '',
        wordCount: 0,
        sentenceCount: 0,
        syllableCount: 0,
        paragraphCount: 0,
        avgSentenceLength: 0,
        avgSyllablesPerWord: 0,
        fleschReadingEase: 0,
        fleschKincaidGrade: 0,
        readabilityLevel: 'Error',
        scoreExplanation: `Error fetching page: ${err.message}`
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const output = {
    crawlDate: new Date().toISOString().split('T')[0],
    pages: results
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n[extract-text] Done! ${results.length} pages analyzed.`);
  console.log(`[extract-text] Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('[extract-text] Fatal error:', err);
  process.exit(1);
});
