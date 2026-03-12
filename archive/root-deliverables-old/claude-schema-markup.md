# JSON-LD Schema Markup: livingparkcityutah.com
**Prepared by:** Claude (SEO Implementation)
**Date:** March 1, 2026
**Client:** Tisha Digman & Cam Schiedel — Summit Sotheby's International Realty
**Format:** JSON-LD (Google-recommended format, 2026 best practices)

**Implementation notes:**
- Paste each `<script>` block inside the `<head>` tag of the relevant page(s)
- Validate before publishing at: https://search.google.com/test/rich-results
- All schema data must match visible page content (Google policy)
- Use RealEstateAgent (most specific type) rather than generic LocalBusiness

---

## 1. HOMEPAGE SCHEMA
**Pages:** `/` (homepage only)
**Types:** Organization + RealEstateAgent (for the team) + Person (for each agent) + WebSite with SearchAction

```html
<!-- HOMEPAGE: Organization + Team RealEstateAgent schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.livingparkcityutah.com/#organization",
      "name": "Tisha and Cam — Summit Sotheby's International Realty",
      "url": "https://www.livingparkcityutah.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.livingparkcityutah.com/images/logo.png"
      },
      "sameAs": [
        "https://www.facebook.com/tishaandcam",
        "https://www.instagram.com/tishaandcam",
        "https://www.linkedin.com/in/tishadigman",
        "https://www.youtube.com/@tishaandcam",
        "https://www.zillow.com/profile/TishaDigman"
      ],
      "parentOrganization": {
        "@type": "Organization",
        "name": "Summit Sotheby's International Realty",
        "url": "https://www.summitsothebysrealty.com"
      }
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.livingparkcityutah.com/#real-estate-agent",
      "name": "Tisha and Cam",
      "alternateName": "Tisha Digman and Cam Schiedel",
      "url": "https://www.livingparkcityutah.com",
      "telephone": "+18018982447",
      "email": "tishaandcam@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1750 Park Ave, Suite B",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Park City",
          "sameAs": "https://en.wikipedia.org/wiki/Park_City,_Utah"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Summit County, Utah"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Wasatch County, Utah"
        }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Real Estate Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Luxury Home Sales",
              "description": "Buyer and seller representation for luxury homes in Park City, Deer Valley, and Summit County."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Free Market Analysis",
              "description": "Complimentary comparative market analysis for Park City area homeowners."
            }
          }
        ]
      },
      "priceRange": "$$$",
      "image": "https://www.livingparkcityutah.com/images/tisha-cam-team.jpg",
      "sameAs": [
        "https://www.facebook.com/tishaandcam",
        "https://www.instagram.com/tishaandcam",
        "https://www.zillow.com/profile/TishaDigman"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.livingparkcityutah.com/#website",
      "url": "https://www.livingparkcityutah.com",
      "name": "Living Park City Utah — Tisha and Cam",
      "description": "Park City, Utah real estate with Tisha Digman and Cam Schiedel at Summit Sotheby's International Realty.",
      "publisher": {
        "@id": "https://www.livingparkcityutah.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.livingparkcityutah.com/property-search/results/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

---

## 2. ABOUT PAGE SCHEMA
**Pages:** `/about/`
**Types:** Person (for both agents) + RealEstateAgent

```html
<!-- ABOUT PAGE: Person schema for Tisha Digman and Cam Schiedel -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.livingparkcityutah.com/#tisha-digman",
      "name": "Tisha Digman",
      "jobTitle": "Licensed Real Estate Agent",
      "worksFor": {
        "@type": "Organization",
        "name": "Summit Sotheby's International Realty",
        "url": "https://www.summitsothebysrealty.com"
      },
      "url": "https://www.livingparkcityutah.com/about/",
      "telephone": "+18018982447",
      "email": "tishaandcam@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1750 Park Ave, Suite B",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "knowsAbout": [
        "Park City Real Estate",
        "Deer Valley Luxury Homes",
        "Summit County Real Estate",
        "Wasatch County Properties",
        "Ski-In Ski-Out Properties",
        "Luxury Home Sales"
      ],
      "areaServed": "Park City, Summit County, and Wasatch County, Utah",
      "image": "https://www.livingparkcityutah.com/images/tisha-digman.jpg",
      "sameAs": [
        "https://www.zillow.com/profile/TishaDigman",
        "https://www.linkedin.com/in/tishadigman"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://www.livingparkcityutah.com/#cam-schiedel",
      "name": "Cam Schiedel",
      "jobTitle": "Licensed Real Estate Agent",
      "worksFor": {
        "@type": "Organization",
        "name": "Summit Sotheby's International Realty",
        "url": "https://www.summitsothebysrealty.com"
      },
      "url": "https://www.livingparkcityutah.com/about/",
      "telephone": "+18018982447",
      "email": "tishaandcam@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1750 Park Ave, Suite B",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "knowsAbout": [
        "Park City Real Estate",
        "Summit County Real Estate",
        "Mountain Property Sales",
        "Investment Property",
        "Luxury Home Marketing"
      ],
      "areaServed": "Park City, Summit County, and Wasatch County, Utah",
      "image": "https://www.livingparkcityutah.com/images/cam-schiedel.jpg"
    },
    {
      "@type": "RealEstateAgent",
      "name": "Tisha and Cam",
      "url": "https://www.livingparkcityutah.com/about/",
      "telephone": "+18018982447",
      "member": [
        { "@id": "https://www.livingparkcityutah.com/#tisha-digman" },
        { "@id": "https://www.livingparkcityutah.com/#cam-schiedel" }
      ]
    }
  ]
}
</script>
```

---

## 3. CONTACT PAGE SCHEMA
**Pages:** `/contact/`
**Types:** RealEstateAgent with ContactPoint

```html
<!-- CONTACT PAGE: RealEstateAgent with full contact details -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.livingparkcityutah.com/#real-estate-agent",
  "name": "Tisha and Cam — Summit Sotheby's International Realty",
  "url": "https://www.livingparkcityutah.com/contact/",
  "telephone": "+18018982447",
  "email": "tishaandcam@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1750 Park Ave, Suite B",
    "addressLocality": "Park City",
    "addressRegion": "UT",
    "postalCode": "84060",
    "addressCountry": "US"
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
      "dayOfWeek": ["Saturday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+18018982447",
    "contactType": "customer service",
    "areaServed": "UT",
    "availableLanguage": ["English"]
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.6461,
    "longitude": -111.4980
  },
  "hasMap": "https://maps.google.com/?q=1750+Park+Ave,+Park+City,+UT+84060",
  "priceRange": "$$$"
}
</script>
```

---

## 4. COMMUNITY PAGE SCHEMA (Reusable Template)
**Pages:** All 28 community pages (e.g., `/old-town/`, `/promontory/`, `/deer-crest/`, etc.)
**Types:** Article (neighborhood guide) + BreadcrumbList
**Instructions:** Replace `[COMMUNITY_NAME]`, `[COMMUNITY_URL_SLUG]`, and `[COMMUNITY_DESCRIPTION]` for each page.

```html
<!-- COMMUNITY PAGE TEMPLATE: Replace bracketed values for each page -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "[COMMUNITY_NAME] Homes & Real Estate — Park City, Utah",
      "description": "[COMMUNITY_DESCRIPTION]",
      "url": "https://www.livingparkcityutah.com/[COMMUNITY_URL_SLUG]/",
      "image": "https://www.livingparkcityutah.com/images/[COMMUNITY_URL_SLUG]-hero.jpg",
      "author": {
        "@type": "Person",
        "name": "Tisha Digman",
        "@id": "https://www.livingparkcityutah.com/#tisha-digman"
      },
      "publisher": {
        "@id": "https://www.livingparkcityutah.com/#organization"
      },
      "datePublished": "2024-01-01",
      "dateModified": "2026-03-01",
      "about": {
        "@type": "Place",
        "name": "[COMMUNITY_NAME]",
        "description": "[COMMUNITY_DESCRIPTION]",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Park City",
          "addressRegion": "UT",
          "addressCountry": "US"
        },
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Summit County, Utah"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.livingparkcityutah.com/[COMMUNITY_URL_SLUG]/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.livingparkcityutah.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Communities",
          "item": "https://www.livingparkcityutah.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[COMMUNITY_NAME]",
          "item": "https://www.livingparkcityutah.com/[COMMUNITY_URL_SLUG]/"
        }
      ]
    }
  ]
}
</script>
```

### Community Page Template — Filled Examples

**Example A: Old Town**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Old Town Park City Homes & Real Estate Guide",
      "description": "Old Town is the historic heart of Park City, Utah — walkable to Main Street dining, ski lifts, and world-class events like Sundance Film Festival.",
      "url": "https://www.livingparkcityutah.com/old-town/",
      "image": "https://www.livingparkcityutah.com/images/old-town-hero.jpg",
      "author": {
        "@type": "Person",
        "name": "Tisha Digman",
        "@id": "https://www.livingparkcityutah.com/#tisha-digman"
      },
      "publisher": { "@id": "https://www.livingparkcityutah.com/#organization" },
      "datePublished": "2024-01-01",
      "dateModified": "2026-03-01",
      "about": {
        "@type": "Place",
        "name": "Old Town Park City",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Park City",
          "addressRegion": "UT",
          "postalCode": "84060",
          "addressCountry": "US"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.livingparkcityutah.com/old-town/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.livingparkcityutah.com/" },
        { "@type": "ListItem", "position": 2, "name": "Communities", "item": "https://www.livingparkcityutah.com/communities/" },
        { "@type": "ListItem", "position": 3, "name": "Old Town", "item": "https://www.livingparkcityutah.com/old-town/" }
      ]
    }
  ]
}
</script>
```

**Example B: Promontory**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Promontory Club Homes for Sale — Park City, Utah",
      "description": "Promontory is Park City's largest private gated community, featuring two Jack Nicklaus golf courses, luxury mountain estates, and a world-class clubhouse.",
      "url": "https://www.livingparkcityutah.com/promontory/",
      "image": "https://www.livingparkcityutah.com/images/promontory-hero.jpg",
      "author": {
        "@type": "Person",
        "name": "Tisha Digman",
        "@id": "https://www.livingparkcityutah.com/#tisha-digman"
      },
      "publisher": { "@id": "https://www.livingparkcityutah.com/#organization" },
      "datePublished": "2024-01-01",
      "dateModified": "2026-03-01",
      "about": {
        "@type": "Place",
        "name": "Promontory",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Park City",
          "addressRegion": "UT",
          "postalCode": "84098",
          "addressCountry": "US"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.livingparkcityutah.com/promontory/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.livingparkcityutah.com/" },
        { "@type": "ListItem", "position": 2, "name": "Communities", "item": "https://www.livingparkcityutah.com/communities/" },
        { "@type": "ListItem", "position": 3, "name": "Promontory", "item": "https://www.livingparkcityutah.com/promontory/" }
      ]
    }
  ]
}
</script>
```

---

## 5. BLOG POST SCHEMA (Reusable Template)
**Pages:** All blog posts under `/blog/`
**Types:** BlogPosting + Person (author) + BreadcrumbList
**Instructions:** Replace bracketed values for each post.

```html
<!-- BLOG POST TEMPLATE: Replace bracketed values -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "[POST_TITLE]",
      "description": "[POST_META_DESCRIPTION]",
      "url": "https://www.livingparkcityutah.com/blog/[POST_SLUG]/",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.livingparkcityutah.com/images/blog/[POST_SLUG]-hero.jpg",
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Person",
        "name": "Tisha Digman",
        "@id": "https://www.livingparkcityutah.com/#tisha-digman"
      },
      "publisher": {
        "@id": "https://www.livingparkcityutah.com/#organization"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.livingparkcityutah.com/blog/[POST_SLUG]/"
      },
      "keywords": "[COMMA_SEPARATED_KEYWORDS]",
      "articleSection": "[Buying a Home | Selling Your Home | Park City Market | Neighborhood Guide]",
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.livingparkcityutah.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.livingparkcityutah.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[POST_TITLE]",
          "item": "https://www.livingparkcityutah.com/blog/[POST_SLUG]/"
        }
      ]
    }
  ]
}
</script>
```

### Filled Example: Spring 2026 Market Update Post

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "Park City Real Estate Market Update — Spring 2026",
      "description": "Where is the Park City real estate market heading in Spring 2026? Tisha & Cam break down inventory, pricing, and what buyers and sellers need to know.",
      "url": "https://www.livingparkcityutah.com/blog/park-city-real-estate-market-update-spring-2026/",
      "datePublished": "2026-03-01",
      "dateModified": "2026-03-01",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.livingparkcityutah.com/images/blog/park-city-market-2026-hero.jpg",
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Person",
        "name": "Tisha Digman",
        "@id": "https://www.livingparkcityutah.com/#tisha-digman"
      },
      "publisher": { "@id": "https://www.livingparkcityutah.com/#organization" },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.livingparkcityutah.com/blog/park-city-real-estate-market-update-spring-2026/"
      },
      "keywords": "park city real estate market, park city homes for sale 2026, park city market update, summit county real estate",
      "articleSection": "Park City Market",
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.livingparkcityutah.com/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.livingparkcityutah.com/blog/" },
        { "@type": "ListItem", "position": 3, "name": "Park City Real Estate Market Update — Spring 2026", "item": "https://www.livingparkcityutah.com/blog/park-city-real-estate-market-update-spring-2026/" }
      ]
    }
  ]
}
</script>
```

---

## 6. BUYER RESOURCE PAGES — FAQPage Schema
**Pages:** `/buyers/`, `/buyers/first-time-buyers/`, `/buyers/making-an-offer/`, `/buyers/what-are-closing-costs/`, `/buyers/park-city-ski-in-ski-out-homes/`
**Note:** As of 2023, FAQPage schema no longer generates rich results for most sites. However, it is still recommended: AI systems (Google AI Overviews, ChatGPT, Perplexity) use FAQ schema to understand and cite Q&A content. Include this alongside your regular page content.

### Buyers Landing Page FAQPage

```html
<!-- BUYERS PAGE: FAQPage schema for AI comprehension -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average home price in Park City, Utah?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The median home price in Park City, Utah is approximately $1.8 million as of early 2026. Prices vary significantly by neighborhood — from condos in Prospector starting under $500,000 to estates in Empire Pass and Deer Crest exceeding $10 million."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a local real estate agent to buy in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While not legally required, working with a local Park City real estate agent is strongly recommended. Local agents understand off-market opportunities, HOA structures, ski resort proximity values, altitude considerations, and negotiation norms specific to Summit County that out-of-area or online agents may miss."
      }
    },
    {
      "@type": "Question",
      "name": "What are closing costs when buying a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Closing costs for buyers in Park City, Utah typically range from 2% to 5% of the purchase price. Costs include lender fees, title insurance, escrow fees, recording fees, and property tax prorations. On a $1.5M home, expect to budget approximately $30,000–$75,000 in closing costs."
      }
    },
    {
      "@type": "Question",
      "name": "Is Park City real estate a good investment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City has consistently shown strong long-term appreciation due to limited land inventory, growing resort amenities (including the Deer Valley East Village expansion), and sustained demand from domestic and international luxury buyers. Many Park City properties also generate significant short-term rental income during ski season."
      }
    },
    {
      "@type": "Question",
      "name": "Can I find ski-in ski-out homes in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Park City and Deer Valley offer true ski-in ski-out properties in several communities including Empire Pass, Deer Crest, Canyons Village, The Colony at White Pine Canyon, and Upper Deer Valley Resort. These properties command premium prices, typically starting at $2 million and ranging well above $20 million for estate-level homes."
      }
    }
  ]
}
</script>
```

### Ski-In Ski-Out Page FAQPage

```html
<!-- SKI-IN SKI-OUT PAGE: FAQPage schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What neighborhoods offer ski-in ski-out homes near Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "True ski-in ski-out communities in the Park City area include Empire Pass and Deer Crest (Deer Valley Resort access), Canyons Village and The Colony at White Pine Canyon (Park City Mountain Resort access), and portions of Upper Deer Valley Resort. Each community offers different price ranges, HOA structures, and ski terrain access."
      }
    },
    {
      "@type": "Question",
      "name": "How much do ski-in ski-out homes cost in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ski-in ski-out homes in Park City and Deer Valley range from approximately $1.5 million for smaller condos to over $25 million for estate properties at Empire Pass or Deer Crest. The premium for true ski-in ski-out access is typically 15–30% above comparable non-ski-access homes in the same area."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between ski-in ski-out and ski access in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "True ski-in ski-out means you can ski from your door directly to the mountain and ski back to your home at the end of the day without removing your skis. Ski access (or ski adjacent) properties are within walking distance of a ski run or have a short shuttle connection. Buyers should verify the exact ski access type before purchasing."
      }
    }
  ]
}
</script>
```

---

## 7. SELLER RESOURCE PAGES — FAQPage Schema
**Pages:** `/sellers/`, `/sellers/free-market-analysis/`, `/sellers/pricing-your-home/`

```html
<!-- SELLERS PAGE: FAQPage schema for AI comprehension -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does it cost to sell a house in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Selling costs in Park City typically total 6–8% of the sale price. This includes real estate agent commissions (typically 5–6%), title insurance, escrow fees, and any agreed-upon seller concessions or buyer closing cost assistance. On a $2 million home, plan for approximately $120,000–$160,000 in selling costs."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best time to sell a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City's real estate market has two peak selling seasons: winter (January–March) when ski season draws affluent visitors who often convert to buyers, and late spring/summer (May–August) when the mountain lifestyle appeals to a broad buyer pool. Properties in ski-in ski-out communities often sell fastest during ski season, while golf course communities peak in summer."
      }
    },
    {
      "@type": "Question",
      "name": "What is my Park City home worth?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City home values depend on location, ski resort proximity, views, property size, HOA amenities, and condition. Tisha and Cam at Summit Sotheby's International Realty provide free comparative market analyses for Park City area homeowners. Contact us for a no-obligation assessment of your property's current market value."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Days on market in Park City vary by property type and price range. Well-priced luxury homes in desirable communities like Old Town, Deer Valley, and Promontory often sell within 30–60 days. Higher-priced estate properties ($5M+) may take 90–180 days. Tisha and Cam achieve 97% of asking price for their listings through strategic pricing and Summit Sotheby's global marketing."
      }
    }
  ]
}
</script>
```

---

## 8. AGGREGATE RATING SCHEMA (Homepage — Google Reviews Section)
**Pages:** `/` (homepage only)
**Note:** This must reflect real, accurate review data. Update the `ratingValue` and `reviewCount` to match your current Google review stats. Do not inflate or fabricate numbers.

```html
<!-- HOMEPAGE: AggregateRating schema for Google Reviews section -->
<!-- IMPORTANT: Update ratingValue and reviewCount to match actual Google review data before publishing -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.livingparkcityutah.com/#real-estate-agent",
  "name": "Tisha and Cam — Summit Sotheby's International Realty",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Client Review"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "Tisha and Cam made our Park City home purchase seamless from start to finish. Their knowledge of the Deer Valley market is unmatched.",
      "datePublished": "2025-11-15"
    }
  ]
}
</script>
```

---

## IMPLEMENTATION CHECKLIST

| Page | Schema Type(s) | Status |
|------|---------------|--------|
| Homepage `/` | Organization + RealEstateAgent + WebSite + AggregateRating | Ready to deploy |
| About `/about/` | Person (x2) + RealEstateAgent | Ready to deploy |
| Contact `/contact/` | RealEstateAgent + ContactPoint | Ready to deploy |
| All 28 community pages | Article + BreadcrumbList | Template ready — fill per page |
| All blog posts | BlogPosting + BreadcrumbList | Template ready — fill per post |
| `/buyers/` | FAQPage | Ready to deploy |
| `/buyers/park-city-ski-in-ski-out-homes/` | FAQPage | Ready to deploy |
| `/sellers/` | FAQPage | Ready to deploy |

**Validation tool:** https://search.google.com/test/rich-results

**Priority order:**
1. Homepage (highest traffic, most impact)
2. About page (E-E-A-T signals)
3. Contact page (local pack / Google Business Profile alignment)
4. Top 5 community pages (Deer Valley, Old Town, Promontory, Park Meadows, Empire Pass)
5. Buyer/seller FAQPage schemas
6. Blog post schemas as new posts are published
