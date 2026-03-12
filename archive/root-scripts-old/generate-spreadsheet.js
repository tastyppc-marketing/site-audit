const XLSX = require('xlsx');

// ============ SHEET 1: Executive Summary ============
const execSummary = [
  ['SEO Audit: livingparkcityutah.com', '', '', ''],
  ['Prepared For:', 'Tisha Digman & Cam Schiedel', '', ''],
  ['Brokerage:', 'Summit Sotheby\'s International Realty', '', ''],
  ['Website:', 'https://www.livingparkcityutah.com', '', ''],
  ['Platform:', 'Sierra Interactive', '', ''],
  ['Audit Date:', 'March 1, 2026', '', ''],
  ['Overall Grade:', 'D+', '', ''],
  [],
  ['TOP 5 CRITICAL ISSUES', '', '', ''],
  ['#', 'Issue', 'Impact', 'Effort to Fix'],
  [1, 'Zero organic search visibility — not found for any of 25 keywords tested', 'Critical', 'Medium-High'],
  [2, 'Only 62 pages (competitors have 200-400+); dead blog (5 generic posts, nothing since Jul 2024)', 'Critical', 'High'],
  [3, 'No market reports or locally-focused content — the #1 content type for real estate SEO', 'Critical', 'Medium'],
  [4, 'Technical SEO errors: 403 page in sitemap, corrupted meta tags, multiple H1s, no schema markup', 'High', 'Low'],
  [5, 'No lead capture on highest-value pages (community pages and blog posts have no CTAs/forms)', 'High', 'Low-Medium'],
  [],
  ['SITE COMPARISON SNAPSHOT', '', '', '', ''],
  ['Metric', 'livingparkcityutah.com', '#1 Competitor (Fisher Group)', 'Gap', ''],
  ['Total Pages', 62, 376, '-314 pages (6x gap)', ''],
  ['Blog Posts', 5, 33, '-28 posts (blog is dead)', ''],
  ['Community Pages', 28, '300+', '10x gap in depth per page', ''],
  ['Community Page Word Count', '~200 words', '3,500-4,500 words', '~20x gap per page', ''],
  ['Schema Markup', 'None', 'Yes (all pages)', 'Critical missing feature', ''],
  ['Keywords Ranking (of 25)', 0, 12, 'Zero visibility', ''],
  ['FAQ Sections', 'None', 'Yes (community pages)', 'Missing rich snippet opportunity', ''],
  ['Testimonials Page', 'No', 'Yes', 'Missing trust signal', ''],
  ['Market Reports', 'No', 'No (but Carlson has best-in-market)', 'Critical content gap', ''],
];

// ============ SHEET 2: Keyword Research ============
const keywords = [
  ['KEYWORD RESEARCH: Park City Real Estate (25 Keywords)', '', '', '', '', ''],
  ['Keywords Tested: 25 | Client Rankings Found: 0 | Laura Willis Rankings: 5', '', '', '', '', ''],
  [],
  ['#', 'Keyword', 'Est. Volume', 'livingparkcityutah.com', 'laurawillisrealestate.com', 'Top Organic Result'],
  [1, 'park city real estate agent', 'High', 'Not found', 'Not found', 'insideparkcityrealestate.com'],
  [2, 'park city utah realtor', 'High', 'Not found', '~#6', 'zillow.com'],
  [3, 'best realtor park city utah', 'Medium', 'Not found', 'Not found', 'fastexpert.com'],
  [4, 'laura willis park city real estate', 'Low (brand)', 'Not found', '#1', 'laurawillisrealestate.com'],
  [5, 'park city homes for sale', 'Very High', 'Not found', 'Not found', 'zillow.com'],
  [6, 'park city luxury real estate', 'High', 'Not found', 'Not found', 'parkcityluxuryrealestate.com'],
  [7, 'park city condos for sale', 'High', 'Not found', 'Not found', 'zillow.com'],
  [8, 'park city ski homes for sale', 'Medium', 'Not found', 'Not found', 'parkcityinvestor.com'],
  [9, 'summit county real estate', 'High', 'Not found', 'Not found', 'CO results dominate'],
  [10, 'deer valley homes for sale', 'High', 'Not found', 'Not found', 'steinsrealty.com'],
  [11, 'park city vacation homes', 'Medium', 'Not found', '~#9', 'pacaso.com'],
  [12, 'heber city utah real estate', 'Medium', 'Not found', 'Not found', 'zillow.com'],
  [13, 'buy home park city utah', 'High', 'Not found', 'Not found', 'zillow.com'],
  [14, 'sell home park city utah', 'Medium', 'Not found', '~#5', 'zillow.com'],
  [15, 'park city real estate market', 'Medium', 'Not found', 'Not found', 'liveeatplayparkcity.com'],
  [16, 'park city real estate market 2025', 'Medium', 'Not found', 'Not found', 'liveeatplayparkcity.com'],
  [17, 'luxury ski homes park city', 'Medium', 'Not found', '#3, #5', 'abodeparkcity.com'],
  [18, 'park city investment property', 'Medium', 'Not found', 'Not found', 'jensenandcompany.com'],
  [19, 'park city real estate agent reviews', 'Medium', 'Not found', 'Not found', 'insideparkcityrealestate.com'],
  [20, 'best neighborhoods park city utah', 'Medium', 'Not found', 'Not found', 'homesparkcity.com'],
  [21, 'park city utah homes', 'Very High', 'Not found', '~#5', 'zillow.com'],
  [22, 'park city mountain homes', 'Medium', 'Not found', 'Not found', 'enjoyparkcity.com'],
  [23, 'deer valley real estate agent', 'Medium', 'Not found', 'Not found', 'deervalleyrealestate.com'],
  [24, 'summit county utah homes for sale', 'High', 'Not found', 'Not found', 'zillow.com'],
  [25, 'park city townhomes for sale', 'Medium', 'Not found', 'Not found', 'homes.com'],
];

// ============ SHEET 3: Competitor Comparison ============
const competitors = [
  ['COMPETITOR COMPARISON', '', '', '', '', ''],
  [],
  ['Metric', 'livingparkcityutah.com', 'Laura Willis', 'Fisher Group (Christie\'s)', 'Derrik Carlson (KW)', 'Magnotta (Christie\'s)'],
  ['Total Pages', 62, 372, 376, '120+', 425],
  ['Blog Posts', 5, 96, 33, '10+', 207],
  ['Community Pages', '28 (~200 words)', '150+ (500-2000 words)', '300+ (3500-4500 words)', '50+ (2000-5000+ words)', '150+ (4000-5700 words)'],
  ['Ski Pages', 1, 20, 3, '5+', 'In blog'],
  ['Golf Pages', 0, 11, 6, '2+', 'In blog'],
  ['Market Reports', 'None', 'None', 'None', '1 (continuously updated)', 'None'],
  ['Local Resource Pages', 'None', 'None', '1 (hiking guide)', 'None', '14 ("Best of PC")'],
  ['Testimonials', 'No', 'Yes (19 reviews)', 'Yes', 'Yes (inline)', 'Yes'],
  ['Schema Markup', 'No', 'No', 'YES', 'No', 'YES'],
  ['Canonical Tags', 'Partial', 'Yes', 'Yes', 'Yes', 'Partial'],
  ['Single H1/Page', 'No (3 on homepage)', 'No (7 on homepage)', 'YES', 'YES', 'Mixed'],
  ['Meta Descriptions', 'Generic/weak', 'Customized', 'Customized', 'Excellent', 'Customized'],
  ['FAQ Sections', 'No', 'No', 'Yes (homepage)', 'Yes (community pages)', 'No'],
  ['Platform', 'Sierra Interactive', 'Sierra Interactive', 'Sierra Interactive', 'Real Estate Webmasters', 'Sierra Interactive'],
  ['Brokerage', 'Summit Sotheby\'s', 'Summit Sotheby\'s', 'Christie\'s Int\'l', 'Keller Williams', 'Christie\'s Int\'l'],
  [],
  ['KEY TAKEAWAY: 3 of 4 competitors use the SAME Sierra Interactive platform. The gap is content investment, not technology.', '', '', '', '', ''],
];

// ============ SHEET 4: Action Plan (45 Items) ============
const actionPlan = [
  ['PRIORITIZED ACTION PLAN (45 Items)', '', '', '', ''],
  [],
  ['QUICK WINS — Week 1-2 (Low Effort, High Impact)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  [1, 'Fix 403 error on /contact/thank-you/ — remove from sitemap, add noindex', 'Broken page in sitemap wastes crawl budget', 'Low', 'High'],
  [2, 'Fix corrupted meta tags on /blog/paying-for/', 'Triple-stuffed meta tags look spammy to Google', 'Low', 'High'],
  [3, 'Consolidate homepage to single H1 ("Park City Utah Real Estate")', 'Multiple H1s dilute topic signal', 'Low', 'High'],
  [4, 'Add H1 tags to ski-in/ski-out page and property search pages', 'Missing H1 = Google can\'t identify page topic', 'Low', 'Medium'],
  [5, 'Rewrite meta descriptions for buyer/seller pages with "Park City"', 'Current 5-word descriptions provide zero advantage', 'Low', 'High'],
  [6, 'Add og:title, og:description, og:url to homepage', 'Social shares display poorly without OG tags', 'Low', 'Medium'],
  [7, 'Remove keyword-stuffing block from About page', 'Dated tactic that can trigger Google penalties', 'Low', 'Medium'],
  [8, 'Add canonical tags to property search pages', 'Missing canonicals cause duplicate content issues', 'Low', 'Medium'],
  [9, 'Switch from Gmail to branded email on Contact page', 'Branded email increases professionalism for luxury clients', 'Low', 'Medium'],
  [10, 'Add RealEstateAgent + LocalBusiness schema to homepage & About page', 'Schema enables rich results in Google', 'Low', 'High'],
  [],
  ['SHORT-TERM — Month 1-2 (Medium Effort)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  [11, 'Write + publish "Park City Real Estate Market Report" with current data', '#1 content type for real estate SEO; all competitors have them', 'Medium', 'High'],
  [12, 'Expand top 10 community pages from ~200 to 1,000-1,500 words each', 'Thin pages can\'t compete; competitors have 2,000+ word guides', 'Medium', 'High'],
  [13, 'Write 4-6 new Park City-specific blog posts targeting key keywords', 'Blog dead for 20+ months; fresh local content essential', 'Medium', 'High'],
  [14, 'Add editorial content to ski-in/ski-out page', '140 listings but zero editorial content on a high-value keyword page', 'Medium', 'High'],
  [15, 'Add contact forms + CTAs to every community page', 'Highest-SEO-value pages have no conversion mechanism', 'Low', 'High'],
  [16, 'Add CTAs + email signup to all blog posts', 'Blog posts currently have zero lead capture', 'Low', 'High'],
  [17, 'Create testimonials/success stories page', 'Builds trust; every competitor has one', 'Medium', 'Medium'],
  [18, 'Rewrite About page with credentials, awards, team photos, video, CTA', 'Current 350 words with keyword stuffing doesn\'t sell expertise', 'Medium', 'Medium'],
  [19, 'Add AggregateRating schema to homepage Google Reviews section', 'Stars in search results increase click-through rates', 'Low', 'High'],
  [20, 'Create unique meta descriptions for all 28 community pages', 'Template descriptions are identical = low quality signal', 'Medium', 'Medium'],
  [],
  ['MEDIUM-TERM — Month 2-4 (Higher Effort)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  [21, 'Create comprehensive Deer Valley hub page (~1,200 words)', 'Highest-value keyword cluster; Fisher Group has hub + 7 sub-pages', 'High', 'High'],
  [22, 'Create "Deer Valley East Village Expansion" dedicated page', 'Biggest development in PC history; hot search topic', 'Medium', 'High'],
  [23, 'Create /ski/ section with individual ski community pages', 'Fisher Group: ski hub; Laura Willis: 20 ski pages; Client: 1', 'High', 'High'],
  [24, 'Create /golf/ section with golf community pages', 'Fisher Group: 2,500-word golf guide; Laura Willis: 11 golf pages; Client: 0', 'High', 'Medium'],
  [25, 'Create "Moving to Park City" relocation guide (2,000+ words)', 'Fisher Group ranks with this; high-value informational keyword', 'High', 'High'],
  [26, 'Create investment property / vacation rental guide', 'Keyword opportunity with moderate competition', 'Medium', 'Medium'],
  [27, 'Build new development pages (East Village, Velvaere, St. Regis, etc.)', 'New construction buyers are high-value leads', 'Medium', 'High'],
  [28, 'Create individual condo/building pages for top 20 developments', 'Fisher Group has 150+ building pages; client has 0', 'High', 'High'],
  [29, 'Add FAQ sections with schema markup to homepage + community pages', 'FAQ schema generates rich snippets + AI Overview citations', 'Medium', 'High'],
  [30, 'Implement cross-linking strategy across all content', 'Fisher Group links everything; client relies on nav-only links', 'Medium', 'Medium'],
  [31, 'Add missing pages to sitemap.xml', 'Un-sitemapped pages may not be indexed', 'Low', 'Low'],
  [32, 'Add BreadcrumbList schema site-wide', 'Breadcrumbs improve search result appearance', 'Low', 'Medium'],
  [33, 'Add Twitter Card meta tags site-wide', 'Better social sharing on Twitter/X', 'Low', 'Low'],
  [],
  ['LONG-TERM — Month 4+ (Ongoing Strategy)', '', '', '', ''],
  ['#', 'Action', 'Why', 'Effort', 'Impact'],
  [34, 'Monthly market report publishing cadence', 'Consistency builds authority', 'Medium', 'High'],
  [35, 'Build content library toward 200+ pages', 'Minimum to compete for topical authority', 'High', 'High'],
  [36, 'Create lifestyle content ("Things to Do", hotels, seasonal guides)', 'Attracts non-real-estate traffic that builds domain authority', 'Medium', 'Medium'],
  [37, 'Create comparison content (PC vs Aspen, PC vs Jackson Hole)', 'Attracts affluent buyers comparing mountain markets', 'Medium', 'Medium'],
  [38, 'Develop international buyer resources + hreflang tags', 'Sotheby\'s brand has global recognition', 'High', 'Medium'],
  [39, 'Create video content series (market updates, neighborhood tours)', 'Video builds trust; embed on community pages + YouTube', 'High', 'High'],
  [40, 'Build local citations (Google Business Profile, Zillow, Yelp, etc.)', 'Strengthens map-pack visibility', 'Medium', 'High'],
  [41, 'Pursue press/media coverage + "As Featured In" section', 'Fisher Group has Vogue, WSJ logos; builds authority', 'Medium', 'Medium'],
  [42, 'Audit + reduce homepage scripts/iframes for performance', '29 scripts + 5 iframes = 15-second load time', 'Medium', 'Medium'],
  [43, 'Create "Park City Events Calendar" page', 'Seasonal content attracts early-stage buyers', 'Medium', 'Medium'],
  [44, 'Develop "Sold Portfolio" / "Recent Transactions" page', 'Active market presence builds trust', 'Medium', 'Medium'],
  [45, 'Add blog email newsletter with monthly market updates', 'Email converts higher than any other channel', 'Medium', 'High'],
];

// ============ SHEET 5: Content Calendar ============
const contentCalendar = [
  ['CONTENT CALENDAR — Next 3 Months', '', '', ''],
  [],
  ['MONTH 1: Establish Credibility', '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  [1, 'Park City Real Estate Market Report: Spring 2026', 'park city real estate market', 'Market Report'],
  [2, 'The Best Neighborhoods in Park City, Utah (2026 Guide)', 'best neighborhoods park city utah', 'Neighborhood Guide'],
  [3, 'Is Park City Real Estate a Good Investment? What the Data Says', 'park city real estate investment', 'Informational'],
  [4, 'Deer Valley Expansion: What Buyers Need to Know About East Village', 'deer valley real estate', 'News/Analysis'],
  [],
  ['MONTH 2: Build Depth — Target Buyer Queries', '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  [1, 'Moving to Park City: The Complete Relocation Guide for 2026', 'moving to park city utah', 'Relocation Guide'],
  [2, 'Park City Ski-in/Ski-out Homes: Communities, Prices, and What to Expect', 'park city ski homes for sale', 'Property Guide'],
  [3, 'Park City vs. Aspen: Comparing Two Premier Ski Towns', 'park city vs aspen real estate', 'Comparison'],
  [4, 'Understanding Park City Property Taxes, HOA Fees, and Cost of Living', 'park city cost of living', 'FAQ/Guide'],
  [],
  ['MONTH 3: Expand Reach', '', '', ''],
  ['Week', 'Topic', 'Target Keyword', 'Type'],
  [1, 'Park City Real Estate Market Report: Q1 2026 Update', 'park city real estate market 2026', 'Market Report'],
  [2, 'Heber City and Midway: Park City\'s Best-Kept Real Estate Secret', 'heber city utah real estate', 'Area Guide'],
  [3, 'Short-Term Rental Rules in Park City: What Investors Need to Know', 'park city vacation rental rules', 'Investment Guide'],
  [4, 'Buying a Luxury Home in Park City: What Sets the $5M+ Market Apart', 'park city luxury real estate', 'Luxury Guide'],
  [],
  ['COMMUNITY PAGE EXPANSION — Phase 1 (Month 1-2): Top 10 Pages to 1,000-1,500 Words', '', '', ''],
  ['Priority', 'Community', 'Current Words', 'Target Words'],
  [1, 'Deer Valley (Lower + Upper combined)', '~200', '1,500'],
  [2, 'Old Town', '~200', '1,200'],
  [3, 'Park Meadows', '~200', '1,200'],
  [4, 'Jeremy Ranch', '~200', '1,000'],
  [5, 'Promontory', '~200', '1,200'],
  [6, 'Canyons Village / The Colony', '~200', '1,200'],
  [7, 'Empire Pass', '~200', '1,000'],
  [8, 'Deer Crest', '~200', '1,000'],
  [9, 'Kimball Junction', '~200', '1,000'],
  [10, 'Jordanelle', '~200', '1,000'],
  [],
  ['MARKET REPORT SCHEDULE', '', '', ''],
  ['Frequency', 'Report Type', 'Format', ''],
  ['Monthly', 'Park City Real Estate Market Update', 'Blog post + email newsletter', ''],
  ['Quarterly', 'Quarterly Market Report with charts/graphs', 'PDF (gated for email) + blog summary', ''],
  ['Annually', 'Park City Year in Review', 'Long-form blog + PDF + social campaign', ''],
];

// ============ SHEET 6: Deliverables Summary ============
const deliverables = [
  ['READY-TO-DEPLOY DELIVERABLES', '', '', ''],
  ['These items have already been created as part of this audit and are ready for implementation.', '', '', ''],
  [],
  ['Deliverable', 'Source', 'Score', 'Status'],
  ['Meta Titles & Descriptions (62 pages)', 'Claude (winner)', '8.75/10', 'Ready — verify $70M claim with client'],
  ['Schema Markup (8 JSON-LD blocks)', 'Claude (winner)', '9.00/10', 'Ready — verify social profile URLs'],
  ['Community Pages (4 pages, 1,000+ words each)', 'Codex (winner)', '8.75/10', 'Ready — copy-paste into Sierra CMS'],
  ['Blog Posts (4 posts, 900-1,200 words each)', 'Codex (winner)', '9.00/10', 'Ready — copy-paste into Sierra CMS'],
  [],
  ['COMMUNITY PAGES CREATED:', '', '', ''],
  ['Page', 'Word Count', 'Key Feature', ''],
  ['Deer Valley', '~1,200', 'East Village expansion coverage + FAQ', ''],
  ['Old Town', '~1,100', 'Historic charm + walkability focus + FAQ', ''],
  ['Park Meadows', '~1,000', 'Family-friendly + schools focus + FAQ', ''],
  ['Promontory', '~1,100', 'Golf community + luxury lifestyle + FAQ', ''],
  [],
  ['BLOG POSTS CREATED:', '', '', ''],
  ['Post', 'Word Count', 'Target Keyword', ''],
  ['Park City Real Estate Market Report: Spring 2026', '~1,100', 'park city real estate market', ''],
  ['The Best Neighborhoods in Park City, Utah (2026)', '~1,050', 'best neighborhoods park city utah', ''],
  ['Is Park City Real Estate a Good Investment?', '~950', 'park city real estate investment', ''],
  ['Park City Ski-in/Ski-out Homes Guide', '~1,000', 'park city ski homes for sale', ''],
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

addSheet(wb, actionPlan, 'Action Plan (45 Items)', [
  { wch: 5 }, { wch: 60 }, { wch: 55 }, { wch: 10 }, { wch: 10 }
]);

addSheet(wb, contentCalendar, 'Content Calendar', [
  { wch: 12 }, { wch: 60 }, { wch: 35 }, { wch: 20 }
]);

addSheet(wb, deliverables, 'Deliverables', [
  { wch: 50 }, { wch: 25 }, { wch: 15 }, { wch: 40 }
]);

const outPath = '/mnt/c/Dev/site audit/deliverables/SEO-Audit-GamePlan.xlsx';
XLSX.writeFile(wb, outPath);
console.log(`Spreadsheet saved to: ${outPath}`);
