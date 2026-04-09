/**
 * shared/explainer.js — Floating "What does this mean?" widget
 * Shows plain-English explanations for each report section as the user scrolls.
 * Hooks into the same scrollspy system as nav.js.
 *
 * Namespace: window.TPPC.explainer
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  // ---------------------------------------------------------------------------
  // Section explanations — keyed by section ID, per page
  // Each entry: { title, explanation, tip }
  //   title: short heading for the card
  //   explanation: 1-3 sentences in plain English
  //   tip: optional actionable takeaway
  // ---------------------------------------------------------------------------

  var EXPLANATIONS = {

    // ===== INDEX (Summary) =====
    'section-hero': {
      title: 'Your Overall Score',
      explanation: 'This letter grade is like a report card for your website\'s visibility on Google. It looks at everything — how well your site is built, how easy it is for Google to understand, and how you stack up against competitors.',
      tip: 'A low grade doesn\'t mean your business is bad — it means there\'s a lot of untapped potential online.'
    },
    'section-stats': {
      title: 'Key Numbers at a Glance',
      explanation: 'These are the most important metrics from your audit, boiled down to the numbers that matter most. Red means urgent, orange means needs attention, and green means you\'re in good shape.',
      tip: 'Focus on the red items first — those have the biggest impact on whether people find you online.'
    },
    'section-issues': {
      title: 'Top Issues to Fix',
      explanation: 'These are the biggest problems holding your site back from showing up in Google search results. They\'re ranked by how much fixing them would help your visibility.',
      tip: 'Think of these like fixing the foundation of a house — the site can\'t perform well until the basics are solid.'
    },
    'section-comparison': {
      title: 'You vs. Your Top Competitor',
      explanation: 'This compares your website side-by-side with your biggest competitor on key metrics like number of pages, blog posts, and keyword rankings. It shows exactly where you\'re behind and by how much.',
      tip: 'You don\'t need to match them overnight — but knowing the gap helps prioritize what to build first.'
    },
    'section-quickwins': {
      title: 'Quick Wins',
      explanation: 'These are changes that take very little time or money but can make a noticeable difference in how Google sees your site. Most can be done in a day or two.',
      tip: 'Quick wins build momentum — knock these out first to see early results.'
    },
    'section-nextsteps': {
      title: 'Recommended Next Steps',
      explanation: 'This is your action plan in order of priority. Each step builds on the previous one, so working through them in order gives you the best results.',
      tip: 'Start with Step 1 this week. Each step is designed to compound on the one before it.'
    },

    // ===== KEYWORDS =====
    'section-rankings': {
      title: 'Where You Rank on Google',
      explanation: 'This shows whether your website appears when someone searches for key phrases related to your business. "Not found" means Google isn\'t showing your site for that search at all. A position of 1-3 means you\'re on the first few results people see.',
      tip: 'If you\'re "not found" for your most important keywords, that\'s the #1 thing to fix.'
    },
    'section-volume': {
      title: 'How Many People Search These Terms',
      explanation: 'Search volume tells you how many people per month type each keyword into Google. Higher volume = more potential visitors. This helps you focus on keywords that actually bring traffic.',
      tip: 'Don\'t just chase the highest volume — sometimes lower-volume keywords are easier to rank for and bring better leads.'
    },
    'section-organic': {
      title: 'Your Organic Visibility',
      explanation: 'Organic visibility means how much of Google\'s search traffic your site is capturing without paying for ads. It combines your rankings and the search volume of keywords you rank for.',
      tip: 'Think of this as your "free traffic score" — the higher it is, the more people find you without ad spend.'
    },
    'section-gsc': {
      title: 'Search Console Data',
      explanation: 'Google Search Console is a free Google tool that shows exactly what searches bring people to your site, how often your site appears in results, and how often people click. It\'s the most accurate source of search data.',
      tip: 'If this section is empty, granting us access to your Search Console would unlock powerful insights.'
    },
    'section-traffic': {
      title: 'Website Traffic Overview',
      explanation: 'This shows how people are getting to your website — through Google searches, social media, direct visits, or other channels. It also shows which devices (phone vs computer) people use.',
      tip: 'If this section is empty, granting us access to your Google Analytics would show where your visitors come from.'
    },
    'section-rank-history': {
      title: 'Ranking Trends Over Time',
      explanation: 'This tracks how your keyword positions change over time. Rising lines mean you\'re climbing in Google; falling lines mean you\'re losing ground. It helps us see if SEO efforts are working.',
      tip: 'SEO takes time — look for upward trends over weeks and months, not day-to-day changes.'
    },

    // ===== CONTENT =====
    'section-overview': {
      title: 'Content Health Check',
      explanation: 'This assesses the quality and quantity of written content on your website. Google rewards sites with helpful, original, in-depth content. Thin or generic content makes it hard to rank.',
      tip: 'More isn\'t always better — what matters is that each page is genuinely useful to someone searching for that topic.'
    },
    'section-readability': {
      title: 'How Easy Is Your Content to Read?',
      explanation: 'Readability scores measure how accessible your writing is. Content that\'s too complex loses readers; content that\'s too simple may lack depth. The sweet spot is clear, professional writing that anyone can understand.',
      tip: 'Write for your clients, not for search engines. If a homebuyer would understand it easily, you\'re on track.'
    },
    'section-thin': {
      title: 'Pages With Too Little Content',
      explanation: 'Thin content means pages with very few words (under 300). Google sees these as low-value because they don\'t provide enough information to be helpful. They can actually hurt your site\'s overall ranking.',
      tip: 'Every page should answer a question thoroughly. If a page only has a sentence or two, either expand it or combine it with another page.'
    },
    'section-duplicates': {
      title: 'Duplicate Content Check',
      explanation: 'When multiple pages on your site have very similar content, Google gets confused about which one to show in search results. This splits your ranking power between pages instead of concentrating it.',
      tip: 'Each page should have a unique purpose and unique content. If two pages say the same thing, combine them into one strong page.'
    },
    'section-cannibalization': {
      title: 'Keyword Cannibalization',
      explanation: 'This happens when multiple pages on your site compete for the same keyword. Instead of one strong page ranking well, you end up with two weak pages that neither ranks well. It\'s like having two runners from the same team trip each other.',
      tip: 'Pick ONE page to be the authority for each important keyword, and have other pages link to it.'
    },
    'section-structure': {
      title: 'Content Organization',
      explanation: 'This looks at how your content is structured — headings, subheadings, lists, and the logical flow of information. Well-structured content helps both Google and visitors understand what each page is about.',
      tip: 'Think of headings like a table of contents. Someone should be able to scan just the headings and understand what the page covers.'
    },

    // ===== TECHNICAL =====
    'section-cwv': {
      title: 'Core Web Vitals',
      explanation: 'Core Web Vitals are Google\'s speed and user experience measurements. They check three things: how fast your page loads (LCP), how quickly it responds to clicks (INP), and whether content jumps around while loading (CLS). Google uses these as a ranking factor.',
      tip: 'If your site is slow on mobile, you\'re losing both visitors AND rankings. Most people won\'t wait more than 3 seconds.'
    },
    'section-pagespeed': {
      title: 'PageSpeed Scores',
      explanation: 'This is Google\'s own speed test, scored 0-100. It checks how fast your site loads on both phones and computers. A score above 90 is great, 50-89 needs improvement, and below 50 is poor.',
      tip: 'Mobile scores matter more than desktop — over 60% of real estate searches happen on phones.'
    },
    'section-schema': {
      title: 'Schema Markup (Structured Data)',
      explanation: 'Schema markup is invisible code that tells Google exactly what your business is — your name, address, phone number, services, reviews, etc. It can make your search result look richer with stars, hours, and other details that attract more clicks.',
      tip: 'Adding RealEstateAgent and LocalBusiness schema is one of the easiest high-impact changes you can make.'
    },
    'section-meta': {
      title: 'Title Tags & Meta Descriptions',
      explanation: 'These are the headline and short description that appear when your site shows up in Google results. They\'re your first impression — like a storefront sign. Good ones include your location, what you do, and why someone should click.',
      tip: 'Every page needs a unique, compelling title under 60 characters and a description under 155 characters that makes people want to click.'
    },
    'section-crawl': {
      title: 'Crawl Issues',
      explanation: 'These are problems Google encounters when it tries to read your website. Broken links, redirect chains, and server errors can prevent Google from properly indexing your pages — like having a store with a locked door.',
      tip: 'Fix broken pages and redirect errors first. If Google can\'t access a page, it definitely can\'t rank it.'
    },
    'section-sitestructure': {
      title: 'Site Structure Overview',
      explanation: 'This is an inventory of every page on your site, showing word count, links, schema markup, and issues found. It gives you a bird\'s-eye view of your site\'s health, page by page.',
      tip: 'Pages with the most issues should be fixed first, especially if they\'re important for your business (like community pages or service pages).'
    },

    // ===== LINKS =====
    'section-linkstats': {
      title: 'Internal Linking Overview',
      explanation: 'Internal links are links from one page of your site to another. They help visitors navigate and tell Google which pages are most important. A well-linked site spreads "ranking power" from strong pages to weaker ones.',
      tip: 'Every important page should be reachable within 2-3 clicks from your homepage.'
    },
    'section-orphans': {
      title: 'Orphan Pages',
      explanation: 'Orphan pages are pages on your site that no other page links to. Google has a hard time finding and ranking them because there\'s no path leading to them — they\'re essentially hidden.',
      tip: 'Add links from related pages to each orphan page. If a page isn\'t worth linking to, consider whether it\'s worth keeping.'
    },
    'section-hubs': {
      title: 'Hub & Spoke Structure',
      explanation: 'A hub page is a main topic page (like "Communities") that links out to detailed sub-pages (like individual neighborhood pages). This structure tells Google you\'re an authority on the topic and helps all related pages rank better.',
      tip: 'Think of it like a wheel — the hub page is the center, and each spoke links to a detailed page. The more connected, the stronger they all become.'
    },
    'section-depth': {
      title: 'Link Depth Analysis',
      explanation: 'Link depth measures how many clicks it takes to reach a page from your homepage. Pages buried 4+ clicks deep are harder for Google to find and rank. Important pages should be within 1-2 clicks.',
      tip: 'If your best content is buried deep in the site, add direct links from your homepage or main navigation.'
    },
    // ===== COMPETITORS =====
    'section-radar': {
      title: 'Competitor Health Radar',
      explanation: 'This radar chart compares you against competitors across multiple dimensions — content, technical SEO, backlinks, local presence, and more. It instantly shows where you\'re strong and where competitors have the edge.',
      tip: 'Don\'t try to beat competitors everywhere at once. Focus on the dimensions with the biggest gaps first.'
    },
    'section-strategies': {
      title: 'Competitor Strategies',
      explanation: 'This breaks down what your most successful competitors are doing to win in Google search — their content approach, lead generation tactics, and unique positioning. It\'s a playbook of proven strategies in your market.',
      tip: 'You don\'t have to copy competitors, but understanding what works in your market helps you make smarter decisions.'
    },
    'section-domains': {
      title: 'Domain Metrics Comparison',
      explanation: 'This compares the technical strength of each website — domain authority, number of backlinks, estimated organic traffic, and keywords ranking. It shows the raw "power" behind each competitor\'s site.',
      tip: 'A higher domain rating means a site has earned more trust from Google over time. Building this takes consistent effort but pays off enormously.'
    },
    'section-pagespeedcomp': {
      title: 'Speed Comparison',
      explanation: 'This compares how fast your website loads against your competitors. A faster site provides a better experience and gets a small ranking boost from Google.',
      tip: 'If your site is slower than competitors, visitors may leave before it even loads — especially on mobile.'
    },

    // ===== LOCAL =====
    'section-gbp': {
      title: 'Google Business Profile',
      explanation: 'Your Google Business Profile (formerly Google My Business) is what shows up in Google Maps and the local "3-pack" at the top of search results. It displays your reviews, hours, photos, and contact info. For local businesses, this is often MORE important than your website.',
      tip: 'A complete, optimized GBP with lots of positive reviews can drive more calls and visits than ranking #1 in organic results.'
    },
    'section-localperf': {
      title: 'Local Search Performance',
      explanation: 'This shows how well you\'re performing in location-based searches — when someone searches "real estate agent near me" or "homes for sale in [neighborhood]." Local performance depends on your GBP, reviews, and local content.',
      tip: 'Local SEO is where small businesses compete most effectively against big portals like Zillow and Realtor.ca.'
    },
    'section-citations': {
      title: 'Local Citations',
      explanation: 'Citations are mentions of your business name, address, and phone number (NAP) on other websites — directories, review sites, social profiles. Consistent NAP info across the web helps Google trust that your business is legitimate and located where you say.',
      tip: 'Make sure your name, address, and phone number are EXACTLY the same everywhere online — even small differences confuse Google.'
    },
    'section-servicemap': {
      title: 'Service Area Map',
      explanation: 'This map shows the geographic areas you serve. It helps us assess whether your website has content covering all the areas where you want to attract clients.',
      tip: 'Each community or area you serve should ideally have its own dedicated page on your website.'
    },
    'section-mappack': {
      title: 'Map Pack Rankings',
      explanation: 'The "Map Pack" is the box of 3 local business results that appears at the top of Google with a map. Getting into this box is extremely valuable because it\'s the first thing people see for local searches.',
      tip: 'Map Pack rankings depend heavily on proximity, reviews, and GBP optimization — not just your website.'
    },

    // ===== ACTION PLAN =====
    'section-plan': {
      title: 'Your Priority Action Plan',
      explanation: 'This is a step-by-step roadmap of everything we recommend, organized by urgency and effort level. Quick wins come first (easy changes with immediate impact), followed by short-term, medium-term, and long-term strategies.',
      tip: 'You don\'t have to do everything at once. Even completing just the Quick Wins can make a significant difference within weeks.'
    },
    'section-calendar': {
      title: 'Content Calendar',
      explanation: 'This is a 3-month plan for blog posts and new pages, with specific topics and target keywords for each. Consistent content publishing is one of the most powerful long-term SEO strategies.',
      tip: 'Even one quality blog post per week, consistently published, can transform your organic traffic within 6 months.'
    },
    'section-pillars': {
      title: 'Strategy Pillars',
      explanation: 'These four pillars represent the major themes of your SEO strategy. Each one builds on the others — you need a solid technical foundation before content can perform, and content must exist before it can earn backlinks.',
      tip: 'Think of these as phases. Get the foundation right first, then layer on content, then local dominance, then conversion optimization.'
    },
    'section-roadmap': {
      title: 'Medium-Term Roadmap',
      explanation: 'These are the major projects planned for months 2-4. They require more investment of time and resources but deliver significant, lasting improvements to your online visibility.',
      tip: 'Each roadmap item is designed to close a specific gap identified earlier in this audit.'
    },
    'section-longterm': {
      title: 'Long-Term Strategy',
      explanation: 'These ongoing strategies (month 4+) build sustained competitive advantage. They\'re the difference between showing up on Google occasionally and dominating your market consistently.',
      tip: 'SEO is a marathon, not a sprint. The competitors who dominate got there through consistent effort over months and years.'
    },
    'section-advantages': {
      title: 'Your Competitive Advantages',
      explanation: 'These are the unique strengths your business has that competitors can\'t easily replicate. Your SEO strategy should amplify these advantages — they\'re what make your content and marketing authentic and compelling.',
      tip: 'Lead with what makes you different. Generic content won\'t outrank established competitors, but unique expertise can.'
    },
    'section-deliverables': {
      title: 'Ready-to-Use Deliverables',
      explanation: 'These are the actual files and content we\'ve created as part of this audit — rewritten meta tags, schema markup code, new page content, and blog posts. They\'re ready to be copy-pasted into your website.',
      tip: 'Implementing these deliverables is the fastest way to start seeing results from this audit.'
    }
  };

  // ---------------------------------------------------------------------------
  // Widget rendering
  // ---------------------------------------------------------------------------

  var _currentSectionId = null;
  var _widgetEl = null;

  function init() {
    _createWidget();
    _hookScrollspy();
    // Show the overview explanation initially
    _showExplanation('section-hero');
  }

  function _createWidget() {
    // Guard against duplicate creation (boot can fire twice)
    if (document.getElementById('explainer-widget')) {
      _widgetEl = document.getElementById('explainer-widget');
      return;
    }

    // Create the floating explainer card
    var widget = document.createElement('div');
    widget.id = 'explainer-widget';
    widget.className = 'explainer-widget';
    widget.innerHTML =
      '<div class="explainer-widget__header">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>' +
        '<span class="explainer-widget__label">What does this mean?</span>' +
        '<button class="explainer-widget__toggle" id="explainer-toggle" title="Minimize">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>' +
        '</button>' +
      '</div>' +
      '<div class="explainer-widget__body" id="explainer-body">' +
        '<h4 class="explainer-widget__title" id="explainer-title"></h4>' +
        '<p class="explainer-widget__text" id="explainer-text"></p>' +
        '<div class="explainer-widget__tip" id="explainer-tip"></div>' +
      '</div>';

    document.body.appendChild(widget);
    _widgetEl = widget;

    // Toggle minimize/expand — entire header is clickable
    var header = widget.querySelector('.explainer-widget__header');
    var toggleBtn = document.getElementById('explainer-toggle');
    function _toggle() {
      widget.classList.toggle('minimized');
      var svg = toggleBtn ? toggleBtn.querySelector('svg') : null;
      if (widget.classList.contains('minimized')) {
        if (toggleBtn) toggleBtn.title = 'Expand';
        if (svg) svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />';
      } else {
        if (toggleBtn) toggleBtn.title = 'Minimize';
        if (svg) svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />';
      }
    }
    if (header) header.addEventListener('click', _toggle);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation(); // prevent double-fire from header click
      });
    }
  }

  function _showExplanation(sectionId) {
    if (sectionId === _currentSectionId) return;
    _currentSectionId = sectionId;

    var data = EXPLANATIONS[sectionId];
    if (!data) return;

    var titleEl = document.getElementById('explainer-title');
    var textEl = document.getElementById('explainer-text');
    var tipEl = document.getElementById('explainer-tip');

    if (titleEl) titleEl.textContent = data.title;
    if (textEl) textEl.textContent = data.explanation;
    if (tipEl) {
      if (data.tip) {
        tipEl.innerHTML = '<strong>Tip:</strong> ' + data.tip;
        tipEl.style.display = '';
      } else {
        tipEl.style.display = 'none';
      }
    }

    // Animate the body
    var body = document.getElementById('explainer-body');
    if (body) {
      body.classList.remove('explainer-fade');
      void body.offsetWidth; // trigger reflow
      body.classList.add('explainer-fade');
    }
  }

  function _hookScrollspy() {
    if (!('IntersectionObserver' in window)) return;

    var allSections = document.querySelectorAll('[id^="section-"]');
    if (!allSections.length) return;

    // Track which sections are currently visible
    var visibleSections = {};

    function pickTopmost() {
      var best = null;
      var bestTop = Infinity;
      for (var id in visibleSections) {
        if (!visibleSections[id]) continue;
        var el = document.getElementById(id);
        if (!el) continue;
        var rect = el.getBoundingClientRect();
        // Pick the section whose top is closest to (but not far above) the viewport top
        // Use absolute distance from the nav bar area (~80px)
        var dist = Math.abs(rect.top - 80);
        if (rect.top < window.innerHeight && rect.bottom > 0 && dist < bestTop) {
          bestTop = dist;
          best = id;
        }
      }
      if (best) _showExplanation(best);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visibleSections[entry.target.id] = entry.isIntersecting;
      });
      pickTopmost();
    }, { rootMargin: '-60px 0px -35% 0px', threshold: [0, 0.1] });

    allSections.forEach(function (el) {
      observer.observe(el);
    });

    // Also update on scroll for smooth tracking during fast scrolling
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        pickTopmost();
      }, 80);
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Allow pages to register additional explanations at runtime
  // ---------------------------------------------------------------------------
  function registerExplanations(map) {
    for (var key in map) {
      if (map.hasOwnProperty(key)) {
        EXPLANATIONS[key] = map[key];
      }
    }
  }

  window.TPPC.explainer = {
    init: init,
    registerExplanations: registerExplanations,
    show: _showExplanation
  };

})();
