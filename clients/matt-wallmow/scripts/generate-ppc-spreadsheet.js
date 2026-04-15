// Generate PPC Audit Excel spreadsheet from ppc-data.json
// Usage: node scripts/generate-ppc-spreadsheet.js [--data path/to/ppc-data.json]
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const dataIdx = args.indexOf('--data');
const dataPath = dataIdx !== -1 ? args[dataIdx + 1] : path.join(__dirname, '..', 'ppc', 'ppc-data.json');

if (!fs.existsSync(dataPath)) {
  console.error(`Error: Data file not found at ${dataPath}`);
  console.error('Populate ppc-data.json with audit findings first.');
  process.exit(1);
}

const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ============ SHEET 1: Executive Summary ============
const execSummary = [
  [`PPC Campaign Audit: ${d.client.website}`, '', '', ''],
  ['Prepared For:', d.client.name, '', ''],
  ['Company:', d.client.company, '', ''],
  ['Google Ads Account:', d.client.accountId, '', ''],
  ['Campaign:', d.client.campaignName, '', ''],
  ['Date Range:', d.client.dateRange, '', ''],
  ['Audit Date:', d.client.auditDate, '', ''],
  ['Overall Grade:', d.client.overallGrade, '', ''],
  [],
  ['CAMPAIGN SETTINGS', '', '', ''],
  ['Monthly Budget:', d.client.monthlyBudget, 'Daily Budget:', d.client.dailyBudget],
  ['Bidding Strategy:', d.client.biddingStrategy, 'Geo-Targeting:', d.client.geoTargeting],
  ['Conversion Type:', d.client.conversionType, 'Target CPL:', d.client.targetCpl],
  [],
  ['CAMPAIGN HEALTH DASHBOARD', '', '', ''],
  ['Metric', 'Value', 'Industry Benchmark', 'Status'],
  ...d.campaignHealth.map(h => [h.metric, h.value, h.benchmark, h.status.toUpperCase()]),
  [],
  ['THE CORE PROBLEM', '', '', ''],
  ['Total Spend:', d.theProblem.totalSpend, '', ''],
  ['Registrations:', d.theProblem.registrations, '', ''],
  ['Closed Deals:', d.theProblem.closedDeals, '', ''],
  ['Cost per Deal:', d.theProblem.costPerDeal, 'Industry Avg Close Rate:', d.theProblem.industryAvgRate],
  ['Registration-to-Close Rate:', d.theProblem.registrationToCloseRate, '', ''],
  [d.theProblem.explanation, '', '', ''],
  [],
  ['TOP 5 CRITICAL ISSUES', '', '', ''],
  ['#', 'Issue', 'Detail', 'Impact'],
  ...d.topIssues.map((t, i) => [i + 1, t.issue, t.detail, t.impact]),
];

// ============ SHEET 2: Ad Group Performance ============
const adGroupPerf = [
  ['AD GROUP PERFORMANCE RANKING', '', '', '', '', '', '', '', ''],
  [`All ${d.topPerformers.length + d.bottomPerformers.length + (d.budgetBreakdown.length || 0)} ad groups ranked by cost per conversion`, '', '', '', '', '', '', '', ''],
  [],
  ['TOP 5 PERFORMERS', '', '', '', '', '', '', '', ''],
  ['Rank', 'Ad Group', 'Impressions', 'Clicks', 'CTR', 'Cost', 'Conversions', 'Cost/Conv', 'Recommendation'],
  ...d.topPerformers.map(p => [p.rank, p.adGroup, p.impressions, p.clicks, p.ctr, `$${p.cost.toFixed(2)}`, p.conversions, `$${p.costPerConv.toFixed(2)}`, p.recommendation]),
  [],
  ['BOTTOM 5 PERFORMERS', '', '', '', '', '', '', '', ''],
  ['Rank', 'Ad Group', 'Impressions', 'Clicks', 'CTR', 'Cost', 'Conversions', 'Cost/Conv', 'Recommendation'],
  ...d.bottomPerformers.map(p => [p.rank, p.adGroup, p.impressions, p.clicks, p.ctr, `$${p.cost.toFixed(2)}`, p.conversions, `$${p.costPerConv.toFixed(2)}`, p.recommendation]),
  [],
  ['BUDGET BREAKDOWN BY AD GROUP', '', '', '', '', ''],
  ['Ad Group', 'Spend', '% of Budget', 'Conversions', 'Cost/Conv', 'Status'],
  ...d.budgetBreakdown.map(b => [b.adGroup, `$${b.spend.toFixed(2)}`, b.pctOfBudget, b.conversions, `$${b.costPerConv.toFixed(2)}`, b.status]),
];

// ============ SHEET 3: Keyword Analysis ============
const keywordAnalysis = [
  ['KEYWORD & MATCH TYPE ANALYSIS', '', '', ''],
  [],
  ['BROAD MATCH CANNIBALIZATION', '', '', ''],
  [d.keywordIssues.broadMatchProblem, '', '', ''],
  [],
  ['DEAD KEYWORDS (0 IMPRESSIONS)', '', '', ''],
  ['Keyword', 'Ad Group(s)', 'Impressions', 'Action'],
  ...d.keywordIssues.deadKeywords.map(k => [k.keyword, k.adGroup, k.impressions, 'PAUSE']),
  [],
  ['MISSING AD EXTENSIONS', '', '', ''],
  ...d.keywordIssues.missingExtensions.map((e, i) => [i + 1, e, 'Not configured', 'ADD']),
  [],
  ['AD COPY IMPROVEMENTS', '', '', ''],
  ['Ad Group', 'Issue', 'Current', 'Recommended'],
  ...d.adCopyImprovements.map(a => [a.adGroup, a.issue, a.current, a.recommended]),
];

// ============ SHEET 4: Search Term Audit ============
const searchTermAudit = [
  ['SEARCH TERM AUDIT & WASTED SPEND', '', '', '', '', ''],
  [],
  ['BUDGET WASTE SUMMARY', '', '', '', '', ''],
  ['Total Wasted:', d.budgetWaste.totalWasted, '', '', '', ''],
  ['% of Budget Wasted:', d.budgetWaste.percentWasted, '', '', '', ''],
  [],
  ['TOP WASTED QUERIES', '', '', '', '', ''],
  ['Search Query', 'Cost', 'Clicks', 'Conversions', 'Reason', ''],
  ...d.budgetWaste.topWastedQueries.map(q => [q.query, `$${q.cost.toFixed(2)}`, q.clicks, q.conversions, q.reason, '']),
  [],
  ['NEGATIVE KEYWORD RECOMMENDATIONS', '', '', '', '', ''],
  [],
  ['GEOGRAPHIC (exclude these locations/regions)', '', '', '', '', ''],
  ...d.negativeKeywords.geographic.map((k, i) => [i + 1, k, '', '', '', '']),
  [],
  ['PRICE-RELATED (exclude low-budget searches)', '', '', '', '', ''],
  ...d.negativeKeywords.price.map((k, i) => [i + 1, k, '', '', '', '']),
  [],
  ['COMPETITOR BRANDS (exclude competitor name searches)', '', '', '', '', ''],
  ...d.negativeKeywords.competitor.map((k, i) => [i + 1, k, '', '', '', '']),
  [],
  ['BRAND/IRRELEVANT (exclude off-brand queries)', '', '', '', '', ''],
  ...d.negativeKeywords.brand.map((k, i) => [i + 1, k, '', '', '', '']),
  [],
  ['UNRELATED TERMS', '', '', '', '', ''],
  ...d.negativeKeywords.unrelated.map((k, i) => [i + 1, k, '', '', '', '']),
];

// ============ SHEET 5: Optimization Plan ============
const actionPlan = [
  ['PRIORITIZED PPC OPTIMIZATION PLAN', '', '', '', ''],
  [],
  ['IMMEDIATE — This Week (Low Effort, High Impact)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.immediate.map((a, i) => [i + 1, a.action, a.why, a.effort, a.impact]),
  [],
  ['WEEK 2-3 (Ad Copy & Keyword Refinement)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.week2to3.map((a, i) => [i + 1 + d.actionPlan.immediate.length, a.action, a.why, a.effort, a.impact]),
  [],
  ['MONTH 1-2 (Campaign Restructuring)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.month1to2.map((a, i) => [i + 1 + d.actionPlan.immediate.length + d.actionPlan.week2to3.length, a.action, a.why, a.effort, a.impact]),
  [],
  ['MONTH 2-3 (Advanced Optimization)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  ...d.actionPlan.month2to3.map((a, i) => [i + 1 + d.actionPlan.immediate.length + d.actionPlan.week2to3.length + d.actionPlan.month1to2.length, a.action, a.why, a.effort, a.impact]),
];

// ============ SHEET 6: Budget Reallocation ============
const budgetRealloc = [
  ['BUDGET REALLOCATION MODEL', '', '', '', ''],
  [`Shift spend from underperformers to top-performing ad groups`, '', '', '', ''],
  [],
  ['Ad Group', 'Current Spend', 'Recommended % of Budget', 'Change', 'Reason'],
  ...d.budgetReallocation.map(b => [b.adGroup, `$${b.currentSpend.toFixed(2)}`, b.recommendedPct, b.change, b.reason]),
  [],
  ['PROJECTED IMPACT', '', '', '', ''],
  ['Metric', 'Current', 'Projected', '', ''],
  ['Cost per Lead', d.projectedImpact.currentCostPerLead, d.projectedImpact.projectedCostPerLead, '', ''],
  ['Lead Quality (Close Rate)', d.projectedImpact.currentLeadQuality, d.projectedImpact.projectedLeadQuality, '', ''],
  ['Est. Monthly Savings', '', d.projectedImpact.estimatedMonthlySavings, '', ''],
  [],
  [d.projectedImpact.explanation, '', '', '', ''],
];

// Build workbook
const wb = XLSX.utils.book_new();

function addSheet(wb, data, name, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  if (colWidths) ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, name);
}

addSheet(wb, execSummary, 'Executive Summary', [
  { wch: 35 }, { wch: 30 }, { wch: 25 }, { wch: 25 }
]);

addSheet(wb, adGroupPerf, 'Ad Group Performance', [
  { wch: 6 }, { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
]);

addSheet(wb, keywordAnalysis, 'Keyword Analysis', [
  { wch: 45 }, { wch: 40 }, { wch: 50 }, { wch: 60 }
]);

addSheet(wb, searchTermAudit, 'Search Term Audit', [
  { wch: 5 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
]);

addSheet(wb, actionPlan, 'Optimization Plan', [
  { wch: 5 }, { wch: 65 }, { wch: 55 }, { wch: 10 }, { wch: 10 }
]);

addSheet(wb, budgetRealloc, 'Budget Reallocation', [
  { wch: 35 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 55 }
]);

const outDir = path.join(__dirname, '..', 'ppc', 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'PPC-Audit-GamePlan.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Spreadsheet saved to: ${outPath}`);
