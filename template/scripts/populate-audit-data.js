#!/usr/bin/env node
'use strict';

/**
 * populate-audit-data.js — Parses Markdown research files and merges extracted data
 * into audit-data.json for the 6 fields that come from AI-written Markdown.
 *
 * Usage (run from client directory):
 *   node scripts/populate-audit-data.js [--force]
 *
 * Options:
 *   --force  Overwrite fields even if already populated
 *
 * Populates (skips if already populated, unless --force):
 *   keywords[]            from seo/research/keyword-research.md
 *   competitorComparison[] from seo/research/competitor-analysis.md
 *   competitorStrategies[] from seo/research/competitor-analysis.md
 *   siteComparison[]      from seo/research/competitor-analysis.md (executive table, summarized)
 *   contentCalendar       from seo/reports/FINAL-AUDIT-REPORT.md Section 8
 *   advantages[]          from seo/reports/FINAL-AUDIT-REPORT.md "What [client] Does Better"
 */

const fs = require('fs');
const path = require('path');
const { writeJsonAtomic } = require('./lib/atomic-write');

const FORCE = process.argv.includes('--force');

// ── Paths (all relative to cwd = client directory) ──────────────────────────
const AUDIT_DATA_PATH = path.resolve('seo/audit-data.json');
const KEYWORD_MD = path.resolve('seo/research/keyword-research.md');
const COMPETITOR_MD = path.resolve('seo/research/competitor-analysis.md');
const FINAL_REPORT_MD = path.resolve('seo/reports/FINAL-AUDIT-REPORT.md');

// ── Utilities ────────────────────────────────────────────────────────────────

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Parse a Markdown pipe-table into array of objects.
 * Returns [{col1: val, col2: val, ...}, ...]
 * The second line (separator) is skipped automatically.
 */
function parseMarkdownTable(text) {
  const lines = text.split('\n');
  const rows = [];
  let headers = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    // Parse cells: split on |, drop empty first/last
    const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (!headers) {
      headers = cells.map(h => h.replace(/\*+/g, '').trim());
      continue;
    }
    // Skip separator row (---|---|...)
    if (cells.every(c => /^[-: ]+$/.test(c))) continue;
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] || '').replace(/\*+/g, '').trim();
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Extract the first Markdown table immediately following a heading that matches headingRegex.
 * Returns the raw table text block.
 */
function extractTableAfterHeading(text, headingRegex) {
  const lines = text.split('\n');
  let inTable = false;
  let tableLines = [];
  let foundHeading = false;

  for (const line of lines) {
    if (!foundHeading && headingRegex.test(line)) {
      foundHeading = true;
      continue;
    }
    if (!foundHeading) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      inTable = true;
      tableLines.push(line);
    } else if (inTable && trimmed === '') {
      // allow one blank line inside table
      tableLines.push(line);
    } else if (inTable) {
      break; // table ended
    }
  }
  return tableLines.join('\n');
}

/**
 * Strip markdown bold/italic from a value string.
 */
function stripMarkdown(str) {
  return str.replace(/\*+/g, '').replace(/^#+\s*/, '').trim();
}

// ── Field parsers ────────────────────────────────────────────────────────────

/**
 * Parse keywords[] from keyword-research.md.
 * Table header: | # | Keyword | Est. Volume | {clientDomain} Rank | Top Organic Result |
 * Returns [{keyword, volume, clientRank, competitorRank, topResult}]
 */
function parseKeywords(md) {
  const tableText = extractTableAfterHeading(md, /Full Rankings Table/i)
    || extractTableAfterHeading(md, /keyword.*table/i);
  if (!tableText) return null;

  const rawRows = parseMarkdownTable(tableText);
  if (!rawRows.length) return null;

  // Column positions: 0=#, 1=Keyword, 2=Est.Volume, 3={clientDomain} Rank, 4=Top Organic Result
  // Headers vary (domain name in col 3), so use positional access
  const headers = Object.keys(rawRows[0]);
  const col = {
    keyword: headers[1],
    volume: headers[2],
    clientRank: headers[3],
    topResult: headers[4],
  };

  return rawRows.map(row => ({
    keyword: stripMarkdown(row[col.keyword] || ''),
    volume: stripMarkdown(row[col.volume] || ''),
    clientRank: stripMarkdown(row[col.clientRank] || ''),
    competitorRank: '',   // populated later by gather-keyword-volumes.js
    topResult: stripMarkdown(row[col.topResult] || ''),
  })).filter(r => r.keyword);
}

/**
 * Parse competitorComparison[] from competitor-analysis.md.
 * Table header: | Metric | {client} | {comp1} | {comp2} | ... |
 * Returns [{metric, client, comp1, comp2, comp3, comp4, comp5, gap}]
 * The first column is Metric, the last column may or may not be Gap.
 */
function parseCompetitorComparison(md) {
  const tableText = extractTableAfterHeading(md, /Executive Comparison Table/i);
  if (!tableText) return null;

  const rawRows = parseMarkdownTable(tableText);
  if (!rawRows.length) return null;

  const headers = Object.keys(rawRows[0]);
  // headers[0] = 'Metric', headers[1] = client name, headers[2..n] = competitors
  // We map positionally: col0=metric, col1=client, col2=comp1, col3=comp2, ...
  // If the last header is 'Gap' we include it, otherwise gap is empty string.
  const lastHeader = headers[headers.length - 1].toLowerCase();
  const hasGap = lastHeader === 'gap';

  return rawRows.map(row => {
    const metric = stripMarkdown(row[headers[0]] || '');
    if (!metric) return null;
    const result = {
      metric,
      client: stripMarkdown(row[headers[1]] || ''),
    };
    // comp1..comp5 (up to 5 competitors after client column, before optional gap)
    const compCols = hasGap ? headers.slice(2, headers.length - 1) : headers.slice(2);
    compCols.forEach((h, i) => {
      result[`comp${i + 1}`] = stripMarkdown(row[h] || '');
    });
    // Fill remaining comp slots up to comp5 as empty
    for (let i = compCols.length + 1; i <= 5; i++) {
      if (!result[`comp${i}`]) result[`comp${i}`] = '';
    }
    result.gap = hasGap ? stripMarkdown(row[headers[headers.length - 1]] || '') : '';
    return result;
  }).filter(Boolean);
}

/**
 * Parse competitorStrategies[] from competitor-analysis.md.
 * Each competitor section has a "### Content Strategy" or "### Keyword Strategy" section.
 * We extract the "Standout approach" bullet from Content Strategy per competitor.
 * Returns [{competitor, strategy, detail}]
 */
function parseCompetitorStrategies(md) {
  const strategies = [];
  // Match competitor sections: ## Competitor N: Name (domain)
  const compSectionRe = /^## Competitor \d+: (.+?)$/m;
  const sections = md.split(/^## Competitor \d+:/m).slice(1); // split at each competitor section

  // Re-extract competitor names from original headings
  const competitorNames = [];
  const nameMatches = md.matchAll(/^## Competitor \d+: (.+?)$/gm);
  for (const m of nameMatches) {
    competitorNames.push(m[1].trim());
  }

  sections.forEach((section, idx) => {
    const name = competitorNames[idx] || `Competitor ${idx + 1}`;
    // Extract the Standout approach bullet from Content Strategy
    const standoutMatch = section.match(/\*\*Standout approach[:\s]*\*\*:?\s*(.+?)(?=\n[-\*]|\n\n|$)/s);
    if (standoutMatch) {
      strategies.push({
        competitor: name,
        strategy: `Content Strategy`,
        detail: standoutMatch[1].replace(/\n/g, ' ').trim(),
      });
    }
  });

  return strategies.length ? strategies : null;
}

/**
 * Parse siteComparison[] — a 3-column summary (metric, client, competitor, gap).
 * Derived from the executive comparison table (competitorComparison).
 * We take the most meaningful rows and aggregate competitors into a range/summary.
 */
function parseSiteComparison(compComparison) {
  if (!compComparison || !compComparison.length) return null;

  // For siteComparison, aggregate comp1..comp5 into a single competitor range string
  return compComparison.map(row => {
    const compVals = [row.comp1, row.comp2, row.comp3, row.comp4, row.comp5]
      .filter(v => v && v !== '');
    const competitor = compVals.join(' / ');
    return {
      metric: row.metric,
      client: row.client,
      competitor,
      gap: row.gap || '',
    };
  });
}

/**
 * Parse contentCalendar from FINAL-AUDIT-REPORT.md Section 8.
 * Expected format:
 *   ## Section 8: Content Calendar
 *   ### Month 1-3 Blog Topics  (or just ### Month 1: Label)
 *   **Month 1:** (or **Month 1: Label**)
 *   | Week | Topic | Target Keyword | Type |
 *   ...
 * Returns {month1Label, month1: [{week, topic, keyword, type}], ...}
 */
function parseContentCalendar(md) {
  // Find Section 8 using indexOf to avoid lazy regex truncation
  const headingMarker = '## Section 8: Content Calendar';
  const startIdx = md.indexOf(headingMarker);
  if (startIdx < 0) return null;

  // Find the next ## heading to bound the section
  const nextHeading = md.indexOf('\n## ', startIdx + headingMarker.length);
  const section = nextHeading >= 0
    ? md.slice(startIdx + headingMarker.length, nextHeading)
    : md.slice(startIdx + headingMarker.length);
  const result = {};

  for (let monthNum = 1; monthNum <= 3; monthNum++) {
    // Match **Month N:** or **Month N: Label**
    const monthHeaderRe = new RegExp(`\\*\\*Month ${monthNum}:\\s*([^*]*?)\\s*\\*\\*`);
    const headerMatch = section.match(monthHeaderRe);
    const label = headerMatch && headerMatch[1]
      ? `Month ${monthNum}: ${headerMatch[1].trim()}`
      : `Month ${monthNum}`;
    result[`month${monthNum}Label`] = label;

    // Extract table that follows **Month N:**
    const tableStartIdx = headerMatch ? section.indexOf(headerMatch[0]) : -1;
    if (tableStartIdx < 0) {
      result[`month${monthNum}`] = [];
      continue;
    }

    const afterHeader = section.slice(tableStartIdx + headerMatch[0].length);
    // Find the table (first block of lines starting with |)
    const tableLines = [];
    let inTable = false;
    for (const line of afterHeader.split('\n')) {
      const t = line.trim();
      if (t.startsWith('|')) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable && t === '') {
        tableLines.push(line);
      } else if (inTable) {
        break;
      }
    }

    if (!tableLines.length) {
      result[`month${monthNum}`] = [];
      continue;
    }

    const rows = parseMarkdownTable(tableLines.join('\n'));
    const headers = rows.length ? Object.keys(rows[0]) : [];
    // Map positionally: Week, Topic, Target Keyword/keyword, Type
    const weekCol = headers[0];
    const topicCol = headers[1];
    const keywordCol = headers[2];
    const typeCol = headers[3];

    result[`month${monthNum}`] = rows.map(row => ({
      week: parseInt(stripMarkdown(row[weekCol] || ''), 10) || 0,
      topic: stripMarkdown(row[topicCol] || ''),
      keyword: stripMarkdown(row[keywordCol] || ''),
      type: stripMarkdown(row[typeCol] || ''),
    })).filter(r => r.topic);
  }

  return result;
}

/**
 * Parse advantages[] from FINAL-AUDIT-REPORT.md.
 * Looks for "### What [Client] Does Better" heading and extracts numbered items.
 * Returns [{title, detail}]
 */
function parseAdvantages(md) {
  // Find the "What [X] Does Better" section
  const sectionMatch = md.match(/### What .+? Does Better\n([\s\S]*?)(?=\n---|\n## |\n### |$)/);
  if (!sectionMatch) return null;

  const body = sectionMatch[1];
  const advantages = [];

  // Match numbered items: 1. **Title** — detail  or  1. **Title.** detail
  const itemRe = /^\d+\.\s+\*\*(.+?)\*\*[.:]?\s*[-—–]?\s*(.+?)$/gm;
  let m;
  while ((m = itemRe.exec(body)) !== null) {
    const title = m[1].replace(/[.:]+$/, '').trim();
    const detail = m[2].trim();
    if (title) advantages.push({ title, detail });
  }

  return advantages.length ? advantages : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Load audit-data.json
  if (!fs.existsSync(AUDIT_DATA_PATH)) {
    console.error(`ERROR: ${AUDIT_DATA_PATH} not found. Run build_audit.py first.`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(AUDIT_DATA_PATH, 'utf8'));

  // Load source Markdown files
  const keywordMd = readFile(KEYWORD_MD);
  const competitorMd = readFile(COMPETITOR_MD);
  const finalReportMd = readFile(FINAL_REPORT_MD);

  const updates = {};
  const skipped = [];
  const errors = [];

  // ── keywords[] ─────────────────────────────────────────────────────────────
  if (!keywordMd) {
    errors.push('keywords: keyword-research.md not found');
  } else if (Array.isArray(data.keywords) && data.keywords.length > 0 && !FORCE) {
    skipped.push(`keywords (${data.keywords.length} entries already present)`);
  } else {
    const parsed = parseKeywords(keywordMd);
    if (parsed && parsed.length) {
      updates.keywords = parsed;
      console.log(`  keywords: extracted ${parsed.length} rows`);
    } else {
      errors.push('keywords: could not parse table from keyword-research.md');
    }
  }

  // ── competitorComparison[] ──────────────────────────────────────────────────
  if (!competitorMd) {
    errors.push('competitorComparison: competitor-analysis.md not found');
  } else if (Array.isArray(data.competitorComparison) && data.competitorComparison.length > 0 && !FORCE) {
    skipped.push(`competitorComparison (${data.competitorComparison.length} rows already present)`);
  } else {
    const parsed = parseCompetitorComparison(competitorMd);
    if (parsed && parsed.length) {
      updates.competitorComparison = parsed;
      console.log(`  competitorComparison: extracted ${parsed.length} rows`);
    } else {
      errors.push('competitorComparison: could not parse Executive Comparison Table from competitor-analysis.md');
    }
  }

  // ── competitorStrategies[] ─────────────────────────────────────────────────
  if (!competitorMd) {
    errors.push('competitorStrategies: competitor-analysis.md not found');
  } else if (Array.isArray(data.competitorStrategies) && data.competitorStrategies.length > 0 && !FORCE) {
    skipped.push(`competitorStrategies (${data.competitorStrategies.length} entries already present)`);
  } else {
    const parsed = parseCompetitorStrategies(competitorMd);
    if (parsed && parsed.length) {
      updates.competitorStrategies = parsed;
      console.log(`  competitorStrategies: extracted ${parsed.length} entries`);
    } else {
      errors.push('competitorStrategies: could not extract standout strategies from competitor-analysis.md');
    }
  }

  // ── siteComparison[] ──────────────────────────────────────────────────────
  if (Array.isArray(data.siteComparison) && data.siteComparison.length > 0 && !FORCE) {
    skipped.push(`siteComparison (${data.siteComparison.length} rows already present)`);
  } else {
    // Derive from competitorComparison (parsed or existing)
    const source = updates.competitorComparison || data.competitorComparison;
    const parsed = parseSiteComparison(source);
    if (parsed && parsed.length) {
      updates.siteComparison = parsed;
      console.log(`  siteComparison: derived ${parsed.length} rows from competitorComparison`);
    } else {
      errors.push('siteComparison: no competitorComparison data to derive from');
    }
  }

  // ── contentCalendar ────────────────────────────────────────────────────────
  if (!finalReportMd) {
    errors.push('contentCalendar: FINAL-AUDIT-REPORT.md not found');
  } else if (data.contentCalendar && data.contentCalendar.month1 && data.contentCalendar.month1.length > 0 && !FORCE) {
    skipped.push('contentCalendar (already populated)');
  } else {
    const parsed = parseContentCalendar(finalReportMd);
    if (parsed) {
      updates.contentCalendar = parsed;
      const total = (parsed.month1 || []).length + (parsed.month2 || []).length + (parsed.month3 || []).length;
      console.log(`  contentCalendar: extracted ${total} items across 3 months`);
    } else {
      errors.push('contentCalendar: could not find Section 8 in FINAL-AUDIT-REPORT.md');
    }
  }

  // ── advantages[] ──────────────────────────────────────────────────────────
  if (!finalReportMd) {
    errors.push('advantages: FINAL-AUDIT-REPORT.md not found');
  } else if (Array.isArray(data.advantages) && data.advantages.length > 0 && !FORCE) {
    skipped.push(`advantages (${data.advantages.length} entries already present)`);
  } else {
    const parsed = parseAdvantages(finalReportMd);
    if (parsed && parsed.length) {
      updates.advantages = parsed;
      console.log(`  advantages: extracted ${parsed.length} items`);
    } else {
      errors.push('advantages: could not find "What [client] Does Better" section in FINAL-AUDIT-REPORT.md');
    }
  }

  // ── Write back ─────────────────────────────────────────────────────────────
  if (Object.keys(updates).length === 0 && skipped.length > 0) {
    console.log('\nAll fields already populated — nothing to write.');
    console.log('Skipped: ' + skipped.join(', '));
    console.log('Run with --force to overwrite.');
  } else if (Object.keys(updates).length > 0) {
    Object.assign(data, updates);
    writeJsonAtomic(AUDIT_DATA_PATH, data, { indent: 2, trailingNewline: false });
    console.log(`\nWrote ${Object.keys(updates).length} field(s) to ${AUDIT_DATA_PATH}`);
    if (skipped.length) console.log('Skipped (already populated): ' + skipped.join(', '));
  }

  if (errors.length) {
    console.warn('\nWarnings/Errors:');
    errors.forEach(e => console.warn('  ' + e));
  }
}

main();
