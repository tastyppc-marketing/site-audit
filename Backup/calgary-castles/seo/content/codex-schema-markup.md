# Production-Ready JSON-LD Schema Markup for sellingcalgarycastles.com

This document provides page-specific JSON-LD blocks for sellingcalgarycastles.com using a consistent `@id` structure, `www` URLs, and schema types appropriate for a Calgary real estate website. FAQ pricing and financing references were normalized to February 2026 CREB market data and current Canada.ca / Alberta rules available as of April 1, 2026.

Use each block only on its matching page. In Sierra Interactive, paste the raw JSON-LD into Custom Code Injection for that page and place it in the `<head>` inside a `<script type="application/ld+json">` tag.

## Table of Contents

- [Block 1: Homepage `@graph` - Organization, RealEstateAgent, WebSite, SearchAction](#block-1-homepage-graph---organization-realestateagent-website-searchaction)
- [Block 2: About Page Person Schema](#block-2-about-page-person-schema)
- [Block 3: Contact Page LocalBusiness + RealEstateAgent](#block-3-contact-page-localbusiness--realestateagent)
- [Block 4: Community Page Examples - Auburn Bay and Cranston](#block-4-community-page-examples---auburn-bay-and-cranston)
- [Block 5: Blog Post Example - Mortgage Rates Post](#block-5-blog-post-example---mortgage-rates-post)
- [Block 6: Buyer FAQ Schema](#block-6-buyer-faq-schema)
- [Block 7: Seller FAQ Schema](#block-7-seller-faq-schema)
- [Block 8: AggregateRating Template](#block-8-aggregaterating-template)

## Block 1: Homepage `@graph` - Organization, RealEstateAgent, WebSite, SearchAction

Use on `https://www.sellingcalgarycastles.com/`. Paste into Sierra Interactive Custom Code Injection for the homepage and place it in the `<head>` section.

```json-ld
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.sellingcalgarycastles.com/#organization",
      "name": "Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/_media/site-logo-1708132305286.png"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+1-403-271-0600",
          "contactType": "customer service",
          "email": "calgarycastles@live.com",
          "areaServed": "CA",
          "availableLanguage": [
            "English"
          ]
        }
      ],
      "sameAs": [
        "https://www.cirrealty.ca",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV",
        "https://ca.linkedin.com/in/calgarycastles"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#130, 703 - 64th Avenue SE",
        "addressLocality": "Calgary",
        "addressRegion": "AB",
        "postalCode": "T2H 2C3",
        "addressCountry": "CA"
      }
    },
    {
      "@type": [
        "RealEstateAgent",
        "Person"
      ],
      "@id": "https://www.sellingcalgarycastles.com/#agent",
      "name": "Neil Rowlandson",
      "worksFor": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "url": "https://www.sellingcalgarycastles.com/",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "sameAs": [
        "https://www.sellingcalgarycastles.com/#neil-rowlandson",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV",
        "https://ca.linkedin.com/in/calgarycastles"
      ],
      "areaServed": [
        {
          "@type": "City",
          "name": "Calgary"
        },
        {
          "@type": "Place",
          "name": "Auburn Bay, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Bridlewood, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Chaparral, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Cranston, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Evergreen, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Legacy, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Mahogany, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "McKenzie Towne, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "New Brighton, Calgary, AB"
        },
        {
          "@type": "Place",
          "name": "Walden, Calgary, AB"
        }
      ],
      "knowsAbout": [
        "Residential real estate",
        "Mortgage financing",
        "Calgary real estate market"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.sellingcalgarycastles.com/#website",
      "url": "https://www.sellingcalgarycastles.com/",
      "name": "Calgary Castles | Calgary Real Estate",
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.sellingcalgarycastles.com/property-search/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

## Block 2: About Page Person Schema

Use on `https://www.sellingcalgarycastles.com/about/`. Paste into Sierra Interactive Custom Code Injection for the About page and place it in the `<head>` section.

```json-ld
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.sellingcalgarycastles.com/#neil-rowlandson",
  "name": "Neil Rowlandson",
  "jobTitle": "REALTOR",
  "worksFor": {
    "@id": "https://www.sellingcalgarycastles.com/#organization"
  },
  "memberOf": {
    "@type": "Organization",
    "name": "CIR Realty",
    "url": "https://www.cirrealty.ca"
  },
  "description": "20+ years residential real estate experience in Calgary, AB, combined with 10 years in banking and mortgage financing. Specializes in SE Calgary communities.",
  "telephone": "+1-403-271-0600",
  "email": "calgarycastles@live.com",
  "url": "https://www.sellingcalgarycastles.com/about/",
  "image": "https://www.sellingcalgarycastles.com/_media/Images/photo.png",
  "sameAs": [
    "https://www.cirrealty.ca",
    "https://www.instagram.com/calgary_castles_real_estate/",
    "https://www.youtube.com/@CalgaryCastlesTV",
    "https://ca.linkedin.com/in/calgarycastles"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "#130, 703 - 64th Avenue SE",
    "addressLocality": "Calgary",
    "addressRegion": "AB",
    "postalCode": "T2H 2C3",
    "addressCountry": "CA"
  },
  "knowsAbout": [
    "Calgary real estate",
    "SE Calgary communities",
    "Home buying",
    "Home selling",
    "Mortgage pre-approval",
    "Calgary market trends"
  ],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "name": "Banking and mortgage financing background",
    "description": "Neil Rowlandson brings 10 years of banking and mortgage financing experience to his real estate practice."
  }
}
```

## Block 3: Contact Page LocalBusiness + RealEstateAgent

Use on `https://www.sellingcalgarycastles.com/contact/`. Paste into Sierra Interactive Custom Code Injection for the Contact page and place it in the `<head>` section. Sunday hours below are modeled as a by-appointment placeholder using `09:00` to `12:00`; confirm this with the client before publishing.

```json-ld
{
  "@context": "https://schema.org",
  "@type": [
    "LocalBusiness",
    "RealEstateAgent"
  ],
  "@id": "https://www.sellingcalgarycastles.com/#local-business",
  "name": "Calgary Castles Team",
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
  "telephone": "+1-403-271-0600",
  "email": "calgarycastles@live.com",
  "url": "https://www.sellingcalgarycastles.com/contact/",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+1-403-271-0600",
      "contactType": "sales",
      "areaServed": "CA",
      "availableLanguage": [
        "English"
      ]
    }
  ],
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
      "dayOfWeek": [
        "Saturday"
      ],
      "opens": "10:00",
      "closes": "16:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Sunday"
      ],
      "opens": "09:00",
      "closes": "12:00"
    }
  ],
  "priceRange": "$$",
  "currenciesAccepted": "CAD",
  "paymentAccepted": "Bank transfer, cheque",
  "areaServed": {
    "@type": "Place",
    "name": "Calgary, AB"
  }
}
```

## Block 4: Community Page Examples - Auburn Bay and Cranston

### Example A: Auburn Bay Community Page

Use on `https://www.sellingcalgarycastles.com/auburn-bay/`. Paste into Sierra Interactive Custom Code Injection for the Auburn Bay page and place it in the `<head>` section.

```json-ld
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#article",
      "headline": "Auburn Bay Homes for Sale - Auburn Bay Real Estate Calgary",
      "description": "Browse Auburn Bay homes for sale in SE Calgary. Lake community with 43-acre lake, 43+ amenities, and new/resale homes. Search Auburn Bay real estate with Neil Rowlandson, Calgary Castles Team, CIR Realty.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#neil-rowlandson"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "dateModified": "2026-03-31",
      "mainEntityOfPage": {
        "@id": "https://www.sellingcalgarycastles.com/auburn-bay/"
      },
      "image": "https://www.sellingcalgarycastles.com/images/auburn-bay-homes-for-sale.jpg",
      "keywords": "Auburn Bay homes for sale, Auburn Bay real estate, SE Calgary lake community"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Communities",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/communities/"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Auburn Bay",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/auburn-bay/"
          }
        }
      ]
    }
  ]
}
```

### Example B: Cranston Community Page

Use on `https://www.sellingcalgarycastles.com/cranston/`. Paste into Sierra Interactive Custom Code Injection for the Cranston page and place it in the `<head>` section.

```json-ld
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/cranston/#article",
      "headline": "Cranston Homes for Sale - Cranston Real Estate Calgary",
      "description": "Explore Cranston real estate in SE Calgary. Family-friendly community with Cranston's Resident Association (The Century Hall), nature reserve access, and diverse housing options. Search Cranston homes with Calgary Castles Team.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#neil-rowlandson"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "dateModified": "2026-03-31",
      "mainEntityOfPage": {
        "@id": "https://www.sellingcalgarycastles.com/cranston/"
      },
      "image": "https://www.sellingcalgarycastles.com/images/cranston-homes-for-sale.jpg",
      "keywords": "Cranston homes for sale, Cranston real estate Calgary, SE Calgary real estate"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/cranston/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Communities",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/communities/"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Cranston",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/cranston/"
          }
        }
      ]
    }
  ]
}
```

## Block 5: Blog Post Example - Mortgage Rates Post

Use on `https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/`. Paste into Sierra Interactive Custom Code Injection for that post and place it in the `<head>` section.

```json-ld
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.sellingcalgarycastles.com/#organization",
      "name": "Calgary Castles Team",
      "url": "https://www.sellingcalgarycastles.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/_media/site-logo-1708132305286.png"
      }
    },
    {
      "@type": "ImageObject",
      "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#primaryimage",
      "url": "https://www.sellingcalgarycastles.com/images/blog/mortgage-rates-calgary.jpg",
      "width": 1200,
      "height": 630,
      "caption": "Calgary homes and mortgage rate impact"
    },
    {
      "@type": "BlogPosting",
      "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#blogposting",
      "headline": "Will Increasing Mortgage Rates Impact Home Prices?",
      "description": "Analysis of how rising mortgage rates affect Calgary home prices in 2026 and what Calgary buyers and sellers should know locally.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#neil-rowlandson"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#organization"
      },
      "datePublished": "2026-02-02",
      "dateModified": "2026-03-31",
      "mainEntityOfPage": {
        "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/"
      },
      "image": {
        "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#primaryimage"
      },
      "articleSection": "Calgary Real Estate Market",
      "keywords": "Calgary mortgage rates, Calgary home prices 2026, Calgary real estate market"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/blog/"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Will Increasing Mortgage Rates Impact Home Prices?",
          "item": {
            "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/"
          }
        }
      ]
    }
  ]
}
```

## Block 6: Buyer FAQ Schema

Use on `https://www.sellingcalgarycastles.com/buyers/`. Paste into Sierra Interactive Custom Code Injection for the Buyers page and place it in the `<head>` section. Make sure the same FAQ content is visibly present on the page.

```json-ld
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.sellingcalgarycastles.com/buyers/#faq",
  "url": "https://www.sellingcalgarycastles.com/buyers/",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average home price in Calgary in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As of February 2026, Calgary's benchmark home price is $560,500 and the average sale price is $627,841 across all residential property types. By benchmark price, detached homes are at $734,300, semi-detached homes at $682,200, row homes at $423,600, and apartment condominiums at $298,600. Prices vary by community, and premium SE Calgary communities such as Auburn Bay, Mahogany, and Cranston often trade above the citywide benchmark for comparable detached homes. Contact Neil Rowlandson for a current market analysis before making an offer."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a down payment to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. In Canada, the minimum down payment is 5% on homes up to $500,000, 5% on the first $500,000 and 10% on the portion from $500,000 to $1.5 million, and 20% on homes at $1.5 million or more. If your down payment is under 20%, your lender will generally require mortgage default insurance. Buyers can use savings, gifted funds, RRSP withdrawals under the Home Buyers' Plan, and eligible FHSA funds, subject to lender and program rules."
      }
    },
    {
      "@type": "Question",
      "name": "What are closing costs when buying a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary buyers should budget roughly 1.5% to 3.5% of the purchase price in cash closing costs beyond the down payment, depending on financing and adjustments. Common costs include Alberta Land Titles transfer and mortgage registration fees, legal fees, a home inspection, title insurance, property tax adjustments, and moving expenses. Alberta does not use the land transfer tax charged in some other provinces, but it does charge registration fees. On a $560,500 benchmark-priced home with a mortgage, many buyers will land around $3,500 to $6,500 in closing costs, plus any CMHC insurance premium if it is not rolled into the mortgage."
      }
    },
    {
      "@type": "Question",
      "name": "What is the first-time home buyer incentive available in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The main programs available to Calgary first-time buyers in 2026 are the FHSA, which gives eligible buyers $8,000 of annual contribution room up to a $40,000 lifetime limit, the Home Buyers' Plan, which allows eligible RRSP withdrawals of up to $60,000, and the federal Home Buyers' Amount tax credit, worth up to $1,500 in tax relief. For qualifying new homes, the new first-time home buyers' GST/HST rebate can also return up to $50,000. Program rules vary, so confirm eligibility with your lender, accountant, or mortgage broker before relying on them."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A typical Calgary home purchase takes about 45 to 90 days from pre-approval to possession. Mortgage pre-approval often takes 1 to 5 business days. Once an offer is accepted, the conditional period is commonly 5 to 10 business days for financing, inspection, and document review, and possession is often 30 to 60 days after conditions are removed. In tighter detached segments of the Calgary market, buyers may need to move faster on strong listings."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a real estate agent to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, but it is usually smart to have one. In most Calgary resale transactions, the seller funds the commission offered to the buyer's brokerage, so buyers often do not pay their agent directly. That said, representation agreements can require buyer-paid compensation in some cases, especially with certain new-construction or low-commission listings, so read the paperwork carefully. A strong buyer's agent can help with MLS access, pricing, negotiations, conditions, and the path from accepted offer to possession."
      }
    }
  ]
}
```

## Block 7: Seller FAQ Schema

Use on `https://www.sellingcalgarycastles.com/sellers/`. Paste into Sierra Interactive Custom Code Injection for the Sellers page and place it in the `<head>` section. Make sure the same FAQ content is visibly present on the page.

```json-ld
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.sellingcalgarycastles.com/sellers/#faq",
  "url": "https://www.sellingcalgarycastles.com/sellers/",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is my Calgary home worth in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As of February 2026, Calgary's detached benchmark price is $734,300, while the overall residential benchmark is $560,500. Your home's actual value depends on location, lot, size, condition, renovations, backing, and competing inventory. Premium SE Calgary communities such as Auburn Bay, Mahogany, and Cranston often command stronger pricing than the citywide average, but the most accurate number comes from a Comparative Market Analysis based on recent nearby sales. Request a free CMA from Neil Rowlandson at calgarycastles@live.com."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As of February 2026, homes averaged 42 days on market across Calgary. Detached homes averaged 35 days, row homes 44 days, semi-detached homes 45 days, and apartment condos 54 days. Well-priced, well-presented homes in desirable SE Calgary communities can still attract offers much faster, while overpriced or dated homes can sit significantly longer."
      }
    },
    {
      "@type": "Question",
      "name": "What are the costs of selling a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The biggest selling cost is usually commission, but in Alberta commission is negotiable and there is no standard province-wide rate. Sellers should also budget for GST on commission, legal fees that often land around $800 to $1,500, mortgage discharge fees if applicable, cleaning or staging, pre-listing touch-ups, and moving costs. As a quick rule of thumb, every 1% of commission on a $700,000 sale equals $7,000 before GST. Neil Rowlandson can prepare a net sheet so you know the likely proceeds before you list."
      }
    },
    {
      "@type": "Question",
      "name": "Should I sell my home before buying in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It depends on your finances and risk tolerance. Selling first gives you a firm budget and reduces the risk of carrying two homes, but you may need temporary housing or flexible possession dates. Buying first can make the move easier if you find the right next property, but it may require bridge financing or a subject-to-sale condition. In early 2026, Calgary's detached market remained tighter than the apartment segment, so the right strategy depends on what you own and what you plan to buy."
      }
    }
  ]
}
```

## Block 8: AggregateRating Template

Recommended page: `https://www.sellingcalgarycastles.com/about/`, with the homepage also acceptable if that is the primary branded entity page in Sierra Interactive. Paste into Sierra Interactive Custom Code Injection only after replacing `ratingValue` and `reviewCount` with verified live values from a real review source.

Do not publish fabricated ratings. Google can treat fabricated review markup as spam and issue a manual action. Also note that Google generally does not show self-serving review stars for `LocalBusiness` or `Organization` entities on their own sites, so treat this as machine-readable review markup, not a guaranteed SERP star feature.

```json-ld
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.sellingcalgarycastles.com/#agent",
  "name": "Calgary Castles Team - Neil Rowlandson",
  "url": "https://www.sellingcalgarycastles.com/about/",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 5.0,
    "reviewCount": 47,
    "bestRating": 5,
    "worstRating": 1
  }
}
```

## Implementation Notes

- In Sierra Interactive, add each block to the matching page only. Wrap the raw JSON-LD in `<script type="application/ld+json">` and place it in the page-level `<head>` injection area.
- Test every deployed block in Google's Rich Results Test: `https://search.google.com/test/rich-results`
- Also validate in Schema Markup Validator: `https://validator.schema.org/`
- FAQ schema is still valid, but Google FAQ rich results are generally limited to authoritative government and health sites. Use the FAQ markup here for structured understanding and future-proofing, not with the expectation of guaranteed FAQ rich snippets.
- Do not publish the AggregateRating block until `ratingValue` and `reviewCount` are sourced from verified reviews such as Google Business Profile, Realtor.ca, or another auditable review source tied to the business.
- Even with real reviews, Google generally does not show self-serving review stars for `LocalBusiness` and `Organization` pages on the business's own site.
- Keep FAQ content and any review content visibly present on the page. Hidden FAQ or review markup can create guideline risk.
- Update every `dateModified` value whenever the page content is refreshed.
- Verify the Sunday contact hours with the client before publishing, since the current schema models Sunday as a by-appointment placeholder.
- Replace any image, logo, or route URL if Sierra Interactive uses a different final asset path or canonical URL. If the live site keeps `.html` or non-trailing-slash canonicals, update `url`, `mainEntityOfPage`, breadcrumb `item`, and page-level `@id` paths to match the final live canonical.
