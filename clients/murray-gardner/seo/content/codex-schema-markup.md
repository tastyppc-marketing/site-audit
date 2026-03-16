# Schema Markup: Gardner Group Realtors

**Client Information**
- Client: Murray Gardner
- Company: Gardner Group Realtors (Keller Williams Park City)
- Site: https://www.gardnergrouprealtors.com
- Date: 2026-03-12
- Author: Codex Worker / LLM-Router

## Table of Contents
1. [Block 1 - Homepage: Organization + RealEstateAgent + WebSite + SearchAction](#block-1--homepage-organization--realestateagent--website--searchaction)
2. [Block 2 - Homepage: Person (Murray Gardner)](#block-2--homepage-person-murray-gardner)
3. [Block 3 - About Page: Person + RealEstateAgent](#block-3--about-page-person--realestateagent)
4. [Block 4 - Contact Page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification](#block-4--contact-page-localbusiness--contactpoint--geocoordinates--openinghoursspecification)
5. [Block 5 - Community Template: Article + BreadcrumbList](#block-5--community-template-article--breadcrumblist)
6. [Block 6 - Blog Template: BlogPosting + BreadcrumbList + ImageObject](#block-6--blog-template-blogposting--breadcrumblist--imageobject)
7. [Block 7 - Buyer FAQ: FAQPage](#block-7--buyer-faq-faqpage)
8. [Block 8 - Seller FAQ: FAQPage](#block-8--seller-faq-faqpage)
9. [Block 9 - AggregateRating Template](#block-9--aggregaterating-template)
10. [Implementation Checklist](#implementation-checklist)
11. [Technical Notes](#technical-notes)
12. [Validation](#validation)

## Block 1 — Homepage: Organization + RealEstateAgent + WebSite + SearchAction
This homepage graph establishes the core entity relationships for Gardner Group Realtors and makes the site searchable via `SearchAction`. It should be deployed on the homepage (`/`) and treated as the canonical source for organization and agent IDs used across the site. This block intentionally avoids deprecated `contactPoint` on `Organization`.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.gardnergrouprealtors.com/#organization",
      "name": "Gardner Group Realtors",
      "legalName": "Gardner Group Realtors (Keller Williams Park City)",
      "url": "https://www.gardnergrouprealtors.com/",
      "logo": "https://www.gardnergrouprealtors.com/wp-content/uploads/gardner-group-realtors-logo.png",
      "telephone": "+14356405184",
      "email": "info@gardnergrouprealtors.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "sameAs": [
        "https://www.facebook.com/gardnergrouprealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-realestate",
        "https://www.zillow.com/profile/GardnerGroupRealtors",
        "https://www.realtor.com/realestateagents/murray-gardner",
        "https://www.kw.com/"
      ]
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.gardnergrouprealtors.com/#realestateagent",
      "name": "Gardner Group Realtors",
      "url": "https://www.gardnergrouprealtors.com/",
      "telephone": "+14356405184",
      "priceRange": "$$$",
      "memberOf": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": 40.6461,
          "longitude": -111.498
        },
        "geoRadius": 80467
      },
      "areaServed": [
        {
          "@type": "Place",
          "name": "Old Town Park City"
        },
        {
          "@type": "Place",
          "name": "Deer Valley"
        },
        {
          "@type": "Place",
          "name": "Empire Pass"
        },
        {
          "@type": "Place",
          "name": "Park Meadows"
        },
        {
          "@type": "Place",
          "name": "Canyons Village"
        },
        {
          "@type": "Place",
          "name": "Promontory"
        },
        {
          "@type": "Place",
          "name": "Silver Creek"
        },
        {
          "@type": "Place",
          "name": "Heber City"
        }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.gardnergrouprealtors.com/#website",
      "url": "https://www.gardnergrouprealtors.com/",
      "name": "Gardner Group Realtors",
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.gardnergrouprealtors.com/property-search/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

Implementation note: Add this as page-level JSON-LD on the homepage only. Keep these three `@id` values stable because all downstream page schemas reference them.

## Block 2 — Homepage: Person (Murray Gardner)
This person schema defines Murray Gardner as a distinct entity and ties his professional identity to the organization. It should be on the homepage and can coexist with Block 1 as a separate script tag or inside a shared `@graph`. The description and award fields capture his Top Gun and military background for authority signals.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner",
  "name": "Murray Gardner",
  "url": "https://www.gardnergrouprealtors.com/",
  "jobTitle": "Luxury Real Estate Agent",
  "description": "Murray Gardner is a Park City luxury real estate agent and former U.S. Navy F/A-18 Hornet pilot and Top Gun instructor. Reach him directly at (435) 640-5184.",
  "telephone": "+14356405184",
  "email": "info@gardnergrouprealtors.com",
  "memberOf": {
    "@id": "https://www.gardnergrouprealtors.com/#organization"
  },
  "alumniOf": {
    "@type": "Organization",
    "name": "United States Navy"
  },
  "award": "Former U.S. Navy Top Gun instructor certification and flight instructor distinction",
  "sameAs": [
    "https://www.gardnergrouprealtors.com/#person-murray-gardner",
    "https://www.linkedin.com/in/murray-gardner-realestate",
    "https://www.zillow.com/profile/GardnerGroupRealtors",
    "https://www.realtor.com/realestateagents/murray-gardner"
  ]
}
```

Implementation note: Use this exact `@id` as the canonical person URI across homepage, blog, FAQ, and community content.

## Block 3 — About Page: Person + RealEstateAgent
This about-page graph gives a fuller biography and expertise footprint for Murray Gardner while keeping machine-readable links to the organization. It belongs on `/about/` and includes a page-specific person ID plus a page-specific occupation agent node. The `knowsAbout` topics should remain aligned with core SEO targets for Park City luxury search intent.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.gardnergrouprealtors.com/about/#person",
      "name": "Murray Gardner",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/about/",
      "jobTitle": "Luxury Real Estate Agent",
      "description": "Former U.S. Navy F/A-18 Hornet pilot and Top Gun instructor, Murray Gardner now helps clients buy and sell luxury real estate across Park City and Deer Valley.",
      "telephone": "+14356405184",
      "email": "info@gardnergrouprealtors.com",
      "memberOf": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "sameAs": [
        "https://www.gardnergrouprealtors.com/#person-murray-gardner",
        "https://www.linkedin.com/in/murray-gardner-realestate",
        "https://www.zillow.com/profile/GardnerGroupRealtors",
        "https://www.realtor.com/realestateagents/murray-gardner"
      ],
      "knowsAbout": [
        "Park City luxury real estate",
        "ski-in ski-out properties",
        "Deer Valley real estate",
        "Empire Pass homes",
        "Park City Mountain properties",
        "investment real estate Park City"
      ],
      "hasOccupation": {
        "@id": "https://www.gardnergrouprealtors.com/about/#realestateagent"
      }
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.gardnergrouprealtors.com/about/#realestateagent",
      "name": "Murray Gardner",
      "jobTitle": "Luxury Real Estate Agent",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "memberOf": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": 40.6461,
          "longitude": -111.498
        },
        "geoRadius": 80467
      },
      "areaServed": [
        {
          "@type": "Place",
          "name": "Park City"
        },
        {
          "@type": "Place",
          "name": "Deer Valley"
        },
        {
          "@type": "Place",
          "name": "Empire Pass"
        },
        {
          "@type": "Place",
          "name": "Old Town Park City"
        }
      ]
    }
  ]
}
```

Implementation note: Keep both about-page IDs (`/about/#person` and `/about/#realestateagent`) and link back to homepage canonical IDs using `sameAs` and `memberOf`.

## Block 4 — Contact Page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification
This contact schema describes office-level business details for local intent and map relevance. It should be implemented on `/contact/` and includes structured hours, geo coordinates, and customer service contact data. The street address used below is noted as an approximate Keller Williams Park City office location.

```json
{
  "@context": "https://schema.org",
  "@type": [
    "LocalBusiness",
    "RealEstateAgent"
  ],
  "@id": "https://www.gardnergrouprealtors.com/contact/#localbusiness",
  "name": "Gardner Group Realtors (Keller Williams Park City)",
  "url": "https://www.gardnergrouprealtors.com/contact/",
  "description": "Park City real estate office for Gardner Group Realtors. The address below is an approximate Keller Williams Park City office location. Sunday consultations are available by appointment.",
  "telephone": "+14356405184",
  "email": "info@gardnergrouprealtors.com",
  "priceRange": "$$$",
  "currenciesAccepted": "USD",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1750 Sun Peak Drive, Suite 100",
    "addressLocality": "Park City",
    "addressRegion": "UT",
    "postalCode": "84060",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.6461,
    "longitude": -111.498
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+14356405184",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "17:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/gardnergrouprealtors",
    "https://www.instagram.com/gardnergrouprealtors",
    "https://www.linkedin.com/in/murray-gardner-realestate",
    "https://www.zillow.com/profile/GardnerGroupRealtors",
    "https://www.realtor.com/realestateagents/murray-gardner"
  ]
}
```

Implementation note: Keep Sunday "By appointment" in `description` and on-page copy rather than forcing a non-standard hours string.

## Block 5 — Community Template: Article + BreadcrumbList
Use this block on neighborhood/community landing pages to represent long-form local content and explicit breadcrumb hierarchy. Start with the template for all new community pages, then reuse the filled examples for Old Town and Empire Pass patterns. This supports missing `Article` and `BreadcrumbList` coverage from the audit.

### Community Template (Use for Any Neighborhood Page)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.gardnergrouprealtors.com/[community]/#article",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/[community]/",
      "headline": "[COMMUNITY_NAME] Real Estate Guide",
      "description": "[COMMUNITY_DESCRIPTION]",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.gardnergrouprealtors.com/[community]/#primaryimage",
        "url": "https://www.gardnergrouprealtors.com/wp-content/uploads/[community-image].jpg",
        "width": 1600,
        "height": 900
      },
      "articleSection": "Community Guide",
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/[community]/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.gardnergrouprealtors.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Areas",
          "item": "https://www.gardnergrouprealtors.com/areas/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[COMMUNITY_NAME]",
          "item": "https://www.gardnergrouprealtors.com/[community]/"
        }
      ]
    }
  ]
}
```

### Example A — Old Town Park City

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.gardnergrouprealtors.com/old-town-park-city/#article",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/old-town-park-city/",
      "headline": "Old Town Park City Real Estate Guide",
      "description": "Old Town Park City combines historic Victorian homes, walkable Main Street dining and shopping, and quick ski access from Town Lift to Park City Mountain.",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "datePublished": "2025-10-01",
      "dateModified": "2026-01-12",
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.gardnergrouprealtors.com/old-town-park-city/#primaryimage",
        "url": "https://www.gardnergrouprealtors.com/wp-content/uploads/old-town-park-city-main-street.jpg",
        "width": 1600,
        "height": 900
      },
      "articleSection": "Community Guide",
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/old-town-park-city/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.gardnergrouprealtors.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Areas",
          "item": "https://www.gardnergrouprealtors.com/areas/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Old Town Park City",
          "item": "https://www.gardnergrouprealtors.com/old-town-park-city/"
        }
      ]
    }
  ]
}
```

### Example B — Empire Pass

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.gardnergrouprealtors.com/empire-pass/#article",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/empire-pass/",
      "headline": "Empire Pass Real Estate Guide",
      "description": "Empire Pass is a premier Deer Valley ski-in/ski-out enclave centered around Montage Deer Valley, with luxury condos and estates commonly ranging from $3M to $8M+.",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "datePublished": "2025-10-08",
      "dateModified": "2026-01-15",
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.gardnergrouprealtors.com/empire-pass/#primaryimage",
        "url": "https://www.gardnergrouprealtors.com/wp-content/uploads/empire-pass-deer-valley.jpg",
        "width": 1600,
        "height": 900
      },
      "articleSection": "Community Guide",
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/empire-pass/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.gardnergrouprealtors.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Areas",
          "item": "https://www.gardnergrouprealtors.com/areas/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Empire Pass",
          "item": "https://www.gardnergrouprealtors.com/empire-pass/"
        }
      ]
    }
  ]
}
```

Implementation note: For each additional neighborhood, duplicate the template and only swap slug, title, description, dates, and image URL.

## Block 6 — Blog Template: BlogPosting + BreadcrumbList + ImageObject
Use this block for all blog URLs to provide article metadata, media assets, and breadcrumb context. The template below is reusable across all posts, followed by a fully populated example for the specified mountain-town comparison post. This closes the audit gap where blog pages currently have OG tags but no `BlogPosting` schema.

### Blog Template (Use for Any Blog Post)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.gardnergrouprealtors.com/blog/[slug]/#blogposting",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/blog/[slug]/",
      "headline": "[POST_TITLE]",
      "alternativeHeadline": "[ALT_HEADLINE]",
      "description": "[META_DESCRIPTION]",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "wordCount": "[WORD_COUNT]",
      "image": {
        "@id": "https://www.gardnergrouprealtors.com/blog/[slug]/#primaryimage"
      },
      "keywords": [
        "[KEYWORD_1]",
        "[KEYWORD_2]",
        "[KEYWORD_3]"
      ],
      "inLanguage": "en-US"
    },
    {
      "@type": "ImageObject",
      "@id": "https://www.gardnergrouprealtors.com/blog/[slug]/#primaryimage",
      "url": "https://www.gardnergrouprealtors.com/wp-content/uploads/[blog-image].jpg",
      "width": 1600,
      "height": 900
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/blog/[slug]/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.gardnergrouprealtors.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.gardnergrouprealtors.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[POST_TITLE]",
          "item": "https://www.gardnergrouprealtors.com/blog/[slug]/"
        }
      ]
    }
  ]
}
```

### Filled Example — Park City vs. Jackson Hole & Sun Valley

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#blogposting",
      "mainEntityOfPage": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/",
      "headline": "Park City vs. Jackson Hole & Sun Valley: What Mountain-Town Living Really Feels Like",
      "alternativeHeadline": "Comparing lifestyle, real estate, and ski access in Park City, Jackson Hole, and Sun Valley",
      "description": "A data-backed comparison of three premier mountain markets across housing, ski terrain, access, and year-round livability for luxury buyers.",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray-gardner"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#organization"
      },
      "datePublished": "2025-11-15",
      "dateModified": "2026-01-10",
      "wordCount": 3200,
      "image": {
        "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#primaryimage"
      },
      "keywords": [
        "Park City real estate",
        "Jackson Hole real estate comparison",
        "Sun Valley Idaho real estate",
        "luxury mountain real estate",
        "ski town homes"
      ],
      "inLanguage": "en-US"
    },
    {
      "@type": "ImageObject",
      "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#primaryimage",
      "url": "https://www.gardnergrouprealtors.com/wp-content/uploads/park-city-mountain-aerial.jpg",
      "width": 1600,
      "height": 900
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.gardnergrouprealtors.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.gardnergrouprealtors.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Park City vs. Jackson Hole & Sun Valley: What Mountain-Town Living Really Feels Like",
          "item": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/"
        }
      ]
    }
  ]
}
```

Implementation note: Use one `BlogPosting` graph per post URL and keep `dateModified` synced with substantive content updates.

## Block 7 — Buyer FAQ: FAQPage
This buyer FAQ schema should be added to `/buyers/` and uses Park City market data points that answer practical pre-purchase questions. It targets common intent around pricing, ski access, taxes, HOA costs, STR rules, and transaction timing. Keep these answers synchronized with visible on-page FAQ text.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.gardnergrouprealtors.com/buyers/#faqpage",
  "url": "https://www.gardnergrouprealtors.com/buyers/",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the median home price in Park City, Utah?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In 2025, Park City median home pricing is approximately $2.1M to $2.4M, depending on neighborhood mix and inventory. Luxury enclaves and ski-in/ski-out communities trend well above that range. Buyers comparing value often also look at Heber City, where median pricing is typically around $650K to $750K."
      }
    },
    {
      "@type": "Question",
      "name": "What neighborhoods are best for ski-in/ski-out access in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Top ski-in/ski-out options include Deer Valley communities such as Empire Pass, plus select Old Town and Canyons Village locations. Deer Valley offers about 2,026 skiable acres with 103 trails, and Park City Mountain offers about 7,300 acres. Across the Park City area, buyers can access 330+ runs depending on pass and base-area access."
      }
    },
    {
      "@type": "Question",
      "name": "Are there property tax benefits for primary residences in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Summit County effective property tax rates are commonly around 0.35% to 0.45%, which is generally lower than many luxury markets. Utah typically provides a primary-residence tax treatment for owner-occupied homes, while second homes and investment properties may be assessed differently. Buyers should confirm current classification and final tax impact with Summit County and a tax advisor before closing."
      }
    },
    {
      "@type": "Question",
      "name": "How does Park City's short-term rental market work for investment buyers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City enforces a strict short-term rental ordinance, and most zones require an active STR license before legally renting nightly. Old Town includes overlay areas where STR activity is more common, but zoning and permit requirements still apply. Investment buyers should verify HOA rental rules, city licensing status, and occupancy limits before underwriting rental income."
      }
    },
    {
      "@type": "Question",
      "name": "What should buyers know about HOA fees in Park City ski communities?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For Deer Valley ski-in/ski-out properties, HOA fees commonly range from about $1,500 to $4,000 per month depending on amenities and service levels. Fees may cover snow removal, exterior maintenance, concierge, shuttle, and reserve funding. Buyers should review the latest budget, reserve study, and special-assessment history before removing contingencies."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it typically take to close on a Park City home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cash transactions can often close in roughly 14 to 21 days if title and diligence are clean. Financed transactions are commonly in the 30 to 45 day range, with complex luxury deals sometimes extending longer for appraisal, HOA review, and inspection negotiations. Setting expectations early with lender, title, and counsel helps avoid timing delays."
      }
    }
  ]
}
```

Implementation note: Ensure each FAQ question and answer appears in visible page content to remain eligible for rich-result treatment.

## Block 8 — Seller FAQ: FAQPage
This seller FAQ schema should be deployed on `/sellers/` to answer high-intent listing questions for Park City owners. It uses current market ranges for days-on-market and luxury pricing, plus risk-focused disclosure and tax topics. Keep legal and tax language factual and conservative, with advisor referrals where appropriate.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.gardnergrouprealtors.com/sellers/#faqpage",
  "url": "https://www.gardnergrouprealtors.com/sellers/",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average days on market for luxury homes in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In the current luxury segment, average days on market is often about 90 to 150 days depending on pricing strategy, property type, and seasonality. Correctly priced turnkey homes tend to move faster than over-aspirational listings. Sellers should benchmark active and recently sold comps by micro-neighborhood rather than using county-wide averages alone."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to disclose ski easements or HOA litigation when selling in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sellers are generally expected to disclose known material facts that can affect value or buyer decision-making, including easements, access restrictions, and active HOA litigation. In resort markets, ski access rights and easement terms can materially affect use and valuation. Work with your agent and real estate attorney to prepare complete, current disclosures before listing."
      }
    },
    {
      "@type": "Question",
      "name": "When is the best time of year to list a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Timing depends on property profile: ski-focused inventory often gets strongest buyer attention during the winter season, while relocation and second-home buyers are very active in spring and summer. Sellers in Old Town and Deer Valley can benefit from listing windows that align with tourism and resort traffic. Pricing and launch strategy usually matter more than calendar timing alone."
      }
    },
    {
      "@type": "Question",
      "name": "How do I price a ski-in/ski-out property in Park City's luxury market?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with direct ski-access comps in the same submarket, then adjust for view corridor, floorplan utility, finish level, and amenity package. In Empire Pass, listings often range from about $3M to $8M+ depending on product type and exact location. Accurate pricing should also account for monthly carrying costs such as HOA fees that may run $1,500 to $4,000 in premier buildings."
      }
    },
    {
      "@type": "Question",
      "name": "What capital gains considerations apply to Park City home sellers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many owner-occupants may qualify for federal home-sale gain exclusions if they meet residency and use tests, while second homes and investment properties are often treated differently. Depreciation recapture and state tax treatment can significantly change net proceeds for rental or non-primary assets. Sellers should model proceeds with a CPA before listing to avoid surprises at closing."
      }
    }
  ]
}
```

Implementation note: Keep advisory language non-definitive for legal/tax items and direct users to qualified professionals for final determinations.

## Block 9 — AggregateRating Template
This reusable template supports review-rich pages and can be added where verified rating summaries are displayed. It references the canonical `#realestateagent` node so review signals reinforce the same entity across the domain. Use only when the page visibly shows matching rating and count data.

```json
{
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "@id": "https://www.gardnergrouprealtors.com/[page]/#aggregaterating",
  "itemReviewed": {
    "@id": "https://www.gardnergrouprealtors.com/#realestateagent"
  },
  "ratingValue": 5.0,
  "reviewCount": "[REVIEW_COUNT]",
  "bestRating": 5,
  "worstRating": 1
}
```

Implementation note: Pull `reviewCount` and displayed rating from a trusted source such as Google Business Profile and/or Zillow, then keep page content and JSON-LD synchronized.

## Implementation Checklist

| Priority | Block | Page | Action | Notes |
|---|---|---|---|---|
| P1 | Block 1 | Homepage (`/`) | Add `@graph` with Organization + RealEstateAgent + WebSite + SearchAction | Core entity architecture and internal `@id` references |
| P1 | Block 4 | Contact (`/contact/`) | Add LocalBusiness/RealEstateAgent schema with geo, hours, and ContactPoint | Uses approximate office address per brief |
| P1 | Block 7 | Buyers (`/buyers/`) | Add FAQPage with 6 buyer-focused Q&A entries | Must match visible FAQ copy |
| P1 | Block 8 | Sellers (`/sellers/`) | Add FAQPage with 5 seller-focused Q&A entries | Must match visible FAQ copy |
| P2 | Block 2 | Homepage (`/`) | Add Person schema for Murray Gardner | Canonical person entity for cross-page linking |
| P2 | Block 3 | About (`/about/`) | Add Person + RealEstateAgent graph for credentials/expertise | Include `knowsAbout` target topics |
| P2 | Block 5 | Community pages | Deploy Article + BreadcrumbList template to all key area pages | Start with Old Town and Empire Pass |
| P2 | Block 6 | Blog posts (`/blog/*`) | Deploy BlogPosting + ImageObject + BreadcrumbList template | Use example post as implementation reference |
| P3 | Block 9 | Reviews-enabled pages | Add AggregateRating where rating summaries are visible | Sync counts with Google Business Profile/Zillow |

## Technical Notes
- Sierra Interactive implementation: Sierra Interactive supports custom HTML/script injection via page-level header/footer fields in admin. Add each JSON-LD `<script type="application/ld+json">...</script>` in page-level custom code fields so schema matches page intent and URL.
- `@id` cross-referencing: Treat `https://www.gardnergrouprealtors.com/#organization`, `#realestateagent`, `#website`, and `#person-murray-gardner` as canonical IDs. Reference these from other blocks using `{"@id":"..."}` rather than duplicating disconnected entities.
- `sameAs` consistency: Use one consistent set of public profile URLs across all applicable schemas and avoid alternate/mixed profile variants. Keep protocol and hostname consistent (`https://www...`).
- Deprecated pattern reminders: Do not place `contactPoint` on `Organization` in this implementation; keep it on `LocalBusiness` (Block 4). Do not use legacy plain-text `openingHours` strings on `RealEstateAgent`; use `OpeningHoursSpecification` objects.

## Validation
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
