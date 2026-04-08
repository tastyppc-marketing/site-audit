# Liane Jamason JSON-LD Schema Markup Reference

This document is a deployment-ready reference for the site's highest-value schema opportunities. Replace every placeholder before publishing, keep `@id` values consistent across pages, and validate each block after implementation.

Important deployment note: some blocks intentionally include placeholders such as `[VERIFY URL]`, `[VERIFY EXACT URL]`, `[ADD LICENSE NUMBER]`, and `>90` because those values were not confirmed in the audit. The JSON syntax is valid, but those placeholder values must be replaced before production validation.

## 1. Homepage - Organization + RealEstateAgent + WebSite

Implementation note: use this as the homepage entity graph, replace the incorrect homepage `Article` schema with `WebPage` at the page level, and avoid publishing a duplicate `WebSite` entity if Rank Math's existing `WebSite + SearchAction` output remains enabled.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.lianejamason.com/#org",
      "url": "https://www.lianejamason.com/",
      "name": "Corcoran Dwellings (Liane Jamason, LLC d/b/a Jamason Group)",
      "legalName": "Corcoran Dwellings (Liane Jamason, LLC d/b/a Jamason Group)",
      "description": "Florida real estate brokerage and luxury waterfront real estate brand serving St. Petersburg, Clearwater, Tampa, and Pinellas County.",
      "telephone": "727-755-3325",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1405 Dr. MLK Jr St N",
        "addressLocality": "St Petersburg",
        "addressRegion": "FL",
        "postalCode": "33704",
        "addressCountry": "US"
      },
      "parentOrganization": {
        "@type": "Organization",
        "name": "Corcoran Group"
      },
      "sameAs": [
        "[VERIFY URL] Zillow",
        "[VERIFY URL] Realtor.com",
        "[VERIFY URL] LinkedIn",
        "[VERIFY URL] Instagram",
        "[VERIFY URL] Facebook",
        "[VERIFY URL] YouTube",
        "[VERIFY URL] Corcoran.com profile",
        "[VERIFY URL] Google Business Profile"
      ]
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.lianejamason.com/#realestateagent",
      "url": "https://www.lianejamason.com/",
      "name": "Liane Jamason",
      "description": "Florida Real Estate Broker specializing in luxury waterfront real estate, waterfront homes, waterfront condos, historic homes, new construction, seller representation, and buyer representation across St. Petersburg, Clearwater, Tampa, and Pinellas County.",
      "telephone": "727-755-3325",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1405 Dr. MLK Jr St N",
        "addressLocality": "St Petersburg",
        "addressRegion": "FL",
        "postalCode": "33704",
        "addressCountry": "US"
      },
      "areaServed": [
        "St. Petersburg FL",
        "Clearwater FL",
        "Tampa FL",
        "Pinellas County FL",
        "Shore Acres",
        "Snell Isle",
        "Old Northeast",
        "Tierra Verde",
        "Venetian Isles",
        "Coffee Pot Bayou",
        "Downtown St. Pete",
        "Pass-a-Grille",
        "St. Pete Beach",
        "Treasure Island"
      ],
      "worksFor": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "sameAs": [
        "[VERIFY URL] Zillow",
        "[VERIFY URL] Realtor.com",
        "[VERIFY URL] LinkedIn",
        "[VERIFY URL] Instagram",
        "[VERIFY URL] Facebook",
        "[VERIFY URL] YouTube",
        "[VERIFY URL] Corcoran.com profile",
        "[VERIFY URL] Google Business Profile"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.lianejamason.com/#website",
      "url": "https://www.lianejamason.com/",
      "name": "Liane Jamason",
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

Notes:
- Replace every `sameAs` placeholder with the exact verified profile URL before deployment.
- Keep the canonical phone as `727-755-3325` in schema everywhere to eliminate the current NAP conflict.
- Keep the canonical address as `1405 Dr. MLK Jr St N, St Petersburg, FL 33704` in schema everywhere.
- If Rank Math continues to output `WebSite + SearchAction`, merge this entity data instead of publishing two competing `#website` nodes.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 2. Homepage - Person Schema for Liane Jamason

Implementation note: place this on the homepage or sitewide so the personal entity is connected to the organization and reusable as the canonical author for articles, community pages, and blog posts.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.lianejamason.com/#person-liane",
  "url": "https://www.lianejamason.com/",
  "name": "Liane Jamason",
  "jobTitle": "Broker/Owner, Corcoran Dwellings",
  "description": "Liane Jamason is a Florida Real Estate Broker serving St. Petersburg, Clearwater, Tampa, and Pinellas County, with a focus on luxury waterfront real estate, historic homes, new construction, and buyer and seller representation.",
  "memberOf": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "knowsAbout": [
    "Luxury waterfront real estate",
    "waterfront homes",
    "waterfront condos",
    "historic homes",
    "new construction",
    "seller representation",
    "buyer representation"
  ],
  "sameAs": [
    "[VERIFY URL] Zillow",
    "[VERIFY URL] Realtor.com",
    "[VERIFY URL] LinkedIn",
    "[VERIFY URL] Instagram",
    "[VERIFY URL] Facebook",
    "[VERIFY URL] YouTube",
    "[VERIFY URL] Corcoran.com profile",
    "[VERIFY URL] Google Business Profile"
  ]
}
```

Notes:
- Use this same `@id` as the canonical author reference on blog posts and neighborhood pages so older content no longer exposes `varick` as the author entity.
- Replace the `sameAs` placeholders with the exact verified URLs before validation.
- If the homepage already outputs a sitewide person schema, keep this `@id` and merge rather than duplicating the entity.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 3. About Page - Person + RealEstateAgent

Implementation note: use this on the About page at `https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/`, and pair it with an `AboutPage` or `ProfilePage` page-level schema so the current incorrect `Article` treatment is removed.

```json
{
  "@context": "https://schema.org",
  "@type": [
    "Person",
    "RealEstateAgent"
  ],
  "@id": "https://www.lianejamason.com/#person-liane",
  "url": "https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/",
  "mainEntityOfPage": {
    "@type": "AboutPage",
    "@id": "https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/"
  },
  "name": "Liane Jamason",
  "jobTitle": "Broker/Owner, Corcoran Dwellings",
  "description": "Liane Jamason is a Florida Real Estate Broker and Broker/Owner at Corcoran Dwellings serving St. Petersburg, Clearwater, Tampa, Pinellas County, and surrounding Tampa Bay markets. She specializes in luxury waterfront real estate, waterfront homes, waterfront condos, historic homes, new construction, seller representation, and buyer representation. Her market authority is reinforced by press coverage in Forbes, Wall Street Journal, USA Today, Huffington Post, Realtor.com, Bay News 9, ABC Action News, 10 Tampa Bay, and the Tampa Bay Times.",
  "worksFor": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "knowsAbout": [
    "Luxury waterfront real estate",
    "waterfront homes",
    "waterfront condos",
    "historic homes",
    "new construction",
    "seller representation",
    "buyer representation"
  ],
  "telephone": "727-755-3325",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1405 Dr. MLK Jr St N",
    "addressLocality": "St Petersburg",
    "addressRegion": "FL",
    "postalCode": "33704",
    "addressCountry": "US"
  },
  "areaServed": [
    "St. Petersburg FL",
    "Clearwater FL",
    "Tampa FL",
    "Pinellas County FL",
    "Shore Acres",
    "Snell Isle",
    "Old Northeast",
    "Tierra Verde",
    "Venetian Isles",
    "Coffee Pot Bayou",
    "Downtown St. Pete",
    "Pass-a-Grille",
    "St. Pete Beach",
    "Treasure Island"
  ],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "name": "Florida Real Estate Broker",
    "credentialCategory": "state professional license",
    "identifier": "[ADD LICENSE NUMBER]",
    "recognizedBy": {
      "@type": "Organization",
      "name": "State of Florida"
    }
  },
  "sameAs": [
    "[VERIFY URL] Zillow",
    "[VERIFY URL] Realtor.com",
    "[VERIFY URL] LinkedIn",
    "[VERIFY URL] Instagram",
    "[VERIFY URL] Facebook",
    "[VERIFY URL] YouTube",
    "[VERIFY URL] Corcoran.com profile",
    "[VERIFY URL] Google Business Profile"
  ]
}
```

Notes:
- Replace the current About page `Article` schema with an `AboutPage` or `ProfilePage` page-level object and keep this person entity as the page's main entity.
- Fill the actual Florida license number in `hasCredential.identifier` before deployment.
- Replace all `sameAs` placeholders with verified URLs.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 4. Contact Page - LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification

Implementation note: use this on `https://www.lianejamason.com/contact/` to create a clean local entity tied to the canonical NAP, customer-service contact point, approximate geo coordinates, and business hours.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.lianejamason.com/#localbusiness",
  "url": "https://www.lianejamason.com/contact/",
  "mainEntityOfPage": {
    "@type": "ContactPage",
    "@id": "https://www.lianejamason.com/contact/"
  },
  "name": "Corcoran Dwellings (Liane Jamason, LLC d/b/a Jamason Group)",
  "telephone": "727-755-3325",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1405 Dr. MLK Jr St N",
    "addressLocality": "St Petersburg",
    "addressRegion": "FL",
    "postalCode": "33704",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 27.7837,
    "longitude": -82.6584
  },
  "areaServed": [
    "St. Petersburg FL",
    "Clearwater FL",
    "Tampa FL",
    "Pinellas County FL"
  ],
  "parentOrganization": {
    "@id": "https://www.lianejamason.com/#org"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "727-755-3325",
      "contactType": "customer service",
      "areaServed": "St. Petersburg FL"
    }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "https://schema.org/Saturday",
      "opens": "10:00",
      "closes": "16:00"
    }
  ]
}
```

Notes:
- Verify the exact latitude and longitude for `1405 Dr. MLK Jr St N`; the coordinates above are intentionally approximate for the general St. Petersburg area.
- Verify the stated hours before deployment.
- Keep this block aligned with the exact same phone and address used in the homepage entities.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 5. Community / Neighborhood Page Template - Article + BreadcrumbList

Implementation note: use this structure for neighborhood and community pages so each page gets an article entity plus breadcrumb markup. Rank Math can output breadcrumbs globally, but the `Article` layer still needs a clean author, publisher, and `about` definition.

### Generic Template

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "[PAGE URL]#breadcrumb",
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
          "item": "[ST. PETERSBURG HUB URL]"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[NEIGHBORHOOD NAME]",
          "item": "[PAGE URL]"
        }
      ]
    },
    {
      "@type": "Article",
      "@id": "[PAGE URL]#article",
      "url": "[PAGE URL]",
      "headline": "[NEIGHBORHOOD NAME] Real Estate Guide",
      "description": "Guide to [NEIGHBORHOOD NAME] real estate in St. Petersburg, Florida, including local market context, buyer considerations, and seller insights.",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "[PAGE URL]"
      },
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "about": [
        {
          "@type": "Place",
          "name": "[NEIGHBORHOOD NAME], St. Petersburg, FL"
        },
        {
          "@type": "Thing",
          "name": "Luxury waterfront real estate"
        },
        {
          "@type": "Thing",
          "name": "Neighborhood guide"
        }
      ],
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "articleSection": "Neighborhood Guide",
      "inLanguage": "en-US"
    }
  ]
}
```

Notes:
- Replace `[ST. PETERSBURG HUB URL]`, `[PAGE URL]`, `[NEIGHBORHOOD NAME]`, and the publish/modified dates before deployment.
- Use `Liane Jamason` as the author on older neighborhood content instead of the exposed `varick` developer author.
- If neighborhood pages are not editorial in structure, `WebPage` can be substituted for `Article`, but keep the breadcrumb entity either way.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

### Example A - Shore Acres

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.lianejamason.com/st-petersburg/shore-acres/#breadcrumb",
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
      "@type": "Article",
      "@id": "https://www.lianejamason.com/st-petersburg/shore-acres/#article",
      "url": "https://www.lianejamason.com/st-petersburg/shore-acres/",
      "headline": "Shore Acres Real Estate Guide",
      "description": "Guide to Shore Acres real estate in St. Petersburg, Florida, with local insight on waterfront homes, buyer strategy, and flood zone considerations in this peninsular waterfront community.",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.lianejamason.com/st-petersburg/shore-acres/"
      },
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "about": [
        {
          "@type": "Place",
          "name": "Shore Acres, St. Petersburg, FL"
        },
        {
          "@type": "Thing",
          "name": "Waterfront homes"
        },
        {
          "@type": "Thing",
          "name": "Flood zone considerations"
        }
      ],
      "datePublished": "[VERIFY EXISTING WP PUBLISH DATE]",
      "dateModified": "[VERIFY LAST MODIFIED DATE]",
      "articleSection": "Neighborhood Guide",
      "inLanguage": "en-US"
    }
  ]
}
```

Notes:
- The Shore Acres page URL is confirmed in the audit.
- Verify that `https://www.lianejamason.com/st-petersburg/` is the correct middle breadcrumb URL; if not, replace it with the live St. Petersburg hub page.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

### Example B - Snell Isle

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.lianejamason.com/st-petersburg/snell-isle/#breadcrumb",
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
      "@type": "Article",
      "@id": "https://www.lianejamason.com/st-petersburg/snell-isle/#article",
      "url": "https://www.lianejamason.com/st-petersburg/snell-isle/",
      "headline": "Snell Isle Real Estate Guide",
      "description": "Guide to Snell Isle real estate in St. Petersburg, Florida, with local insight on waterfront homes, luxury inventory, and buyer strategy in one of the site's highest-opportunity neighborhoods.",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.lianejamason.com/st-petersburg/snell-isle/"
      },
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "about": [
        {
          "@type": "Place",
          "name": "Snell Isle, St. Petersburg, FL"
        },
        {
          "@type": "Thing",
          "name": "Luxury waterfront real estate"
        },
        {
          "@type": "Thing",
          "name": "Buyer opportunity neighborhood"
        }
      ],
      "datePublished": "[VERIFY EXISTING WP PUBLISH DATE]",
      "dateModified": "[VERIFY LAST MODIFIED DATE]",
      "articleSection": "Neighborhood Guide",
      "inLanguage": "en-US"
    }
  ]
}
```

Notes:
- The Snell Isle URL is assumed from site structure and must be verified before deployment.
- Verify the St. Petersburg hub breadcrumb URL here as well.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 6. Blog Post Template - BlogPosting + BreadcrumbList + ImageObject

Implementation note: use this for editorial blog posts so each post gets a clean author, image object, and breadcrumb path. This also fixes older content where the schema author is not mapped to `Liane Jamason`.

### Generic Template

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "[POST URL]#breadcrumb",
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
          "item": "[BLOG INDEX URL]"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[POST TITLE]",
          "item": "[POST URL]"
        }
      ]
    },
    {
      "@type": "BlogPosting",
      "@id": "[POST URL]#blogposting",
      "url": "[POST URL]",
      "headline": "[POST TITLE]",
      "description": "[POST META DESCRIPTION]",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "[POST URL]"
      },
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "image": {
        "@type": "ImageObject",
        "url": "[REPLACE WITH ACTUAL IMAGE URL]",
        "width": "[REPLACE WITH ACTUAL WIDTH]",
        "height": "[REPLACE WITH ACTUAL HEIGHT]",
        "caption": "[REPLACE WITH ACTUAL IMAGE ALT TEXT OR CAPTION]"
      },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "articleSection": "[BLOG CATEGORY]",
      "inLanguage": "en-US"
    }
  ]
}
```

Notes:
- Replace the post URL, blog index URL, title, description, image data, and dates before deployment.
- Keep `author` pointed at `https://www.lianejamason.com/#person-liane` to prevent the old `varick` author issue from leaking into structured data.
- Use the actual featured image URL and image dimensions from WordPress rather than guessing.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

### Filled Example - "9 Mistakes Luxury Waterfront and Historic Sellers Make"

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.lianejamason.com/9-mistakes-luxury-waterfront-and-historic-sellers-make/#breadcrumb",
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
          "name": "9 Mistakes Luxury Waterfront and Historic Sellers Make",
          "item": "https://www.lianejamason.com/9-mistakes-luxury-waterfront-and-historic-sellers-make/"
        }
      ]
    },
    {
      "@type": "BlogPosting",
      "@id": "https://www.lianejamason.com/9-mistakes-luxury-waterfront-and-historic-sellers-make/#blogposting",
      "url": "https://www.lianejamason.com/9-mistakes-luxury-waterfront-and-historic-sellers-make/",
      "headline": "9 Mistakes Luxury Waterfront and Historic Sellers Make",
      "description": "3,500-word seller guide covering common pricing, preparation, and marketing mistakes for luxury waterfront and historic home sellers in the St. Petersburg market.",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.lianejamason.com/9-mistakes-luxury-waterfront-and-historic-sellers-make/"
      },
      "author": {
        "@id": "https://www.lianejamason.com/#person-liane"
      },
      "publisher": {
        "@id": "https://www.lianejamason.com/#org"
      },
      "image": {
        "@type": "ImageObject",
        "url": "[REPLACE WITH ACTUAL IMAGE URL]",
        "width": "[REPLACE WITH ACTUAL WIDTH]",
        "height": "[REPLACE WITH ACTUAL HEIGHT]",
        "caption": "[REPLACE WITH ACTUAL IMAGE ALT TEXT OR CAPTION]"
      },
      "wordCount": 3500,
      "datePublished": "[VERIFY EXISTING WP PUBLISH DATE]",
      "dateModified": "[VERIFY LAST MODIFIED DATE]",
      "articleSection": "Seller Advice",
      "inLanguage": "en-US"
    }
  ]
}
```

Notes:
- The post URL and blog index URL above are reasonable WordPress assumptions and both should be verified before deployment.
- Replace the placeholder `ImageObject` values with the actual featured image URL, dimensions, and caption or alt text.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 7. Buyer FAQ - FAQPage with 6 Q&A Pairs

Implementation note: deploy this on the main buyer page or the strongest buyer guide page once the canonical URL is confirmed. The content below uses only audit-supported St. Petersburg and Tampa Bay market details.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.lianejamason.com/#buyer-faq",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[BUYER PAGE URL]"
  },
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which St. Petersburg neighborhoods give buyers the best chance to find opportunities beyond the biggest national portals?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The St. Petersburg market is very competitive and broad keyword searches are dominated by national portals such as Zillow, Redfin, and Trulia. The audit identified Snell Isle, Downtown St. Pete condos, Old Northeast, and St. Pete waterfront condos as some of the best local opportunity areas where focused neighborhood guidance can help buyers move beyond the most portal-heavy search results."
      }
    },
    {
      "@type": "Question",
      "name": "What should buyers understand about flood zones before purchasing a waterfront home in St. Petersburg?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flood zone and insurance planning are material parts of buying waterfront property in St. Petersburg, especially in neighborhoods such as Shore Acres and other bayfront communities. Liane Jamason's buyer guidance should address current flood zone status, elevation and insurance implications, and how those factors affect waterfront homes and condos before a purchase decision is made."
      }
    },
    {
      "@type": "Question",
      "name": "Why is Shore Acres a unique buyer search area within St. Petersburg?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Shore Acres is a peninsular waterfront community, which makes water access and flood-related due diligence especially important for buyers. For clients targeting luxury waterfront real estate, the neighborhood deserves its own search strategy rather than being treated like a generic St. Petersburg home search."
      }
    },
    {
      "@type": "Question",
      "name": "Should buyers focus only on St. Petersburg, or also include Tampa and the broader Tampa Bay market in their search?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Liane Jamason serves Pinellas County broadly and also extends into Tampa and Hillsborough County, which matters when inventory is tight or when buyers want to compare coastal living with other Tampa Bay options. Buyers looking for more selection, including some new construction opportunities, should often compare St. Petersburg with other Tampa Bay communities rather than limiting the search to one city."
      }
    },
    {
      "@type": "Question",
      "name": "Where should buyers look if they want new construction but still want guidance from a St. Petersburg-focused broker?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The site's audit notes that new construction service extends beyond St. Petersburg into Wesley Chapel and other Tampa Bay communities. That means buyers can work with Liane Jamason for a St. Petersburg-based perspective while also evaluating newer inventory across the broader regional market."
      }
    },
    {
      "@type": "Question",
      "name": "How can buyers search listings directly through Liane Jamason's site instead of relying only on Zillow or Redfin?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The site uses iHomefinder IDX on idx.lianejamason.com for property search. Buyers who want a more direct path into the local inventory can use that IDX search alongside Liane Jamason's neighborhood guidance for St. Petersburg, Clearwater, Tampa, and Pinellas County, especially in waterfront and luxury segments."
      }
    }
  ]
}
```

Notes:
- Replace `[BUYER PAGE URL]` with the actual canonical URL of the buyer page or buyer guide before deployment.
- This block is strongest when the on-page FAQ content matches these questions and answers closely.
- The answers intentionally stay within audit-supported facts and avoid unsupported market-stat claims.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 8. Seller FAQ - FAQPage with 5 Q&A Pairs

Implementation note: deploy this on the main seller page or strongest seller guide once the canonical URL is confirmed. The Q&A below uses the site's actual seller positioning, testimonials, CMA offer, press signals, and market focus.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.lianejamason.com/#seller-faq",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[SELLER PAGE URL]"
  },
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does Liane Jamason's CMA process help St. Petersburg sellers price a home correctly?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The site offers a Comparative Market Analysis through the Market Analysis page, which gives sellers a structured starting point for pricing decisions. For St. Petersburg and Pinellas County sellers, that process is especially important when a property falls into luxury waterfront, condo, historic home, or other niche segments where broad averages are less useful."
      }
    },
    {
      "@type": "Question",
      "name": "What makes pricing a waterfront home in St. Petersburg different from pricing a standard property?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Waterfront pricing in St. Petersburg is not just about square footage or bedroom count. In neighborhoods such as Shore Acres, Snell Isle, Venetian Isles, Tierra Verde, Pass-a-Grille, St. Pete Beach, and Treasure Island, value is shaped by water orientation, boating access, flood considerations, lot position, renovation level, and the expectations of luxury buyers."
      }
    },
    {
      "@type": "Question",
      "name": "How does Corcoran Dwellings market luxury listings differently for sellers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Corcoran Dwellings gives sellers the backing of a luxury national brand while keeping the representation local to the St. Petersburg and Tampa Bay market. For higher-end waterfront, condo, and historic properties, that combination supports stronger positioning, more polished presentation, and a marketing approach that is aligned with luxury buyer expectations."
      }
    },
    {
      "@type": "Question",
      "name": "What timeline should sellers expect when preparing and listing a St. Petersburg luxury or waterfront home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The timeline depends on property condition, pricing accuracy, and how much preparation is needed before launch. Waterfront and historic properties often require more upfront work because photography, staging, disclosures, flood-related documentation, and buyer qualification matter more in these segments than they do for a standard home sale."
      }
    },
    {
      "@type": "Question",
      "name": "Why do Liane Jamason's broker credentials, press coverage, and client testimonials matter to sellers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Liane Jamason is a Broker/Owner at Corcoran Dwellings, not just an agent, and the site cites press coverage from Forbes, Wall Street Journal, USA Today, Huffington Post, Realtor.com, Bay News 9, ABC Action News, 10 Tampa Bay, and the Tampa Bay Times. Combined with 90+ testimonials and a 3,500-word seller resource on luxury waterfront and historic seller mistakes, those signals help establish authority and trust with prospective sellers."
      }
    }
  ]
}
```

Notes:
- Replace `[SELLER PAGE URL]` with the actual canonical seller page URL before deployment.
- This block should be added to a page where the visible FAQ content substantially matches the schema text.
- If the Sell page carries the strongest testimonial content, it is the first candidate for this FAQ block.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## 9. Reviews Page - AggregateRating

Implementation note: use this on `https://www.lianejamason.com/reviews/` and update the review count from the live page before deployment. This is the highest-impact schema opportunity in the audit, but it should be paired with third-party review verification where possible.

```json
{
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "@id": "https://www.lianejamason.com/reviews/#aggregate-rating",
  "url": "https://www.lianejamason.com/reviews/",
  "itemReviewed": {
    "@id": "https://www.lianejamason.com/#realestateagent"
  },
  "ratingValue": 5.0,
  "reviewCount": ">90",
  "bestRating": 5,
  "worstRating": 1
}
```

Notes:
- Update `reviewCount` with the exact live total from the reviews page before deployment; `>90` is a planning placeholder from the audit and will not validate as a final production value.
- Google does not show rich results for self-hosted review schemas without third-party verification, so add this alongside Birdeye or TestimonialTree embeds if available.
- Keep `itemReviewed` pointed at `https://www.lianejamason.com/#realestateagent` so review equity rolls up to the primary business entity.

Validation: https://validator.schema.org/ and https://search.google.com/test/rich-results

## Implementation Checklist

1. CRITICAL (week 1): Reviews page `AggregateRating` - biggest SERP impact (star ratings)
2. CRITICAL (week 1): FAQ schemas on Buyer/Seller pages - rich result eligibility
3. HIGH (week 2): Homepage `@graph` (`Organization + RealEstateAgent + WebSite`)
4. HIGH (week 2): Person schema (About page + Homepage)
5. HIGH (month 1): Contact page `LocalBusiness`
6. MEDIUM (month 1): `BreadcrumbList` on all pages - enable in Rank Math settings
7. MEDIUM (month 1): Neighborhood page `Article` schema
8. LOWER (month 2): `BlogPosting` refinements

## Final QA Before Deployment

- Verify all social/profile URLs, Google Business Profile URL, Corcoran.com profile URL, and any external `sameAs` links.
- Confirm the exact Florida license number, exact review count, exact business hours, exact coordinates, and exact blog/community canonical URLs before publication.
- Remove or replace the incorrect homepage and About page `Article` schema so page types are no longer misclassified.
- Validate each finished block in Schema.org Validator and Google's Rich Results Test after placeholder replacement.
