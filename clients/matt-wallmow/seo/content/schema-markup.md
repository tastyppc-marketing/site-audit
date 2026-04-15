# Schema Markup Implementation — mattwallmow.com

**Date:** 2026-04-15
**Status:** Ready for implementation
**Current schema:** None (zero JSON-LD on any page)

All schema blocks below are production-ready JSON-LD. Each can be pasted directly into the `<head>` section of the corresponding page via Yoast/RankMath custom schema, the AgentFire theme's custom code area, or a plugin like "Insert Headers and Footers."

---

## 1. Homepage — RealEstateAgent + LocalBusiness + Organization

**URL:** `https://mattwallmow.com/`
**Expected rich results:** Knowledge Panel enhancement, local business card, sitelinks, social profile links

**Implementation:** Add to homepage template or via Yoast/RankMath custom schema for the homepage only.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["RealEstateAgent", "LocalBusiness"],
      "@id": "https://mattwallmow.com/#business",
      "name": "Wallmow Realty, Inc",
      "alternateName": "Lakeland Realty - Matt Wallmow",
      "url": "https://mattwallmow.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mattwallmow.com/wp-content/uploads/2024/logo.png",
        "width": 300,
        "height": 100
      },
      "image": "https://mattwallmow.com/wp-content/uploads/2024/matt-wallmow-headshot.jpg",
      "description": "Matt Wallmow is a top-producing Northwoods Wisconsin real estate agent specializing in lakefront, residential, and recreational properties in Rhinelander, Minocqua, Eagle River, and surrounding communities.",
      "telephone": "+1-715-490-9930",
      "email": "matt@mattwallmow.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "48 W King St",
        "addressLocality": "Rhinelander",
        "addressRegion": "WI",
        "postalCode": "54501",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 45.6366,
        "longitude": -89.4121
      },
      "areaServed": [
        {
          "@type": "State",
          "name": "Wisconsin"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Oneida County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Vilas County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Lincoln County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Forest County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Iron County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Langlade County, WI"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Price County, WI"
        }
      ],
      "priceRange": "$$-$$$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "18:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "09:00",
          "closes": "16:00"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/MattWallmowRealtor",
        "https://www.instagram.com/matt_wallmow_realtor/",
        "https://www.youtube.com/channel/UCq0P5MUtJ_YlSqtKPI3-Xsw",
        "https://www.tiktok.com/@mattwallmowrealtor",
        "https://www.zillow.com/profile/Matt%20Wallmow"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "182",
        "bestRating": "5",
        "worstRating": "1"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Real Estate Services",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Buyer Representation"
          },
          {
            "@type": "OfferCatalog",
            "name": "Seller Representation"
          },
          {
            "@type": "OfferCatalog",
            "name": "Lakefront Property Sales"
          },
          {
            "@type": "OfferCatalog",
            "name": "Home Valuation"
          }
        ]
      }
    },
    {
      "@type": "Organization",
      "@id": "https://mattwallmow.com/#organization",
      "name": "Wallmow Realty, Inc",
      "url": "https://mattwallmow.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mattwallmow.com/wp-content/uploads/2024/logo.png"
      },
      "sameAs": [
        "https://www.facebook.com/MattWallmowRealtor",
        "https://www.instagram.com/matt_wallmow_realtor/",
        "https://www.youtube.com/channel/UCq0P5MUtJ_YlSqtKPI3-Xsw",
        "https://www.tiktok.com/@mattwallmowrealtor",
        "https://www.zillow.com/profile/Matt%20Wallmow"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-715-490-9930",
        "contactType": "sales",
        "email": "matt@mattwallmow.com",
        "areaServed": "US",
        "availableLanguage": "English"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://mattwallmow.com/#website",
      "name": "Matt Wallmow - Northwoods Wisconsin Real Estate",
      "url": "https://mattwallmow.com/",
      "publisher": {
        "@id": "https://mattwallmow.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://mattwallmow.com/properties/?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

**Notes:**
- Update `logo` and `image` URLs to match actual file paths in wp-content/uploads.
- The `aggregateRating` reflects the 182 Google reviews at 5.0 stars from the audit data.
- `openingHoursSpecification` should be verified with Matt -- adjust Saturday hours or add Sunday if applicable.
- The `SearchAction` enables a sitelinks search box in Google; update the target URL to match the actual property search page format.

---

## 2. About Page — Person Schema

**URL:** `https://mattwallmow.com/about/`
**Expected rich results:** Knowledge Panel enrichment, author card in search results

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://mattwallmow.com/#person-matt-wallmow",
  "name": "Matt Wallmow",
  "givenName": "Matt",
  "familyName": "Wallmow",
  "jobTitle": "Real Estate Agent",
  "url": "https://mattwallmow.com/about/",
  "image": "https://mattwallmow.com/wp-content/uploads/2024/matt-wallmow-headshot.jpg",
  "description": "Top-producing Northwoods Wisconsin real estate agent with $85M+ in sales volume and 400+ transactions. #1 Solo Agent for Sides Sold in 2025.",
  "telephone": "+1-715-490-9930",
  "email": "matt@mattwallmow.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "48 W King St",
    "addressLocality": "Rhinelander",
    "addressRegion": "WI",
    "postalCode": "54501",
    "addressCountry": "US"
  },
  "worksFor": {
    "@type": "RealEstateAgent",
    "@id": "https://mattwallmow.com/#business",
    "name": "Wallmow Realty, Inc"
  },
  "knowsAbout": [
    "Residential Real Estate",
    "Lakefront Properties",
    "Northwoods Wisconsin Real Estate",
    "Recreational Properties",
    "Home Buying",
    "Home Selling",
    "Real Estate Market Analysis"
  ],
  "award": [
    "#1 Solo Agent for Sides Sold - 2025",
    "FastExpert Top Agent Recognition"
  ],
  "sameAs": [
    "https://www.facebook.com/MattWallmowRealtor",
    "https://www.instagram.com/matt_wallmow_realtor/",
    "https://www.youtube.com/channel/UCq0P5MUtJ_YlSqtKPI3-Xsw",
    "https://www.tiktok.com/@mattwallmowrealtor",
    "https://www.zillow.com/profile/Matt%20Wallmow"
  ]
}
</script>
```

**Notes:**
- Update `image` URL to the actual headshot file path.
- Add additional `award` entries if Matt has other certifications or recognitions (e.g., NAR designations, CRS, ABR).
- The `@id` reference lets other schema blocks on the site reference this Person entity.

---

## 3. Buyers Page — Service Schema

**URL:** `https://mattwallmow.com/buyers/`
**Expected rich results:** Service-type rich snippets, enhanced breadcrumbs

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://mattwallmow.com/buyers/#service",
  "name": "Home Buying Services - Northwoods Wisconsin",
  "description": "Full-service buyer representation for residential, lakefront, and recreational properties in Rhinelander, Minocqua, Eagle River, Tomahawk, and the greater Northwoods Wisconsin area. From first showing to closing table.",
  "url": "https://mattwallmow.com/buyers/",
  "serviceType": "Real Estate Buyer Representation",
  "provider": {
    "@type": "RealEstateAgent",
    "@id": "https://mattwallmow.com/#business"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Rhinelander",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Minocqua",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Eagle River",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Tomahawk",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Buyer Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "VIP Home Search",
          "description": "Priority access to new listings before they hit the MLS, matched to your criteria."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Lakefront Property Search",
          "description": "Specialized expertise in waterfront and lake properties across Oneida, Vilas, and Lincoln counties."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Buyer Consultation",
          "description": "Free consultation to discuss your goals, budget, and the Northwoods market."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Negotiation & Closing Support",
          "description": "Expert offer negotiation, inspection coordination, and closing support."
        }
      }
    ]
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Home Buyers"
  }
}
</script>
```

**Notes:**
- The `provider` references the homepage `@id` so Google connects this service to the main business entity.
- Add or remove cities in `areaServed` to match Matt's actual service area marketing.

---

## 4. Sellers Page — Service Schema

**URL:** `https://mattwallmow.com/sellers/`
**Expected rich results:** Service-type rich snippets, enhanced breadcrumbs

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://mattwallmow.com/sellers/#service",
  "name": "Home Selling Services - Northwoods Wisconsin",
  "description": "Full-service listing representation for homeowners in Rhinelander, Minocqua, Eagle River, and the greater Northwoods Wisconsin area. Professional marketing, pricing strategy, and negotiation to maximize your sale price.",
  "url": "https://mattwallmow.com/sellers/",
  "serviceType": "Real Estate Listing Services",
  "provider": {
    "@type": "RealEstateAgent",
    "@id": "https://mattwallmow.com/#business"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Rhinelander",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Minocqua",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Eagle River",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    },
    {
      "@type": "City",
      "name": "Tomahawk",
      "containedInPlace": {
        "@type": "State",
        "name": "Wisconsin"
      }
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Seller Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Free Home Valuation",
          "description": "Complimentary comparative market analysis to determine your home's current market value."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Professional Listing Marketing",
          "description": "Professional photography, virtual tours, MLS syndication, and targeted digital marketing."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Pricing Strategy",
          "description": "Data-driven pricing strategy based on local market conditions and comparable sales."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Offer Negotiation & Closing",
          "description": "Expert negotiation to maximize your sale price and coordinate a smooth closing."
        }
      }
    ]
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Home Sellers"
  }
}
</script>
```

---

## 5. Community Pages — Place Schema

These schemas apply to the 7 Northwoods county/community pages. Below is a template plus the completed schema for each county page.

**Expected rich results:** Place cards, geographic context for local searches

### Template Pattern

Each community page gets a `Place` schema customized with the county name, description, and geo coordinates.

**Implementation:** Add to each individual community page via Yoast/RankMath custom schema or a per-page code block in the AgentFire theme.

### 5a. Oneida County

**URL:** `https://mattwallmow.com/oneida-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/oneida-county/#place",
  "name": "Oneida County, Wisconsin",
  "description": "Oneida County is the heart of Northwoods Wisconsin, home to Rhinelander and Minocqua. Known for its 1,100+ lakes, forests, and year-round outdoor recreation. A premier destination for lakefront and residential real estate.",
  "url": "https://mattwallmow.com/oneida-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.7,
    "longitude": -89.5
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin",
    "sameAs": "https://en.wikipedia.org/wiki/Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Oneida_County,_Wisconsin"
}
</script>
```

### 5b. Vilas County

**URL:** `https://mattwallmow.com/vilas-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/vilas-county/#place",
  "name": "Vilas County, Wisconsin",
  "description": "Vilas County is home to Eagle River, the Snowmobile Capital of the World, and over 1,300 lakes. A top destination for vacation homes, lakefront properties, and year-round Northwoods living.",
  "url": "https://mattwallmow.com/vilas-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 46.07,
    "longitude": -89.56
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Vilas_County,_Wisconsin"
}
</script>
```

### 5c. Lincoln County

**URL:** `https://mattwallmow.com/lincoln-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/lincoln-county/#place",
  "name": "Lincoln County, Wisconsin",
  "description": "Lincoln County is home to Tomahawk and Merrill, offering affordable Northwoods real estate with river frontage, wooded acreage, and access to the Wisconsin River corridor.",
  "url": "https://mattwallmow.com/lincoln-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.37,
    "longitude": -89.73
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Lincoln_County,_Wisconsin"
}
</script>
```

### 5d. Forest County

**URL:** `https://mattwallmow.com/forest-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/forest-county/#place",
  "name": "Forest County, Wisconsin",
  "description": "Forest County offers remote Northwoods living with Nicolet National Forest access, pristine lakes, and some of the most affordable rural and recreational property in northern Wisconsin.",
  "url": "https://mattwallmow.com/forest-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.67,
    "longitude": -88.77
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Forest_County,_Wisconsin"
}
</script>
```

### 5e. Iron County

**URL:** `https://mattwallmow.com/iron-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/iron-county/#place",
  "name": "Iron County, Wisconsin",
  "description": "Iron County in Wisconsin's far north features Hurley, the Turtle-Flambeau Flowage, and rugged Northwoods terrain. Known for snowmobiling, fishing, and affordable rural properties.",
  "url": "https://mattwallmow.com/iron-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 46.32,
    "longitude": -90.19
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Iron_County,_Wisconsin"
}
</script>
```

### 5f. Langlade County

**URL:** `https://mattwallmow.com/langlade-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/langlade-county/#place",
  "name": "Langlade County, Wisconsin",
  "description": "Langlade County, home to Antigo, offers a mix of farmland and forested Northwoods property. Known for the Wolf River corridor, trout fishing, and affordable single-family homes.",
  "url": "https://mattwallmow.com/langlade-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.17,
    "longitude": -89.07
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Langlade_County,_Wisconsin"
}
</script>
```

### 5g. Price County

**URL:** `https://mattwallmow.com/price-county/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "@id": "https://mattwallmow.com/price-county/#place",
  "name": "Price County, Wisconsin",
  "description": "Price County, home to Phillips and the Chequamegon-Nicolet National Forest, offers secluded Northwoods living with lake access, hunting land, and affordable rural real estate.",
  "url": "https://mattwallmow.com/price-county/",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.68,
    "longitude": -90.36
  },
  "containedInPlace": {
    "@type": "State",
    "name": "Wisconsin"
  },
  "additionalType": "https://en.wikipedia.org/wiki/Price_County,_Wisconsin"
}
</script>
```

---

## 6. Blog Posts — Article / BlogPosting Schema

**URLs:** All posts under `https://mattwallmow.com/blog/`
**Expected rich results:** Article rich results with author, date, thumbnail in search

This is a **template** -- implement it dynamically in the WordPress blog post template so every post gets schema automatically. In Yoast SEO, this can be configured under SEO > Search Appearance > Content Types > Posts. For manual implementation, use the template below and substitute the dynamic values.

### Template

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://mattwallmow.com/POST-SLUG/#article",
  "headline": "POST TITLE HERE",
  "description": "POST META DESCRIPTION HERE",
  "url": "https://mattwallmow.com/POST-SLUG/",
  "datePublished": "2026-03-15T08:00:00-05:00",
  "dateModified": "2026-03-15T08:00:00-05:00",
  "author": {
    "@type": "Person",
    "@id": "https://mattwallmow.com/#person-matt-wallmow",
    "name": "Matt Wallmow",
    "url": "https://mattwallmow.com/about/"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://mattwallmow.com/#organization",
    "name": "Wallmow Realty, Inc",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mattwallmow.com/wp-content/uploads/2024/logo.png"
    }
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://mattwallmow.com/wp-content/uploads/POST-FEATURED-IMAGE.jpg",
    "width": 1200,
    "height": 630
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://mattwallmow.com/POST-SLUG/"
  },
  "articleSection": "Real Estate",
  "inLanguage": "en-US",
  "wordCount": 1500,
  "keywords": ["Northwoods real estate", "Rhinelander WI", "lakefront property"]
}
</script>
```

### Example: Waterfront Living Blog Post

**URL:** `https://mattwallmow.com/10-pros-and-cons-of-waterfront-living-in-minocqua-wi/` (approximate slug)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://mattwallmow.com/10-pros-and-cons-of-waterfront-living-in-minocqua-wi/#article",
  "headline": "10 Pros and Cons of Waterfront Living in Minocqua, WI",
  "description": "Considering lakefront property in Minocqua? Explore the top 10 pros and cons of waterfront living in Wisconsin's Northwoods, from stunning views to seasonal maintenance.",
  "url": "https://mattwallmow.com/10-pros-and-cons-of-waterfront-living-in-minocqua-wi/",
  "datePublished": "2026-03-15T08:00:00-05:00",
  "dateModified": "2026-03-15T08:00:00-05:00",
  "author": {
    "@type": "Person",
    "@id": "https://mattwallmow.com/#person-matt-wallmow",
    "name": "Matt Wallmow",
    "url": "https://mattwallmow.com/about/"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://mattwallmow.com/#organization",
    "name": "Wallmow Realty, Inc",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mattwallmow.com/wp-content/uploads/2024/logo.png"
    }
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://mattwallmow.com/wp-content/uploads/2026/03/1.jpg",
    "width": 1200,
    "height": 630
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://mattwallmow.com/10-pros-and-cons-of-waterfront-living-in-minocqua-wi/"
  },
  "articleSection": "Lakefront Living",
  "inLanguage": "en-US",
  "keywords": ["waterfront living Minocqua WI", "lakefront property pros cons", "Northwoods lake homes"]
}
</script>
```

**Notes:**
- If using Yoast SEO Premium, enable the Article schema under Search Appearance > Content Types and set the author to Matt Wallmow. This will auto-generate BlogPosting schema for all posts.
- If implementing manually, replace `POST-SLUG`, `POST TITLE HERE`, dates, and image URLs for each post.
- The `author` and `publisher` use `@id` references to connect to the Person and Organization schemas defined elsewhere, building a connected entity graph.

---

## 7. Testimonials Page — AggregateRating + Review Schema

**URL:** `https://mattwallmow.com/testimonials/`
**Expected rich results:** Star ratings in search results, review snippets

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://mattwallmow.com/#business",
  "name": "Wallmow Realty, Inc",
  "url": "https://mattwallmow.com/",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "182",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "REVIEWER NAME 1"
      },
      "datePublished": "2025-12-01",
      "reviewBody": "PASTE ACTUAL REVIEW TEXT HERE. Use the exact text from the testimonials page.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "REVIEWER NAME 2"
      },
      "datePublished": "2025-11-15",
      "reviewBody": "PASTE ACTUAL REVIEW TEXT HERE.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "REVIEWER NAME 3"
      },
      "datePublished": "2025-10-20",
      "reviewBody": "PASTE ACTUAL REVIEW TEXT HERE.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  ]
}
</script>
```

**Notes:**
- **IMPORTANT:** Replace `REVIEWER NAME` and `PASTE ACTUAL REVIEW TEXT HERE` with the real testimonials displayed on the page. Google requires that review schema match visible on-page content. Using fabricated reviews or reviews not shown on the page violates Google's structured data guidelines and can result in a manual action.
- Include 3-10 of the strongest testimonials. You do not need to mark up every single review -- the `aggregateRating` covers the overall count.
- Update `reviewCount` as new Google reviews come in. As of the audit, the count is 182.
- `datePublished` should reflect when the review was originally posted. Use approximate dates if exact dates are not available from the testimonials page.

---

## 8. Contact Page — ContactPoint Schema

**URL:** `https://mattwallmow.com/contact/`
**Expected rich results:** Contact information in Knowledge Panel, phone number display

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://mattwallmow.com/#business",
  "name": "Wallmow Realty, Inc",
  "url": "https://mattwallmow.com/",
  "telephone": "+1-715-490-9930",
  "email": "matt@mattwallmow.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "48 W King St",
    "addressLocality": "Rhinelander",
    "addressRegion": "WI",
    "postalCode": "54501",
    "addressCountry": "US"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+1-715-490-9930",
      "contactType": "sales",
      "email": "matt@mattwallmow.com",
      "areaServed": "US",
      "availableLanguage": "English",
      "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    },
    {
      "@type": "ContactPoint",
      "telephone": "+1-715-490-9930",
      "contactType": "customer service",
      "email": "matt@mattwallmow.com",
      "areaServed": "US",
      "availableLanguage": "English"
    }
  ],
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.6366,
    "longitude": -89.4121
  },
  "hasMap": "https://www.google.com/maps?q=48+W+King+St,+Rhinelander,+WI+54501"
}
</script>
```

**Notes:**
- If Matt has a second office in Minocqua, add a second `PostalAddress` entry and corresponding `contactPoint`.
- `hoursAvailable` should match actual availability -- verify with Matt.
- The `hasMap` URL provides a direct Google Maps link for the office address.

---

## 9. BreadcrumbList Schema (All Pages)

Add this to every page on the site for improved SERP display with breadcrumb trails.

**Expected rich results:** Breadcrumb trail in search results (e.g., "Home > Communities > Oneida County")

### Homepage (minimal)

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
      "item": "https://mattwallmow.com/"
    }
  ]
}
</script>
```

### Service Page Example (Buyers)

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
      "item": "https://mattwallmow.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Buyers",
      "item": "https://mattwallmow.com/buyers/"
    }
  ]
}
</script>
```

### Community Page Example (Oneida County)

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
      "item": "https://mattwallmow.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Communities",
      "item": "https://mattwallmow.com/communities/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Oneida County",
      "item": "https://mattwallmow.com/oneida-county/"
    }
  ]
}
</script>
```

### Blog Post Example

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
      "item": "https://mattwallmow.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://mattwallmow.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "10 Pros and Cons of Waterfront Living in Minocqua, WI",
      "item": "https://mattwallmow.com/10-pros-and-cons-of-waterfront-living-in-minocqua-wi/"
    }
  ]
}
</script>
```

**Notes:**
- Yoast SEO generates BreadcrumbList schema automatically if breadcrumbs are enabled under SEO > Search Appearance > Breadcrumbs. Check this setting first -- if it is already on, do not add manual breadcrumb schema (it will create duplicates).
- If using manual implementation, apply the pattern above to every page, adjusting the hierarchy for each section.

---

## Implementation Guide

### Option A: Yoast SEO (Recommended if already installed)

1. **Organization schema:** Yoast > Search Appearance > General > Organization. Fill in all fields (name, logo, social profiles). This handles the Organization and WebSite schema automatically.
2. **Person schema:** Yoast handles this if you set the site to represent a "Person" under General settings. However, this conflicts with the Organization setting. For a solo agent like Matt, configure as Organization and add the Person schema manually.
3. **Article schema:** Yoast auto-generates Article/BlogPosting schema for posts if enabled under Content Types.
4. **Breadcrumbs:** Enable under SEO > Search Appearance > Breadcrumbs.
5. **Manual additions:** The RealEstateAgent, Service, Place, Review, and ContactPoint schemas must be added manually. Use the "Insert Headers and Footers" plugin or the AgentFire theme's per-page custom code injection.

### Option B: Manual Implementation (Per-Page Code Injection)

1. In the WordPress admin for each page, look for AgentFire's custom code area or use a plugin like "WPCode" (formerly Insert Headers and Footers).
2. Paste the appropriate `<script type="application/ld+json">` block into the page's `<head>` section.
3. Each page should have its own specific schema block(s) plus the BreadcrumbList.

### Option C: Theme Functions.php

Add schema output conditionally using WordPress template tags:

```php
add_action('wp_head', 'mattwallmow_schema_markup');
function mattwallmow_schema_markup() {
    if (is_front_page()) {
        // Output homepage schema
    } elseif (is_page('about')) {
        // Output Person schema
    } elseif (is_page('buyers')) {
        // Output Buyers Service schema
    }
    // ... etc.
}
```

This approach keeps all schema in one place and makes updates easier, but requires developer access.

### Validation

After implementing each schema block:

1. **Google Rich Results Test:** https://search.google.com/test/rich-results -- paste each page URL and verify no errors.
2. **Schema.org Validator:** https://validator.schema.org/ -- paste the JSON-LD to check structural validity.
3. **Google Search Console:** After deployment, monitor the Enhancements section for schema-related errors or warnings over the following 2-4 weeks.

### Priority Order for Implementation

| Priority | Page | Schema Types | Impact |
|----------|------|-------------|--------|
| 1 | Homepage | RealEstateAgent + LocalBusiness + Organization + WebSite | Highest -- affects Knowledge Panel and all local results |
| 2 | Testimonials | AggregateRating + Review | Star ratings in SERPs |
| 3 | Contact | ContactPoint | Phone/address display |
| 4 | About | Person | Author authority for E-E-A-T |
| 5 | Blog Posts | BlogPosting | Article rich results |
| 6 | Buyers | Service | Service rich snippets |
| 7 | Sellers | Service | Service rich snippets |
| 8 | Community Pages | Place | Geographic context |
| 9 | All Pages | BreadcrumbList | Navigation breadcrumbs in SERPs |
