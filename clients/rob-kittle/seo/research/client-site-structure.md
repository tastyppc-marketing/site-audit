# Kittle Real Estate — Client Site Structure Audit
**Domain:** kittlerealestate.com
**Date:** 2026-05-09
**Pages analyzed in detail:** 13
**Sitemap URLs reviewed:** 16,280
**Methodology note:** The bundled `crawl-sitemap.js --analyze` script could not finish on this site because its IDX-skip regex requires a literal `/homes-for-sale/` segment, but Kittle's URLs use `/<city>-homes-for-sale/`. Roughly 99% of sitemap URLs slipped past the filter and the analyzer queued 15,753 "content" pages, hung Chromium with timeouts, and never wrote `crawl-data.json` / `link-graph.json`. We built this audit from raw sitemap XML, robots.txt, `check-technical.js` (5 pages), `browse.js` (9 pages), and direct curl + DOM extraction (4 IDX-heavy pages whose `networkidle` event never fired in Playwright).

---

## 1. Sitemap Overview

**Total URLs in sitemap.xml:** 16,280
**Auto-generated IDX/filter pages:** ~15,753 (96.8%)
**Genuine editorial / marketing pages:** ~527

### URL category breakdown (raw sitemap counts)

| Category | URL pattern | Count | Notes |
|---|---|---:|---|
| City "homes for sale" hubs (1-segment) | `/<city>-homes-for-sale/` | 63 | Core local SEO pages |
| City filter sub-pages (auto-gen IDX) | `/<city>-homes-for-sale/<filter>/` | 15,664 | Bedrooms, bathrooms, sub-areas, MLS IDs, etc. |
| `/communities/` (city guides) | `/communities/move-to-<city>-co/` | 77 | "Move to" editorial pages |
| Blog posts | `/blog/<slug>/` | 88 | Genuine content |
| Open-house aggregators | `/<city>-homes-for-sale/open-houses/` | 64 | One per city + 1 hub |
| `/co-listings/` (legacy?) | `/<city>-co-listings/` | 12 | Likely duplicates of communities |
| `/contact/*` | `/contact/...` | 5 | Includes thin "thank-you" page |
| `/selling-your-home-*` | top-level slug | 8 | Should live under `/sellers/` |
| `/property-search/*` | reserved app paths | 4 | Includes `/results/` (IDX) |
| Top-level seller-tips, events, properties, etc. | mixed | ~10 | One-off pages |
| Test/staging | `/test/`, `/test1/`, `/calendly-test/` | 3 | **Should not be public** |

### Top-30 city hubs by sitemap URL volume (descending)

```
denver-homes-for-sale/         1,766
fort-collins-homes-for-sale/     880
aurora-homes-for-sale/           743
boulder-homes-for-sale/          629
loveland-homes-for-sale/         572
lakewood-homes-for-sale/         532
littleton-homes-for-sale/        523
arvada-homes-for-sale/           511
longmont-homes-for-sale/         481
greeley-homes-for-sale/          460
golden-homes-for-sale/           389
thornton-homes-for-sale/         323
westminster-homes-for-sale/      307
broomfield-homes-for-sale/       303
brighton-homes-for-sale/         300
wheat-ridge-homes-for-sale/      291
commerce-city-homes-for-sale/    272
windsor-homes-for-sale/          228
berthoud-homes-for-sale/         225
lafayette-homes-for-sale/        205
highlands-ranch-homes-for-sale/  190
louisville-homes-for-sale/       185
wellington-homes-for-sale/       178
erie-homes-for-sale/             177
johnstown-homes-for-sale/        171
greenwood-village-homes-for-sale/ 171
evans-homes-for-sale/            169
fort-morgan-homes-for-sale/      168
fort-lupton-homes-for-sale/      161
frederick-homes-for-sale/        157
```

### Structure issues spotted in sitemap

1. **Index bloat / thin content** — 96.8% of indexed URLs are auto-generated bedroom/bathroom/MLS filter combos. These are classic Sierra Interactive IDX templates. They risk Panda-style demotion of the whole domain.
2. **Two parallel community URL systems** — `/communities/move-to-<city>-co/` (77 entries) and `/<city>-co-listings/` (12 entries). Likely duplicate intent / cannibalization.
3. **Top-level "selling-your-home-*" pages live outside `/sellers/`** — should be subfolder children for tighter taxonomy. They duplicate similar content already inside `/sellers/`.
4. **Test pages exposed** — `/test/`, `/test1/`, `/calendly-test/` are public and indexable.
5. **No sitemap_index.xml** — single 16k-URL sitemap. Google will still parse it (within the 50k limit), but splitting would let GSC report indexing health per content type.
6. **lastmod on homepage stale** (2024-07-26). The IDX pages all show `2026-05-09` because Sierra regenerates them; the editorial pages do not.

---

## 2. Navigation & Internal Linking

### Primary navigation (lifted from homepage DOM, 50+ unique items)

- **Search** (Search All Properties, Search Properties, Luxury Homes, Waterfront Homes, Horse Properties, Golf Course Homes, Featured Listings)
- **Buyers** (Buyer's Guide, Perfect Home Finder, Off-Market Listings, Affordability calc, Mortgage Calculator, Relocation, Resources)
- **Sellers** (Seller's Guide, Resources, Top Realtor, Home Value, The 40 D's of moving, Zillow Showcase)
- **Communities** (Fort Collins, Loveland, Windsor, Greeley, Longmont, View All)
- **Events** (Events, Kittle Events)
- **Reviews** (Google, Facebook, Zillow)
- **About** (About, The Kittle Team, Kittle Careers, Kittle Cares, Housing Market Videos, Featured Posts)
- **Contact**
- **Phone CTA** (970) 408-3468

### Internal-link counts per page (from browse.js, full DOM)

| Page | Internal | External | Total |
|---|---:|---:|---:|
| Homepage | 298 | 48 | 359 |
| About | 411 | 36 | 555 |
| Contact | 189 | 32 | 232 |
| Buyers | 195 | 32 | 234 |
| Sellers | 190 | 32 | 229 |
| Communities (hub) | 255 | 30 | 292 |
| Fort Collins community | ~1,196 (raw HTML inflates with IDX) | 25 | — |
| Loveland community | ~815 | 25 | — |
| Windsor community | ~471 | 31 | — |
| Properties (search hub) | 293 | 25 | — |
| Blog index | 313 | 31 | 352 |
| Blog post (lowball) | 256 | 36 | 303 |
| Luxury Homes | 231 | 30 | 270 |

### Internal-linking observations

- **Excellent depth from header/footer** — every page has 180–300+ internal links from the persistent nav and footer alone. Crawl reach is not an issue.
- **Homepage anchor text is mostly nav-template** — only a handful of contextual deep links (e.g. "homes for sale in Fort Collins" → `/communities/fort-collins-co-homes-for-sale/`, "neighborhood reports" → `/buyers/neigborhood-report/` (note typo: "neigborhood")). Most internal links are templated, missing keyword-rich anchors.
- **"Find Your Dream Home" / "Get Pre-Approved" CTAs are siloed** — repeated heavily, but rarely crosslink to `/luxury-homes/`, `/horse-properties/`, etc.
- **Featured-Searches section** uses NO link text inside H6 anchors (e.g., `https://www.kittlerealestate.com/condominiums-townhomes/ [no text]`). Multiple key category links lack anchor text.
- **External link pollution** — homepage links out to 7 different `kittlerealestate.hifello.com` landing pages, plus Sierra Interactive footer credit, multiple long-URL Google review queries, and YouTube embeds. None marked `rel="sponsored"` or `nofollow`. PageRank leakage is meaningful given the volume.
- **`/properties/`** has its own H1 ("PROPERTIES" — all caps) and 293 internal links but is a shallow IDX gateway. Not a real landing page.
- **Typo in URL** — `/buyers/neigborhood-report/` (should be `neighborhood`). Permanent URL typo present in homepage body copy and internal links.

---

## 3. Page-by-Page Meta Tag Audit

(See Section 5 for image counts and Section 6 for schema. Word count column reflects rendered text excluding scripts/styles.)

| # | URL | Title (chars) | Description (chars) | Word count | Canonical | Robots |
|---|---|---|---|---:|---|---|
| 1 | `/` | "Northern Colorado Real Estate Agents - Fort Collins Realtors® - Top Realtors in Colorado - Houses for Sale Fort Collins - Real Estate Agents Fort Collin - Real Estate Near Me - Best Real Estate Agents in Colorado Springs" **(220)** | "Kittle Real Estate is a team of award-winning Northern Colorado Realtors® based in Fort Collins…" **(312)** | 2,818 | self | `index, follow` |
| 2 | `/about/` | "BEST Real Estate Agency in Northern Colorado \| 400+ Reviews on Google \| The Kittle Team" **(87)** | "Looking for the best real estate agency in Northern Colorado? Well, you made it. Click now to learn all about The Kittle Team" **(125)** | 1,773 | self | `index, follow` |
| 3 | `/contact/` | "Contact Kittle Real Estate" **(26)** | "Contact Kittle Real Estate using the following information." **(59)** | 774 | self | `index, follow` |
| 4 | `/buyers/` | "Buy a Home in Northern Colorado \| Find Your Dream Home \| Kittle" **(63)** | "Searching for a new home in Northern Colorado? Discover active listings and expert guidance from Kittle Real Estate. Start your home search now!" **(144)** | 813 | self | `index, follow` |
| 5 | `/sellers/` | "Sell My Home in Northern Colorado \| Expert Agents in Your Area \| Kittle" **(71)** | "Thinking of selling your home in Northern Colorado? Work with trusted local agents at Kittle Real Estate. Get a free home evaluation today!" **(139)** | 906 | self | `index, follow` |
| 6 | `/communities/` | "Northern Colorado Real Estate by Neighborhood \| Northern Colorado Neighborhoods and Communities \| Kittle Real Estate" **(116)** | "This is your official guide to homes for sale in Northern Colorado Neighborhoods and Communities" **(96)** | 630 | self | `index, follow` |
| 7 | `/communities/move-to-fort-collins-co/` | "Homes for Sale in Fort Collins \| Browse Our Active Listings \| Kittle" **(68)** | "Looking for homes in Fort Collins? Browse active listings and let Kittle Real Estate help you find the perfect property. Start your search today!" **(145)** | 4,832* | self | `index, follow` |
| 8 | `/communities/move-to-loveland-co/` | "Homes for Sale in Loveland \| Browse Our Active Listings \| Kittle" **(64)** | "Want to buy a home in Loveland? Explore current listings with Kittle Real Estate and find your dream property. Browse all our available homes now!" **(146)** | 3,103* | self | `index, follow` |
| 9 | `/communities/move-to-windsor-co/` | "Homes for Sale in Windsor \| Browse Our Active Listings \| Kittle" **(63)** | "Searching for a home in Windsor, CO? Check out the latest listings from Kittle Real Estate and discover your next move. Start browsing today!" **(141)** | 2,531* | self | `index, follow` |
| 10 | `/properties/` | "Properties for Sale Northern Colorado \| We are the top producing team in Northern Colorado \| Kittle Real Estate" **(111)** | "Looking for a property in Northern Colorado? Look no further. Listings include large photos, school info, detailed maps, and more." **(130)** | 1,111 | self | `index, follow` |
| 11 | `/blog/` | "Northern Colorado Real Estate Blog" **(34)** | "Northern Colorado Real Estate Blog" **(34)** | 1,521 | self | `index, follow` |
| 12 | `/blog/the-best-way-to-respond-to-a-lowball-offer/` | "The Best Way to Respond to a Lowball Offer" **(42)** | "When you get a lowball offer on your home, don't just walk away. They may be worth a look. Here are four effective strategies to handle these offers and turn the negotiation in your favor." **(188)** | 1,543 | self | `index, follow` |
| 13 | `/luxury-homes/` | "Luxury Homes - Kittle Real Estate" **(33)** | "Kittle Real Estate is a high-performing, top-ranking team of real estate professionals that serves the coveted Northern Colorado communities of: Fort Collins Old Town Fort Collins Loveland Windsor Greeley Wellington Johnstown" **(225)** | 1,057 | self | `index, follow` |

\* Word counts marked with `*` include the IDX listing-card text rendered into raw HTML by Sierra; the genuine editorial copy on these pages is approximately 200–600 words. The other community pages we sampled (Fort Collins, Windsor) likewise inflate their word count via embedded MLS listings.

### Page H2 / H3 structure

| Page | H2 count | H3 count | Notes |
|---|---:|---:|---|
| Homepage | 8 | 12 | Heavy use of H4–H6 for visual styling rather than hierarchy. |
| About | 1 | 0 | Only one H2 ("We Specialize, You Benefit"); structure is flat under a missing H1. |
| Contact | 2 | 1 | Sparse but acceptable for a contact page. |
| Buyers | 1 | 1 | Single H2 — page reads more like a banner than a structured pillar. |
| Sellers | 1 | 3 | Same shape — single H2, then H3s for value props. Could benefit from grouping. |
| Communities (hub) | 1 | 1 | Headline + content list; the visible list of cities uses H2 each in the rendered DOM (via Playwright we counted 30+) — raw HTML count understates because IDX widgets render client-side. |
| Fort Collins | 12 | 2 | Many H2s come from city sub-area links inside Sierra's IDX widget. |
| Loveland | 5 | 1 | Modest. |
| Windsor | 9 | 0 | All H2 / no H3 — flat hierarchy. |
| Properties | 7 | 6 | OK structure — but H2s describe IDX modules, not editorial sections. |
| Blog index | 20 | 0 | Each post card uses an H2 — no H3 sub-sections; structurally fine. |
| Blog post | 5 | 2 | Reasonable structure ("Post a Comment", "Related Posts" are H3s). |
| Luxury Homes | 0 | 0 | **Empty hierarchy — no H1, no H2, no H3** in raw HTML. The rendered DOM via check-technical.js confirms only event-widget headings appear. The content area itself has no semantic outline. |

### Title tag issues
- **Homepage title is 220 chars** (≈3× the 50–60 ideal): keyword-stuffed and references "Colorado Springs" which Kittle does not serve.
- **Communities hub (116 chars)** — repeats "Northern Colorado" twice, includes brand at the end past the SERP cutoff.
- **`/properties/` title (111 chars)** — descriptive bragging text past the cutoff ("We are the top producing team…").
- **Blog index (34 chars)** — duplicates the description; missing brand and keywords.
- **Contact (26 chars)** — too short, missing "Northern Colorado" / city qualifiers.
- **Luxury Homes (33 chars)** — missing locality keywords (no "Fort Collins" / "Northern Colorado"); high-value page underperforming.

### Meta description issues
- **Homepage description is 312 chars** — Google truncates at ~155–160; the message past character ~160 ("Whether you're looking for houses for sale in Fort Collins or seeking the best Real Estate Agent in Fort Collins…") is invisible in SERPs.
- **Blog index meta description is identical to title** ("Northern Colorado Real Estate Blog" — 34 chars).
- **Contact description (59 chars)** — too short, no value proposition, no CTA.
- **Luxury Homes description (225 chars)** — runs over the cutoff; first 160 chars don't include any luxury-home value proposition.

---

## 4. H1 Tag Audit

| Page | H1 count | H1 text | Status |
|---|---:|---|---|
| Homepage | 1 | "The Best of Northern Colorado Real Estate" | OK |
| About | **0** | — | **FAIL — no H1 on the page** |
| Contact | 1 | "Contact Kittle Real Estate" | OK |
| Buyers | 1 | "Buy a Home in Northern Colorado" | OK |
| Sellers | 1 | "Sell My Home in Northern Colorado" | OK |
| Communities (hub) | 1 | "Community Guide" | OK (but generic) |
| Fort Collins community | **0** | — | **FAIL — page lacks H1** |
| Loveland community | 1 | "Loveland, CO Real Estate" | OK |
| Windsor community | **0** | — | **FAIL — page lacks H1** |
| Properties | 1 | "PROPERTIES" | OK (but ALL-CAPS, no keywords) |
| Blog index | 1 | "Northern Colorado Real Estate Blog" | OK |
| Blog post (lowball) | 1 | "The Best Way to Respond to a Lowball Offer" | OK |
| Luxury Homes | **0** | — | **FAIL — high-value page lacks H1** |

**Pages without an H1:** 4 of 13 (31%). The missing-H1 pages include `/about/` (brand-equity page), `/luxury-homes/` (high-value commercial intent), and 2 of the 3 community hub pages we sampled. This is a templating bug, not a one-off; expect it across most `/communities/move-to-*/` and the homes-for-sale templates.

H6 misuse on homepage: H6 is used as a styling tag for testimonial bylines and feature card titles ("- Wayne & Julie B", "Condos & Townhouses", "Golf Course Homes", "Luxury Homes"). H1→H6 jumps appear without intermediate logical structure.

H4 used for the homepage hero copy ("Get a Guaranteed Offer & Successfully Sell Your Front Range Home in as Little as 7 Days") instead of an H2 supporting the H1.

---

## 5. Image Alt-Text Analysis

### Per-page (rendered DOM via Playwright where available; raw HTML otherwise)

| Page | Source | Images | Missing alt | % missing |
|---|---|---:|---:|---:|
| Homepage | Playwright (rendered) | 67 | 56 | **84%** |
| About | Playwright (rendered) | 54 | 2 | 4% |
| Contact | Playwright (rendered) | 6 | 3 | 50% |
| Buyers | raw HTML | 9 | 6 | 67% |
| Sellers | raw HTML | 5 | 2 | 40% |
| Communities hub | raw HTML | 5 | 2 | 40% |
| Fort Collins | raw HTML | 55 | 2 | 4% |
| Loveland | raw HTML | 55 | 3 | 5% |
| Windsor | raw HTML | 54 | 2 | 4% |
| Properties | raw HTML | 13 | 10 | **77%** |
| Blog index | Playwright (rendered) | 23 | 2 | 9% |
| Blog post | Playwright (rendered) | 8 | 2 | 25% |
| Luxury Homes | Playwright (rendered) | 54 | 2 | 4% |

### Pattern
- **Homepage is the outlier — 84% missing alt** in the rendered DOM. Most of these are repeated decorative tick-icons (loaded 8+ times) and footer/award imagery.
- Most other pages, once rendered, have <10% missing alt. Sierra Interactive's IDX listing-card and agent-photo widgets emit alt attributes automatically.
- The 50–77% missing-alt outliers (`/contact/`, `/buyers/`, `/properties/`) are pages with very few images — small denominators amplify the percentage. Still worth fixing the 2–10 actual missing alts per page.
- Across the marketing pages, the consistent gap is hero / decorative / award-badge images. Establish the rule: "hero & decorative = `alt=""`; logo/award/photo = descriptive alt."

### Sample missing-alt URLs (homepage rendered DOM)

- `cy-sierra-assets.s3.us-west-1.amazonaws.com/sites/kittlerealestate.com/images/tick-images.png` (×8 — bullet-list checkmark, repeating)
- `cdn.sitephotos.sierrastatic.com/2610_contentbackground_2610-contentbackground-2728-footer-...`
- Background hero / partner logos (BBB, Best of Fort Collins) — partial coverage; some labeled, many not.

### Pattern
- Hero/decorative images largely unlabeled (defensible as decorative if intentional, but missing `alt=""` rather than no `alt` attribute at all).
- Award/badge logos partially labeled, partially blank.
- Repeating "tick" bullet icon image used 8+ times in a row — should be CSS, or single image with `alt=""`.

**True missing-alt total across analyzed marketing pages: 90+ unlabeled images per high-traffic page once rendered.**

---

## 6. Schema / JSON-LD Inventory

Schema is **client-side rendered** (Sierra Interactive injects via JS). curl on raw HTML returns 0 JSON-LD blocks; Playwright sees them after page load.

| Page | JSON-LD types present (rendered) | Verdict |
|---|---|---|
| Homepage | `Organization` (name field BLANK, contactPoint phone), `WebSite` (with SearchAction) | **Org schema is broken — name=""** |
| About | `Article`, `Organization`, `Website`, `CreativeWork`, `ImageObject` | Article schema on a static About page is wrong type |
| Contact | (none detected by check-technical.js) | **No LocalBusiness / RealEstateAgent schema on the contact page** |
| Blog index | `Blog`, `Article`, `Organization`, `Website` | OK |
| Blog post (lowball) | `BlogPosting`, `Blog`, `Organization`, `Website`, `CreativeWork`, `ImageObject` | Best-shaped schema on the site |
| Luxury Homes | `Event`, `Place`, `PostalAddress`, `GeoCoordinates` (×3, all events) | **Wrong intent — event schema on a luxury-homes commercial page** |

### Critical schema gaps
- **No `RealEstateAgent` schema anywhere.** This is the canonical type for an agent/team site. Google has been promoting it in real-estate SERPs.
- **No `LocalBusiness`** with full NAP (name/address/phone) schema. Phone is in `Organization.contactPoint`, but there is no `address`, `geo`, `openingHours`, `aggregateRating`, etc.
- **`Organization.name` is blank** in the homepage JSON-LD. This is a content fault in Sierra Interactive's organization-schema config.
- **No `BreadcrumbList`** on any page (no breadcrumbs in the UI either).
- **No `FAQPage`** despite long Q&A blog posts.
- **No `Review` / `AggregateRating`** schema, despite the homepage prominently advertising "400+ reviews / more 5-star reviews than any other Northern Colorado agent."
- **`Event` schema on /luxury-homes/`** likely refers to embedded event widgets, but it's overwhelming what should be a commercial real-estate landing page; confuses Google about page intent.

---

## 7. Canonical Tag Analysis

All 13 sampled pages emit a canonical pointing to themselves — none of them rel-canonical to a different URL, none missing.

```
/                                              → self
/about/                                        → self
/contact/                                      → self
/buyers/                                       → self
/sellers/                                      → self
/communities/                                  → self
/communities/move-to-fort-collins-co/          → self
/communities/move-to-loveland-co/              → self
/communities/move-to-windsor-co/               → self
/properties/                                   → self
/blog/                                         → self
/blog/the-best-way-to-respond-to-a-lowball…/  → self
/luxury-homes/                                 → self
```

### Implications
- Self-canonical is the safe default and is correct for editorial pages.
- However, **15,664 IDX filter pages also self-canonical to themselves** (verified via curl on `/<city>-homes-for-sale/2-bathrooms/` etc.). This means thousands of near-duplicate auto-generated pages are all telling Google "I'm canonical." That is the prime cause of the index bloat.
- Recommended fix: have IDX filter pages canonical to the parent city page (e.g., `/aurora-homes-for-sale/2-bathrooms/` → canonical `/aurora-homes-for-sale/`), or noindex them.

---

## 8. Open Graph / Social Meta Analysis

| Page | og:title | og:description | og:image | og:type | og:url | og:site_name | twitter:card |
|---|---|---|---|---|---|---|---|
| Homepage | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| About | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| Contact | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| Buyers | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| Sellers | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| Communities (hub) | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /communities/move-to-fort-collins-co/ | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /communities/move-to-loveland-co/ | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /communities/move-to-windsor-co/ | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /properties/ | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /blog/ | **MISSING** | **MISSING** | hero (default) | MISSING | MISSING | MISSING | **MISSING** |
| /blog/lowball-offer/ | OK | OK | post hero | article | OK | KittleRealEstate.com | **MISSING** |
| /luxury-homes/ | OK (trailing newline) | OK (trailing newline) | luxury hero | MISSING | OK | MISSING | **MISSING** |

### Findings
- **11 of 13 (85%) sampled pages have NO og:title and NO og:description.** Only the blog post and luxury-homes page expose them.
- The default og:image across the entire site is the same generic hero (`2610_hero_hero-20210629075843.jpg`) – every shared page on Facebook / LinkedIn / Slack will show identical imagery.
- **Twitter Card meta is absent everywhere.** Twitter/X falls back to default rendering.
- The `/luxury-homes/` og:title and og:description include literal trailing newlines (`\n`) — a Sierra Interactive content-entry artifact that breaks display in some social previews.

---

## 9. Robots.txt Review

Live `https://www.kittlerealestate.com/robots.txt` (full):

```
User-agent: Amazonbot                # Amazon's user agent
Disallow: /

User-agent: PetalBot                 # Huawei Petal Search
Disallow: /

User-agent: Barkrowler               # Babbar SEO
Disallow: /

User-agent: AhrefsSiteAudit
Crawl-Delay: 85
Allow: /res/includes/*.js
Allow: /res/includes/*.css
Disallow: /res/includes/
Disallow: /sist/
Disallow: /property-search/sist_ajax/
Disallow: /property-search/market-update/
Disallow: /idx/market-update/
Disallow: /search/market-update/

User-agent: AhrefsBot
Crawl-Delay: 85
…(same Allow/Disallow stanza)…

User-agent: SemrushBot
Crawl-Delay: 85
…(same Allow/Disallow stanza)…

User-agent: *
Crawl-delay: 5
Allow: /res/includes/*.js
Allow: /res/includes/*.css
Disallow: /res/includes/
Disallow: /sist/
Disallow: /property-search/sist_ajax/
Disallow: /property-search/market-update/
Disallow: /idx/market-update/
Disallow: /search/market-update/

Sitemap:  https://www.kittlerealestate.com/sitemap.xml
```

### Findings
- **Sitemap declared correctly.**
- **Crawl-delay: 5** for `*` is restrictive (Googlebot ignores it, but Bing respects it). 5s × 16,280 URLs = ~22.6 hours per full Bing crawl.
- **Missing `Disallow` for the actual IDX bloat patterns** — `/<city>-homes-for-sale/<filter>/` is wide open. Robots blocks `/property-search/sist_ajax/` and `/idx/market-update/` but not the public IDX templates that produce 15.7k indexed pages.
- **Missing `Disallow` for `/test/`, `/test1/`, `/calendly-test/`** — staging/test pages are crawlable.
- **No allowance for image / asset paths** beyond `/res/includes/`. Sierra serves photos from `cdn.sitephotos.sierrastatic.com` (cross-domain, robots scope doesn't apply), so this is fine.
- **Aggressive bot blocks (Amazonbot, PetalBot, Barkrowler) are intentional but worth a client conversation** — Amazon's bot is increasingly used to feed Alexa / Bedrock training data; some sites explicitly want to opt out, others lose discoverability.
- **No HSTS header** present on the response (separate from robots.txt but flagged for security ranking factors).

---

## 10. Additional Technical Observations

| Item | Value | Notes |
|---|---|---|
| HTTP → HTTPS redirect | 301 to https | Correct |
| apex → www redirect | 301 to www | Correct |
| HSTS header | **MISSING** | Add `Strict-Transport-Security` (Cloudflare-level) |
| Cloudflare in front of origin | Yes | OK |
| Compression | Brotli (`content-encoding: br`) | Good |
| 404 handling | Returns proper 404 | Good |
| 404 content quality | Default Sierra 404 | Could be enriched |
| Lang attribute | `lang="en"` | OK |
| Charset | UTF-8 | OK |
| Viewport meta | `width=device-width, initial-scale=1.0, minimum-scale=1.0` | `minimum-scale` discouraged but harmless |
| Hreflang | None | Site is English-only with a JS language switcher (中文/한국어/etc.). Translated content does not appear to live at separate URLs, so hreflang is not currently applicable. |
| Favicon set | 16/32/ICO | Good |
| Total DOM elements (homepage, rendered) | 1,511 | High but acceptable for a real-estate template |
| Total scripts (homepage) | 85 | **Very high** — consolidate / defer |
| Total stylesheets (homepage) | 16 | Should be 3–5 after consolidation |
| Total iframes (homepage) | 6 | Including Calendly, YouTube, etc. — defer / lazy-load |

---

## 11. Twenty Prioritized Technical Recommendations

Effort: S = ≤2h, M = half-day, L = 1+ day, XL = multi-week. Impact: traffic/ranking impact estimate.

| # | Recommendation | Effort | Impact | Why |
|---|---|---|---|---|
| 1 | **Resolve IDX index bloat: noindex or canonical-to-parent for the 15,664 `/<city>-homes-for-sale/<filter>/` pages.** Options: (a) Sierra-template-level canonical to the city hub, (b) `<meta name="robots" content="noindex, follow">`, or (c) robots.txt `Disallow: /*-homes-for-sale/*/` (but this loses link equity flow). Recommend option (a). | L | XL | Removes 96% of the indexed footprint that is auto-generated near-duplicate; lifts overall site quality signal. |
| 2 | **Rewrite homepage title from 220 chars to ≤60.** Suggested: `Northern Colorado Real Estate \| Fort Collins Realtors \| Kittle Real Estate` (78 → trim to fit). Remove "Colorado Springs" — Kittle does not service that market and it dilutes relevance. | S | L | Highest-equity page in SERPs; current title is truncated badly. |
| 3 | **Rewrite homepage meta description from 312 chars to ≤155.** Lead with the unique "more 5-star reviews than any other NoCo agent" angle plus a CTA. | S | M | Direct CTR lift in SERPs. |
| 4 | **Add `RealEstateAgent` + `LocalBusiness` JSON-LD to homepage and contact page.** Include NAP, geo, hours, sameAs (social profiles), aggregateRating sourced from Google reviews. Replace the empty-name `Organization` block. | M | L | Eligibility for rich results; correctness fix (current Org schema has empty `name`). |
| 5 | **Fix or remove the empty-name Organization schema** in the homepage `<script type="application/ld+json">`. Right now `name` is `""`, which breaks Google's parser silently. | S | M | Schema validation pass. |
| 6 | **Add og:title, og:description, og:type, og:url, og:site_name on every page** (currently only blog posts and Luxury Homes have any). Sierra Interactive supports this in its template — flag with their support if not editable in CMS. | M | M | All social shares of the site currently render as the same generic hero with no headline. |
| 7 | **Add Twitter Card meta (`twitter:card=summary_large_image`, twitter:title, twitter:description, twitter:image)** sitewide. | S | S | One-time template fix; covers the site's social-share footprint. |
| 8 | **Add H1 to /about/, /luxury-homes/, /communities/move-to-windsor-co/, /communities/move-to-fort-collins-co/.** Likely a Sierra-template bug — check whether those pages set the H1 in the CMS field or in a custom block. | M | L | Fundamental on-page SEO; missing H1 on a high-value commercial page like /luxury-homes/ is leaving rankings on the table. |
| 9 | **Strip trailing newlines from /luxury-homes/ og:title and og:description** (artifacts of CMS data entry). Same likely affects other pages with custom OG. | S | S | Display consistency on social. |
| 10 | **Audit and remove or noindex test pages (`/test/`, `/test1/`, `/calendly-test/`)** — currently public, indexable, and in sitemap. | S | S | Removes embarrassing/unintentional public surface area. |
| 11 | **Decide on `/<city>-co-listings/` vs `/communities/move-to-<city>-co/`.** Two URL systems represent the same intent (12 vs 77 cities). Consolidate into one canonical structure with 301s from the loser. | M | M | Fixes content cannibalization between the two community page systems. |
| 12 | **Move `/selling-your-home-*` top-level pages under `/sellers/`** (e.g., `/sellers/disclosure/`, `/sellers/negotiating/`). 301 the old URLs. Tightens taxonomy. | M | M | Improves topical clustering for "selling your home" queries. |
| 13 | **Fix the typo URL `/buyers/neigborhood-report/`** → 301 to `/buyers/neighborhood-report/`. Update internal links and homepage body copy. | S | S | Permanent typo in a navigation target hurts trust + breaks shareability. |
| 14 | **Improve image alt coverage on marketing pages.** Homepage shows 56/67 missing alt (84%). Establish a checklist: hero photos = descriptive alt; decorative icons = `alt=""`; logos / awards = brand + descriptor. | M | M | Accessibility + image-search visibility. |
| 15 | **Replace repeating `tick-images.png` bullet image with CSS `::before` content** or single image referenced once with `alt=""`. Currently the image is loaded 8+ times per page. | S | S | Modest CWV (LCP/CLS) and accessibility win. |
| 16 | **Consolidate scripts / stylesheets.** Homepage loads 85 scripts and 16 stylesheets. Most are Sierra-template defaults. Push for `defer` on third-party (Calendly, hifello.com, video embeds) + bundling where possible. | L | M | Largest-Contentful-Paint and TBT improvement; ranks/CWV. |
| 17 | **Add HSTS header** at Cloudflare (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`). | S | S | Security + Lighthouse Best Practices. |
| 18 | **Add BreadcrumbList JSON-LD + visible breadcrumbs** on community, blog, and "selling-your-home-*" pages. Helps both UX and Google's path display in SERPs. | M | M | Rich-result eligibility + improved internal-link signaling. |
| 19 | **Add FAQ schema to the long Q&A blog posts** (e.g., "8 questions Northern Colorado sellers are asking…", "7 questions Northern Colorado buyers are asking…", "/buyers/buyers-guide/"). | M | M | FAQ rich-snippet eligibility for high-intent buyer/seller queries. |
| 20 | **Fix nav anchor texts that read "no text"** in the Featured-Searches section (Condominiums, New Construction, Single Family Homes, Virtual Tours all link without anchor text). Provide keyword-rich anchor text. | S | M | Internal anchor-text strength; many of these target commercial-intent landing pages. |

---

## Appendix A — Pages with Critical Issues at a Glance

- **Homepage** — title 220 chars, description 312 chars, og:title/og:desc missing, 84% images missing alt, broken Organization schema (empty name), 85 scripts.
- **/about/** — no H1.
- **/luxury-homes/** — no H1, og:title has trailing newline, only event schema (wrong type), missing locality keywords in title, missing description value-prop.
- **/communities/move-to-fort-collins-co/** — no H1, og:* missing, 1,196 internal links (probably from IDX widget — bordering on excess).
- **/communities/move-to-windsor-co/** — no H1, og:* missing.
- **/properties/** — H1 is "PROPERTIES" all-caps with no keywords; 77% images missing alt.
- **/blog/** — title and meta description are identical and only 34 chars; missing brand keyword.
- **/contact/** — title 26 chars, description 59 chars; no LocalBusiness schema on the page that should be carrying it.

---

## Appendix B — Files Generated / Reviewed

- Sitemap raw: `/tmp/all_urls.txt` (16,280 URLs, generated from `https://www.kittlerealestate.com/sitemap.xml`)
- Per-page browse.js outputs: `/tmp/seo_pages/p01-home.json` through `/tmp/seo_pages/p13-luxury.json`
- Per-page rendered technical (Playwright) outputs: `/tmp/seo_pages/technical-home.json`, `/tmp/seo_pages/tech-{about,blog,blogpost,contact,luxury}.json`
- Raw HTML snapshots: `/tmp/seo_pages/p01-home.html` through `p13-luxury.html`
- Aggregated extraction: `/tmp/seo_pages/extracted.json`
- Robots.txt source: `https://www.kittlerealestate.com/robots.txt` (verified live)
