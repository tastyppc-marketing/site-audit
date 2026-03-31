# Schema Markup (JSON-LD) — P3RealtyNC.com

> **Client:** Lisa Johnson | Performance Property Partners
> **Site:** p3realtync.com (Sierra Interactive)
> **Date:** March 2026
>
> All schema uses JSON-LD format injected via `<script type="application/ld:json">`.
> Sierra Interactive supports custom HTML injection in page settings or via the site-wide header.

---

## 1. Organization Schema (Site-Wide — Header)

Place in the site-wide `<head>` via Sierra Interactive's custom code injection.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.p3realtync.com/#organization",
  "name": "Performance Property Partners",
  "alternateName": "P3RealtyNC",
  "url": "https://www.p3realtync.com",
  "logo": "https://sierra-public.azureedge.net/1299822d-c77e-4198-bf69-dac3fea7a8a5.jpg",
  "image": "https://sierra-public.azureedge.net/e7610634-2fdb-4e89-941b-7c0fa206590d.jpg",
  "description": "Performance Property Partners helps families buy and sell real estate across Johnston County, Pinehurst, Hampstead, and Coastal North Carolina.",
  "telephone": "+1-919-000-0000",
  "email": "lisa@p3realtync.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Clayton",
    "addressRegion": "NC",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.6507,
    "longitude": -78.4564
  },
  "areaServed": [
    {
      "@type": "State",
      "name": "North Carolina"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Johnston County, NC"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Moore County, NC"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Pender County, NC"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/p3realtync",
    "https://www.instagram.com/p3realtync",
    "https://www.zillow.com/profile/lisajohnsonp3"
  ],
  "founder": {
    "@type": "Person",
    "@id": "https://www.p3realtync.com/#lisa-johnson",
    "name": "Lisa W. Johnson"
  },
  "knowsAbout": [
    "Real Estate",
    "Home Buying",
    "Home Selling",
    "Relocation",
    "Johnston County NC Real Estate",
    "Coastal NC Real Estate",
    "Pinehurst NC Real Estate"
  ],
  "priceRange": "$$-$$$$"
}
</script>
```

> **Action Required:** Replace the phone number, email, and social media URLs with Lisa's actual values. Update the logo URL if a higher-resolution version exists.

---

## 2. Person Schema — Lisa Johnson (Site-Wide — Header)

Place immediately after the Organization schema in the site-wide header.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.p3realtync.com/#lisa-johnson",
  "name": "Lisa W. Johnson",
  "jobTitle": "Owner & Real Estate Broker",
  "worksFor": {
    "@id": "https://www.p3realtync.com/#organization"
  },
  "url": "https://www.p3realtync.com/our-agents/lisa-johnson/",
  "image": "https://assets.site-static.com/agentsitephotos/5907/agent_6197_02.jpg",
  "description": "Lisa W. Johnson is the owner and lead broker of Performance Property Partners (P3RealtyNC), a Zillow Premier Agent serving Johnston County, Pinehurst, and Coastal North Carolina.",
  "knowsAbout": [
    "NC Real Estate",
    "Relocation Services",
    "Luxury Properties",
    "Coastal NC Homes",
    "Johnston County NC",
    "Pinehurst NC"
  ],
  "sameAs": [
    "https://www.zillow.com/profile/lisajohnsonp3"
  ]
}
</script>
```

---

## 3. LocalBusiness Schema (Homepage Only)

Place on the homepage in addition to the site-wide Organization schema.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Performance Property Partners",
  "alternateName": "P3RealtyNC",
  "url": "https://www.p3realtync.com",
  "logo": "https://sierra-public.azureedge.net/1299822d-c77e-4198-bf69-dac3fea7a8a5.jpg",
  "telephone": "+1-919-000-0000",
  "email": "lisa@p3realtync.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Clayton",
    "addressRegion": "NC",
    "postalCode": "27520",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.6507,
    "longitude": -78.4564
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
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "50",
    "bestRating": "5"
  }
}
</script>
```

> **Action Required:** Replace address, phone, email, hours, and review count with actual values. The `aggregateRating` should reflect real Google/Zillow review data.

---

## 4. RealEstateListing Schema Template (CRITICAL — Listing Pages)

**This is the most important schema on the site.** This template must be applied to every individual property listing page (`/property-search/detail/...`). It tells Google "this is Lisa Johnson's listing of this specific property" — which is exactly what's needed to outrank Zillow and Redfin for address queries.

### Why This Matters

Lisa has 360 address queries in Search Console with near-zero CTR. Google shows Zillow/Redfin above her because they use structured data and she doesn't. Adding `RealEstateListing` schema gives Google explicit structured signals about:
- The exact property address (matching the user's search query)
- That this is a listing from a licensed agent (not a scraper)
- Price, photos, and listing details in rich result format

### Template for Sierra Interactive

Sierra Interactive generates listing pages dynamically. This schema should be injected via a template that pulls from the MLS data feed. Below is the template with placeholders.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "{{property_address}} — For Sale by P3RealtyNC",
  "url": "{{canonical_url}}",
  "description": "{{property_description_first_200_chars}}",
  "datePosted": "{{listing_date_iso}}",
  "image": [
    "{{photo_url_1}}",
    "{{photo_url_2}}",
    "{{photo_url_3}}"
  ],
  "about": {
    "@type": "SingleFamilyResidence",
    "name": "{{property_address}}",
    "description": "{{property_description}}",
    "url": "{{canonical_url}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street_address}}",
      "addressLocality": "{{city}}",
      "addressRegion": "NC",
      "postalCode": "{{zip_code}}",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "{{latitude}}",
      "longitude": "{{longitude}}"
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": "{{square_feet}}",
      "unitCode": "FTK"
    },
    "numberOfRooms": "{{total_rooms}}",
    "numberOfBedrooms": "{{bedrooms}}",
    "numberOfBathroomsTotal": "{{bathrooms}}",
    "yearBuilt": "{{year_built}}",
    "lotSize": {
      "@type": "QuantitativeValue",
      "value": "{{lot_acres}}",
      "unitText": "acres"
    },
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "{{feature_1}}"
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "{{feature_2}}"
      }
    ]
  },
  "offers": {
    "@type": "Offer",
    "price": "{{list_price}}",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "validFrom": "{{listing_date_iso}}",
    "seller": {
      "@type": "RealEstateAgent",
      "@id": "https://www.p3realtync.com/#organization",
      "name": "Performance Property Partners"
    }
  },
  "broker": {
    "@type": "RealEstateAgent",
    "@id": "https://www.p3realtync.com/#organization",
    "name": "Performance Property Partners",
    "url": "https://www.p3realtync.com"
  },
  "agent": {
    "@type": "Person",
    "@id": "https://www.p3realtync.com/#lisa-johnson",
    "name": "Lisa W. Johnson",
    "url": "https://www.p3realtync.com/our-agents/lisa-johnson/"
  }
}
</script>
```

### Implementation Notes for Sierra Interactive

1. **Contact Sierra Support** to request JSON-LD injection on property detail pages. Sierra has a templating system — request access to inject schema via the listing detail template.

2. **Variable Mapping** — map each `{{placeholder}}` to Sierra's internal MLS data fields:
   - `{{property_address}}` → Full address string (e.g., "1004 Cabin Hill Way, Garner, NC 27529")
   - `{{street_address}}` → Street only (e.g., "1004 Cabin Hill Way")
   - `{{city}}` → City name from MLS
   - `{{zip_code}}` → 5-digit ZIP
   - `{{list_price}}` → Numeric price without formatting (e.g., 425000)
   - `{{listing_date_iso}}` → ISO 8601 date (e.g., 2026-03-15)
   - `{{photo_url_1,2,3}}` → First 3 MLS photos
   - `{{latitude}}/{{longitude}}` → From MLS geo data
   - `{{square_feet}}/{{bedrooms}}/{{bathrooms}}` → Standard MLS fields
   - `{{property_description}}` → MLS remarks/description field
   - `{{canonical_url}}` → The full URL of this listing page

3. **Property Type Mapping** — Adjust the `@type` inside `about` based on property type:
   - Single family → `SingleFamilyResidence`
   - Condo → `Apartment`
   - Townhouse → `Residence`
   - Land → `LandForm` (with no bedroom/bathroom fields)
   - Multi-family → `Residence`

4. **Fallback for Non-Lisa Listings:** For listings where the agent isn't Lisa, adjust the `agent` field to reference the appropriate agent or omit it, keeping `broker` as the brokerage.

### Minimal Version (If Sierra Can't Do Full Template)

If Sierra Interactive can't inject the full template, at minimum add this to every listing page via custom code:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{property_address}}",
  "description": "Home for sale at {{property_address}}. Listed by Lisa W. Johnson, Performance Property Partners.",
  "offers": {
    "@type": "Offer",
    "price": "{{list_price}}",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "brand": {
    "@type": "Organization",
    "name": "Performance Property Partners"
  }
}
</script>
```

---

## 5. BreadcrumbList Schema (All Pages)

Inject on every page via site-wide template. Adjust the breadcrumb items based on page depth.

### Homepage

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
      "item": "https://www.p3realtync.com/"
    }
  ]
}
</script>
```

### County Page (Example: Johnston County)

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
      "item": "https://www.p3realtync.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Johnston County NC Homes",
      "item": "https://www.p3realtync.com/johnston-county/"
    }
  ]
}
</script>
```

### Lifestyle Search Page (Example: No HOA in Johnston County)

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
      "item": "https://www.p3realtync.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Johnston County",
      "item": "https://www.p3realtync.com/johnston-county/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "No HOA Homes",
      "item": "https://www.p3realtync.com/no-hoa-homes-for-sale-in-johnston-county/"
    }
  ]
}
</script>
```

### Blog Post

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
      "item": "https://www.p3realtync.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://www.p3realtync.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{Blog Post Title}}",
      "item": "{{Blog Post URL}}"
    }
  ]
}
</script>
```

### Property Listing Page

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
      "item": "https://www.p3realtync.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Property Search",
      "item": "https://www.p3realtync.com/property-search/site-map/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{Property Address}}",
      "item": "{{Listing Page URL}}"
    }
  ]
}
</script>
```

---

## 6. Article / BlogPosting Schema (All Blog Posts)

Apply to every blog post page. Below is the template.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{blog_title}}",
  "description": "{{meta_description}}",
  "url": "{{canonical_url}}",
  "datePublished": "{{publish_date_iso}}",
  "dateModified": "{{modified_date_iso}}",
  "image": "{{featured_image_url}}",
  "author": {
    "@type": "Person",
    "@id": "https://www.p3realtync.com/#lisa-johnson",
    "name": "Lisa W. Johnson",
    "url": "https://www.p3realtync.com/our-agents/lisa-johnson/"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://www.p3realtync.com/#organization",
    "name": "Performance Property Partners",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sierra-public.azureedge.net/1299822d-c77e-4198-bf69-dac3fea7a8a5.jpg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "{{canonical_url}}"
  },
  "wordCount": "{{word_count}}",
  "inLanguage": "en-US",
  "about": {
    "@type": "Thing",
    "name": "{{primary_topic}}"
  }
}
</script>
```

### Example: Why People Love Pinehurst NC

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Why People Love Living in Pinehurst, NC",
  "description": "Discover what makes Pinehurst NC a beloved place to live — golf, charm, lifestyle, and hidden gems only locals know.",
  "url": "https://www.p3realtync.com/blog/why-people-love-pinehurst-nc/",
  "datePublished": "2025-10-15",
  "dateModified": "2026-01-20",
  "image": "https://assets.site-static.com/blogphotos/5907/22624-pinehurst-map-thumpnail-image.jpg",
  "author": {
    "@type": "Person",
    "@id": "https://www.p3realtync.com/#lisa-johnson",
    "name": "Lisa W. Johnson",
    "url": "https://www.p3realtync.com/our-agents/lisa-johnson/"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://www.p3realtync.com/#organization",
    "name": "Performance Property Partners",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sierra-public.azureedge.net/1299822d-c77e-4198-bf69-dac3fea7a8a5.jpg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.p3realtync.com/blog/why-people-love-pinehurst-nc/"
  },
  "wordCount": "4379",
  "inLanguage": "en-US"
}
</script>
```

---

## 7. FAQPage Schema (Blog Posts & Resource Pages)

Add to any page with FAQ content. Use the real questions from the page content.

### Template

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{question_1}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{answer_1}}"
      }
    },
    {
      "@type": "Question",
      "name": "{{question_2}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{answer_2}}"
      }
    },
    {
      "@type": "Question",
      "name": "{{question_3}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{answer_3}}"
      }
    }
  ]
}
</script>
```

### Example: First-Time Home Buyers Page

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much do I need for a down payment on a home in NC?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NC first-time buyers can put down as little as 3% with conventional loans or 0% with VA and USDA loans. FHA loans require 3.5% down. Lisa Johnson at P3RealtyNC can connect you with lenders who offer NC-specific down payment assistance programs."
      }
    },
    {
      "@type": "Question",
      "name": "What credit score do I need to buy a house in North Carolina?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most NC lenders require a minimum credit score of 620 for conventional loans and 580 for FHA loans. However, some programs accept scores as low as 500 with a larger down payment. Contact P3RealtyNC for lender referrals."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to buy a home in NC?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The typical NC home purchase takes 30-45 days from accepted offer to closing. The full process from initial search to closing usually takes 2-4 months. Performance Property Partners guides you through every step."
      }
    }
  ]
}
</script>
```

---

## 8. WebSite Schema with SearchAction (Homepage Only)

Enables Google sitelinks search box.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "P3RealtyNC — Performance Property Partners",
  "url": "https://www.p3realtync.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.p3realtync.com/property-search/results/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
</script>
```

> **Note:** Verify the search URL template matches Sierra Interactive's actual search results URL format.

---

## Implementation Priority

| Priority | Schema Type | Where | Impact |
|----------|-------------|-------|--------|
| **P0** | **RealEstateListing** | All listing detail pages | **Directly fixes the core problem** — 360 address queries with 0 clicks |
| P1 | Organization + Person | Site-wide header | Establishes entity identity for Google |
| P1 | BlogPosting | All 36 blog posts | Rich results in SERPs, authorship signals |
| P2 | BreadcrumbList | All pages | Navigation rich results, site hierarchy |
| P2 | FAQPage | Blog posts, resource pages | FAQ rich results, more SERP real estate |
| P2 | LocalBusiness | Homepage | Local pack eligibility |
| P3 | WebSite + SearchAction | Homepage | Sitelinks search box |

---

## Testing & Validation

1. After implementing, test each schema type with [Google's Rich Results Test](https://search.google.com/test/rich-results)
2. Monitor schema errors in Google Search Console under **Enhancements**
3. For the RealEstateListing schema, test with 3-5 active listing pages first, then roll out to all
4. Check for schema validation errors using [Schema.org Validator](https://validator.schema.org/)
