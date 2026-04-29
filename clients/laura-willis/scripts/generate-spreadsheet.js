// Generate SEO Audit Excel spreadsheet from audit-data.json
// Usage: node scripts/generate-spreadsheet.js [--data path/to/audit-data.json]
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const dataIdx = args.indexOf('--data');
const dataPath = dataIdx !== -1 ? args[dataIdx + 1] : path.join(__dirname, '..', 'seo', 'audit-data.json');

if (!fs.existsSync(dataPath)) {
  console.error(`Error: Data file not found at ${dataPath}`);
  console.error('Copy audit-data.json from the template and fill in your audit findings.');
  process.exit(1);
}

const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ============ SHEET 1: Executive Summary ============
const execSummary = [
  [`SEO Audit: ${d.client.website}`, '', '', ''],
  ['Prepared For:', d.client.name, '', ''],
  ['Company:', d.client.company, '', ''],
  ['Website:', d.client.websiteUrl, '', ''],
  ['Platform:', d.client.platform, '', ''],
  ['Audit Date:', d.client.auditDate, '', ''],
  ['Overall Grade:', d.client.overallGrade, '', ''],
  [],
  ['TOP 5 CRITICAL ISSUES', '', '', ''],
  ['#', 'Issue', 'Impact', 'Effort to Fix'],
  ...d.topIssues.map((t, i) => [i + 1, t.issue + ' — ' + t.detail, t.impact, t.effort]),
  [],
  ['SITE COMPARISON SNAPSHOT', '', '', '', ''],
  ['Metric', d.client.website, `#1 Competitor (${d.competitor.primaryLabel})`, 'Gap', ''],
  ...d.siteComparison.map(s => [s.metric, s.client, s.competitor, s.gap, '']),
];

// ============ SHEET 2: Keyword Research ============
const kwHeader = d.keywords.length > 0 ? d.keywords.length : 25;
const kwRanking = d.keywords.filter(k => k.clientRank !== 'Not found').length;
const keywords = [
  [`KEYWORD RESEARCH: ${d.client.location} (${kwHeader} Keywords)`, '', '', '', '', ''],
  [`Keywords Tested: ${kwHeader} | Client Rankings Found: ${kwRanking} | ${d.competitor.primaryLabel} Rankings: ${d.keywords.filter(k => k.competitorRank !== 'Not found').length}`, '', '', '', '', ''],
  [],
  ['#', 'Keyword', 'Est. Volume', d.client.website, d.competitor.primary, 'Top Organic Result'],
  ...d.keywords.map((k, i) => [i + 1, k.keyword, k.volume, k.clientRank, k.competitorRank, k.topResult]),
];

// ============ SHEET 3: Competitor Comparison ============
// Mirrors pages/competitors.js:64-71 — derive column count from row keys, not
// from competitor.all (the two can diverge when normalizer adds a comp slot
// without a matching competitor metadata entry).
const compKeys = (function (rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter(k => /^comp\d+$/.test(k) && rows[0][k] !== undefined)
    .sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10));
})(d.competitorComparison);

const compHeaders = ['Metric', d.client.website];
compKeys.forEach((_, i) => {
  const meta = d.competitor.all[i];
  compHeaders.push((meta && meta.name) || ('Comp ' + (i + 1)));
});
compHeaders.push('Gap');

const competitors = [
  ['COMPETITOR COMPARISON', '', '', '', '', ''],
  [],
  compHeaders,
  ...d.competitorComparison.map(row => {
    const r = [row.metric, row.client];
    compKeys.forEach(key => r.push(row[key] || ''));
    r.push(row.gap || '');
    return r;
  }),
];

// ============ SHEET 4: Action Plan ============
const actionPlan = [
  ['PRIORITIZED ACTION PLAN', '', '', '', ''],
  [],
  ['QUICK WINS — Week 1-2 (Low Effort, High Impact)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.quickWins.map((a, i) => [i + 1, a.action, a.why, a.effort, a.impact]),
  [],
  ['SHORT-TERM — Month 1-2 (Medium Effort)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.shortTerm.map((a, i) => [i + 1 + d.actionPlan.quickWins.length, a.action, a.why, a.effort, a.impact]),
  [],
  ['MEDIUM-TERM — Month 2-4 (Higher Effort)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.mediumTerm.map((a, i) => [i + 1 + d.actionPlan.quickWins.length + d.actionPlan.shortTerm.length, a.action, a.why, a.effort, a.impact]),
  [],
  ['LONG-TERM — Month 4+ (Ongoing Strategy)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.longTerm.map((a, i) => [i + 1 + d.actionPlan.quickWins.length + d.actionPlan.shortTerm.length + d.actionPlan.mediumTerm.length, a.action, a.why, a.effort, a.impact]),
];

// ============ SHEET 5: Content Calendar ============
const contentCalendar = [
  ['CONTENT CALENDAR — Next 3 Months', '', '', ''],
  [],
  [d.contentCalendar.month1Label, '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  ...d.contentCalendar.month1.map(c => [c.week, c.topic, c.keyword, c.type]),
  [],
  [d.contentCalendar.month2Label, '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  ...d.contentCalendar.month2.map(c => [c.week, c.topic, c.keyword, c.type]),
  [],
  [d.contentCalendar.month3Label, '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  ...d.contentCalendar.month3.map(c => [c.week, c.topic, c.keyword, c.type]),
];

// ============ SHEET 6: Deliverables Summary ============
const deliverables = [
  ['READY-TO-DEPLOY DELIVERABLES', '', '', ''],
  ['These items have been created as part of this audit and are ready for implementation.', '', '', ''],
  [],
  ['Deliverable', 'Scope', 'Score', 'Status'],
  ...d.deliverables.map(del => [del.name, del.scope, del.score, del.status]),
  [],
  ['KEY PAGES CREATED:', '', '', ''],
  ...d.keyPagesCreated.map((p, i) => [i + 1, p, '', '']),
  [],
  ['BLOG POSTS CREATED:', '', '', ''],
  ...d.blogPostsCreated.map((p, i) => [i + 1, p, '', '']),
];

// Build workbook
const wb = XLSX.utils.book_new();

function addSheet(wb, data, name, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  if (colWidths) ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, name);
}

addSheet(wb, execSummary, 'Executive Summary', [
  { wch: 35 }, { wch: 50 }, { wch: 30 }, { wch: 30 }, { wch: 20 }
]);

addSheet(wb, keywords, 'Keyword Research', [
  { wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 25 }, { wch: 28 }, { wch: 35 }
]);

addSheet(wb, competitors, 'Competitor Comparison', [
  { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 30 }
]);

addSheet(wb, actionPlan, 'Action Plan', [
  { wch: 5 }, { wch: 60 }, { wch: 55 }, { wch: 10 }, { wch: 10 }
]);

addSheet(wb, contentCalendar, 'Content Calendar', [
  { wch: 12 }, { wch: 60 }, { wch: 35 }, { wch: 20 }
]);

addSheet(wb, deliverables, 'Deliverables', [
  { wch: 50 }, { wch: 25 }, { wch: 15 }, { wch: 40 }
]);

const outPath = path.join(__dirname, '..', 'seo', 'reports', 'SEO-Audit-GamePlan.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Spreadsheet saved to: ${outPath}`);
