# JSON-LD Schema Markup: livingparkcityutah.com

## Overview
This file includes production-ready JSON-LD script tags for the homepage, about page, contact page, reusable templates for community pages and blog posts, and FAQPage markup for the buyer and seller resource pages. Replace all placeholder values (for example, `[REPLACE_WITH_...]`) with values that are visibly present on each page before deployment, then validate in Google Rich Results Test and Schema Markup Validator.

---

## 1. Homepage Schema

### 1a. RealEstateAgent + AggregateRating (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/
Insert: inside <head> (preferred), one script instance only
Customize: streetAddress, postalCode, image paths, license numbers, and social profile URLs
Keep: aggregateRating values aligned with visible on-page review content
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://livingparkcityutah.com/#brokerage",
      "name": "Summit Sotheby's International Realty",
      "url": "https://www.summitsothebysrealty.com/"
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://livingparkcityutah.com/#real-estate-team",
      "name": "Tisha and Cam at Summit Sotheby's International Realty",
      "url": "https://livingparkcityutah.com/",
      "telephone": "+1-801-898-2447",
      "priceRange": "$$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "[REPLACE_WITH_STREET_ADDRESS]",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "[REPLACE_WITH_ZIP]",
        "addressCountry": "US"
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Park City"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Summit County"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Wasatch County"
        }
      ],
      "image": "https://livingparkcityutah.com/[REPLACE_WITH_TEAM_IMAGE_PATH]",
      "parentOrganization": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "employee": [
        {
          "@id": "https://livingparkcityutah.com/#tisha-digman"
        },
        {
          "@id": "https://livingparkcityutah.com/#cam-schiedel"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "Person",
      "@id": "https://livingparkcityutah.com/#tisha-digman",
      "name": "Tisha Digman",
      "jobTitle": "Real Estate Agent",
      "url": "https://livingparkcityutah.com/about/",
      "worksFor": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "affiliation": {
        "@id": "https://livingparkcityutah.com/#real-estate-team"
      },
      "areaServed": [
        "Park City, Utah",
        "Summit County, Utah",
        "Wasatch County, Utah"
      ],
      "knowsAbout": [
        "Luxury real estate",
        "Ski properties",
        "Deer Valley",
        "Park City neighborhoods"
      ],
      "identifier": {
        "@type": "PropertyValue",
        "name": "UT Real Estate License",
        "value": "[REPLACE_WITH_TISHA_LICENSE_NUMBER]"
      },
      "sameAs": [
        "https://www.instagram.com/[REPLACE_WITH_TISHA_HANDLE]",
        "https://www.facebook.com/[REPLACE_WITH_TISHA_PROFILE]",
        "https://www.linkedin.com/in/[REPLACE_WITH_TISHA_PROFILE]"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://livingparkcityutah.com/#cam-schiedel",
      "name": "Cam Schiedel",
      "jobTitle": "Real Estate Agent",
      "url": "https://livingparkcityutah.com/about/",
      "worksFor": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "affiliation": {
        "@id": "https://livingparkcityutah.com/#real-estate-team"
      },
      "areaServed": [
        "Park City, Utah",
        "Summit County, Utah",
        "Wasatch County, Utah"
      ],
      "knowsAbout": [
        "Luxury real estate",
        "Ski properties",
        "Deer Valley",
        "Park City neighborhoods"
      ],
      "identifier": {
        "@type": "PropertyValue",
        "name": "UT Real Estate License",
        "value": "[REPLACE_WITH_CAM_LICENSE_NUMBER]"
      },
      "sameAs": [
        "https://www.instagram.com/[REPLACE_WITH_CAM_HANDLE]",
        "https://www.facebook.com/[REPLACE_WITH_CAM_PROFILE]",
        "https://www.linkedin.com/in/[REPLACE_WITH_CAM_PROFILE]"
      ]
    }
  ]
}
</script>
```

### 1b. WebSite with SearchAction (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/
Insert: inside <head>, one script instance only
Customize: search results URL template so it matches the live Sierra Interactive site search endpoint
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://livingparkcityutah.com/#website",
  "name": "Living Park City Utah",
  "url": "https://livingparkcityutah.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://livingparkcityutah.com/property-search/results/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
</script>
```

---

## 2. About Page Schema

### 2a. Person Schema for Both Agents (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/about/
Insert: inside <head> (preferred), one script instance only
Customize: profile URLs, image URLs, and license placeholders
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://livingparkcityutah.com/#brokerage",
      "name": "Summit Sotheby's International Realty",
      "url": "https://www.summitsothebysrealty.com/"
    },
    {
      "@type": "Person",
      "@id": "https://livingparkcityutah.com/about/#tisha-digman",
      "name": "Tisha Digman",
      "jobTitle": "Real Estate Agent",
      "worksFor": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "areaServed": [
        "Park City, Utah",
        "Summit County, Utah",
        "Wasatch County, Utah"
      ],
      "knowsAbout": [
        "Luxury real estate",
        "Ski properties",
        "Deer Valley",
        "Park City neighborhoods"
      ],
      "identifier": {
        "@type": "PropertyValue",
        "name": "UT Real Estate License",
        "value": "[REPLACE_WITH_TISHA_LICENSE_NUMBER]"
      },
      "sameAs": [
        "https://www.instagram.com/[REPLACE_WITH_TISHA_HANDLE]",
        "https://www.facebook.com/[REPLACE_WITH_TISHA_PROFILE]",
        "https://www.linkedin.com/in/[REPLACE_WITH_TISHA_PROFILE]"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://livingparkcityutah.com/about/#cam-schiedel",
      "name": "Cam Schiedel",
      "jobTitle": "Real Estate Agent",
      "worksFor": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "areaServed": [
        "Park City, Utah",
        "Summit County, Utah",
        "Wasatch County, Utah"
      ],
      "knowsAbout": [
        "Luxury real estate",
        "Ski properties",
        "Deer Valley",
        "Park City neighborhoods"
      ],
      "identifier": {
        "@type": "PropertyValue",
        "name": "UT Real Estate License",
        "value": "[REPLACE_WITH_CAM_LICENSE_NUMBER]"
      },
      "sameAs": [
        "https://www.instagram.com/[REPLACE_WITH_CAM_HANDLE]",
        "https://www.facebook.com/[REPLACE_WITH_CAM_PROFILE]",
        "https://www.linkedin.com/in/[REPLACE_WITH_CAM_PROFILE]"
      ]
    }
  ]
}
</script>
```

---

## 3. Contact Page Schema

### 3a. RealEstateAgent (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/contact/
Insert: inside <head> (preferred), one script instance only
Customize: exact street address and postal code when confirmed
Note: priceRange intentionally set to user-specified placeholder value
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://livingparkcityutah.com/contact/#real-estate-agent",
  "name": "Tisha and Cam at Summit Sotheby's International Realty",
  "url": "https://livingparkcityutah.com/contact/",
  "telephone": "+1-801-898-2447",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[REPLACE_WITH_STREET_ADDRESS]",
    "addressLocality": "Park City",
    "addressRegion": "UT",
    "postalCode": "[REPLACE_WITH_ZIP]",
    "addressCountry": "US"
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
      "closes": "16:00"
    }
  ],
  "priceRange": "4165841658",
  "areaServed": [
    "Park City, Utah",
    "Summit County, Utah",
    "Wasatch County, Utah"
  ]
}
</script>
```

---

## 4. Community Pages Schema (Template)

### 4a. Article + BreadcrumbList Template (paste in `<head>` on each community page)
<!--
Page(s): all community pages, e.g. https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/
Insert: inside <head> of the community page template
Customize per page: COMMUNITY-SLUG, COMMUNITY_NAME, headline, description, image, and publish/modified dates
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/#article",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/"
      },
      "headline": "[COMMUNITY_NAME] Community Guide | Park City, Utah",
      "description": "[COMMUNITY_PAGE_META_DESCRIPTION]",
      "image": [
        "https://livingparkcityutah.com/[COMMUNITY_HERO_IMAGE_PATH]"
      ],
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "author": [
        {
          "@type": "Person",
          "name": "Tisha Digman"
        },
        {
          "@type": "Person",
          "name": "Cam Schiedel"
        }
      ],
      "publisher": {
        "@type": "Organization",
        "name": "Summit Sotheby's International Realty",
        "logo": {
          "@type": "ImageObject",
          "url": "https://livingparkcityutah.com/[BROKERAGE_LOGO_PATH]"
        }
      },
      "articleSection": "Communities",
      "about": {
        "@type": "Place",
        "name": "[COMMUNITY_NAME], Park City, Utah"
      },
      "inLanguage": "en-US",
      "breadcrumb": {
        "@id": "https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://livingparkcityutah.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Communities",
          "item": "https://livingparkcityutah.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[COMMUNITY_NAME]",
          "item": "https://livingparkcityutah.com/communities/[COMMUNITY-SLUG]/"
        }
      ]
    }
  ]
}
</script>
```

---

## 5. Blog Posts Schema (Template)

### 5a. BlogPosting + BreadcrumbList Template (paste in `<head>` on each post)
<!--
Page(s): all blog posts, e.g. https://livingparkcityutah.com/blog/[POST-SLUG]/
Insert: inside <head> of the blog post template
Customize per post: POST-SLUG, POST_TITLE, description, image, and ISO 8601 publish/modified timestamps
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://livingparkcityutah.com/#brokerage",
      "name": "Summit Sotheby's International Realty",
      "url": "https://www.summitsothebysrealty.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://livingparkcityutah.com/[BROKERAGE_LOGO_PATH]"
      }
    },
    {
      "@type": "BlogPosting",
      "@id": "https://livingparkcityutah.com/blog/[POST-SLUG]/#blogposting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://livingparkcityutah.com/blog/[POST-SLUG]/"
      },
      "headline": "[POST_TITLE]",
      "description": "[POST_META_DESCRIPTION]",
      "image": [
        "https://livingparkcityutah.com/[POST_FEATURED_IMAGE_PATH]"
      ],
      "datePublished": "[YYYY-MM-DDTHH:MM:SS-07:00]",
      "dateModified": "[YYYY-MM-DDTHH:MM:SS-07:00]",
      "author": [
        {
          "@type": "Person",
          "name": "Tisha Digman"
        },
        {
          "@type": "Person",
          "name": "Cam Schiedel"
        }
      ],
      "publisher": {
        "@id": "https://livingparkcityutah.com/#brokerage"
      },
      "inLanguage": "en-US",
      "articleSection": "Blog",
      "breadcrumb": {
        "@id": "https://livingparkcityutah.com/blog/[POST-SLUG]/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://livingparkcityutah.com/blog/[POST-SLUG]/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://livingparkcityutah.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://livingparkcityutah.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[POST_TITLE]",
          "item": "https://livingparkcityutah.com/blog/[POST-SLUG]/"
        }
      ]
    }
  ]
}
</script>
```

---

## 6. Buyer Resource Page Schema (`/buyers/`)

### 6a. FAQPage (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/buyers/
Insert: inside <head> (preferred), one script instance only
Customize: ensure FAQ copy exactly matches visible on-page FAQ content (including price figures)
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://livingparkcityutah.com/buyers/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average home price in Park City Utah?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City home prices vary widely by neighborhood. In 2026, median prices range from approximately 00,000 in areas like Kimball Junction to over  million in Deer Valley and Empire Pass communities."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a local agent to buy in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While not required, working with a local Park City real estate agent provides significant advantages including knowledge of off-market listings, neighborhood expertise, and relationships with local lenders and inspectors."
      }
    },
    {
      "@type": "Question",
      "name": "What are closing costs when buying a Park City home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Buyers in Park City typically pay 2-5% of the purchase price in closing costs, including lender fees, title insurance, recording fees, and prepaid property taxes and insurance."
      }
    },
    {
      "@type": "Question",
      "name": "Are there ski-in ski-out homes in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Park City has several ski-in ski-out communities including Deer Crest, Empire Pass, Aerie, and The Colony at White Pine Canyon, with prices typically starting above  million."
      }
    }
  ]
}
</script>
```

---

## 7. Seller Resource Page Schema (`/sellers/`)

### 7a. FAQPage (paste in `<head>`)
<!--
Page(s): https://livingparkcityutah.com/sellers/
Insert: inside <head> (preferred), one script instance only
Customize: ensure FAQ copy exactly matches visible on-page FAQ content
-->
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://livingparkcityutah.com/sellers/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does it cost to sell a house in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sellers in Park City typically pay 5-6% in real estate commissions plus closing costs. Additional costs may include staging, pre-sale inspections, and minor repairs."
      }
    },
    {
      "@type": "Question",
      "name": "What is the average days on market for Park City homes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Market conditions vary, but Park City luxury homes typically sell in 30-90 days depending on price point, community, and seasonal demand. Ski season and summer bring increased buyer activity."
      }
    },
    {
      "@type": "Question",
      "name": "Should I sell my Park City home in winter or summer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City has strong seasonal patterns. Winter (ski season) brings motivated luxury buyers actively seeking properties. Summer also sees strong demand. Working with a local agent to time your listing strategically can maximize your outcome."
      }
    }
  ]
}
</script>
```
