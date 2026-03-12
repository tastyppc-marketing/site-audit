// Generate SEO Audit PowerPoint presentation from audit-data.json
// Usage: node scripts/generate-presentation.js [--data path/to/audit-data.json]
const PptxGenJS = require('pptxgenjs');
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

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'SEO Audit Team';
pptx.subject = `SEO Audit: ${d.client.website}`;

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
const SEVERITY = { red: RED, orange: ORANGE, green: GREEN };

function addTitleBar(slide, title) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: DARK } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 12, h: 0.8, fontSize: 28, color: WHITE, bold: true, fontFace: 'Arial' });
}

// ============ SLIDE 1: Title ============
let slide = pptx.addSlide();
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: '100%', h: 0.06, fill: { color: HIGHLIGHT } });
slide.addText('SEO Audit & Growth Strategy', { x: 0.8, y: 1.0, w: 11, h: 1.2, fontSize: 40, color: WHITE, bold: true, fontFace: 'Arial' });
slide.addText(d.client.website, { x: 0.8, y: 2.1, w: 11, h: 0.7, fontSize: 28, color: HIGHLIGHT, fontFace: 'Arial' });
slide.addText([
  { text: 'Prepared for: ', options: { color: MED_GRAY, fontSize: 16 } },
  { text: d.client.name, options: { color: WHITE, fontSize: 16, bold: true } },
], { x: 0.8, y: 3.8, w: 11, h: 0.5, fontFace: 'Arial' });
slide.addText(d.client.company, { x: 0.8, y: 4.3, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
slide.addText(d.client.auditDate, { x: 0.8, y: 4.9, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });

// ============ SLIDE 2: Current State / Overall Grade ============
slide = pptx.addSlide();
addTitleBar(slide, 'Where We Are Today');
slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 3, h: 3.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText('OVERALL GRADE', { x: 0.5, y: 1.6, w: 3, h: 0.5, fontSize: 14, color: MED_GRAY, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText(d.client.overallGrade, { x: 0.5, y: 2.2, w: 3, h: 2, fontSize: 96, color: RED, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText(d.client.gradeSummary, { x: 0.5, y: 4.3, w: 3, h: 0.7, fontSize: 10, color: MED_GRAY, align: 'center', fontFace: 'Arial' });

d.keyStats.forEach((s, i) => {
  const y = 1.5 + i * 0.75;
  slide.addText(s.value, { x: 4.2, y, w: 3, h: 0.35, fontSize: 22, color: SEVERITY[s.severity] || RED, bold: true, fontFace: 'Arial' });
  slide.addText(s.label, { x: 7.2, y: y + 0.05, w: 5.5, h: 0.35, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 3: Top 5 Critical Issues ============
slide = pptx.addSlide();
addTitleBar(slide, 'Top 5 Critical Issues');
d.topIssues.forEach((issue, i) => {
  const y = 1.4 + i * 1.15;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.5, h: 0.5, fill: { color: HIGHLIGHT }, rectRadius: 0.05 });
  slide.addText(String(i + 1), { x: 0.5, y, w: 0.5, h: 0.5, fontSize: 20, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addText(issue.issue, { x: 1.2, y, w: 11, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(issue.detail, { x: 1.2, y: y + 0.4, w: 11, h: 0.5, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 4: Keyword Visibility ============
slide = pptx.addSlide();
const kwFound = d.keywords.filter(k => k.clientRank !== 'Not found').length;
addTitleBar(slide, `Search Visibility: ${kwFound} of ${d.keywords.length} Keywords`);

slide.addText(`We tested ${d.keywords.length} keywords covering brand, type, area, intent, and long-tail terms.\n${d.client.website} was ${kwFound === 0 ? 'NOT found in organic results for any of them' : `found for ${kwFound} of them`}.`, {
  x: 0.5, y: 1.3, w: 12, h: 0.8, fontSize: 14, color: MED_GRAY, fontFace: 'Arial'
});

const kwTableRows = [
  [{ text: 'Keyword', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Volume', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Your Site', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: d.competitor.primaryLabel, options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: '#1 Result', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.keywords.slice(0, 8).map(k => [
    k.keyword, k.volume,
    k.clientRank === 'Not found' ? { text: 'Not found', options: { color: RED } } : { text: k.clientRank, options: { color: GREEN } },
    k.competitorRank === 'Not found' ? 'Not found' : { text: k.competitorRank, options: { color: GREEN } },
    k.topResult
  ])
];

slide.addTable(kwTableRows, {
  x: 0.5, y: 2.3, w: 12, colW: [3.5, 1.5, 2, 2, 3],
  fontSize: 11, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 5: Competitor Gap ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Content Gap');

const compTableRows = [
  [{ text: 'Metric', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Your Site', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: d.competitor.all[0]?.name || 'Comp 1', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: d.competitor.all[1]?.name || 'Comp 2', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Gap', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.competitorComparison.map(row => [
    row.metric,
    { text: String(row.client), options: { color: RED, bold: true } },
    String(row.comp1 || ''),
    String(row.comp2 || ''),
    { text: row.gap, options: { color: RED } }
  ])
];

slide.addTable(compTableRows, {
  x: 0.5, y: 1.8, w: 12, colW: [2.5, 2, 2.5, 2.5, 2.5],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 6: What Competitors Do Right ============
slide = pptx.addSlide();
addTitleBar(slide, 'What Top Competitors Are Doing Right');
d.competitorStrategies.forEach((s, i) => {
  const y = 1.4 + i * 0.95;
  slide.addText(s.strategy, { x: 0.5, y, w: 2.5, h: 0.4, fontSize: 14, color: BLUE, bold: true, fontFace: 'Arial' });
  slide.addText(s.detail, { x: 3.2, y, w: 9.5, h: 0.75, fontSize: 11, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 7: The Strategy — 4 Pillars ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Growth Strategy: 4 Pillars');
const pillarColors = [BLUE, ACCENT, DARK, HIGHLIGHT];
d.pillars.forEach((p, i) => {
  const x = 0.5 + i * 3.15;
  const color = pillarColors[i] || BLUE;
  slide.addShape(pptx.ShapeType.rect, { x, y: 1.5, w: 2.9, h: 4.8, fill: { color }, rectRadius: 0.1 });
  slide.addText(p.title, { x, y: 1.7, w: 2.9, h: 1.2, fontSize: 20, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addShape(pptx.ShapeType.rect, { x: x + 0.3, y: 3.0, w: 2.3, h: 0.02, fill: { color: WHITE } });
  slide.addText(p.desc, { x: x + 0.2, y: 3.2, w: 2.5, h: 2, fontSize: 12, color: WHITE, align: 'center', fontFace: 'Arial' });
  slide.addText(p.time, { x, y: 5.5, w: 2.9, h: 0.6, fontSize: 13, color: WHITE, bold: true, align: 'center', fontFace: 'Arial',
    fill: { color: '000000', transparency: 30 } });
});

// ============ SLIDE 8: Quick Wins ============
slide = pptx.addSlide();
addTitleBar(slide, 'Quick Wins: Week 1-2 (Low Effort, High Impact)');
const qwTable = [
  [{ text: '#', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Action', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Impact', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Effort', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.quickWins.map((qw, i) => [
    i + 1,
    qw.action,
    { text: qw.impact, options: { color: qw.impact === 'High' ? GREEN : ORANGE, bold: true } },
    { text: 'Low', options: { color: GREEN } }
  ])
];
slide.addTable(qwTable, {
  x: 0.5, y: 1.3, w: 12, colW: [0.5, 8.5, 1.5, 1.5],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});
slide.addText(`All ${d.quickWins.length} items are low effort and can be completed by a developer in 1-2 business days.`, {
  x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 12, color: GREEN, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 9: Content Strategy ============
slide = pptx.addSlide();
addTitleBar(slide, 'Content Strategy: Month 1-2');
slide.addText('Priority Content Actions', { x: 0.5, y: 1.3, w: 6, h: 0.5, fontSize: 18, color: DARK, bold: true, fontFace: 'Arial' });
d.actionPlan.shortTerm.forEach((a, i) => {
  const y = 1.9 + i * 0.58;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.25, h: 0.25, fill: { color: HIGHLIGHT }, rectRadius: 0.02 });
  slide.addText(a.action, { x: 1.0, y, w: 11.5, h: 0.45, fontSize: 13, color: DARK, fontFace: 'Arial' });
});

// ============ SLIDE 10: Content Calendar ============
slide = pptx.addSlide();
addTitleBar(slide, 'Blog Content Calendar: Next 3 Months');
const calTable = [
  [{ text: 'Week', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Topic', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Keyword Target', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Type', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  [{ text: d.contentCalendar.month1Label, options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ...d.contentCalendar.month1.map(c => [`Wk ${c.week}`, c.topic, c.keyword, c.type]),
  [{ text: d.contentCalendar.month2Label, options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ...d.contentCalendar.month2.map(c => [`Wk ${c.week}`, c.topic, c.keyword, c.type]),
  [{ text: d.contentCalendar.month3Label, options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ...d.contentCalendar.month3.map(c => [`Wk ${c.week}`, c.topic, c.keyword, c.type]),
];
slide.addTable(calTable, {
  x: 0.3, y: 1.3, w: 12.7, colW: [1, 5, 3.5, 1.7],
  fontSize: 11, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 11: Ready-to-Deploy Deliverables ============
slide = pptx.addSlide();
addTitleBar(slide, "Ready-to-Deploy: What We've Already Built");
slide.addText('These deliverables were created as part of this audit and are ready for implementation today.', {
  x: 0.5, y: 1.3, w: 12, h: 0.5, fontSize: 14, color: MED_GRAY, fontFace: 'Arial'
});
const delTable = [
  [{ text: 'Deliverable', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Scope', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Score', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Status', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...d.deliverables.map(del => [
    del.name, del.scope,
    { text: del.score, options: { color: GREEN, bold: true } },
    del.status
  ])
];
slide.addTable(delTable, {
  x: 0.5, y: 2.0, w: 12, colW: [3.5, 2.5, 2, 4],
  fontSize: 13, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

slide.addText('Key Pages Created:', { x: 0.5, y: 4.5, w: 6, h: 0.4, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial' });
slide.addText(d.keyPagesCreated.join('  |  '), { x: 0.5, y: 4.9, w: 12, h: 0.4, fontSize: 13, color: BLUE, fontFace: 'Arial' });
slide.addText('Blog Posts Created:', { x: 0.5, y: 5.5, w: 6, h: 0.4, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial' });
slide.addText(d.blogPostsCreated.join('  |  '), { x: 0.5, y: 5.9, w: 12, h: 0.4, fontSize: 13, color: BLUE, fontFace: 'Arial' });

// ============ SLIDE 12: Medium-Term Roadmap ============
slide = pptx.addSlide();
addTitleBar(slide, 'Medium-Term Roadmap: Month 2-4');
d.mediumTermRoadmap.forEach((item, i) => {
  const y = 1.35 + i * 0.65;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.2, h: 0.2, fill: { color: BLUE }, rectRadius: 0.02 });
  slide.addText(item.title, { x: 0.9, y, w: 3.3, h: 0.4, fontSize: 13, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(item.detail, { x: 4.3, y, w: 8.5, h: 0.4, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 13: Long-Term Vision ============
slide = pptx.addSlide();
addTitleBar(slide, 'Long-Term Strategy: Month 4+');
d.longTermColumns.forEach((col, i) => {
  const x = 0.4 + i * 3.15;
  slide.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 3, h: 5.4, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
  slide.addText(col.title, { x, y: 1.5, w: 3, h: 0.6, fontSize: 15, color: DARK, bold: true, align: 'center', fontFace: 'Arial' });
  slide.addShape(pptx.ShapeType.rect, { x: x + 0.3, y: 2.1, w: 2.4, h: 0.02, fill: { color: HIGHLIGHT } });
  col.items.forEach((item, j) => {
    slide.addText('  ' + item, { x: x + 0.15, y: 2.3 + j * 0.65, w: 2.7, h: 0.5, fontSize: 11, color: MED_GRAY, fontFace: 'Arial', bullet: { type: 'bullet', color: BLUE } });
  });
});

// ============ SLIDE 14: The Opportunity ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Opportunity');
slide.addText('Your Competitive Advantages', { x: 0.5, y: 1.4, w: 6, h: 0.5, fontSize: 20, color: DARK, bold: true, fontFace: 'Arial' });
d.advantages.forEach((a, i) => {
  const y = 2.1 + i * 0.85;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: GREEN }, rectRadius: 0.15 });
  slide.addText(a.title, { x: 1.1, y, w: 4, h: 0.35, fontSize: 15, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(a.detail, { x: 5.2, y, w: 7.5, h: 0.35, fontSize: 13, color: MED_GRAY, fontFace: 'Arial' });
});
slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.4, w: 12, h: 0.8, fill: { color: DARK }, rectRadius: 0.05 });
slide.addText('The site is not broken — it just needs content. With consistent investment, we can close the gap with competitors in 3-6 months.', {
  x: 0.7, y: 6.5, w: 11.5, h: 0.6, fontSize: 15, color: WHITE, fontFace: 'Arial'
});

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
const outPath = path.join(__dirname, '..', 'seo', 'reports', 'SEO-Audit-Presentation.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Presentation saved to: ${outPath}`);
}).catch(err => {
  console.error('Error:', err);
});
