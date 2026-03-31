# Schema Markup — sellingcalgarycastles.com

**Client:** Neil Rowlandson, Calgary Castles Team, CIR Realty
**Prepared:** March 23, 2026
**Format:** Production-ready JSON-LD — copy directly into `<head>` section

---

## 1. Homepage Schema

Place in `<head>` of `/` (homepage). Combines RealEstateAgent, Organization, WebSite with SearchAction.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.sellingcalgarycastles.com/#agent",
      "name": "Neil Rowlandson - Calgary Castles Team",
      "alternateName": "Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com",
      "logo": "https://www.sellingcalgarycastles.com/logo.png",
      "image": "https://www.sellingcalgarycastles.com/neil-rowlandson.jpg",
      "description": "Neil Rowlandson is a Calgary REALTOR with 20+ years of real estate experience and 10 years in banking. Serving Calgary, AB and surrounding communities with CIR Realty.",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#130, 703 - 64th Avenue SE",
        "addressLocality": "Calgary",
        "addressRegion": "AB",
        "postalCode": "T2H 2C3",
        "addressCountry": "CA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 51.0447,
        "longitude": -114.0719
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Calgary",
          "sameAs": "https://en.wikipedia.org/wiki/Calgary"
        },
        {
          "@type": "City",
          "name": "Cochrane",
          "sameAs": "https://en.wikipedia.org/wiki/Cochrane,_Alberta"
        },
        {
          "@type": "City",
          "name": "Chestermere",
          "sameAs": "https://en.wikipedia.org/wiki/Chestermere"
        }
      ],
      "priceRange": "$$$",
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
          "opens": "10:00",
          "closes": "16:00"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgarycastles"
      ],
      "memberOf": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://www.sellingcalgarycastles.com/#organization",
      "name": "Calgary Castles Team - CIR Realty",
      "url": "https://www.sellingcalgarycastles.com",
      "logo": "https://www.sellingcalgarycastles.com/logo.png",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#130, 703 - 64th Avenue SE",
        "addressLocality": "Calgary",
        "addressRegion": "AB",
        "postalCode": "T2H 2C3",
        "addressCountry": "CA"
      },
      "parentOrganization": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.sellingcalgarycastles.com/#website",
      "name": "Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com",
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.sellingcalgarycastles.com/property-search/site-map/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

---

## 2. About Page Schema

Place in `<head>` of `/about/`. Person schema for Neil Rowlandson.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.sellingcalgarycastles.com/about/#person",
      "name": "Neil Rowlandson",
      "jobTitle": "REALTOR",
      "description": "Neil Rowlandson is a Calgary REALTOR with over 20 years of real estate experience and 10 years in the banking industry. Born and raised in the Lakeview community of Calgary, Neil brings deep local knowledge and financial expertise to every transaction.",
      "url": "https://www.sellingcalgarycastles.com/about/",
      "image": "https://www.sellingcalgarycastles.com/neil-rowlandson.jpg",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "birthPlace": {
        "@type": "Place",
        "name": "Lakeview, Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        }
      },
      "homeLocation": {
        "@type": "Place",
        "name": "Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        }
      },
      "knowsAbout": [
        "Calgary Real Estate",
        "Residential Real Estate",
        "Mortgage Financing",
        "Investment Properties",
        "First-Time Home Buying",
        "Calgary Neighborhoods",
        "Property Valuation"
      ],
      "worksFor": {
        "@type": "Organization",
        "name": "Calgary Castles Team - CIR Realty",
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "memberOf": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      },
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgarycastles"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.sellingcalgarycastles.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "About Neil Rowlandson",
          "item": "https://www.sellingcalgarycastles.com/about/"
        }
      ]
    }
  ]
}
</script>
```

---

## 3. Contact Page Schema

Place in `<head>` of `/contact/`. LocalBusiness with ContactPoint and GeoCoordinates.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://www.sellingcalgarycastles.com/contact/#localbusiness",
      "name": "Calgary Castles Team - CIR Realty",
      "description": "Full-service real estate team serving Calgary, AB and surrounding communities. Led by Neil Rowlandson with 20+ years of real estate experience.",
      "url": "https://www.sellingcalgarycastles.com",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "image": "https://www.sellingcalgarycastles.com/logo.png",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#130, 703 - 64th Avenue SE",
        "addressLocality": "Calgary",
        "addressRegion": "AB",
        "postalCode": "T2H 2C3",
        "addressCountry": "CA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 51.0447,
        "longitude": -114.0719
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+1-403-271-0600",
          "contactType": "sales",
          "areaServed": "CA",
          "availableLanguage": "English",
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "18:00"
          }
        },
        {
          "@type": "ContactPoint",
          "email": "calgarycastles@live.com",
          "contactType": "customer service",
          "areaServed": "CA",
          "availableLanguage": "English"
        }
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
          "dayOfWeek": ["Saturday"],
          "opens": "10:00",
          "closes": "16:00"
        }
      ],
      "priceRange": "$$$",
      "hasMap": "https://www.google.com/maps?q=51.0447,-114.0719",
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgarycastles"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.sellingcalgarycastles.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Contact",
          "item": "https://www.sellingcalgarycastles.com/contact/"
        }
      ]
    }
  ]
}
</script>
```

---

## 4. Community Page Template

Place in `<head>` of community pages (`/auburn-bay/`, `/bridlewood/`, `/chaparral/`, etc.). Replace `{{COMMUNITY}}` and `{{URL_SLUG}}` with the actual community name and path.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/#article",
      "headline": "{{COMMUNITY}} Homes for Sale, Calgary | Neil Rowlandson",
      "description": "Explore homes for sale in {{COMMUNITY}}, Calgary, AB. Community guide with listings, schools, parks, and local amenities from Neil Rowlandson, CIR Realty.",
      "author": {
        "@type": "Person",
        "name": "Neil Rowlandson",
        "@id": "https://www.sellingcalgarycastles.com/about/#person"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Calgary Castles Team - CIR Realty",
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "mainEntityOfPage": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/",
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-23",
      "image": "https://www.sellingcalgarycastles.com/images/{{URL_SLUG}}-hero.jpg",
      "about": {
        "@type": "Place",
        "name": "{{COMMUNITY}}, Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.sellingcalgarycastles.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Communities",
          "item": "https://www.sellingcalgarycastles.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "{{COMMUNITY}}",
          "item": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/"
        }
      ]
    }
  ]
}
</script>
```

**Variable substitution guide:**

| Community | `{{COMMUNITY}}` | `{{URL_SLUG}}` |
|-----------|----------------|----------------|
| Auburn Bay | Auburn Bay | auburn-bay |
| Bridlewood | Bridlewood | bridlewood |
| Chaparral | Chaparral | chaparral |
| Cranston | Cranston | cranston |
| Evergreen | Evergreen | evergreen |
| Legacy | Legacy | legacy |
| Mahogany | Mahogany | mahogany |
| McKenzie Towne | McKenzie Towne | mckenzie-towne |
| New Brighton | New Brighton | new-brighton |
| Walden | Walden | walden |

---

## 5. Blog Post Template

Place in `<head>` of blog posts (`/blog/*`). Replace `{{VARIABLES}}` with actual values.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/#blogpost",
      "headline": "{{TITLE}}",
      "description": "{{META_DESCRIPTION}}",
      "author": {
        "@type": "Person",
        "name": "Neil Rowlandson",
        "@id": "https://www.sellingcalgarycastles.com/about/#person"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Calgary Castles Team - CIR Realty",
        "@id": "https://www.sellingcalgarycastles.com/#organization",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.sellingcalgarycastles.com/logo.png"
        }
      },
      "mainEntityOfPage": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/",
      "datePublished": "{{PUBLISH_DATE}}",
      "dateModified": "{{MODIFIED_DATE}}",
      "image": "https://www.sellingcalgarycastles.com/images/blog/{{SLUG}}-hero.jpg",
      "wordCount": "{{WORD_COUNT}}",
      "articleSection": "Calgary Real Estate",
      "inLanguage": "en-CA"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.sellingcalgarycastles.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.sellingcalgarycastles.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "{{TITLE}}",
          "item": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/"
        }
      ]
    }
  ]
}
</script>
```

**Variable substitution for existing blog posts:**

| Post | `{{SLUG}}` | `{{TITLE}}` |
|------|-----------|-------------|
| Mortgage Rates | will-increasing-mortgage-rates-impact-home-prices | Do Mortgage Rates Affect Calgary Home Prices? |
| Buying Checklist | common-things-to-look-out-for-before-buying-your-dream-home | What to Check Before Buying a Calgary Home |
| Winter Selling | why-you-should-consider-selling-in-the-winter | Why Sell Your Calgary Home in Winter |
| Mortgage Difficulty | is-getting-a-home-mortgage-still-too-difficult | Is Getting a Mortgage in Calgary Still Difficult? |

---

## 6. FAQ Page Template

Use on buyer guides, seller guides, or any page with Q&A content. The following example includes 5 Calgary real estate FAQs ready for deployment.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average home price in Calgary in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average home price in Calgary is approximately $641,000 as of early 2026, with a median price of $572,500. Prices vary significantly by neighborhood — SE Calgary communities like Auburn Bay and Mahogany tend to offer family homes in the $500K–$700K range, while inner-city and luxury areas like Mount Royal and Elbow Park can exceed $1.5 million. Contact Neil Rowlandson at 403-271-0600 for current pricing in your target area."
      }
    },
    {
      "@type": "Question",
      "name": "Is Calgary a good place to buy real estate in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary remains one of Canada's most attractive real estate markets in 2026. With no provincial sales tax, relatively affordable prices compared to Toronto and Vancouver, strong job growth in energy and tech sectors, and consistent population growth, Calgary offers excellent value for buyers. The market has seen approximately 2% year-over-year price appreciation with over 5,500 active listings providing good selection."
      }
    },
    {
      "@type": "Question",
      "name": "How much do I need for a down payment on a Calgary home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Canada, the minimum down payment is 5% for homes priced up to $500,000 and 10% for the portion between $500,000 and $1,499,999. For a home at Calgary's median price of $572,500, you would need a minimum of approximately $32,250. However, putting down 20% or more ($114,500) avoids CMHC mortgage insurance premiums, which can save thousands over the life of the mortgage. Neil Rowlandson's banking background can help you plan the right financing strategy."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best neighborhoods to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary's best neighborhoods depend on your priorities. For families: Auburn Bay, Cranston, and McKenzie Towne in the SE offer excellent schools and amenities. For lake living: Mahogany and Chestermere provide waterfront lifestyles. For established inner-city charm: Lakeview, Altadore, and Marda Loop. For value and growth: Legacy, Walden, and Cochrane (just NW of Calgary). Neil Rowlandson grew up in Lakeview and has 20+ years of local expertise to help you find the right fit."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Average days on market in Calgary varies by property type and price point, but well-priced homes in desirable areas typically sell within 30–45 days. Properties priced competitively in high-demand SE Calgary communities can sell in under 2 weeks. Factors include pricing strategy, home condition, staging, and marketing — all areas where Neil Rowlandson's 20+ years of experience makes a measurable difference. Call 403-271-0600 for a free market analysis."
      }
    }
  ]
}
</script>
```

**Deployment locations for FAQ schema:**
- `/buyers/` — Add FAQs about buying process, down payments, pre-approval
- `/sellers/` — Add FAQs about selling timeline, pricing, agent commissions
- `/buyers/first-time-buyers/` — Add FAQs about first-time buyer programs, CMHC insurance
- `/communities/` — Add FAQs about best neighborhoods (use the example above)
- New community pages (Lakeview, Cochrane, Chestermere, Signal Hill) — Add 4 community-specific FAQs each

---

## Site-Wide BreadcrumbList Template

Add to every page that doesn't already have BreadcrumbList schema. Adjust the hierarchy per page type.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.sellingcalgarycastles.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{PARENT_PAGE_NAME}}",
      "item": "https://www.sellingcalgarycastles.com/{{PARENT_SLUG}}/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{CURRENT_PAGE_NAME}}",
      "item": "https://www.sellingcalgarycastles.com/{{CURRENT_SLUG}}/"
    }
  ]
}
</script>
```

**Breadcrumb hierarchy map:**

| Page | Breadcrumb Path |
|------|----------------|
| `/buyers/first-time-buyers/` | Home > Buyers > First Time Buyers |
| `/buyers/making-an-offer/` | Home > Buyers > Making an Offer |
| `/buyers/mortgage-calculator/` | Home > Buyers > Mortgage Calculator |
| `/buyers/mortgage-pre-approval/` | Home > Buyers > Mortgage Pre-Approval |
| `/buyers/financial-terms-glossary/` | Home > Buyers > Financial Glossary |
| `/buyers/personalized-home-search/` | Home > Buyers > Home Search |
| `/buyers/what-are-closing-costs/` | Home > Buyers > Closing Costs |
| `/sellers/adding-value/` | Home > Sellers > Adding Value |
| `/sellers/free-market-analysis/` | Home > Sellers > Market Analysis |
| `/sellers/marketing-your-home/` | Home > Sellers > Marketing |
| `/sellers/pricing-your-home/` | Home > Sellers > Pricing |
| `/sellers/showing-your-home/` | Home > Sellers > Showing |

---

## Implementation Checklist

1. **Homepage** — Deploy RealEstateAgent + Organization + WebSite + SearchAction (Section 1)
2. **About page** — Deploy Person + BreadcrumbList (Section 2)
3. **Contact page** — Deploy LocalBusiness + ContactPoint + BreadcrumbList (Section 3)
4. **10 community pages** — Deploy Article + BreadcrumbList template (Section 4)
5. **4 blog posts** — Deploy BlogPosting + BreadcrumbList template (Section 5)
6. **Buyer/seller guides** — Deploy FAQPage where applicable + BreadcrumbList (Section 6)
7. **All remaining pages** — Deploy BreadcrumbList (Site-Wide Template)
8. **Update image URLs** — Replace placeholder image paths with actual hosted image URLs
9. **Update social URLs** — Verify Facebook/Instagram profile URLs and update `sameAs` arrays
10. **Validate** — Test all schema at https://validator.schema.org/ and Google Rich Results Test
