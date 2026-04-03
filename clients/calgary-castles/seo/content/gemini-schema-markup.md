# Calgary Castles Real Estate — JSON-LD Schema Markup

This document provides production-ready JSON-LD schema markup for the Calgary Castles Team website. These blocks are designed to enhance search engine visibility, establish authority in the Calgary real estate market, and improve rich snippet eligibility for local searches and community-specific content.

## Block 1 — Homepage Master Schema
**Injection:** Add to the <head> of the homepage (https://www.sellingcalgarycastles.com/).

This block combines Organization, RealEstateAgent, WebSite, and BreadcrumbList into a single graph. It defines the core identity of the Calgary Castles Team and Neil Rowlandson, while also enabling the Sitelinks Searchbox.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.sellingcalgarycastles.com/#organization",
      "name": "Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/assets/tasty-ppc-logo.svg",
        "width": "512",
        "height": "512"
      },
      "parentOrganization": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#130, 703 - 64th Avenue SE",
        "addressLocality": "Calgary",
        "addressRegion": "AB",
        "postalCode": "T2H 2C3",
        "addressCountry": "CA"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+14032710600",
        "contactType": "customer service",
        "email": "calgarycastles@live.com",
        "availableLanguage": "English"
      },
      "sameAs": [
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV/videos",
        "https://ca.linkedin.com/in/calgarycastles",
        "https://www.cirrealty.ca"
      ]
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.sellingcalgarycastles.com/#agent",
      "name": "Neil Rowlandson - Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com",
      "telephone": "+14032710600",
      "email": "calgarycastles@live.com",
      "image": "https://www.sellingcalgarycastles.com/about/#person",
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
        { "@type": "City", "name": "Calgary" },
        { "@type": "Place", "name": "Auburn Bay" },
        { "@type": "Place", "name": "Bridlewood" },
        { "@type": "Place", "name": "Chaparral" },
        { "@type": "Place", "name": "Cranston" },
        { "@type": "Place", "name": "Evergreen" },
        { "@type": "Place", "name": "Legacy" },
        { "@type": "Place", "name": "Mahogany" },
        { "@type": "Place", "name": "McKenzie Towne" },
        { "@type": "Place", "name": "New Brighton" },
        { "@type": "Place", "name": "Walden" }
      ],
      "memberOf": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "sameAs": [
        "https://ca.linkedin.com/in/calgarycastles"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.sellingcalgarycastles.com/#website",
      "url": "https://www.sellingcalgarycastles.com",
      "name": "Calgary Castles Team | Neil Rowlandson, CIR Realty",
      "publisher": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.sellingcalgarycastles.com/property-search/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.sellingcalgarycastles.com"
        }
      ]
    }
  ]
}
</script>
```

## Block 2 — Person Schema for Neil (About Page)
**Injection:** Add to the <head> of the /about/ page.

Establishes Neil Rowlandson's professional authority, experience (20+ years), and banking background.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["Person", "RealEstateAgent"],
  "@id": "https://www.sellingcalgarycastles.com/about/#person",
  "name": "Neil Rowlandson",
  "jobTitle": "Calgary REALTOR® | Real Estate Agent",
  "url": "https://www.sellingcalgarycastles.com/about/",
  "description": "Neil Rowlandson is a premier Calgary REALTOR® with over 20 years of experience in the real estate industry and a 10-year background in banking, providing clients with unparalleled financial and market expertise.",
  "worksFor": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "#130, 703 - 64th Avenue SE",
    "addressLocality": "Calgary",
    "addressRegion": "AB",
    "postalCode": "T2H 2C3",
    "addressCountry": "CA"
  },
  "telephone": "+14032710600",
  "email": "calgarycastles@live.com",
  "sameAs": [
    "https://ca.linkedin.com/in/calgarycastles"
  ],
  "knowsAbout": [
    "Calgary Real Estate",
    "Home Buying",
    "Home Selling",
    "Luxury Homes",
    "First-Time Home Buyers",
    "Investment Property",
    "Auburn Bay",
    "Cranston",
    "Mahogany"
  ],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "name": "Licensed REALTOR®",
    "recognizedBy": {
      "@type": "Organization",
      "name": "CIR Realty"
    }
  }
}
</script>
```

## Block 3 — Contact / LocalBusiness Page
**Injection:** Add to the <head> of the /contact/ page.

Provides detailed local business data for map indexing and local intent searches.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "RealEstateAgent"],
  "@id": "https://www.sellingcalgarycastles.com/contact/#localbusiness",
  "name": "Calgary Castles Team — Neil Rowlandson, CIR Realty",
  "url": "https://www.sellingcalgarycastles.com/contact/",
  "image": "https://www.sellingcalgarycastles.com/assets/tasty-ppc-logo.svg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "#130, 703 - 64th Avenue SE",
    "addressLocality": "Calgary",
    "addressRegion": "AB",
    "postalCode": "T2H 2C3",
    "addressCountry": "CA"
  },
  "telephone": "+14032710600",
  "email": "calgarycastles@live.com",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 51.0447,
    "longitude": -114.0719
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "16:00"
    }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+14032710600",
    "contactType": "customer service",
    "email": "calgarycastles@live.com",
    "availableLanguage": "English"
  },
  "currenciesAccepted": "CAD",
  "priceRange": "$$$",
  "areaServed": {
    "@type": "City",
    "name": "Calgary"
  }
}
</script>
```

## Block 4 — Community Page Template & Examples
**Injection:** Add to the <head> of individual community pages.

### Community Template
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Article", "WebPage"],
      "@id": "{PAGE_URL}#webpage",
      "url": "{PAGE_URL}",
      "headline": "{COMMUNITY_NAME} Real Estate & Homes for Sale",
      "description": "{DESCRIPTION}",
      "inLanguage": "en-CA",
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-31",
      "author": { "@id": "https://www.sellingcalgarycastles.com/about/#person" },
      "publisher": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "about": {
        "@type": "Place",
        "name": "{COMMUNITY_NAME}",
        "containedInPlace": {
          "@type": "City",
          "name": "Calgary",
          "address": { "@type": "PostalAddress", "addressRegion": "AB", "addressCountry": "CA" }
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "{PAGE_URL}#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sellingcalgarycastles.com" },
        { "@type": "ListItem", "position": 2, "name": "Communities", "item": "https://www.sellingcalgarycastles.com/communities/" },
        { "@type": "ListItem", "position": 3, "name": "{COMMUNITY_NAME}", "item": "{PAGE_URL}" }
      ]
    }
  ]
}
</script>
```

### Example A: Auburn Bay
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Article", "WebPage"],
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#webpage",
      "url": "https://www.sellingcalgarycastles.com/auburn-bay/",
      "headline": "Auburn Bay Real Estate & Homes for Sale",
      "description": "Auburn Bay is a master-planned lake community in SE Calgary. Residents enjoy year-round access to a private 43-acre lake, beach club, and pathway system. Popular with families seeking a suburban lake lifestyle minutes from Deerfoot Trail.",
      "inLanguage": "en-CA",
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-31",
      "author": { "@id": "https://www.sellingcalgarycastles.com/about/#person" },
      "publisher": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "about": {
        "@type": "Place",
        "name": "Auburn Bay",
        "containedInPlace": {
          "@type": "City",
          "name": "Calgary"
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sellingcalgarycastles.com" },
        { "@type": "ListItem", "position": 2, "name": "Communities", "item": "https://www.sellingcalgarycastles.com/communities/" },
        { "@type": "ListItem", "position": 3, "name": "Auburn Bay", "item": "https://www.sellingcalgarycastles.com/auburn-bay/" }
      ]
    }
  ]
}
</script>
```

### Example B: Cranston
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Article", "WebPage"],
      "@id": "https://www.sellingcalgarycastles.com/cranston/#webpage",
      "url": "https://www.sellingcalgarycastles.com/cranston/",
      "headline": "Cranston Real Estate & Homes for Sale",
      "description": "Cranston is a family-oriented community in SE Calgary's Riverstone area, offering scenic Bow River views, the Century Hall amenity centre, and proximity to Fish Creek Provincial Park. Known for new construction and executive homes.",
      "inLanguage": "en-CA",
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-31",
      "author": { "@id": "https://www.sellingcalgarycastles.com/about/#person" },
      "publisher": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "about": {
        "@type": "Place",
        "name": "Cranston",
        "containedInPlace": {
          "@type": "City",
          "name": "Calgary"
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/cranston/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sellingcalgarycastles.com" },
        { "@type": "ListItem", "position": 2, "name": "Communities", "item": "https://www.sellingcalgarycastles.com/communities/" },
        { "@type": "ListItem", "position": 3, "name": "Cranston", "item": "https://www.sellingcalgarycastles.com/cranston/" }
      ]
    }
  ]
}
</script>
```

## Block 5 — Blog Post Template
**Injection:** Add to the <head> of individual blog posts.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "{POST_URL}#blogposting",
      "headline": "{POST_TITLE}",
      "description": "{DESCRIPTION}",
      "url": "{POST_URL}",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "{POST_URL}" },
      "author": { "@id": "https://www.sellingcalgarycastles.com/about/#person" },
      "publisher": { "@id": "https://www.sellingcalgarycastles.com/#organization" },
      "datePublished": "{DATE_ISO8601}",
      "dateModified": "{DATE_ISO8601}",
      "image": {
        "@type": "ImageObject",
        "url": "{IMAGE_URL}",
        "width": "1200",
        "height": "630"
      },
      "articleSection": "{SECTION}",
      "keywords": ["Calgary Real Estate", "{KEYWORD_1}", "{KEYWORD_2}"],
      "wordCount": "{WORD_COUNT}",
      "inLanguage": "en-CA"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "{POST_URL}#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sellingcalgarycastles.com" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.sellingcalgarycastles.com/blog/" },
        { "@type": "ListItem", "position": 3, "name": "{POST_TITLE}", "item": "{POST_URL}" }
      ]
    }
  ]
}
</script>
```

## Block 6 — Buyer FAQ (FAQPage)
**Injection:** Add to the <head> of the /buyers/ page.

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
        "text": "As of early 2026, the average home price in Calgary is approximately CAD 641,000. However, this varies significantly by property type and neighbourhood; SE communities like Auburn Bay and Mahogany may differ from downtown or inner-city markets."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get pre-approved for a mortgage in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To get pre-approved, consult with a Canadian bank or a licensed mortgage broker. You will need to provide proof of income, assets, and debt. If your down payment is less than 20%, you will also need to factor in CMHC mortgage insurance."
      }
    },
    {
      "@type": "Question",
      "name": "What are closing costs for a home buyer in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Buyers should budget 1.5% to 4% of the purchase price for closing costs. These include land title transfer fees, legal fees (typically ,000–,000), home inspections, and property tax adjustments."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "With an average of 30 days on market in 2026, the process from starting your search to possession usually takes 30 to 60 days after an offer is accepted, depending on the agreed-upon possession date."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a real estate agent to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While not legally required, it is strongly recommended. In Alberta, the seller typically pays the buyer's agent commission, meaning professional representation often comes at no direct cost to the buyer."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best neighbourhoods in Calgary for families?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary's SE quadrant offers many top family neighbourhoods, including Auburn Bay, Cranston, Mahogany, McKenzie Towne, and New Brighton, known for their schools, lake access, and community amenities."
      }
    }
  ]
}
</script>
```

## Block 7 — Seller FAQ (FAQPage)
**Injection:** Add to the <head> of the /sellers/ page.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best time to sell a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The spring market (March–May) is traditionally the strongest for volume. However, winter listings can benefit from lower competition and highly motivated buyers."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Calgary in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average time to sell is approximately 30 days. Well-priced homes in high-demand SE communities often sell in just a few days."
      }
    },
    {
      "@type": "Question",
      "name": "What are the costs of selling a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Selling costs include real estate commissions (typically 3–7% split between agents), legal fees (~,000–,000), and any costs associated with repairs, staging, or cleaning."
      }
    },
    {
      "@type": "Question",
      "name": "How do I price my home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A REALTOR® will provide a Comparative Market Analysis (CMA) based on recent comparable sales, current inventory levels, and your home's unique features to determine the optimal listing price."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to make repairs before selling my Calgary home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It is best to address obvious deficiencies first. Staging and curb appeal often provide a better return than major renovations. Consult your agent to prioritize high-ROI improvements."
      }
    }
  ]
}
</script>
```

## Block 8 — AggregateRating Template
**Injection:** Add to pages displaying reviews (Homepage, About, Testimonials).

*Note: Replace placeholder values with actual Google Business Profile review data before deploying.*

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Calgary Castles Team — Neil Rowlandson",
  "url": "https://www.sellingcalgarycastles.com",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sample Client"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "Neil was incredible to work with. His banking background really helped us understand the financial side of buying our first home in Mahogany.",
      "datePublished": "2026-02-15"
    }
  ]
}
</script>
```

## Implementation Notes

- **Placement:** All blocks should be injected into the <head> section of their respective pages.
- **Sierra Interactive Platform:** Since the site uses Sierra Interactive, you may need to use the platform's "Custom Header Code" fields or Google Tag Manager for injection.
- **Validation:** Always validate each block using [Google's Rich Results Test](https://search.google.com/test/rich-results) before going live.
- **Dynamic Data:** 
  - Update the `AggregateRating` block when new reviews are received.
  - Ensure `dateModified` in Community and Blog blocks is updated if significant content changes are made.
  - Replace placeholders in the Blog and Community templates with specific page data.
