const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pptx.author = 'SEO Audit Team';
pptx.subject = 'SEO Audit: livingparkcityutah.com';

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

// Helper: add a standard title bar to a slide
function addTitleBar(slide, title) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: DARK } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 12, h: 0.8, fontSize: 28, color: WHITE, bold: true, fontFace: 'Arial' });
}

// ============ SLIDE 1: Title ============
let slide = pptx.addSlide();
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: '100%', h: 0.06, fill: { color: HIGHLIGHT } });
slide.addText('SEO Audit & Growth Strategy', { x: 0.8, y: 1.0, w: 11, h: 1.2, fontSize: 40, color: WHITE, bold: true, fontFace: 'Arial' });
slide.addText('livingparkcityutah.com', { x: 0.8, y: 2.1, w: 11, h: 0.7, fontSize: 28, color: HIGHLIGHT, fontFace: 'Arial' });
slide.addText([
  { text: 'Prepared for: ', options: { color: MED_GRAY, fontSize: 16 } },
  { text: 'Tisha Digman & Cam Schiedel', options: { color: WHITE, fontSize: 16, bold: true } },
], { x: 0.8, y: 3.8, w: 11, h: 0.5, fontFace: 'Arial' });
slide.addText('Summit Sotheby\'s International Realty', { x: 0.8, y: 4.3, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
slide.addText('March 1, 2026', { x: 0.8, y: 4.9, w: 11, h: 0.4, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });

// ============ SLIDE 2: Current State / Overall Grade ============
slide = pptx.addSlide();
addTitleBar(slide, 'Where We Are Today');

// Grade box
slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 3, h: 3.5, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
slide.addText('OVERALL GRADE', { x: 0.5, y: 1.6, w: 3, h: 0.5, fontSize: 14, color: MED_GRAY, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText('D+', { x: 0.5, y: 2.2, w: 3, h: 2, fontSize: 96, color: RED, bold: true, align: 'center', fontFace: 'Arial' });
slide.addText('The site is not broken, but it is\nessentially invisible to search engines', { x: 0.5, y: 4.3, w: 3, h: 0.7, fontSize: 10, color: MED_GRAY, align: 'center', fontFace: 'Arial' });

// Key stats
const stats = [
  ['0 / 25', 'keywords ranking in Google', RED],
  ['62 pages', 'vs. competitors\' 200-400+', ORANGE],
  ['5 blog posts', 'all generic, last updated Jul 2024', ORANGE],
  ['~200 words', 'avg. community page (competitors: 3,500+)', RED],
  ['0 schema', 'markup on any page', RED],
  ['0 market reports', 'the #1 content type for real estate SEO', RED],
];
stats.forEach((s, i) => {
  const y = 1.5 + i * 0.75;
  slide.addText(s[0], { x: 4.2, y, w: 3, h: 0.35, fontSize: 22, color: s[2], bold: true, fontFace: 'Arial' });
  slide.addText(s[1], { x: 7.2, y: y + 0.05, w: 5.5, h: 0.35, fontSize: 14, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 3: Top 5 Critical Issues ============
slide = pptx.addSlide();
addTitleBar(slide, 'Top 5 Critical Issues');

const issues = [
  ['Zero organic search visibility', 'Not found for ANY of 25 Park City real estate keywords — potential clients are not finding this site through Google'],
  ['Critically thin content', 'Only 62 pages (competitors have 200-400+); dead blog with 5 generic posts, nothing since July 2024'],
  ['No market reports or local content', 'The single highest-impact content type for real estate SEO is completely absent from the site'],
  ['Technical SEO errors', '403 error page in sitemap, corrupted meta tags, multiple H1 tags, no schema markup, 60-70% images missing alt text'],
  ['No lead capture on highest-value pages', 'Community pages and blog posts (most likely to attract organic traffic) have no forms, CTAs, or lead magnets'],
];
issues.forEach((issue, i) => {
  const y = 1.4 + i * 1.15;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.5, h: 0.5, fill: { color: HIGHLIGHT }, rectRadius: 0.05 });
  slide.addText(String(i + 1), { x: 0.5, y, w: 0.5, h: 0.5, fontSize: 20, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addText(issue[0], { x: 1.2, y, w: 11, h: 0.4, fontSize: 16, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(issue[1], { x: 1.2, y: y + 0.4, w: 11, h: 0.5, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 4: Keyword Visibility ============
slide = pptx.addSlide();
addTitleBar(slide, 'Search Visibility: 0 of 25 Keywords');

slide.addText('We tested 25 keywords covering brand, property type, area, buyer intent, and long-tail terms.\nlivingparkcityutah.com was NOT found in organic results for any of them.', {
  x: 0.5, y: 1.3, w: 12, h: 0.8, fontSize: 14, color: MED_GRAY, fontFace: 'Arial'
});

const kwTable = [
  [{ text: 'Keyword', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Volume', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Your Site', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Laura Willis', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: '#1 Result', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ['park city homes for sale', 'Very High', { text: 'Not found', options: { color: RED } }, 'Not found', 'zillow.com'],
  ['park city real estate agent', 'High', { text: 'Not found', options: { color: RED } }, 'Not found', 'insideparkcityrealestate.com'],
  ['park city condos for sale', 'High', { text: 'Not found', options: { color: RED } }, 'Not found', 'zillow.com'],
  ['deer valley homes for sale', 'High', { text: 'Not found', options: { color: RED } }, 'Not found', 'steinsrealty.com'],
  ['park city real estate market', 'Medium', { text: 'Not found', options: { color: RED } }, 'Not found', 'liveeatplayparkcity.com'],
  ['park city utah realtor', 'High', { text: 'Not found', options: { color: RED } }, { text: '~#6', options: { color: GREEN } }, 'zillow.com'],
  ['luxury ski homes park city', 'Medium', { text: 'Not found', options: { color: RED } }, { text: '#3, #5', options: { color: GREEN } }, 'abodeparkcity.com'],
  ['park city utah homes', 'Very High', { text: 'Not found', options: { color: RED } }, { text: '~#5', options: { color: GREEN } }, 'zillow.com'],
];

slide.addTable(kwTable, {
  x: 0.5, y: 2.3, w: 12, colW: [3.5, 1.5, 2, 2, 3],
  fontSize: 11, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
  rowH: [0.4, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
});

slide.addText('Laura Willis (same platform, same brokerage) ranks for 5 of 25 keywords. The top local competitor ranks for 12.', {
  x: 0.5, y: 6.5, w: 12, h: 0.5, fontSize: 12, color: HIGHLIGHT, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 5: Competitor Gap ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Content Gap');

slide.addText('Your site has the same platform (Sierra Interactive) as 3 of 4 top competitors.\nThe gap is content investment, not technology.', {
  x: 0.5, y: 1.3, w: 12, h: 0.7, fontSize: 14, color: MED_GRAY, fontFace: 'Arial'
});

const compTable = [
  [{ text: 'Metric', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Your Site', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Laura Willis', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Fisher Group (#1)', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Gap', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ['Total Pages', { text: '62', options: { color: RED, bold: true } }, '372', '376', { text: '6x behind', options: { color: RED } }],
  ['Blog Posts', { text: '5', options: { color: RED, bold: true } }, '96', '33', { text: '19x behind Willis', options: { color: RED } }],
  ['Community Depth', { text: '~200 words', options: { color: RED, bold: true } }, '500-2,000', '3,500-4,500', { text: '20x behind', options: { color: RED } }],
  ['Schema Markup', { text: 'None', options: { color: RED, bold: true } }, 'None', 'Yes (all pages)', { text: 'Missing', options: { color: RED } }],
  ['Keywords Ranking', { text: '0 / 25', options: { color: RED, bold: true } }, '5 / 25', '12 / 25', { text: 'Zero visibility', options: { color: RED } }],
  ['Market Reports', { text: 'None', options: { color: RED, bold: true } }, 'None', 'None', { text: 'Opportunity!', options: { color: GREEN } }],
  ['FAQ Sections', { text: 'None', options: { color: RED, bold: true } }, 'None', 'Yes', { text: 'Missing', options: { color: RED } }],
];

slide.addTable(compTable, {
  x: 0.5, y: 2.2, w: 12, colW: [2.5, 2, 2.5, 2.5, 2.5],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
  rowH: [0.45, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
});

slide.addText('Good news: No competitor has market reports. First mover advantage here.', {
  x: 0.5, y: 6.3, w: 12, h: 0.4, fontSize: 13, color: GREEN, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 6: What Competitors Do Right ============
slide = pptx.addSlide();
addTitleBar(slide, 'What Top Competitors Are Doing Right');

const compStrategies = [
  ['Content Depth', 'parkcityluxuryrealestate.com has 300+ community pages at 3,500-4,500 words each. They have individual pages for every condo building and subdivision.'],
  ['Market Reports', 'realestateinparkcity.com publishes monthly market reports with median prices, inventory, DOM, and year-over-year data. This one page is worth more SEO value than our entire blog.'],
  ['Blog Volume', 'parkcityrealestate.com has 207 blog posts. laurawillisrealestate.com has 96 blog posts. We have 5.'],
  ['FAQ Sections', 'Fisher Group has FAQ schema on community pages targeting "People Also Ask" boxes and AI Overview citations in Google.'],
  ['"Best of" Content', 'parkcityrealestate.com has 14 local resource pages (best restaurants, spas, hotels) that build topical authority and attract non-real-estate traffic.'],
  ['Schema Markup', 'Fisher Group and Magnotta team have structured data on every page, enabling rich search results with business info and star ratings.'],
];
compStrategies.forEach((s, i) => {
  const y = 1.4 + i * 0.95;
  slide.addText(s[0], { x: 0.5, y, w: 2.5, h: 0.4, fontSize: 14, color: BLUE, bold: true, fontFace: 'Arial' });
  slide.addText(s[1], { x: 3.2, y, w: 9.5, h: 0.75, fontSize: 11, color: MED_GRAY, fontFace: 'Arial' });
});

// ============ SLIDE 7: The Strategy — 4 Pillars ============
slide = pptx.addSlide();
addTitleBar(slide, 'The Growth Strategy: 4 Pillars');

const pillars = [
  { title: 'TECHNICAL\nFIXES', desc: 'Fix H1 tags, meta descriptions,\nschema markup, 403 errors,\ncorrupted blog post, OG tags', time: 'Week 1-2', color: BLUE },
  { title: 'CONTENT\nDEPTH', desc: 'Expand community pages,\nlaunch market reports,\nrevive the blog', time: 'Month 1-2', color: ACCENT },
  { title: 'CONTENT\nSCALE', desc: 'Build ski/golf sections,\ncondo building pages,\nlifestyle guides', time: 'Month 2-4', color: DARK },
  { title: 'AUTHORITY\n& LEADS', desc: 'Video content, press mentions,\nemail newsletter, local citations,\nconversion optimization', time: 'Month 4+', color: HIGHLIGHT },
];
pillars.forEach((p, i) => {
  const x = 0.5 + i * 3.15;
  slide.addShape(pptx.ShapeType.rect, { x, y: 1.5, w: 2.9, h: 4.8, fill: { color: p.color }, rectRadius: 0.1 });
  slide.addText(p.title, { x, y: 1.7, w: 2.9, h: 1.2, fontSize: 20, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addShape(pptx.ShapeType.rect, { x: x + 0.3, y: 3.0, w: 2.3, h: 0.02, fill: { color: WHITE } });
  slide.addText(p.desc, { x: x + 0.2, y: 3.2, w: 2.5, h: 2, fontSize: 12, color: WHITE, align: 'center', fontFace: 'Arial' });
  slide.addText(p.time, { x, y: 5.5, w: 2.9, h: 0.6, fontSize: 13, color: WHITE, bold: true, align: 'center', fontFace: 'Arial',
    fill: { color: '000000', transparency: 30 } });
});

// ============ SLIDE 8: Quick Wins (Week 1-2) ============
slide = pptx.addSlide();
addTitleBar(slide, 'Quick Wins: Week 1-2 (Low Effort, High Impact)');

const quickWins = [
  ['Fix 403 error page — remove from sitemap', 'High'],
  ['Fix corrupted meta tags on blog post', 'High'],
  ['Fix homepage to single H1 tag', 'High'],
  ['Add H1 tags to ski-in/ski-out and search pages', 'Medium'],
  ['Rewrite all buyer/seller meta descriptions with "Park City"', 'High'],
  ['Add Open Graph tags to homepage', 'Medium'],
  ['Remove keyword stuffing from About page', 'Medium'],
  ['Add canonical tags to search pages', 'Medium'],
  ['Switch Gmail to branded email address', 'Medium'],
  ['Add RealEstateAgent + LocalBusiness schema', 'High'],
];
const qwTable = [
  [{ text: '#', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Action', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Impact', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Effort', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ...quickWins.map((qw, i) => [
    i + 1,
    qw[0],
    { text: qw[1], options: { color: qw[1] === 'High' ? GREEN : ORANGE, bold: true } },
    { text: 'Low', options: { color: GREEN } }
  ])
];
slide.addTable(qwTable, {
  x: 0.5, y: 1.3, w: 12, colW: [0.5, 8.5, 1.5, 1.5],
  fontSize: 12, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
  rowH: [0.4, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
});

slide.addText('All 10 items are low effort and can be completed by a developer in 1-2 business days.', {
  x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 12, color: GREEN, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 9: Content Strategy ============
slide = pptx.addSlide();
addTitleBar(slide, 'Content Strategy: Month 1-2');

slide.addText('Priority Content Actions', { x: 0.5, y: 1.3, w: 6, h: 0.5, fontSize: 18, color: DARK, bold: true, fontFace: 'Arial' });

const contentActions = [
  'Publish a Park City Market Report with current pricing data, inventory, and trends',
  'Expand top 10 community pages from ~200 to 1,000-1,500 words each',
  'Write 4-6 new locally-focused blog posts targeting high-value keywords',
  'Add editorial content to ski-in/ski-out page (140 listings, 0 words)',
  'Add contact forms and CTAs to every community page',
  'Add CTAs and email signup to all blog posts',
  'Create a testimonials/success stories page',
  'Rewrite About page with credentials, awards, video intro',
];
contentActions.forEach((a, i) => {
  const y = 1.9 + i * 0.58;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.25, h: 0.25, fill: { color: HIGHLIGHT }, rectRadius: 0.02 });
  slide.addText(a, { x: 1.0, y, w: 11.5, h: 0.45, fontSize: 13, color: DARK, fontFace: 'Arial' });
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.3, w: 12, h: 0.8, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });
slide.addText('Target: Go from 62 pages to 100+ pages in 2 months. Begin closing the 6x gap with competitors.', {
  x: 0.7, y: 6.4, w: 11.5, h: 0.6, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 10: Content Calendar ============
slide = pptx.addSlide();
addTitleBar(slide, 'Blog Content Calendar: Next 3 Months');

const calTable = [
  [{ text: 'Week', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Topic', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Keyword Target', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Type', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  [{ text: 'MONTH 1', options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ['Wk 1', 'Park City RE Market Report: Spring 2026', 'park city real estate market', 'Market Report'],
  ['Wk 2', 'Best Neighborhoods in Park City (2026)', 'best neighborhoods park city', 'Guide'],
  ['Wk 3', 'Is Park City RE a Good Investment?', 'park city real estate investment', 'Informational'],
  ['Wk 4', 'Deer Valley Expansion: East Village', 'deer valley real estate', 'News'],
  [{ text: 'MONTH 2', options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ['Wk 1', 'Moving to Park City: Relocation Guide', 'moving to park city utah', 'Guide'],
  ['Wk 2', 'Ski-in/Ski-out Homes Guide', 'park city ski homes for sale', 'Property'],
  ['Wk 3', 'Park City vs. Aspen Comparison', 'park city vs aspen', 'Comparison'],
  ['Wk 4', 'Property Taxes, HOAs & Cost of Living', 'park city cost of living', 'FAQ'],
  [{ text: 'MONTH 3', options: { bold: true, color: WHITE, fill: { color: BLUE }, colSpan: 4 } }],
  ['Wk 1', 'Q1 2026 Market Report Update', 'park city real estate market 2026', 'Market Report'],
  ['Wk 2', 'Heber City & Midway: Best-Kept Secret', 'heber city utah real estate', 'Area Guide'],
  ['Wk 3', 'Short-Term Rental Rules for Investors', 'park city vacation rental rules', 'Investment'],
  ['Wk 4', 'Buying Luxury in Park City ($5M+)', 'park city luxury real estate', 'Luxury'],
];

slide.addTable(calTable, {
  x: 0.3, y: 1.3, w: 12.7, colW: [1, 5, 3.5, 1.7],
  fontSize: 11, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
});

// ============ SLIDE 11: Ready-to-Deploy Deliverables ============
slide = pptx.addSlide();
addTitleBar(slide, 'Ready-to-Deploy: What We\'ve Already Built');

slide.addText('These deliverables were created as part of this audit and are ready for implementation today.', {
  x: 0.5, y: 1.3, w: 12, h: 0.5, fontSize: 14, color: MED_GRAY, fontFace: 'Arial'
});

const delTable = [
  [{ text: 'Deliverable', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Pages/Items', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Score', options: { bold: true, color: WHITE, fill: { color: DARK } } },
   { text: 'Status', options: { bold: true, color: WHITE, fill: { color: DARK } } }],
  ['Meta Titles & Descriptions', '62 pages', { text: '8.75 / 10', options: { color: GREEN, bold: true } }, 'Ready (verify claims)'],
  ['Schema Markup (JSON-LD)', '8 schema blocks', { text: '9.00 / 10', options: { color: GREEN, bold: true } }, 'Ready (verify URLs)'],
  ['Community Pages (expanded)', '4 pages, 1,000+ words', { text: '8.75 / 10', options: { color: GREEN, bold: true } }, 'Ready to paste into CMS'],
  ['Blog Posts (SEO-optimized)', '4 posts, 900-1,200 words', { text: '9.00 / 10', options: { color: GREEN, bold: true } }, 'Ready to paste into CMS'],
];

slide.addTable(delTable, {
  x: 0.5, y: 2.0, w: 12, colW: [3.5, 2.5, 2, 4],
  fontSize: 13, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
  rowH: [0.5, 0.45, 0.45, 0.45, 0.45],
});

slide.addText('Community Pages Created:', { x: 0.5, y: 4.5, w: 6, h: 0.4, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial' });
slide.addText('Deer Valley  |  Old Town  |  Park Meadows  |  Promontory', { x: 0.5, y: 4.9, w: 8, h: 0.4, fontSize: 13, color: BLUE, fontFace: 'Arial' });

slide.addText('Blog Posts Created:', { x: 0.5, y: 5.5, w: 6, h: 0.4, fontSize: 14, color: DARK, bold: true, fontFace: 'Arial' });
const posts = [
  'Spring 2026 Market Report', 'Best Neighborhoods Guide',
  'Is Park City RE a Good Investment?', 'Ski-in/Ski-out Homes Guide'
];
slide.addText(posts.join('  |  '), { x: 0.5, y: 5.9, w: 12, h: 0.4, fontSize: 13, color: BLUE, fontFace: 'Arial' });

slide.addText('Each deliverable includes FAQ sections optimized for AI Overview citations (Google SGE).', {
  x: 0.5, y: 6.6, w: 12, h: 0.4, fontSize: 12, color: HIGHLIGHT, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 12: Medium-Term Roadmap ============
slide = pptx.addSlide();
addTitleBar(slide, 'Medium-Term Roadmap: Month 2-4');

const medTermItems = [
  ['Deer Valley Hub Page', 'Comprehensive guide combining Lower + Upper DV with East Village expansion'],
  ['Ski Section (/ski/)', 'Individual pages for each ski community (Deer Valley, Empire Pass, Canyons)'],
  ['Golf Section (/golf/)', 'Pages for Promontory, Glenwild, Red Ledges, Tuhaye, Victory Ranch'],
  ['Relocation Guide', '"Moving to Park City" — 2,000+ words on schools, taxes, lifestyle, climate'],
  ['Investment Guide', 'STR regulations, ROI analysis, rental rates, property management'],
  ['New Development Pages', 'East Village, Velvaere, Sommet Blanc, St. Regis Snow Park'],
  ['Condo Building Pages', 'Top 20 buildings: Montage, St. Regis, Stein Eriksen, Colony, Goldener Hirsch'],
  ['FAQ Schema on All Community Pages', 'Rich snippets + AI Overview citation opportunities'],
  ['Cross-Linking Strategy', 'Blog > community > buyer/seller > contact across all content'],
];
medTermItems.forEach((item, i) => {
  const y = 1.35 + i * 0.65;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.2, h: 0.2, fill: { color: BLUE }, rectRadius: 0.02 });
  slide.addText(item[0], { x: 0.9, y, w: 3.3, h: 0.4, fontSize: 13, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(item[1], { x: 4.3, y, w: 8.5, h: 0.4, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 7.0, w: 12, h: 0.3, fill: { color: LIGHT_GRAY } });
slide.addText('Target: 150+ pages by month 4. Add 50+ community sub-pages following Fisher Group\'s 3-tier model.', {
  x: 0.5, y: 6.95, w: 12, h: 0.4, fontSize: 12, color: DARK, bold: true, fontFace: 'Arial'
});

// ============ SLIDE 13: Long-Term Vision ============
slide = pptx.addSlide();
addTitleBar(slide, 'Long-Term Strategy: Month 4+');

const longTermCols = [
  { title: 'Content Authority', items: ['Monthly market reports', 'Build to 200+ pages', 'Lifestyle guides ("Things to Do")', 'Comparison content (PC vs Aspen)', '"Best of Park City" resource pages'] },
  { title: 'Video & Media', items: ['Monthly video market updates', 'Neighborhood tour videos', 'Agent introduction video', 'Pursue press/media coverage', '"As Featured In" section'] },
  { title: 'Lead Generation', items: ['Blog email newsletter', 'Gated quarterly market PDFs', 'Chat widget integration', 'Community-specific email signups', '"Just Listed/Just Sold" alerts'] },
  { title: 'Local SEO', items: ['Google Business Profile optimization', 'Zillow/Yelp/FastExpert profiles', 'Local citation consistency', 'Hreflang tags for intl buyers', 'Homepage performance audit'] },
];

longTermCols.forEach((col, i) => {
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

const advantages = [
  ['Summit Sotheby\'s Brand', 'Stronger luxury cachet than Keller Williams or Christie\'s'],
  ['Same Platform as Competitors', 'Sierra Interactive — everything they do, you can do too'],
  ['No Competitor Has Market Reports', 'First mover advantage on the #1 content type for RE SEO'],
  ['Solid Foundation Already', 'Clean design, 28 community pages, IDX, lifestyle filters'],
  ['Strong Social Proof', '$70M sold, 300+ homes, 97% of asking price — just needs visibility'],
];
advantages.forEach((a, i) => {
  const y = 2.1 + i * 0.85;
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: GREEN }, rectRadius: 0.15 });
  slide.addText(a[0], { x: 1.1, y, w: 4, h: 0.35, fontSize: 15, color: DARK, bold: true, fontFace: 'Arial' });
  slide.addText(a[1], { x: 5.2, y, w: 7.5, h: 0.35, fontSize: 13, color: MED_GRAY, fontFace: 'Arial' });
});

slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.4, w: 12, h: 0.8, fill: { color: DARK }, rectRadius: 0.05 });
slide.addText('The site is not broken — it just needs content. With consistent investment, we can close the gap with competitors in 3-6 months.', {
  x: 0.7, y: 6.5, w: 11.5, h: 0.6, fontSize: 15, color: WHITE, fontFace: 'Arial'
});

// ============ SLIDE 15: Expanded Competitor Analysis ============
slide = pptx.addSlide();
addTitleBar(slide, 'Expanded Competitor Analysis: 7 Competitors');

// Full 7-competitor comparison table
// Column widths: Metric(1.7) | Your Site(1.3) | Laura Willis(1.5) | Fisher Group(1.5) | Carlson KW(1.5) | Magnotta(1.4) | PC Investor(1.5) | Inhabit PC(1.4)
const expandedCompTable = [
  // Header row
  [
    { text: 'Metric',        options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Your Site',     options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Laura Willis',  options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Fisher Group',  options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Carlson (KW)',  options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Magnotta',      options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'PC Investor',   options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
    { text: 'Inhabit PC',    options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9 } },
  ],
  // Brokerage
  [
    { text: 'Brokerage',        options: { bold: true, fontSize: 9 } },
    { text: 'Summit Sotheby\'s', options: { fontSize: 9 } },
    { text: 'Summit Sotheby\'s', options: { fontSize: 9 } },
    { text: 'Christie\'s Int\'l', options: { fontSize: 9 } },
    { text: 'Keller Williams',  options: { fontSize: 9 } },
    { text: 'Christie\'s Int\'l', options: { fontSize: 9 } },
    { text: 'Keller Williams',  options: { fontSize: 9 } },
    { text: 'Summit Sotheby\'s', options: { fontSize: 9 } },
  ],
  // Platform
  [
    { text: 'Platform',          options: { bold: true, fontSize: 9 } },
    { text: 'Sierra Interactive', options: { fontSize: 9 } },
    { text: 'Sierra Interactive', options: { fontSize: 9 } },
    { text: 'Sierra Interactive', options: { fontSize: 9 } },
    { text: 'RE Webmasters',     options: { fontSize: 9 } },
    { text: 'Sierra Interactive', options: { fontSize: 9 } },
    { text: 'WordPress',         options: { fontSize: 9 } },
    { text: 'Luxury Presence',   options: { fontSize: 9 } },
  ],
  // Total Pages
  [
    { text: 'Total Pages',  options: { bold: true, fontSize: 9 } },
    { text: '62',           options: { color: RED, bold: true, fontSize: 9 } },
    { text: '372',          options: { fontSize: 9 } },
    { text: '376',          options: { fontSize: 9 } },
    { text: '120+',         options: { fontSize: 9 } },
    { text: '425',          options: { fontSize: 9 } },
    { text: '834+',         options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: '170+',         options: { fontSize: 9 } },
  ],
  // Blog Posts
  [
    { text: 'Blog Posts', options: { bold: true, fontSize: 9 } },
    { text: '5',          options: { color: RED, bold: true, fontSize: 9 } },
    { text: '96',         options: { fontSize: 9 } },
    { text: '33',         options: { fontSize: 9 } },
    { text: '10+',        options: { fontSize: 9 } },
    { text: '207',        options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: '396',        options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: '69',         options: { fontSize: 9 } },
  ],
  // Community Pages
  [
    { text: 'Community Pages', options: { bold: true, fontSize: 9 } },
    { text: '28',              options: { color: RED, bold: true, fontSize: 9 } },
    { text: '150+',            options: { fontSize: 9 } },
    { text: '300+',            options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: '50+',             options: { fontSize: 9 } },
    { text: '150+',            options: { fontSize: 9 } },
    { text: '214',             options: { fontSize: 9 } },
    { text: '49',              options: { fontSize: 9 } },
  ],
  // Schema Markup
  [
    { text: 'Schema Markup', options: { bold: true, fontSize: 9 } },
    { text: 'No',            options: { color: RED, bold: true, fontSize: 9 } },
    { text: 'No',            options: { fontSize: 9 } },
    { text: 'Yes',           options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: 'No',            options: { fontSize: 9 } },
    { text: 'Yes',           options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: 'Yes',           options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: 'No',            options: { fontSize: 9 } },
  ],
  // Market Reports
  [
    { text: 'Market Reports', options: { bold: true, fontSize: 9 } },
    { text: 'No',             options: { color: RED, bold: true, fontSize: 9 } },
    { text: 'No',             options: { fontSize: 9 } },
    { text: 'No',             options: { fontSize: 9 } },
    { text: 'Yes',            options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: 'No',             options: { fontSize: 9 } },
    { text: 'Yes',            options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: 'Yes',            options: { color: GREEN, bold: true, fontSize: 9 } },
  ],
  // Testimonials
  [
    { text: 'Testimonials', options: { bold: true, fontSize: 9 } },
    { text: 'No',           options: { color: RED, bold: true, fontSize: 9 } },
    { text: 'Yes',          options: { fontSize: 9 } },
    { text: 'Yes',          options: { fontSize: 9 } },
    { text: 'Yes',          options: { fontSize: 9 } },
    { text: 'Yes',          options: { fontSize: 9 } },
    { text: 'Yes',          options: { fontSize: 9 } },
    { text: 'Yes',          options: { color: GREEN, bold: true, fontSize: 9 } },
  ],
  // Keywords Ranking
  [
    { text: 'Keywords Ranking', options: { bold: true, fontSize: 9 } },
    { text: '0 / 25',           options: { color: RED, bold: true, fontSize: 9 } },
    { text: '5 / 25',           options: { fontSize: 9 } },
    { text: '12 / 25',          options: { color: GREEN, bold: true, fontSize: 9 } },
    { text: '10 / 25',          options: { fontSize: 9 } },
    { text: '10 / 25',          options: { fontSize: 9 } },
    { text: 'Not tested',       options: { color: MED_GRAY, fontSize: 9 } },
    { text: 'Not tested',       options: { color: MED_GRAY, fontSize: 9 } },
  ],
];

slide.addTable(expandedCompTable, {
  x: 0.3, y: 1.25, w: 12.7,
  colW: [1.7, 1.3, 1.5, 1.5, 1.5, 1.4, 1.5, 1.3],
  fontSize: 9, fontFace: 'Arial',
  border: { type: 'solid', pt: 0.5, color: 'cccccc' },
  rowH: [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
});

// Bottom callout bar
slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 6.55, w: 12.7, h: 0.7, fill: { color: DARK }, rectRadius: 0.05 });
slide.addText(
  '3 of 7 competitors are in the SAME brokerage (Summit Sotheby\'s). parkcityinvestor.com has 13x more content than your site.',
  { x: 0.5, y: 6.62, w: 12.3, h: 0.56, fontSize: 12, color: WHITE, fontFace: 'Arial', bold: false }
);

// ============ SLIDE 16: About Page Comparison ============
slide = pptx.addSlide();
addTitleBar(slide, 'About Page Comparison: Fisher Group vs. Your Site');

// Left column header
slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.2, w: 5.9, h: 0.45, fill: { color: BLUE }, rectRadius: 0.05 });
slide.addText('What Fisher Group Does Right', {
  x: 0.3, y: 1.2, w: 5.9, h: 0.45, fontSize: 14, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial'
});

// Right column header
slide.addShape(pptx.ShapeType.rect, { x: 6.5, y: 1.2, w: 6.5, h: 0.45, fill: { color: GREEN }, rectRadius: 0.05 });
slide.addText('Quick Wins for Your About Page', {
  x: 6.5, y: 1.2, w: 6.5, h: 0.45, fontSize: 14, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial'
});

// Left column background
slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.7, w: 5.9, h: 4.55, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });

// Right column background
slide.addShape(pptx.ShapeType.rect, { x: 6.5, y: 1.7, w: 6.5, h: 4.55, fill: { color: LIGHT_GRAY }, rectRadius: 0.05 });

// Left column bullet items
const fisherWins = [
  '1,899 words vs. your 602 words (3x more content)',
  'Embedded Google Reviews widget (47 reviews, 5.0 stars)',
  '"As Featured In" logos: Vogue, WSJ, Yahoo Finance, Ski Utah',
  '$25M record Deer Valley sale highlighted',
  'Contact form directly on About page',
  'Active listings shown on About page',
  'Product schema generates star ratings in Google',
];
fisherWins.forEach((item, i) => {
  slide.addText('  ' + item, {
    x: 0.4, y: 1.82 + i * 0.6, w: 5.7, h: 0.52,
    fontSize: 11, color: DARK, fontFace: 'Arial',
    bullet: { type: 'bullet', color: BLUE }
  });
});

// Right column bullet items
const aboutQuickWins = [
  'Fix meta title: "About Tisha and Cam" → include "Park City Realtor"',
  'Remove keyword stuffing block at bottom of page',
  'Add Google Reviews embed (Elfsight widget)',
  'Add specific stats: $70M sold, 300+ homes, awards',
  'Add contact form with lead capture',
  'Add personal storytelling (hobbies, community involvement)',
  'Add "As Featured In" or credentials section',
];
aboutQuickWins.forEach((item, i) => {
  slide.addText('  ' + item, {
    x: 6.6, y: 1.82 + i * 0.6, w: 6.3, h: 0.52,
    fontSize: 11, color: DARK, fontFace: 'Arial',
    bullet: { type: 'bullet', color: GREEN }
  });
});

// Bottom highlight bar
slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 6.5, w: 12.7, h: 0.75, fill: { color: HIGHLIGHT }, rectRadius: 0.05 });
slide.addText(
  'The Fisher Group\'s About page is their #2 most-visited page after the homepage. Investing in this page has direct ROI.',
  { x: 0.5, y: 6.55, w: 12.3, h: 0.65, fontSize: 13, color: WHITE, bold: true, fontFace: 'Arial', align: 'center', valign: 'middle' }
);

// ============ SLIDE 17: Next Steps ============
slide = pptx.addSlide();
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.8, w: '100%', h: 0.04, fill: { color: HIGHLIGHT } });

slide.addText('Next Steps', { x: 0.8, y: 0.5, w: 11, h: 1, fontSize: 36, color: WHITE, bold: true, fontFace: 'Arial' });

const nextSteps = [
  { num: '1', text: 'Deploy ready-to-use deliverables (meta tags, schema, 4 community pages, 4 blog posts)', sub: 'Can be done this week — just copy-paste into Sierra Interactive CMS' },
  { num: '2', text: 'Complete Week 1-2 quick wins (10 technical fixes)', sub: 'Developer can complete in 1-2 business days' },
  { num: '3', text: 'Begin Month 1 content calendar (4 blog posts + community page expansion)', sub: 'One blog post per week targeting high-value keywords' },
  { num: '4', text: 'Create monthly market report (first mover advantage)', sub: 'No competitor currently publishes regular market data' },
  { num: '5', text: 'Review progress at 30-day mark and adjust strategy', sub: 'Measure keyword improvements, traffic changes, lead capture' },
];
nextSteps.forEach((s, i) => {
  const y = 2.2 + i * 1.0;
  slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: HIGHLIGHT }, rectRadius: 0.05 });
  slide.addText(s.num, { x: 0.8, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 22, color: WHITE, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  slide.addText(s.text, { x: 1.6, y, w: 10.5, h: 0.45, fontSize: 16, color: WHITE, bold: true, fontFace: 'Arial' });
  slide.addText(s.sub, { x: 1.6, y: y + 0.45, w: 10.5, h: 0.4, fontSize: 12, color: MED_GRAY, fontFace: 'Arial' });
});

// Save
const outPath = '/mnt/c/Dev/site audit/deliverables/SEO-Audit-Presentation-v2.pptx';
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Presentation saved to: ${outPath}`);
}).catch(err => {
  console.error('Error:', err);
});
