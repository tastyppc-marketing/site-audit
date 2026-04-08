#!/usr/bin/env node
// Parse Google Ads CSV exports into structured JSON
// Usage: node scripts/parse-google-ads.js <folder-path>
// Output: ppc-raw-data.json in the current working directory

const fs = require('fs');
const path = require('path');

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: node scripts/parse-google-ads.js <folder-path>');
  process.exit(1);
}

const absFolder = path.resolve(folder);
if (!fs.existsSync(absFolder)) {
  console.error(`Folder not found: ${absFolder}`);
  process.exit(1);
}

// ---------- Encoding detection ----------
function readFileAutoEncoding(filePath) {
  const buf = fs.readFileSync(filePath);
  // UTF-16LE BOM: 0xFF 0xFE
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
    console.log(`  Encoding: UTF-16LE`);
    return buf.toString('utf16le').replace(/^\uFEFF/, '');
  }
  // UTF-8 BOM: 0xEF 0xBB 0xBF
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return buf.toString('utf8').replace(/^\uFEFF/, '');
  }
  return buf.toString('utf8');
}

// ---------- CSV/TSV parser (handles quoted fields with embedded commas/newlines) ----------
function detectDelimiter(line) {
  const tabs = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r') {
        // skip
      } else if (ch === '\n') {
        row.push(field.trim());
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some(f => f !== '')) rows.push(row);
  }
  return rows;
}

// ---------- Value cleaners ----------
function cleanNum(val) {
  if (val == null || val === '' || val === ' --' || val === '--') return 0;
  const s = String(val).replace(/[,"$]/g, '').trim();
  if (s === '' || s === '--') return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function cleanPct(val) {
  if (val == null || val === '' || val === ' --' || val === '--') return 0;
  const s = String(val).replace(/[%,"]/g, '').trim();
  if (s === '' || s === '--') return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : +(n / 100).toFixed(6);
}

function cleanStr(val) {
  if (val == null) return '';
  return String(val).replace(/^"|"$/g, '').trim();
}

// ---------- Identify report type ----------
function identifyReportType(reportName, headers) {
  const name = reportName.toLowerCase();
  const hdr = headers.join('|').toLowerCase();

  if (name.includes('search term')) return 'searchTerms';
  if (name.includes('quality score') || (name.includes('keyword') && hdr.includes('quality score'))) return 'qualityScore';
  if (name.includes('search keyword') || name.includes('keyword report')) return 'keywords';
  if (name.includes('ad group')) return 'adGroups';
  if (name.includes('ad report')) return 'ads';
  if (name.includes('audience') || name.includes('segment report')) return 'audiences';
  if (name.includes('landing page')) return 'landingPages';
  if (name.includes('device')) return 'devices';
  if (name.includes('location')) return 'geographic';
  if (name.includes('time') && name.includes('day')) return 'adSchedule';
  if (name.includes('change history')) return 'changeHistory';

  // Untitled reports — check column headers
  if (hdr.includes('device')) return 'devices';
  if (hdr.includes('country') || hdr.includes('state (matched)')) return 'geographic';
  if (hdr.includes('quality score')) return 'qualityScore';
  if (hdr.includes('hour of the day')) return 'adSchedule';
  if (hdr.includes('landing page')) return 'landingPages';
  if (hdr.includes('search term')) return 'searchTerms';
  if (hdr.includes('audience segment')) return 'audiences';

  return 'unknown';
}

// ---------- Column map builder ----------
function buildColMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    map[h.toLowerCase().replace(/\s+/g, ' ').trim()] = i;
  });
  return map;
}

function col(row, map, ...keys) {
  for (const k of keys) {
    const idx = map[k.toLowerCase()];
    if (idx !== undefined && idx < row.length) return row[idx];
  }
  return '';
}

// ---------- Report-specific parsers ----------
function parseKeywords(rows, m) {
  return rows.map(r => ({
    keywordStatus: cleanStr(col(r, m, 'keyword status')),
    keyword: cleanStr(col(r, m, 'keyword')),
    matchType: cleanStr(col(r, m, 'match type')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    status: cleanStr(col(r, m, 'status')),
    statusReasons: cleanStr(col(r, m, 'status reasons')),
    finalUrl: cleanStr(col(r, m, 'final url')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    cost: cleanNum(col(r, m, 'cost')),
    clicks: cleanNum(col(r, m, 'clicks')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseSearchTerms(rows, m) {
  return rows.map(r => ({
    searchTerm: cleanStr(col(r, m, 'search term')),
    matchType: cleanStr(col(r, m, 'match type')),
    addedExcluded: cleanStr(col(r, m, 'added/excluded')),
    campaign: cleanStr(col(r, m, 'campaign')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseAdGroups(rows, m) {
  return rows.map(r => ({
    adGroupStatus: cleanStr(col(r, m, 'ad group status')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    status: cleanStr(col(r, m, 'status')),
    statusReasons: cleanStr(col(r, m, 'status reasons')),
    adGroupType: cleanStr(col(r, m, 'ad group type')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    cost: cleanNum(col(r, m, 'cost')),
    clicks: cleanNum(col(r, m, 'clicks')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseAds(rows, m) {
  return rows.map(r => {
    const headlines = [];
    for (let i = 1; i <= 15; i++) {
      const h = cleanStr(col(r, m, `headline ${i}`));
      if (h && h !== '--') headlines.push(h);
    }
    const descriptions = [];
    for (let i = 1; i <= 4; i++) {
      const d = cleanStr(col(r, m, `description ${i}`));
      if (d && d !== '--') descriptions.push(d);
    }
    return {
      adStatus: cleanStr(col(r, m, 'ad status')),
      finalUrl: cleanStr(col(r, m, 'final url')),
      headlines,
      descriptions,
      path1: cleanStr(col(r, m, 'path 1')),
      path2: cleanStr(col(r, m, 'path 2')),
      adGroup: cleanStr(col(r, m, 'ad group')),
      status: cleanStr(col(r, m, 'status')),
      adStrength: cleanStr(col(r, m, 'ad strength')),
      adStrengthImprovements: cleanStr(col(r, m, 'ad strength improvements')),
      adType: cleanStr(col(r, m, 'ad type')),
      clicks: cleanNum(col(r, m, 'clicks')),
      impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
      ctr: cleanPct(col(r, m, 'ctr')),
      avgCpc: cleanNum(col(r, m, 'avg. cpc')),
      cost: cleanNum(col(r, m, 'cost')),
      convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
      conversions: cleanNum(col(r, m, 'conversions')),
      costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
    };
  });
}

function parseAudiences(rows, m) {
  return rows.map(r => ({
    segmentStatus: cleanStr(col(r, m, 'segment status')),
    audienceSegment: cleanStr(col(r, m, 'audience segment')),
    type: cleanStr(col(r, m, 'type')),
    campaign: cleanStr(col(r, m, 'campaign')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    status: cleanStr(col(r, m, 'status')),
    level: cleanStr(col(r, m, 'level')),
    bidAdj: cleanStr(col(r, m, 'bid adj.')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseDevices(rows, m) {
  return rows.map(r => ({
    device: cleanStr(col(r, m, 'device')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseGeographic(rows, m) {
  return rows.map(r => ({
    country: cleanStr(col(r, m, 'country/territory (matched)', 'country')),
    state: cleanStr(col(r, m, 'state (matched)', 'state')),
    city: cleanStr(col(r, m, 'city (matched)', 'city')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    conversions: cleanNum(col(r, m, 'conversions')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseLandingPages(rows, m) {
  return rows.map(r => ({
    landingPage: cleanStr(col(r, m, 'landing page')),
    selectedBy: cleanStr(col(r, m, 'selected by')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    conversions: cleanNum(col(r, m, 'conversions')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseQualityScore(rows, m) {
  return rows.map(r => ({
    keyword: cleanStr(col(r, m, 'search keyword', 'keyword')),
    qualityScore: cleanNum(col(r, m, 'quality score')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    campaign: cleanStr(col(r, m, 'campaign')),
    conversions: cleanNum(col(r, m, 'conversions')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    ctr: cleanPct(col(r, m, 'ctr')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
  }));
}

function parseAdSchedule(rows, m) {
  return rows.map(r => ({
    hour: cleanNum(col(r, m, 'hour of the day')),
    dayOfWeek: cleanStr(col(r, m, 'day of the week')),
    conversions: cleanNum(col(r, m, 'conversions')),
    clicks: cleanNum(col(r, m, 'clicks')),
    impressions: cleanNum(col(r, m, 'impr.', 'impressions')),
    ctr: cleanPct(col(r, m, 'ctr')),
    avgCpc: cleanNum(col(r, m, 'avg. cpc')),
    cost: cleanNum(col(r, m, 'cost')),
    convRate: cleanPct(col(r, m, 'conv. rate', 'conversion rate')),
    costPerConv: cleanNum(col(r, m, 'cost / conv.', 'cost/conv.')),
    imprsAbsTop: cleanPct(col(r, m, 'impr. (abs. top) %')),
    imprsTop: cleanPct(col(r, m, 'impr. (top) %')),
  }));
}

function parseChangeHistory(rows, m) {
  return rows.map(r => ({
    dateTime: cleanStr(col(r, m, 'date & time')),
    user: cleanStr(col(r, m, 'user')),
    campaign: cleanStr(col(r, m, 'campaign')),
    adGroup: cleanStr(col(r, m, 'ad group')),
    changes: cleanStr(col(r, m, 'changes')),
  }));
}

// ---------- Main ----------
const parsers = {
  keywords: parseKeywords, searchTerms: parseSearchTerms, adGroups: parseAdGroups,
  ads: parseAds, audiences: parseAudiences, devices: parseDevices,
  geographic: parseGeographic, landingPages: parseLandingPages,
  qualityScore: parseQualityScore, adSchedule: parseAdSchedule,
  changeHistory: parseChangeHistory,
};

const csvFiles = fs.readdirSync(absFolder).filter(f => f.toLowerCase().endsWith('.csv'));
console.log(`\nFound ${csvFiles.length} CSV files in ${absFolder}\n`);

const output = {
  meta: { folder: absFolder, parsedAt: new Date().toISOString(), fileCount: csvFiles.length },
  adGroups: [], keywords: [], ads: [], searchTerms: [], audiences: [],
  geographic: [], devices: [], adSchedule: [], landingPages: [],
  qualityScore: [], changeHistory: [],
};

for (const file of csvFiles) {
  const filePath = path.join(absFolder, file);
  console.log(`Parsing: ${file}`);

  const text = readFileAutoEncoding(filePath);

  // Split into lines, keeping structure for header detection
  const allLines = text.split('\n');
  const nonEmpty = allLines.filter(l => l.trim());
  if (nonEmpty.length < 3) {
    console.log(`  Skipped (< 3 lines)\n`);
    continue;
  }

  const reportName = nonEmpty[0].trim();
  const dateRange = nonEmpty[1].trim();
  const headerLine = nonEmpty[2];
  const delimiter = detectDelimiter(headerLine);
  console.log(`  Report: "${reportName}" | Range: ${dateRange} | Delim: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

  // Re-parse from header line onward with full CSV parser (handles quoted newlines)
  const dataText = allLines.slice(allLines.indexOf(nonEmpty[2])).join('\n');
  const parsed = parseCSV(dataText, delimiter);

  if (parsed.length < 2) {
    console.log(`  Skipped (no data rows)\n`);
    continue;
  }

  const headers = parsed[0];
  const dataRows = parsed.slice(1);
  const colMap = buildColMap(headers);

  const reportType = identifyReportType(reportName, headers);
  console.log(`  Type: ${reportType} | ${headers.length} cols | ${dataRows.length} rows`);

  if (reportType === 'unknown' || !parsers[reportType]) {
    console.log(`  WARNING: Unknown report type, skipping.\n`);
    continue;
  }

  const records = parsers[reportType](dataRows, colMap);
  output[reportType] = output[reportType].concat(records);
  console.log(`  -> ${records.length} records added to ${reportType}\n`);
}

// ---------- Summary ----------
console.log('========================================');
console.log('PARSE SUMMARY');
console.log('========================================');
const sections = ['adGroups', 'keywords', 'ads', 'searchTerms', 'audiences',
  'geographic', 'devices', 'adSchedule', 'landingPages', 'qualityScore', 'changeHistory'];
for (const s of sections) {
  const n = output[s].length;
  console.log(`  ${s.padEnd(16)} ${String(n).padStart(6)} records ${n === 0 ? '(missing)' : ''}`);
}

// Quick aggregate stats
const totalSpend = output.adGroups.reduce((s, r) => s + r.cost, 0)
  || output.devices.reduce((s, r) => s + r.cost, 0);
const totalClicks = output.adGroups.reduce((s, r) => s + r.clicks, 0)
  || output.devices.reduce((s, r) => s + r.clicks, 0);
const totalConv = output.adGroups.reduce((s, r) => s + r.conversions, 0)
  || output.devices.reduce((s, r) => s + r.conversions, 0);
const totalImpr = output.adGroups.reduce((s, r) => s + r.impressions, 0)
  || output.devices.reduce((s, r) => s + r.impressions, 0);

console.log('\n--- Quick Stats ---');
console.log(`  Total Spend:       $${totalSpend.toFixed(2)}`);
console.log(`  Total Impressions: ${totalImpr.toLocaleString()}`);
console.log(`  Total Clicks:      ${totalClicks.toLocaleString()}`);
console.log(`  Total Conversions: ${totalConv.toFixed(0)}`);
if (totalClicks > 0) console.log(`  Avg CPC:           $${(totalSpend / totalClicks).toFixed(2)}`);
if (totalImpr > 0) console.log(`  Avg CTR:           ${((totalClicks / totalImpr) * 100).toFixed(2)}%`);
if (totalConv > 0) console.log(`  Avg Cost/Conv:     $${(totalSpend / totalConv).toFixed(2)}`);

// Write output
const ppcDir = path.join(process.cwd(), 'ppc');
if (!fs.existsSync(ppcDir)) fs.mkdirSync(ppcDir, { recursive: true });
const outPath = path.join(ppcDir, 'ppc-raw-data.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nOutput: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)\n`);
