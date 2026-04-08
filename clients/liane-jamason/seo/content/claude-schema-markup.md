# JSON-LD Schema Markup — lianejamason.com

This file contains 9 production-ready JSON-LD schema markup blocks for https://www.lianejamason.com/. Each block is designed for a specific page and follows current schema.org standards.

**How to implement:** In Rank Math, navigate to the page editor → Schema tab → Custom Schema → Code Block, and paste the corresponding JSON-LD block. Alternatively, inject via a WordPress child theme's `wp_head` action using `<script type="application/ld+json">`.

**Last updated:** 2026-04-08

---

## Block 1: Homepage @graph (Organization + RealEstateAgent + WebSite + SearchAction)

### Where to Place
https://www.lianejamason.com/

### What This Does
Establishes the business entity, links it to the website, and enables sitelinks search box in Google results. This is the foundational schema that all other page schemas reference via `@id`.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["RealEstateAgent", "LocalBusiness"],
      "@id": "https://www.lianejamason.com/#org",
      "name": "Corcoran Dwellings",
      "url": "https://www.lianejamason.com/",
      "logo": "[LOGO IMAGE URL]",
      "image": "[HERO IMAGE URL]",
      "telephone": "+1-727-755-3325",
      "priceRange": "$$$$",
      "description": "Corcoran Dwellings is a luxury real estate brokerage in St. Petersburg, Florida, specializing in waterfront homes, condos, and investment properties across Tampa Bay. Led by Broker/Owner Liane Jamason.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1405 Dr. MLK Jr St N",
        "addressLocality": "St. Petersburg",
        "addressRegion": "FL",
        "postalCode": "33704",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 27.7861,
        "longitude": -82.6638
      },
      "areaServed": [
        {"@type": "City", "name": "St. Petersburg", "addressRegion": "FL"},
        {"@type": "City", "name": "Tampa", "addressRegion": "FL"},
        {"@type": "City", "name": "Clearwater", "addressRegion": "FL"},
        {"@type": "City", "name": "Gulfport", "addressRegion": "FL"},
        {"@type": "City", "name": "St. Pete Beach", "addressRegion": "FL"},
        {"@type": "City", "name": "Dunedin", "addressRegion": "FL"},
        {"@type": "City", "name": "Tierra Verde", "addressRegion": "FL"},
        {"@type": "Neighborhood", "name": "Shore Acres"},
        {"@type": "Neighborhood", "name": "Snell Isle"},
        {"@type": "Neighborhood", "name": "Old Northeast"},
        {"@type": "Neighborhood", "name": "Downtown St. Pete"},
        {"@type": "Neighborhood", "name": "Venetian Isles"},
        {"@type": "Neighborhood", "name": "Coffee Pot Bayou"},
        {"@type": "Neighborhood", "name": "Pinellas Point"},
        {"@type": "Neighborhood", "name": "Pass-a-Grille"}
      ],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "18:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "10:00",
          "closes": "16:00"
        }
      ],
      "sameAs": [
        "https://www.zillow.com/profile/LianeJamason",
        "https://www.realtor.com/realestateagents/liane-jamason",
        "https://www.linkedin.com/in/liane-jamason",
        "https://www.facebook.com/LianeJamason",
        "https://www.instagram.com/lianejamason",
        "https://www.youtube.com/@LianeJamason",
        "https://corcoran.com",
        "https://www.birdeye.com/liane-jamason"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.lianejamason.com/#website",
      "name": "Liane Jamason - Corcoran Dwellings",
      "url": "https://www.lianejamason.com/",
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.lianejamason.com/?s={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

### Before Going Live
- Replace `[LOGO IMAGE URL]` with the full URL to the site logo (e.g., `https://www.lianejamason.com/wp-content/uploads/logo.png`)
- Replace `[HERO IMAGE URL]` with the homepage hero or office image URL
- Verify opening hours with client — the hours listed (Mon-Fri 9-6, Sat 10-4) are defaults
- Verify that `/?s=` is the correct WordPress search URL pattern
- Validate all `sameAs` URLs (see verification notes below)

> **sameAs verification needed:**
> - `https://www.zillow.com/profile/LianeJamason` — VERIFY exact URL slug
> - `https://www.realtor.com/realestateagents/liane-jamason` — VERIFY; audit notes profile may not be claimed yet
> - `https://www.linkedin.com/in/liane-jamason` — VERIFY exact URL slug
> - `https://www.facebook.com/LianeJamason` — VERIFY; audit notes she has 2 Facebook pages, use the primary one
> - `https://www.instagram.com/lianejamason` — VERIFY exact handle
> - `https://www.youtube.com/@LianeJamason` — VERIFY exact channel handle
> - `https://corcoran.com` — Confirmed (she is listed on corcoran.com per audit)
> - `https://www.birdeye.com/liane-jamason` — VERIFY exact URL slug

---

## Block 2: Homepage — Person Schema (Liane Jamason)

### Where to Place
https://www.lianejamason.com/ (same page as Block 1 — add to the `@graph` array or as a separate `<script>` tag)

### What This Does
Establishes Liane Jamason as a named individual linked to the business entity, enabling Knowledge Panel signals and connecting her professional profiles.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.lianejamason.com/#person-liane",
  "name": "Liane Jamason",
  "jobTitle": "Broker/Owner",
  "url": "https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/",
  "image": "[LIANE HEADSHOT IMAGE URL]",
  "worksFor": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "memberOf": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "description": "Liane Jamason is the Broker/Owner of Corcoran Dwellings in St. Petersburg, Florida, specializing in luxury waterfront real estate across Tampa Bay. With extensive experience in the Pinellas County market and features in Forbes, Wall Street Journal, and USA Today, Liane is a recognized authority in St. Petersburg's waterfront and luxury home segments.",
  "sameAs": [
    "https://www.zillow.com/profile/LianeJamason",
    "https://www.realtor.com/realestateagents/liane-jamason",
    "https://www.linkedin.com/in/liane-jamason",
    "https://www.facebook.com/LianeJamason",
    "https://www.instagram.com/lianejamason",
    "https://www.youtube.com/@LianeJamason",
    "https://corcoran.com",
    "https://www.birdeye.com/liane-jamason"
  ]
}
```

### Before Going Live
- Replace `[LIANE HEADSHOT IMAGE URL]` with the full URL to her professional headshot
- Verify all `sameAs` URLs resolve correctly (same list as Block 1)

---

## Block 3: About Page — Person + RealEstateAgent with Detailed Bio

### Where to Place
https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/

### What This Does
Provides Google with detailed professional information about Liane, including credentials, expertise areas, and media appearances. This strengthens E-E-A-T signals and Knowledge Panel eligibility.

```json
{
  "@context": "https://schema.org",
  "@type": ["Person", "RealEstateAgent"],
  "@id": "https://www.lianejamason.com/#person-liane",
  "name": "Liane Jamason",
  "jobTitle": "Broker/Owner",
  "url": "https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/",
  "image": "[LIANE HEADSHOT IMAGE URL]",
  "telephone": "+1-727-755-3325",
  "worksFor": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "description": "Liane Jamason is the Broker/Owner of Corcoran Dwellings in St. Petersburg, Florida, and a recognized specialist in luxury waterfront real estate across Tampa Bay. With deep expertise in Pinellas County's waterfront market — including flood zone analysis, dock permits, seawall inspections, and Florida condo regulations — Liane guides buyers and sellers through the complexities of coastal property transactions. Her work has been featured in Forbes, the Wall Street Journal, USA Today, the Huffington Post, and multiple Tampa Bay television outlets including Bay News 9, ABC Action News, and 10 Tampa Bay.",
  "knowsAbout": [
    "Waterfront real estate",
    "Luxury homes",
    "Flood zone analysis",
    "Dock permits and seawall inspections",
    "Comparative Market Analysis",
    "St. Petersburg neighborhoods",
    "Tampa Bay real estate market",
    "Florida condo regulations"
  ],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Real Estate Broker License",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Florida Department of Business and Professional Regulation"
    },
    "identifier": "[FL LICENSE NUMBER]"
  },
  "areaServed": [
    {"@type": "City", "name": "St. Petersburg", "addressRegion": "FL"},
    {"@type": "City", "name": "Tampa", "addressRegion": "FL"},
    {"@type": "City", "name": "Clearwater", "addressRegion": "FL"},
    {"@type": "City", "name": "Gulfport", "addressRegion": "FL"},
    {"@type": "City", "name": "St. Pete Beach", "addressRegion": "FL"},
    {"@type": "City", "name": "Tierra Verde", "addressRegion": "FL"}
  ],
  "sameAs": [
    "https://www.zillow.com/profile/LianeJamason",
    "https://www.realtor.com/realestateagents/liane-jamason",
    "https://www.linkedin.com/in/liane-jamason",
    "https://www.facebook.com/LianeJamason",
    "https://www.instagram.com/lianejamason",
    "https://www.youtube.com/@LianeJamason",
    "https://corcoran.com",
    "https://www.birdeye.com/liane-jamason"
  ]
}
```

### Before Going Live
- Replace `[LIANE HEADSHOT IMAGE URL]` with her professional headshot URL
- Replace `[FL LICENSE NUMBER]` with her confirmed Florida broker license number
- Verify the about page URL slug is exactly `about-tampa-real-estate-liane-jamason`
- Verify all `sameAs` URLs resolve correctly

---

## Block 4: Contact Page — LocalBusiness + ContactPoint + GeoCoordinates

### Where to Place
https://www.lianejamason.com/contact/

### What This Does
Provides complete NAP (Name, Address, Phone) data with geographic coordinates and contact details. This is the primary schema for Google Maps integration, local pack eligibility, and consistent business information across Google surfaces.

```json
{
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness"],
  "@id": "https://www.lianejamason.com/#localbusiness",
  "name": "Corcoran Dwellings",
  "url": "https://www.lianejamason.com/",
  "telephone": "+1-727-755-3325",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1405 Dr. MLK Jr St N",
    "addressLocality": "St. Petersburg",
    "addressRegion": "FL",
    "postalCode": "33704",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 27.7861,
    "longitude": -82.6638
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-727-755-3325",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "16:00"
    }
  ],
  "hasMap": "https://maps.google.com/?q=1405+Dr+MLK+Jr+St+N,+St+Petersburg,+FL+33704",
  "image": "[OFFICE EXTERIOR OR MAP IMAGE URL]",
  "priceRange": "$$$$"
}
```

### Before Going Live
- Replace `[OFFICE EXTERIOR OR MAP IMAGE URL]` with the office photo or Google Maps embed image
- Verify opening hours with client — Mon-Fri 9am-6pm, Sat 10am-4pm are defaults
- Verify the contact page URL slug is exactly `contact`
- Confirm GeoCoordinates (27.7861, -82.6638) match the office address on Google Maps

---

## Block 5: Community/Neighborhood Page Template + 2 Filled Examples

### Where to Place
Each neighborhood page (e.g., `https://www.lianejamason.com/st-petersburg/[neighborhood-slug]/`)

### What This Does
Marks up community pages as both articles and geographic places, enabling breadcrumb rich results and linking authorship and publisher to the main entity. This helps Google understand the site's topical authority structure around St. Petersburg neighborhoods.

### Template (with placeholders)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["WebPage", "Article"],
      "headline": "[NEIGHBORHOOD NAME] St. Petersburg FL | Homes for Sale & Neighborhood Guide",
      "description": "[1-2 SENTENCE DESCRIPTION OF THE NEIGHBORHOOD]",
      "url": "https://www.lianejamason.com/st-petersburg/[NEIGHBORHOOD-SLUG]/",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "isPartOf": {
        "@id": "https://www.lianejamason.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.lianejamason.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "St. Petersburg",
          "item": "https://www.lianejamason.com/st-petersburg/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[NEIGHBORHOOD NAME]",
          "item": "https://www.lianejamason.com/st-petersburg/[NEIGHBORHOOD-SLUG]/"
        }
      ]
    },
    {
      "@type": "Place",
      "name": "[NEIGHBORHOOD NAME]",
      "description": "[2-3 SENTENCE DESCRIPTION OF THE NEIGHBORHOOD INCLUDING KEY FEATURES]",
      "containedInPlace": {
        "@type": "City",
        "name": "St. Petersburg",
        "addressRegion": "FL"
      }
    }
  ]
}
```

### Filled Example 1: Shore Acres

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["WebPage", "Article"],
      "headline": "Shore Acres St. Petersburg FL | Homes for Sale & Neighborhood Guide",
      "description": "Explore Shore Acres in St. Petersburg, FL — a peninsular waterfront community known for canals, boating access, and family-friendly living. Browse homes for sale and learn about the neighborhood.",
      "url": "https://www.lianejamason.com/st-petersburg/shore-acres/",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "isPartOf": {
        "@id": "https://www.lianejamason.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.lianejamason.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "St. Petersburg",
          "item": "https://www.lianejamason.com/st-petersburg/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Shore Acres",
          "item": "https://www.lianejamason.com/st-petersburg/shore-acres/"
        }
      ]
    },
    {
      "@type": "Place",
      "name": "Shore Acres",
      "description": "Shore Acres is a peninsular waterfront community in St. Petersburg, Florida, known for its canals, boating access, and family-friendly atmosphere. The neighborhood offers a mix of mid-century and renovated homes with many properties featuring direct water access to Tampa Bay.",
      "containedInPlace": {
        "@type": "City",
        "name": "St. Petersburg",
        "addressRegion": "FL"
      }
    }
  ]
}
```

### Filled Example 2: Snell Isle

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["WebPage", "Article"],
      "headline": "Snell Isle St. Petersburg FL | Luxury Waterfront Homes & Neighborhood Guide",
      "description": "Discover Snell Isle in St. Petersburg, FL — a prestigious luxury waterfront neighborhood developed in 1911, featuring waterfront estates and Mediterranean-style architecture.",
      "url": "https://www.lianejamason.com/st-petersburg/snell-isle/",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "isPartOf": {
        "@id": "https://www.lianejamason.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.lianejamason.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "St. Petersburg",
          "item": "https://www.lianejamason.com/st-petersburg/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Snell Isle",
          "item": "https://www.lianejamason.com/st-petersburg/snell-isle/"
        }
      ]
    },
    {
      "@type": "Place",
      "name": "Snell Isle",
      "description": "Snell Isle is a prestigious luxury waterfront neighborhood in St. Petersburg, FL, developed in 1911 by C. Perry Snell, featuring waterfront estates and Mediterranean-style architecture. It is one of the most sought-after addresses in Tampa Bay, with deep-water docks, lush landscaping, and proximity to downtown St. Petersburg.",
      "containedInPlace": {
        "@type": "City",
        "name": "St. Petersburg",
        "addressRegion": "FL"
      }
    }
  ]
}
```

### Before Going Live
- Replace all `[YYYY-MM-DD]` date placeholders with actual publish/modify dates from the CMS
- Verify the URL slugs match the live page URLs exactly
- Verify that a parent `/st-petersburg/` page exists for the breadcrumb trail
- For each new neighborhood page, copy the template and fill in the neighborhood-specific details

---

## Block 6: Blog Post Template + 1 Filled Example

### Where to Place
Each blog post page (e.g., `https://www.lianejamason.com/[post-slug]/`)

### What This Does
Marks up blog posts as BlogPosting with authorship, publisher, and breadcrumb data. This enables article rich results in Google Search and reinforces Liane's topical authority.

### Template (with placeholders)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "[POST TITLE]",
      "url": "https://www.lianejamason.com/[POST-SLUG]/",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "isPartOf": {
        "@id": "https://www.lianejamason.com/#website"
      },
      "wordCount": "[WORD COUNT]",
      "articleSection": "[CATEGORY]",
      "keywords": ["[KEYWORD 1]", "[KEYWORD 2]", "[KEYWORD 3]"],
      "image": {
        "@type": "ImageObject",
        "url": "[FEATURED IMAGE URL]",
        "width": "[WIDTH]",
        "height": "[HEIGHT]",
        "caption": "[IMAGE CAPTION]"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.lianejamason.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.lianejamason.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[POST TITLE]",
          "item": "https://www.lianejamason.com/[POST-SLUG]/"
        }
      ]
    }
  ]
}
```

### Filled Example: Market Update Post

> **Note:** The URL slug and datePublished below are placeholders — verify the actual published URL and date in the CMS before deploying.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "Pinellas vs. Hillsborough Real Estate Market Update | St. Petersburg FL Real Estate Market 2026",
      "url": "https://www.lianejamason.com/pinellas-vs-hillsborough-real-estate-market-update/",
      "datePublished": "2026-01-01",
      "dateModified": "2026-01-01",
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "isPartOf": {
        "@id": "https://www.lianejamason.com/#website"
      },
      "wordCount": 2500,
      "articleSection": "Market Analysis",
      "keywords": [
        "St Petersburg real estate market 2026",
        "Pinellas County housing market",
        "Hillsborough County real estate",
        "Tampa Bay real estate market update"
      ],
      "image": {
        "@type": "ImageObject",
        "url": "[FEATURED IMAGE URL]",
        "width": 1200,
        "height": 630,
        "caption": "Pinellas vs. Hillsborough County real estate market comparison"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.lianejamason.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.lianejamason.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Pinellas vs. Hillsborough Real Estate Market Update",
          "item": "https://www.lianejamason.com/pinellas-vs-hillsborough-real-estate-market-update/"
        }
      ]
    }
  ]
}
```

### Before Going Live
- Replace `[FEATURED IMAGE URL]` with the actual featured image URL from the CMS
- Verify the URL slug matches the published post URL
- Verify datePublished and dateModified match the CMS values
- Confirm the blog index page exists at `/blog/` for the breadcrumb trail
- For each new blog post, copy the template and fill in post-specific details

---

## Block 7: Buyer FAQ — FAQPage with 6 Q&A Pairs

### Where to Place
https://www.lianejamason.com/buyers/ (or whichever page serves as the main buyer resource — verify URL)

### What This Does
Enables FAQ rich results in Google Search for buyer-related queries. These answers use real St. Petersburg/Florida-specific data to build topical authority and capture long-tail search traffic for waterfront buyer queries.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What should I know about flood zones when buying a waterfront home in St. Petersburg, FL?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Florida uses FEMA flood zone designations that directly affect insurance requirements and costs. Zone X indicates low-to-moderate risk and does not require flood insurance. Zone AE is a high-risk area where flood insurance is mandatory if you have a federally backed mortgage. Zone VE is the highest-risk coastal zone with velocity wave action, carrying the strictest building requirements and highest insurance premiums. Waterfront properties in St. Petersburg frequently fall in AE or VE zones, particularly in neighborhoods like Shore Acres, Venetian Isles, and Tierra Verde. Before purchasing any waterfront home, obtain an elevation certificate — this document determines your exact flood risk and directly affects your insurance premium."
      }
    },
    {
      "@type": "Question",
      "name": "How much does flood insurance cost for a waterfront home in St. Pete?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flood insurance costs in St. Petersburg vary significantly based on the property's flood zone, elevation, and structure type. National Flood Insurance Program (NFIP) policies for lower-risk Zone X properties average $700 to $2,000 per year. Properties in AE or VE flood zones can range from $3,000 to $10,000 or more per year depending on elevation relative to the base flood elevation, coverage limits, and construction type. Private flood insurance is increasingly available in Florida and sometimes offers lower premiums than NFIP, especially for newer construction with higher elevations. An elevation certificate is the key document that determines your exact rate — request one from the seller or order a new survey before making an offer."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best waterfront neighborhoods in St. Petersburg for buyers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "St. Petersburg offers several distinct waterfront neighborhoods, each with its own character and price range. Shore Acres is a peninsular community with canal-front homes, boating access, and a family-friendly atmosphere. Snell Isle is one of Tampa Bay's most prestigious addresses, featuring luxury waterfront estates in an established neighborhood developed in 1911. Tierra Verde is an island community with direct Tampa Bay access, popular with boaters and those seeking a quieter coastal lifestyle. Venetian Isles offers wide canals and deep-water access ideal for larger boats. Coffee Pot Bayou, adjacent to the Old Northeast, provides historic charm with waterfront views. Each neighborhood has different flood zone profiles, HOA structures, price ranges from the mid-$400Ks to $12M+, and lifestyle characteristics that a local waterfront specialist can help you evaluate."
      }
    },
    {
      "@type": "Question",
      "name": "What changed for Florida condo buyers after the 2024 condo regulations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Florida Senate Bill 4D, effective in 2024, introduced mandatory structural milestone inspections for condominium buildings that are 30 years old or older — or 25 years old if located within 3 miles of the coast, which includes most of St. Petersburg's condo inventory. The law also requires condominium associations to fully fund reserve accounts for structural integrity items including roof, foundation, load-bearing walls, and primary structural members. This has resulted in significant HOA fee increases at some buildings as associations work to meet reserve funding requirements. Before purchasing a Florida condo, request the most recent reserve study, the milestone inspection report (if applicable), and review the association's financial statements to understand any upcoming special assessments."
      }
    },
    {
      "@type": "Question",
      "name": "How do I find waterfront homes for sale in St. Petersburg, FL?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While online portals like Zillow and Realtor.com list waterfront properties, the details that matter most — water depth, dock permits, seawall condition, and canal width — are rarely included in standard MLS listings. Working with a local waterfront specialist who knows which properties have permitted docks, deepwater access versus shallow canals, and recently inspected seawalls can save significant time and prevent costly surprises after closing. A knowledgeable St. Petersburg agent can also identify off-market opportunities and properties that technically have water access but face practical limitations such as fixed bridges, shallow draft restrictions, or pending seawall repairs that would affect your intended use."
      }
    },
    {
      "@type": "Question",
      "name": "What are typical closing costs for buyers in Florida?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Florida buyer closing costs typically range from 2% to 3% of the purchase price. Major cost components include: title insurance (required in Florida — the buyer typically pays for the lender's policy), title search and settlement fees, loan origination and processing fees, prepaid items such as homeowners insurance, property tax prorations, and HOA fees, plus recording fees charged by the county. On a $750,000 waterfront home in St. Petersburg, expect approximately $15,000 to $22,500 in total closing costs. These figures are estimates and will vary based on your specific transaction, lender requirements, and whether you negotiate seller contributions. Your agent and closing attorney will provide a detailed estimate before you finalize your offer."
      }
    }
  ]
}
```

### Before Going Live
- Verify the target page URL (e.g., `/buyers/`, `/buying/`, or `/buyer-resources/`)
- Review FAQ answers for any market data that may need updating at the time of deployment
- Confirm that the page's visible content includes these same Q&A pairs — Google requires FAQ schema to match on-page content

---

## Block 8: Seller FAQ — FAQPage with 5 Q&A Pairs

### Where to Place
https://www.lianejamason.com/sellers/ (or whichever page serves as the main seller resource — verify URL)

### What This Does
Enables FAQ rich results for seller-related queries. These answers use real St. Petersburg market dynamics and Florida legal requirements to position Liane as a local authority on the selling process.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I price my home correctly in the St. Petersburg market?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Accurate pricing requires a Comparative Market Analysis (CMA) based on recent comparable sales within your specific neighborhood, adjusted for lot size, water access, renovation quality, and current market conditions. In St. Petersburg's waterfront segment, overpricing by even 5-10% significantly extends days on market — luxury buyers conduct extensive research and know the comparable sales in their target neighborhoods. A CMA from a local waterfront specialist accounts for factors that automated online estimates miss entirely, including dock condition, seawall age, water depth, and canal orientation. Pricing strategy should also consider seasonal demand patterns in the Tampa Bay market."
      }
    },
    {
      "@type": "Question",
      "name": "What repairs or upgrades give the best return before selling in St. Petersburg?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For waterfront and luxury properties in St. Petersburg, the highest-return improvements are fresh interior and exterior paint, professional staging with modern furniture, and updated kitchens and bathrooms. Cosmetic improvements in this market segment typically yield 3 to 5 times their cost at closing. Ensuring that your dock and seawall are in good documented condition is critical for waterfront properties — buyers and their inspectors will scrutinize these elements, and documented maintenance records build confidence. Major structural work such as seawall replacement or roof replacement should either be completed before listing or fully disclosed and reflected in the asking price. Your listing agent can advise which improvements will deliver the best return for your specific property and price point."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in St. Petersburg, FL?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Days on market in St. Petersburg varies significantly by price point and neighborhood. Entry-level homes under $500,000 in active markets often sell within 7 to 21 days. Luxury waterfront properties priced at $1 million or above typically take 45 to 120 or more days because the buyer pool is smaller and due diligence on waterfront properties — including dock inspections, seawall surveys, and flood zone analysis — is more extensive. The two primary factors that reduce days on market are accurate pricing based on current comparable sales and professional marketing that reaches qualified buyers. Corcoran Dwellings' national network and luxury brand positioning provide exposure to out-of-state relocation buyers who represent a significant segment of St. Petersburg's luxury market."
      }
    },
    {
      "@type": "Question",
      "name": "What is a Comparative Market Analysis (CMA) and how does it help me price my home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A CMA is a detailed analysis prepared by a licensed real estate agent comparing your home to recently sold, currently pending, and active similar properties in your area. It accounts for square footage, lot size, water access, upgrades, condition, and location within the neighborhood. A CMA from a St. Petersburg waterfront specialist will include dock and seawall condition, water depth, canal width, and view orientation as pricing factors — elements that generic automated valuation models like Zillow's Zestimate miss entirely. The analysis examines properties that closed within the last 3 to 6 months and adjusts for differences between those properties and yours to arrive at a market-supported price range."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to disclose flood zone status when selling in Florida?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Florida law under Section 689.261 of the Florida Statutes requires sellers to disclose if the property is located in a special flood hazard area and whether flood insurance has been required during the seller's ownership. Sellers must provide the buyer with the current flood zone designation and disclose any known flooding history, including past insurance claims. Non-disclosure can expose sellers to post-closing liability and potential legal action. A knowledgeable listing agent will prepare the proper flood zone and property condition disclosures upfront as part of the listing process, reducing the risk of disputes and ensuring a smoother transaction for both parties."
      }
    }
  ]
}
```

### Before Going Live
- Verify the target page URL (e.g., `/sellers/`, `/selling/`, or `/seller-resources/`)
- Ensure the page's visible content includes these same Q&A pairs — Google requires FAQ schema to match on-page content
- Review market timing data (days on market figures) for accuracy at deployment time

---

## Block 9: Reviews Page — AggregateRating

### Where to Place
https://www.lianejamason.com/reviews/

### What This Does
Displays star rating and review count in Google Search results for branded queries. This is one of the highest-impact schema types for click-through rate — a 5.0-star rating with 92 reviews is a strong trust signal.

```json
{
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness"],
  "@id": "https://www.lianejamason.com/#org",
  "name": "Liane Jamason - Corcoran Dwellings",
  "url": "https://www.lianejamason.com/",
  "telephone": "+1-727-755-3325",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1405 Dr. MLK Jr St N",
    "addressLocality": "St. Petersburg",
    "addressRegion": "FL",
    "postalCode": "33704",
    "addressCountry": "US"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": 92,
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

### Before Going Live
- Verify the reviews page URL is exactly `/reviews/`
- Update `reviewCount` to the current actual number of Google reviews at time of deployment (92 was accurate as of audit date)
- Ensure the reviews page displays actual reviews on-page — Google may penalize AggregateRating schema on pages that don't show review content
- Periodically update `reviewCount` as new reviews come in

---

## Implementation Checklist

| Priority | Block | Page | Effort | Impact | Status |
|----------|-------|------|--------|--------|--------|
| 1 - High | Block 9 | Reviews | Low | High — star ratings in SERPs | ☐ |
| 2 - High | Block 7 | Buyer FAQ | Medium | High — FAQ rich results for buyer queries | ☐ |
| 3 - High | Block 8 | Seller FAQ | Medium | High — FAQ rich results for seller queries | ☐ |
| 4 - High | Block 1 | Homepage | Medium | High — foundational entity schema | ☐ |
| 5 - High | Block 2 | Homepage | Low | High — Person entity for Knowledge Panel | ☐ |
| 6 - Medium | Block 3 | About | Medium | Medium — detailed E-E-A-T signals | ☐ |
| 7 - Medium | Block 4 | Contact | Low | Medium — NAP consistency, local pack | ☐ |
| 8 - Medium | Block 5 | Neighborhoods | Medium | Medium — breadcrumbs, topical authority | ☐ |
| 9 - Medium | Block 6 | Blog posts | Low | Medium — article rich results | ☐ |

---

## Validation Instructions

Test each block before deploying to production using Google's Rich Results Test.

| Block | Test URL | Expected Rich Result |
|-------|----------|---------------------|
| Block 1 | https://search.google.com/test/rich-results — paste homepage URL after deploying | Sitelinks Search Box, Local Business |
| Block 2 | https://search.google.com/test/rich-results — paste homepage URL | No specific rich result (entity signal) |
| Block 3 | https://search.google.com/test/rich-results — paste about page URL | No specific rich result (entity signal) |
| Block 4 | https://search.google.com/test/rich-results — paste contact page URL | Local Business |
| Block 5 | https://search.google.com/test/rich-results — paste neighborhood page URL | Breadcrumb |
| Block 6 | https://search.google.com/test/rich-results — paste blog post URL | Article, Breadcrumb |
| Block 7 | https://search.google.com/test/rich-results — paste buyer FAQ page URL | FAQ |
| Block 8 | https://search.google.com/test/rich-results — paste seller FAQ page URL | FAQ |
| Block 9 | https://search.google.com/test/rich-results — paste reviews page URL | Review Snippet |

**Additional validation steps:**
1. Paste each JSON-LD block into https://validator.schema.org/ to check for schema.org compliance
2. After deploying, use Google Search Console → Enhancements to monitor for errors
3. Check that Rank Math's built-in schema does not conflict — if Rank Math is already generating Organization or WebSite schema on the homepage, either disable Rank Math's auto-generated schema for those types or merge the data into Rank Math's schema editor rather than adding a separate `<script>` block
