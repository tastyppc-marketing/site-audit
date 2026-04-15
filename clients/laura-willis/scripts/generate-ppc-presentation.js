// Generate PPC Audit PowerPoint presentation from ppc-data.json
// Usage: node scripts/generate-ppc-presentation.js [--data path/to/ppc-data.json]
const PptxGenJS = require('pptxgenjs');
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

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'PPC Audit Team';
pptx.subject = `PPC Campaign Audit: ${d.client.website}`;

// Color palette
const DARK = '1a1a2e';
const ACCENT = '16213e';
const BLUE = '0f3460';
const HIGHLIGHT = 'e94560';
const WHITE = 'ffffff';
const LIGHT_GRAY = 'f5f5f5';
const MED_GRAY = '666666';
const GREEN = '27ae60';
const RED = 'e74c3c';
const ORANGE = 'f39c12';
const STATUS = { green: GREEN, orange: ORANGE, red: RED, neutral: MED_GRAY };

function addTitleBar(slide, title) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: DARK } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 12, h: 0.8, fontSize: 28, color: WHITE, bold: true, fontFace: 'Arial' });
}

// ============ SLIDE 1: Title ============
let slide = pptx.addSlide();
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: '100%', h: 0.06, fill: { color: HIGHLIGHT } });
slide.addText('PPC Campaign Audit', { x: 0.8, y: 1.0, w: 11, h: 1.2, fontSize: 40, color: WHITE, bold: true, fontFace: 'Arial' });
slide.addText(d.client.website, { x: 0.8, y: 2.1, w: 11, h: 0.7, fontSize: 28, color: HIGHLIGHT, fontFace: 'Arial' });
slide.addText([
  { text: 'Prepared for: ', options: { color: MED_GRAY, fontSize: 16 } },
  { text: d.client.name, options: { color: WHITE, fontSize: 16, bold: true } },
], { x: 0.8, y: 3.8, w: 11, h: 0.5, fontFace: 'Arial' });
slide.addText(d.client.company, { x: 0.8, y: 4.3, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
slide.addText(`Google Ads Account: ${d.client.accountId}`, { x: 0.8, y: 4.7, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
slide.addText(d.client.auditDate, { x: 0.8, y: 5.1, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });

// ============ SLIDE 2: Campaign Health Dashboard ============
slide = pptx.addSlide();
addTitleBar(slide, 'Campaign Health Dashboard');

// Grade box
slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 3, h: 3.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText('CAMPAIGN GRADE', { x: 0.5, y: 1.6, w: 3, h: 0.5, fontSize: 14, color: MED_GRAY, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText(d.client.overallGrade, { x: 0.5, y: 2.2, w: 3, h: 2, fontSize: 96, color: RED, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText(d.client.gradeSummary, { x: 0.5, y: 4.3, w: 3, h: 0.7, fontSize: 9, color: MED_GRAY, align: 'center', fontFace: 'Arial' });

// Metrics
d.campaignHealth.slice(0, 8).forEach((h, i) => {
  const y = 1.5 + i * 0.62;
  const color = STATUS[h.status] || MED_GRAY;
  slide.addText(h.value, { x: 4.2, y, w: 3.2, h: 0.3, fontSize: 20, color, bold: true, fontFace: 'Arial' });
  slide.addText(h.metric, { x: 7.5, y: y + 0.02, w: 5.2, h: 0.3, fontSize: 13, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 3: The Problem ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Core Problem: Lead Quality');

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 12, h: 1.8, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
const probData = [
  { label: 'Total Spend', value: d.theProblem.totalSpend, color: MED_GRAY },
  { label: 'Registrations', value: String(d.theProblem.registrations), color: ORANGE },
  { label: 'Closed Deals', value: String(d.theProblem.closedDeals), color: RED },
  { label: 'Cost per Deal', value: d.theProblem.costPerDeal, color: RED },
];
probData.forEach((p, i) => {
  const x = 0.8 + i * 3.1;
  slide.addText(p.value, { x, y: 1.7, w: 2.6, h: 0.9, fontSize: 36, color: p.color, bold: true, align: 'center', fontFace: 'Arial' });
  slide.addText(p.label, { x, y: 2.6, w: 2.6, h: 0.4, fontSize: 13, color: MED_GRAY, align: 'center', fontFace: 'Arial' });
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.8, w: 12, h: 0.06, fill: { color: HIGHLIGHT } });

slide.addText([
  { text: 'Registration-to-Close Rate: ', options: { fontSize: 18, color: MED_GRAY } },
  { text: d.theProblem.registrationToCloseRate, options: { fontSize: 24, color: RED, bold: true } },
  { text: `  (Industry avg: ${d.theProblem.industryAvgRate})`, options: { fontSize: 16, color: MED_GRAY } },
], { x: 0.8, y: 4.2, w: 12, h: 0.6, fontFace: 'Arial' });

slide.addText(d.theProblem.explanation, { x: 0.8, y: 5.0, w: 11.5, h: 1.2, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });

// ============ SLIDE 4: Where Your Money Goes ============
slide = pptx.addSlide();
addTitleBar(slide, 'Where Your Money Goes');

const budgetTable = [
  [{ text: 'Ad Group', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Spend', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: '% Budget', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Conversions', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Cost/Conv', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Status', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.budgetBreakdown.map(b => {
    const statusColor = b.status === 'Top Performer' ? GREEN : b.status === 'Overspending' ? RED : b.status === 'Underperforming' ? ORANGE : MED_GRAY;
    return [b.adGroup, `$${b.spend.toFixed(2)}`, b.pctOfBudget, b.conversions, `$${b.costPerConv.toFixed(2)}`, { text: b.status, options: { color: statusColor, bold: true } }];
  })
];
slide.addTable(budgetTable, {
  x: 0.3, y: 1.4, w: 12.5, colW: [3.5, 1.5, 1.3, 1.5, 1.5, 3.2],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 5: Budget Waste ============
slide = pptx.addSlide();
addTitleBar(slide, 'Budget Waste: Irrelevant Search Terms');

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 4, h: 1.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText(d.budgetWaste.percentWasted, { x: 0.5, y: 1.6, w: 4, h: 0.8, fontSize: 48, color: RED, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText('of budget wasted on irrelevant queries', { x: 0.5, y: 2.4, w: 4, h: 0.5, fontSize: 12, color: MED_GRAY, align: 'center', fontFace: 'Arial' });

slide.addShape(pptx.ShapeType.rect, { x: 5, y: 1.5, w: 4, h: 1.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText(d.budgetWaste.totalWasted, { x: 5, y: 1.6, w: 4, h: 0.8, fontSize: 48, color: RED, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText('total wasted spend', { x: 5, y: 2.4, w: 4, h: 0.5, fontSize: 12, color: MED_GRAY, align: 'center', fontFace: 'Arial' });

slide.addText('Top Wasted Search Queries:', { x: 0.5, y: 3.3, w: 12, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });
d.budgetWaste.topWastedQueries.slice(0, 8).forEach((q, i) => {
  const y = 3.8 + i * 0.42;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.2, h: 0.2, fill: { color: RED }, rectRadius: 0.02 });
  slide.addText(`"${q.query}"`, { x: 0.9, y, w: 6, h: 0.35, fontSize: 13, color: DARK, fontFace: 'Arial' });
  slide.addText(q.reason, { x: 7.5, y, w: 5, h: 0.35, fontSize: 12, color: MED_GRAY, italic: true, fontFace: 'Arial' });
});

// ============ SLIDE 6: Top Performing Areas ============
slide = pptx.addSlide();
addTitleBar(slide, 'Top 5 Performing Ad Groups');

const topTable = [
  [{ text: '#', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Ad Group', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'CTR', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Cost', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Conversions', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Cost/Conv', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Action', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.topPerformers.map(p => [
    p.rank, p.adGroup, p.ctr,
    `$${p.cost.toFixed(2)}`, p.conversions,
    { text: `$${p.costPerConv.toFixed(2)}`, options: { color: GREEN, bold: true } },
    p.recommendation
  ])
];
slide.addTable(topTable, {
  x: 0.3, y: 1.4, w: 12.5, colW: [0.5, 3, 1.2, 1.5, 1.3, 1.3, 3.7],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 5.5, w: 12, h: 0.8, fill: { color: DARK }, rectRadius: 0.05 });
slide.addText('These 5 ad groups should receive the majority of your budget — shift spend from underperformers.', {
  x: 0.7, y: 5.6, w: 11.5, h: 0.6, fontSize: 15, color: WHITE, fontFace: 'Arial'
});

// ============ SLIDE 7: Underperforming Areas ============
slide = pptx.addSlide();
addTitleBar(slide, 'Bottom 5: Underperforming Ad Groups');

const bottomTable = [
  [{ text: '#', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Ad Group', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'CTR', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Cost', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Conversions', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Cost/Conv', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Action', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.bottomPerformers.map(p => [
    p.rank, p.adGroup, p.ctr,
    `$${p.cost.toFixed(2)}`, p.conversions,
    { text: `$${p.costPerConv.toFixed(2)}`, options: { color: RED, bold: true } },
    p.recommendation
  ])
];
slide.addTable(bottomTable, {
  x: 0.3, y: 1.4, w: 12.5, colW: [0.5, 3, 1.2, 1.5, 1.3, 1.3, 3.7],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 8: Keyword & Match Type Issues ============
slide = pptx.addSlide();
addTitleBar(slide, 'Keyword & Match Type Issues');

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.4, w: 12, h: 1.4, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText('BROAD MATCH CANNIBALIZATION', { x: 0.7, y: 1.5, w: 11.5, h: 0.4, fontSize: 16, color: RED, bold: true, fontFace: 'Arial' });
slide.addText(d.keywordIssues.broadMatchProblem, { x: 0.7, y: 1.9, w: 11.5, h: 0.8, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });

slide.addText('Dead Keywords (0 Impressions):', { x: 0.5, y: 3.1, w: 12, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });
d.keywordIssues.deadKeywords.forEach((k, i) => {
  const y = 3.6 + i * 0.5;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.25, h: 0.25, fill: { color: RED }, rectRadius: 0.02 });
  slide.addText(`"${k.keyword}"`, { x: 1.0, y, w: 5, h: 0.35, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(k.adGroup, { x: 6.5, y, w: 6, h: 0.35, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

slide.addText('Missing Extensions:', { x: 0.5, y: 5.3, w: 12, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });
slide.addText(d.keywordIssues.missingExtensions.join('  |  '), { x: 0.5, y: 5.7, w: 12, h: 0.4, fontSize: 14, color: ORANGE, fontFace: 'Arial' });

// ============ SLIDE 9: Ad Copy Improvements ============
slide = pptx.addSlide();
addTitleBar(slide, 'Ad Copy: Current vs Recommended');

d.adCopyImprovements.forEach((a, i) => {
  const y = 1.4 + i * 1.8;
  slide.addText(a.issue, { x: 0.5, y, w: 12, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });

  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.45, w: 5.8, h: 1.0, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });
  slide.addText('CURRENT:', { x: 0.7, y: y + 0.45, w: 5.4, h: 0.3, fontSize: 10, color: RED, bold: true, fontFace: 'Arial' });
  slide.addText(a.current, { x: 0.7, y: y + 0.75, w: 5.4, h: 0.6, fontSize: 10, color: MED_GRAY, fontFace: 'Arial' });

  slide.addShape(pptx.ShapeType.rect, { x: 6.7, y: y + 0.45, w: 5.8, h: 1.0, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });
  slide.addText('RECOMMENDED:', { x: 6.9, y: y + 0.45, w: 5.4, h: 0.3, fontSize: 10, color: GREEN, bold: true, fontFace: 'Arial' });
  slide.addText(a.recommended, { x: 6.9, y: y + 0.75, w: 5.4, h: 0.6, fontSize: 10, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 10: Negative Keywords ============
slide = pptx.addSlide();
addTitleBar(slide, 'Negative Keywords to Add');

const negCategories = [
  { label: 'Geographic', items: d.negativeKeywords.geographic, color: BLUE },
  { label: 'Price', items: d.negativeKeywords.price, color: ORANGE },
  { label: 'Competitor', items: d.negativeKeywords.competitor, color: ACCENT },
  { label: 'Unrelated', items: d.negativeKeywords.unrelated, color: RED },
];
negCategories.forEach((cat, i) => {
  const x = 0.4 + i * 3.15;
  slide.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 3, h: 5.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
  slide.addText(cat.label, { x, y: 1.5, w: 3, h: 0.5, fontSize: 16, color: cat.color, bold: true, align: 'center', fontFace: 'Arial' });
  slide.addShape(pptx.ShapeType.rect, { x: x + 0.3, y: 2.0, w: 2.4, h: 0.02, fill: { color: cat.color } });
  cat.items.slice(0, 9).forEach((item, j) => {
    slide.addText(item, { x: x + 0.2, y: 2.2 + j * 0.45, w: 2.6, h: 0.35, fontSize: 11, color: MED_GRAY, fontFace: 'Arial', bullet: { type: 'bullet', color: cat.color } });
  });
});

// ============ SLIDE 11: Quick Wins ============
slide = pptx.addSlide();
addTitleBar(slide, 'Quick Wins: This Week');

const qwTable = [
  [{ text: '#', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Action', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Impact', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Effort', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.quickWins.map((qw, i) => [
    i + 1, qw.action,
    { text: qw.impact, options: { color: qw.impact === 'High' ? GREEN : ORANGE, bold: true } },
    { text: 'Low', options: { color: GREEN } }
  ])
];
slide.addTable(qwTable, {
  x: 0.3, y: 1.3, w: 12.5, colW: [0.5, 9, 1.5, 1.5],
  fontSize: 11, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

slide.addText(`All ${d.quickWins.length} items are low effort and can be completed in a single Google Ads session.`, {
  x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 12, color: GREEN, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 12: 30-Day Optimization Plan ============
slide = pptx.addSlide();
addTitleBar(slide, '30-Day Optimization Plan');

slide.addText('Week 2-3 Actions', { x: 0.5, y: 1.3, w: 6, h: 0.5, fontSize: 18, color: DARK, bold: true, fontFace: 'Arial' });
d.actionPlan.week2to3.slice(0, 8).forEach((a, i) => {
  const y = 1.9 + i * 0.6;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.25, h: 0.25, fill: { color: BLUE }, rectRadius: 0.02 });
  slide.addText(a.action, { x: 1.0, y, w: 11.5, h: 0.45, fontSize: 12, color: DARK, fontFace: 'Arial' });
});

// ============ SLIDE 13: 90-Day Growth Strategy ============
slide = pptx.addSlide();
addTitleBar(slide, '90-Day Growth Strategy');

slide.addText('Month 1-2: Campaign Restructuring', { x: 0.5, y: 1.3, w: 6, h: 0.5, fontSize: 16, color: BLUE, bold: true, fontFace: 'Arial' });
d.actionPlan.month1to2.slice(0, 6).forEach((a, i) => {
  const y = 1.9 + i * 0.5;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.2, h: 0.2, fill: { color: BLUE }, rectRadius: 0.02 });
  slide.addText(a.action, { x: 0.9, y, w: 11.5, h: 0.4, fontSize: 12, color: DARK, fontFace: 'Arial' });
});

slide.addText('Month 2-3: Advanced Optimization', { x: 0.5, y: 5.0, w: 6, h: 0.5, fontSize: 16, color: ACCENT, bold: true, fontFace: 'Arial' });
d.actionPlan.month2to3.slice(0, 3).forEach((a, i) => {
  const y = 5.5 + i * 0.5;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.2, h: 0.2, fill: { color: ACCENT }, rectRadius: 0.02 });
  slide.addText(a.action, { x: 0.9, y, w: 11.5, h: 0.4, fontSize: 12, color: DARK, fontFace: 'Arial' });
});

// ============ SLIDE 14: Projected Impact ============
slide = pptx.addSlide();
addTitleBar(slide, 'Projected Impact');

slide.addText('If We Implement All Recommendations:', { x: 0.5, y: 1.4, w: 12, h: 0.5, fontSize: 20, color: DARK, bold: true, fontFace: 'Arial' });

const impactData = [
  { label: 'Cost per Lead', current: d.projectedImpact.currentCostPerLead, projected: d.projectedImpact.projectedCostPerLead },
  { label: 'Lead Quality', current: d.projectedImpact.currentLeadQuality, projected: d.projectedImpact.projectedLeadQuality },
  { label: 'Monthly Savings', current: '$0', projected: d.projectedImpact.estimatedMonthlySavings },
];

impactData.forEach((item, i) => {
  const y = 2.2 + i * 1.4;
  slide.addText(item.label, { x: 0.5, y, w: 12, h: 0.4, fontSize: 16, color: MED_GRAY, bold: true, fontFace: 'Arial' });

  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.5, w: 5, h: 0.7, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });
  slide.addText([{ text: 'Current: ', options: { color: MED_GRAY } }, { text: item.current, options: { color: RED, bold: true } }], {
    x: 0.7, y: y + 0.55, w: 4.6, h: 0.5, fontSize: 18, fontFace: 'Arial'
  });

  slide.addText('>', { x: 5.6, y: y + 0.5, w: 1, h: 0.7, fontSize: 28, color: GREEN, bold: true, align: 'center', fontFace: 'Arial' });

  slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: y + 0.5, w: 5, h: 0.7, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });
  slide.addText([{ text: 'Projected: ', options: { color: MED_GRAY } }, { text: item.projected, options: { color: GREEN, bold: true } }], {
    x: 7.0, y: y + 0.55, w: 4.6, h: 0.5, fontSize: 18, fontFace: 'Arial'
  });
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.4, w: 12, h: 0.8, fill: { color: DARK }, rectRadius: 0.05 });
slide.addText(d.projectedImpact.explanation, { x: 0.7, y: 6.5, w: 11.5, h: 0.6, fontSize: 13, color: WHITE, fontFace: 'Arial' });

// ============ SLIDE 15: Next Steps ============
slide = pptx.addSlide();
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.8, w: '100%', h: 0.04, fill: { color: HIGHLIGHT } });
slide.addText('Next Steps', { x: 0.8, y: 0.5, w: 11, h: 1, fontSize: 36, color: WHITE, bold: true, fontFace: 'Arial' });

d.nextSteps.forEach((s, i) => {
  const y = 2.2 + i * 1.0;
  slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: HIGHLIGHT }, rectRadius: 0.05 });
  slide.addText(String(i + 1), { x: 0.8, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 22, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addText(s.text, { x: 1.6, y, w: 10.5, h: 0.45, fontSize: 16, color: WHITE, bold: true, fontFace: 'Arial' });
  slide.addText(s.sub, { x: 1.6, y: y + 0.45, w: 10.5, h: 0.4, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

// Save
const outDir = path.join(__dirname, '..', 'ppc', 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'PPC-Audit-Presentation.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Presentation saved to: ${outPath}`);
}).catch(err => {
  console.error('Error:', err);
});
