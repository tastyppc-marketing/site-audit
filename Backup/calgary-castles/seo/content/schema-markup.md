# Schema Markup -- sellingcalgarycastles.com

**Client:** Neil Rowlandson, Calgary Castles Team, CIR Realty
**Prepared:** March 31, 2026 (v2 -- full rewrite with cross-linked @id graph)
**Format:** Production-ready JSON-LD -- copy directly into `<head>` section
**Validator:** Test every block at https://validator.schema.org/ and https://search.google.com/test/rich-results

---

## @id Reference Map

All schemas use a consistent set of `@id` URIs so Google can connect entities across pages.

| @id URI | Type | Used On |
|---------|------|---------|
| `https://www.sellingcalgarycastles.com/#org` | Organization | Homepage, referenced everywhere |
| `https://www.sellingcalgarycastles.com/#website` | WebSite | Homepage |
| `https://www.sellingcalgarycastles.com/#agent` | RealEstateAgent | Homepage |
| `https://www.sellingcalgarycastles.com/#person-neil` | Person | Homepage, About, Blog, Community pages |
| `https://www.sellingcalgarycastles.com/contact/#localbusiness` | LocalBusiness | Contact page |
| `https://www.sellingcalgarycastles.com/about/#person-neil` | (redirect to /#person-neil) | About page canonical |
| `https://www.sellingcalgarycastles.com/{slug}/#article` | Article | Community pages |
| `https://www.sellingcalgarycastles.com/blog/{slug}/#blogpost` | BlogPosting | Blog posts |

**Rule:** When referencing an entity from another page, use only `{"@id": "..."}` -- never duplicate the full object.

---

## 1. Homepage: Organization + RealEstateAgent + WebSite + SearchAction + Person

Place in `<head>` of `/` (homepage). This is the master entity graph for the entire site.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.sellingcalgarycastles.com/#org",
      "name": "Calgary Castles Team",
      "alternateName": "Calgary Castles Real Estate",
      "url": "https://www.sellingcalgarycastles.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/logo.png",
        "width": 300,
        "height": 100
      },
      "image": "https://www.sellingcalgarycastles.com/logo.png",
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
        "url": "https://www.cirrealty.ca",
        "sameAs": "https://www.cirrealty.ca"
      },
      "member": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV",
        "https://ca.linkedin.com/in/calgarycastles"
      ],
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
      ]
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.sellingcalgarycastles.com/#agent",
      "name": "Calgary Castles Team - CIR Realty",
      "url": "https://www.sellingcalgarycastles.com",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "image": "https://www.sellingcalgarycastles.com/neil-rowlandson.jpg",
      "description": "Full-service Calgary real estate team led by Neil Rowlandson, a REALTOR with over 20 years of real estate experience and 10 years in banking. Serving Calgary, Cochrane, and Chestermere with CIR Realty.",
      "priceRange": "$$$",
      "currenciesAccepted": "CAD",
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
      "memberOf": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      },
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV",
        "https://ca.linkedin.com/in/calgarycastles"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.sellingcalgarycastles.com/#website",
      "name": "Calgary Castles Team - Calgary Real Estate",
      "url": "https://www.sellingcalgarycastles.com",
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "inLanguage": "en-CA",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.sellingcalgarycastles.com/property-search/site-map/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Person",
      "@id": "https://www.sellingcalgarycastles.com/#person-neil",
      "name": "Neil Rowlandson",
      "givenName": "Neil",
      "familyName": "Rowlandson",
      "jobTitle": "REALTOR",
      "url": "https://www.sellingcalgarycastles.com/about/",
      "image": "https://www.sellingcalgarycastles.com/neil-rowlandson.jpg",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "description": "Calgary REALTOR with over 20 years of real estate experience and 10 years in the banking industry. Born and raised in Lakeview, Calgary.",
      "worksFor": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "memberOf": {
        "@type": "Organization",
        "name": "CIR Realty",
        "url": "https://www.cirrealty.ca"
      },
      "knowsAbout": [
        "Calgary Real Estate",
        "Residential Real Estate",
        "Mortgage Financing",
        "Investment Properties",
        "First-Time Home Buying",
        "Calgary Neighborhoods",
        "Property Valuation",
        "Real Estate Negotiation"
      ],
      "sameAs": [
        "https://www.sellingcalgarycastles.com/about/",
        "https://ca.linkedin.com/in/calgarycastles",
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgary_castles_real_estate/"
      ]
    }
  ]
}
</script>
```

**Implementation notes:**
- Update `logo.png` URL to the actual hosted logo file. Check Sierra Interactive media library.
- Update `neil-rowlandson.jpg` to the actual headshot URL from the site.
- The Person entity is defined here and referenced by `@id` on every other page -- this is intentional. Google builds entity understanding from the homepage graph.

---

## 2. About Page: Person Schema (Full Profile)

Place in `<head>` of `/about/`. This is the expanded Person entity with full biographical detail.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.sellingcalgarycastles.com/#person-neil",
      "name": "Neil Rowlandson",
      "givenName": "Neil",
      "familyName": "Rowlandson",
      "jobTitle": "REALTOR",
      "url": "https://www.sellingcalgarycastles.com/about/",
      "image": "https://www.sellingcalgarycastles.com/neil-rowlandson.jpg",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "description": "Neil Rowlandson is a Calgary REALTOR with over 20 years of real estate experience and 10 years in the banking industry. Born and raised in the Lakeview community of Calgary, Neil combines deep local neighborhood knowledge with financial expertise to guide buyers and sellers through every step of the transaction.",
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
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "Professional License",
          "name": "Licensed REALTOR - Alberta",
          "recognizedBy": {
            "@type": "Organization",
            "name": "Real Estate Council of Alberta (RECA)"
          }
        }
      ],
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Real Estate Agent",
        "occupationLocation": {
          "@type": "City",
          "name": "Calgary",
          "sameAs": "https://en.wikipedia.org/wiki/Calgary"
        },
        "experienceRequirements": "20+ years in real estate, 10 years in banking",
        "skills": [
          "Residential Real Estate Sales",
          "Buyer Representation",
          "Seller Representation",
          "Mortgage and Financing Guidance",
          "Market Analysis and Pricing Strategy",
          "Negotiation",
          "Investment Property Analysis"
        ]
      },
      "knowsAbout": [
        "Calgary Real Estate Market",
        "Residential Real Estate",
        "Mortgage Financing",
        "Investment Properties",
        "First-Time Home Buying in Alberta",
        "Calgary Neighborhoods",
        "Property Valuation",
        "Real Estate Negotiation",
        "CMHC Mortgage Insurance",
        "Alberta Land Titles"
      ],
      "worksFor": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "memberOf": [
        {
          "@type": "Organization",
          "name": "CIR Realty",
          "url": "https://www.cirrealty.ca"
        },
        {
          "@type": "Organization",
          "name": "Calgary Real Estate Board (CREB)",
          "url": "https://www.creb.com"
        }
      ],
      "sameAs": [
        "https://www.sellingcalgarycastles.com/about/",
        "https://ca.linkedin.com/in/calgarycastles",
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/about/#breadcrumb",
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

**Implementation notes:**
- Verify Neil's CREB membership status before deploying. If he is not a direct CREB member (some agents are members through their brokerage), remove the CREB `memberOf` entry.
- The `hasCredential` block references RECA licensing. Update with Neil's actual license number if available: add `"identifier": "LICENSE_NUMBER"` inside the credential object.
- The `@id` matches the homepage Person entity intentionally. Google merges them.

---

## 3. Contact Page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification

Place in `<head>` of `/contact/`.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "additionalType": "https://schema.org/RealEstateAgent",
      "@id": "https://www.sellingcalgarycastles.com/contact/#localbusiness",
      "name": "Calgary Castles Team - CIR Realty",
      "description": "Full-service real estate team serving Calgary, Cochrane, and Chestermere. Led by Neil Rowlandson with 20+ years of real estate experience and 10 years in banking. Specializing in residential buying, selling, and investment properties across Calgary's south and southeast communities.",
      "url": "https://www.sellingcalgarycastles.com",
      "telephone": "+1-403-271-0600",
      "email": "calgarycastles@live.com",
      "image": "https://www.sellingcalgarycastles.com/logo.png",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/logo.png"
      },
      "founder": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
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
      "hasMap": "https://www.google.com/maps/search/?api=1&query=51.0447,-114.0719",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+1-403-271-0600",
          "contactType": "sales",
          "areaServed": {
            "@type": "AdministrativeArea",
            "name": "Calgary Metropolitan Area",
            "containedInPlace": {
              "@type": "AdministrativeArea",
              "name": "Alberta",
              "sameAs": "https://en.wikipedia.org/wiki/Alberta"
            }
          },
          "availableLanguage": "English",
          "contactOption": "TollFree"
        },
        {
          "@type": "ContactPoint",
          "email": "calgarycastles@live.com",
          "contactType": "customer service",
          "areaServed": {
            "@type": "AdministrativeArea",
            "name": "Calgary Metropolitan Area"
          },
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
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Sunday"],
          "opens": "00:00",
          "closes": "00:00"
        }
      ],
      "priceRange": "$$$",
      "currenciesAccepted": "CAD",
      "paymentAccepted": "Commission-based",
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
      "sameAs": [
        "https://www.facebook.com/sellingcalgarycastles",
        "https://www.instagram.com/calgary_castles_real_estate/",
        "https://www.youtube.com/@CalgaryCastlesTV",
        "https://ca.linkedin.com/in/calgarycastles",
        "https://www.cirrealty.ca"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/contact/#breadcrumb",
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
          "name": "Contact Neil Rowlandson",
          "item": "https://www.sellingcalgarycastles.com/contact/"
        }
      ]
    }
  ]
}
</script>
```

**Implementation notes:**
- Sunday hours set to `"00:00"/"00:00"` signals "closed" to Google. Alternatively, omit Sunday entirely; both are valid.
- The `hasMap` URL uses Google Maps search API format. Replace with the actual Google Maps share URL for the CIR Realty office if available.
- `contactOption: "TollFree"` -- verify if 403-271-0600 is toll-free. If it is a local number, remove that property.

---

## 4. Community Page Template + 2 Filled Examples

### 4a. Template (for all 10 community pages)

Replace `{{COMMUNITY}}`, `{{URL_SLUG}}`, and date values with actual data per community.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/#article",
      "headline": "{{COMMUNITY}} Homes for Sale - {{COMMUNITY}} Real Estate, Calgary",
      "description": "Explore homes for sale in {{COMMUNITY}}, Calgary, AB. Community guide with current listings, neighborhood overview, schools, parks, amenities, and market insights from Neil Rowlandson, CIR Realty.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/"
      },
      "datePublished": "{{PUBLISH_DATE}}",
      "dateModified": "{{MODIFIED_DATE}}",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/images/{{URL_SLUG}}-hero.jpg",
        "caption": "Homes and real estate in {{COMMUNITY}}, Calgary, AB"
      },
      "about": {
        "@type": "Place",
        "name": "{{COMMUNITY}}, Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "{{LATITUDE}}",
          "longitude": "{{LONGITUDE}}"
        }
      },
      "inLanguage": "en-CA",
      "isPartOf": {
        "@id": "https://www.sellingcalgarycastles.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/{{URL_SLUG}}/#breadcrumb",
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

| Community | `{{COMMUNITY}}` | `{{URL_SLUG}}` | `{{LATITUDE}}` | `{{LONGITUDE}}` |
|-----------|-----------------|----------------|-----------------|-------------------|
| Auburn Bay | Auburn Bay | auburn-bay | 50.8807 | -113.9859 |
| Bridlewood | Bridlewood | bridlewood | 50.8972 | -114.0671 |
| Chaparral | Chaparral | chaparral | 50.8927 | -114.0193 |
| Cranston | Cranston | cranston | 50.8862 | -114.0043 |
| Evergreen | Evergreen | evergreen | 50.9111 | -114.0976 |
| Legacy | Legacy | legacy | 50.8669 | -114.0115 |
| Mahogany | Mahogany | mahogany | 50.8724 | -113.9519 |
| McKenzie Towne | McKenzie Towne | mckenzie-towne | 50.9029 | -113.9573 |
| New Brighton | New Brighton | new-brighton | 50.8898 | -113.9560 |
| Walden | Walden | walden | 50.8775 | -114.0559 |

### 4b. Filled Example: Auburn Bay

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#article",
      "headline": "Auburn Bay Homes for Sale - Auburn Bay Real Estate, Calgary",
      "description": "Explore homes for sale in Auburn Bay, Calgary, AB. Community guide with current listings, neighborhood overview, schools, parks, amenities, and market insights from Neil Rowlandson, CIR Realty.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.sellingcalgarycastles.com/auburn-bay/"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-31",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/images/auburn-bay-hero.jpg",
        "caption": "Homes and real estate in Auburn Bay, Calgary, AB"
      },
      "about": {
        "@type": "Place",
        "name": "Auburn Bay, Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 50.8807,
          "longitude": -113.9859
        }
      },
      "inLanguage": "en-CA",
      "isPartOf": {
        "@id": "https://www.sellingcalgarycastles.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/auburn-bay/#breadcrumb",
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
          "name": "Auburn Bay",
          "item": "https://www.sellingcalgarycastles.com/auburn-bay/"
        }
      ]
    }
  ]
}
</script>
```

### 4c. Filled Example: Cranston

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.sellingcalgarycastles.com/cranston/#article",
      "headline": "Cranston Homes for Sale - Cranston Real Estate, Calgary",
      "description": "Explore homes for sale in Cranston, Calgary, AB. Community guide with current listings, neighborhood overview, schools, parks, amenities, and market insights from Neil Rowlandson, CIR Realty.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.sellingcalgarycastles.com/cranston/"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-31",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.sellingcalgarycastles.com/images/cranston-hero.jpg",
        "caption": "Homes and real estate in Cranston, Calgary, AB"
      },
      "about": {
        "@type": "Place",
        "name": "Cranston, Calgary, AB",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Calgary",
          "addressRegion": "AB",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 50.8862,
          "longitude": -114.0043
        }
      },
      "inLanguage": "en-CA",
      "isPartOf": {
        "@id": "https://www.sellingcalgarycastles.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/cranston/#breadcrumb",
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
          "name": "Cranston",
          "item": "https://www.sellingcalgarycastles.com/cranston/"
        }
      ]
    }
  ]
}
</script>
```

---

## 5. Blog Post Template + 1 Filled Example

### 5a. Template

Replace all `{{VARIABLES}}` with actual post data.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/#blogpost",
      "headline": "{{TITLE}}",
      "description": "{{META_DESCRIPTION_150_CHARS_MAX}}",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/"
      },
      "datePublished": "{{PUBLISH_DATE}}",
      "dateModified": "{{MODIFIED_DATE}}",
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/#primaryimage",
        "url": "{{IMAGE_URL}}",
        "caption": "{{IMAGE_CAPTION}}",
        "width": 1200,
        "height": 630
      },
      "wordCount": "{{WORD_COUNT}}",
      "articleSection": "{{CATEGORY}}",
      "keywords": "{{COMMA_SEPARATED_KEYWORDS}}",
      "inLanguage": "en-CA",
      "isPartOf": {
        "@id": "https://www.sellingcalgarycastles.com/#website"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".post-content p:first-of-type", ".post-content h2"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/blog/{{SLUG}}/#breadcrumb",
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

| Variable | Post 1 | Post 2 | Post 3 | Post 4 |
|----------|--------|--------|--------|--------|
| `{{SLUG}}` | will-increasing-mortgage-rates-impact-home-prices | common-things-to-look-out-for-before-buying-your-dream-home | why-you-should-consider-selling-in-the-winter | is-getting-a-home-mortgage-still-too-difficult |
| `{{TITLE}}` | Will Increasing Mortgage Rates Impact Home Prices? | Common Things to Look Out for Before Buying Your Dream Home | Why You Should Consider Selling in the Winter | Is Getting a Home Mortgage Still Too Difficult? |
| `{{CATEGORY}}` | Calgary Real Estate | Buying a Home | Selling Your Home | Buying a Home |
| `{{PUBLISH_DATE}}` | 2026-02-02 | 2026-02-02 | 2026-02-02 | 2026-02-02 |
| `{{MODIFIED_DATE}}` | 2026-02-02 | 2026-02-02 | 2026-02-02 | 2026-02-02 |

### 5b. Filled Example: Mortgage Rates Blog Post

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#blogpost",
      "headline": "Will Increasing Mortgage Rates Impact Home Prices?",
      "description": "How rising mortgage rates affect Calgary home prices in 2026. Analysis of Bank of Canada rate changes and the impact on Calgary's residential real estate market.",
      "author": {
        "@id": "https://www.sellingcalgarycastles.com/#person-neil"
      },
      "publisher": {
        "@id": "https://www.sellingcalgarycastles.com/#org"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/"
      },
      "datePublished": "2026-02-02",
      "dateModified": "2026-02-02",
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#primaryimage",
        "url": "https://cdn.sitephotos.sierrastatic.com/6546_hero_scc-hero2-20260227022224.jpg",
        "caption": "Will increasing mortgage rates impact Calgary home prices?",
        "width": 1200,
        "height": 630
      },
      "wordCount": "800",
      "articleSection": "Calgary Real Estate",
      "keywords": "mortgage rates Calgary, home prices Calgary, Bank of Canada rate, Calgary real estate market 2026",
      "inLanguage": "en-CA",
      "isPartOf": {
        "@id": "https://www.sellingcalgarycastles.com/#website"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".post-content p:first-of-type", ".post-content h2"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/#breadcrumb",
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
          "name": "Will Increasing Mortgage Rates Impact Home Prices?",
          "item": "https://www.sellingcalgarycastles.com/blog/will-increasing-mortgage-rates-impact-home-prices/"
        }
      ]
    }
  ]
}
</script>
```

**Implementation notes:**
- Update the `image.url` per blog post. The current site uses the same hero image across all pages. If individual post images exist, use those.
- Update `wordCount` to match the actual word count per post.
- The `speakable` CSS selectors target the first paragraph and all H2s. Adjust selectors to match the actual Sierra Interactive blog template DOM structure.

---

## 6. Buyer FAQ: FAQPage with Calgary-Specific Q&A

Place in `<head>` of `/buyers/` or `/buyers/first-time-buyers/`. Contains 6 Q&A pairs with real Calgary data.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.sellingcalgarycastles.com/buyers/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average home price in Calgary in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average home price in Calgary is approximately $641,000 as of early 2026, with a median price near $572,500. Prices vary significantly by community: SE Calgary neighborhoods like Auburn Bay, Cranston, and Mahogany typically range from $500,000 to $700,000 for detached homes, while inner-city communities like Lakeview and Mount Royal can exceed $1.5 million. Calgary condos and townhomes average $300,000 to $450,000 depending on location. Contact Neil Rowlandson at 403-271-0600 for current pricing in your target area."
      }
    },
    {
      "@type": "Question",
      "name": "How much do I need for a down payment on a Calgary home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Canada, the minimum down payment is 5% of the purchase price for homes up to $500,000, and 10% on the portion between $500,000 and $1,499,999. For a Calgary home at the median price of $572,500, the minimum down payment is approximately $32,250. Putting down less than 20% requires CMHC mortgage default insurance, which adds a premium of 2.8% to 4.0% of the mortgage amount. With 20% down ($114,500 on a $572,500 home), you avoid CMHC insurance entirely, saving thousands over the life of the mortgage. Neil Rowlandson's 10 years of banking experience can help you plan the right financing strategy for your budget."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best neighborhoods to buy a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary's best neighborhoods depend on your priorities and budget. For families seeking newer communities with schools and amenities: Auburn Bay, Cranston, McKenzie Towne, and New Brighton in southeast Calgary. For lakefront living: Mahogany (with its private lake) and nearby Chestermere. For established character and walkability: Lakeview, Altadore, and Marda Loop in the inner city. For first-time buyers seeking value: Legacy, Walden, and Evergreen offer newer builds at lower entry prices. For small-town living near Calgary: Cochrane (20 minutes northwest). Neil Rowlandson grew up in Lakeview and has specialized in Calgary's south and SE communities for over 20 years."
      }
    },
    {
      "@type": "Question",
      "name": "What first-time home buyer programs are available in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary first-time buyers can access several Canadian and Alberta programs: (1) The Home Buyers' Plan (HBP) lets you withdraw up to $60,000 from your RRSP ($120,000 per couple) tax-free for a down payment, repayable over 15 years. (2) The First Home Savings Account (FHSA) allows tax-deductible contributions of up to $8,000 per year ($40,000 lifetime) specifically for your first home purchase. (3) The federal First-Time Home Buyer Tax Credit provides a $10,000 non-refundable tax credit (up to $1,500 in tax relief). (4) Alberta has no provincial land transfer tax, saving Calgary buyers thousands compared to Ontario or BC. (5) The GST/HST New Housing Rebate can provide up to $6,300 back on new-build purchases. Neil Rowlandson can walk you through each program and how they apply to your situation."
      }
    },
    {
      "@type": "Question",
      "name": "What are the closing costs when buying a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Typical closing costs for a Calgary home purchase range from 1.5% to 4% of the purchase price. On a $572,500 home, expect approximately $8,500 to $23,000 in closing costs including: (1) Legal fees: $1,500 to $2,500 for a real estate lawyer. (2) Land title registration: approximately $350 to $500. (3) Home inspection: $400 to $600. (4) Property tax adjustment: prorated from the closing date. (5) Title insurance: $250 to $400. (6) CMHC insurance premium (if less than 20% down): 2.8% to 4.0% of the mortgage, which can be added to the mortgage balance. Alberta does not charge a provincial land transfer tax, which is a significant advantage over buying in Toronto or Vancouver. Neil Rowlandson's banking background means he can help you budget accurately for all costs."
      }
    },
    {
      "@type": "Question",
      "name": "Is Calgary a good place to buy real estate in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Calgary remains one of Canada's strongest real estate markets in 2026. Key advantages include: no provincial sales tax (Alberta has no PST or HST beyond the 5% federal GST), no provincial land transfer tax, strong population growth driven by interprovincial migration and immigration, a diversified economy across energy, technology, logistics, and agriculture, and home prices that remain significantly more affordable than Toronto and Vancouver (Calgary's $641,000 average vs. Toronto's $1.1M+). The market has seen steady 2% to 4% year-over-year price appreciation with healthy inventory levels providing good selection for buyers. Over 5,500 active listings ensure buyers have genuine choice. Call Neil Rowlandson at 403-271-0600 for a personalized market briefing."
      }
    }
  ]
}
</script>
```

---

## 7. Seller FAQ: FAQPage with Calgary Market Data

Place in `<head>` of `/sellers/` or `/sellers/pricing-your-home/`. Contains 5 Q&A pairs with real Calgary selling data.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.sellingcalgarycastles.com/sellers/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much is my Calgary home worth in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average Calgary home price is approximately $641,000 as of early 2026, but values vary dramatically by community, property type, and condition. Detached homes in SE Calgary communities like Auburn Bay and Cranston typically range from $525,000 to $725,000. Inner-city communities like Altadore and Marda Loop see detached prices from $700,000 to $1.2 million. Condos and townhomes average $300,000 to $450,000. The most accurate way to determine your home's value is a Comparative Market Analysis (CMA) that examines recent sales of similar properties in your specific neighborhood. Neil Rowlandson offers free, no-obligation market analyses -- call 403-271-0600 or visit sellingcalgarycastles.com/sellers/free-market-analysis/."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Average days on market in Calgary in 2026 is approximately 30 to 45 days for competitively priced properties. Well-priced homes in high-demand SE communities like Auburn Bay, Cranston, and McKenzie Towne can sell in under two weeks, sometimes with multiple offers. Factors that affect time on market include pricing accuracy (overpriced homes sit 2 to 3 times longer), property condition, professional staging, quality of photography and marketing, and time of year. Spring (April through June) is typically the strongest selling season in Calgary. Neil Rowlandson's pricing strategy and marketing plan are designed to minimize days on market while maximizing your sale price."
      }
    },
    {
      "@type": "Question",
      "name": "What does it cost to sell a home in Calgary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Selling costs in Calgary typically total 5% to 7% of the sale price. On a $641,000 sale, expect approximately $32,000 to $45,000 in total costs including: (1) Real estate commission: typically 7% on the first $100,000 and 3% on the balance, split between the listing and buyer agents (approximately $23,230 on a $641,000 sale, plus GST). (2) Legal fees: $1,200 to $2,000 for conveyancing. (3) Mortgage discharge fees: $200 to $500 if you have an existing mortgage. (4) Property staging: $2,000 to $4,000 (optional but recommended). (5) Minor repairs and preparation: varies. Alberta has no provincial land transfer tax on the seller side. Calgary does not charge a municipal transfer tax. Contact Neil Rowlandson for a detailed net-proceeds estimate for your specific property."
      }
    },
    {
      "@type": "Question",
      "name": "Should I sell my Calgary home in winter or wait until spring?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While spring is traditionally Calgary's busiest real estate season with the highest number of listings and buyer activity, winter selling has distinct advantages: significantly less competition (30% to 40% fewer listings), more motivated buyers (people house-hunting in a Calgary winter are serious), and faster closing timelines. Calgary's strong job market drives relocations year-round regardless of season. Data shows winter-listed properties in Calgary often achieve sale-to-list-price ratios comparable to spring listings because the reduced inventory creates relative scarcity. If your home shows well with good lighting and is well-maintained through winter, listing in January through March can be a strategic advantage."
      }
    },
    {
      "@type": "Question",
      "name": "How do I prepare my Calgary home for sale to get the best price?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To maximize your Calgary home's sale price: (1) Professional staging: staged homes in Calgary sell for an average of 3% to 6% more than unstaged homes. (2) Professional photography: 90%+ of Calgary buyers start their search online; high-quality photos are essential. (3) Declutter and depersonalize: remove personal items and excess furniture to make rooms feel larger. (4) Address deferred maintenance: fix leaky faucets, patch walls, replace worn caulking. Calgary buyers in 2026 are especially attentive to the condition of furnaces, roofs, and hot water tanks given Alberta's climate. (5) Curb appeal: power wash, tidy landscaping, and ensure the front entrance is welcoming. (6) Get a pre-listing home inspection: identifying issues before buyers do gives you control over the narrative. (7) Price correctly from day one: overpricing is the number one mistake Calgary sellers make. Neil Rowlandson's 20+ years of local experience ensures your home is priced to attract maximum interest while achieving top dollar."
      }
    }
  ]
}
</script>
```

---

## 8. AggregateRating Template

> **WARNING: Do not deploy this schema until real customer reviews have been collected.** Google penalizes fabricated or unverified review markup. This template is ready to activate once Neil has collected verified reviews (minimum 5 recommended before deploying). Use reviews from Google Business Profile, Zillow, Realtor.ca, or direct client testimonials with written permission.

Place in `<head>` of homepage or about page ONLY after real reviews exist.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.sellingcalgarycastles.com/#agent",
  "name": "Calgary Castles Team - CIR Realty",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{AVERAGE_RATING}}",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "{{TOTAL_NUMBER_OF_RATINGS}}",
    "reviewCount": "{{TOTAL_NUMBER_OF_REVIEWS}}"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "{{REVIEWER_NAME}}"
      },
      "datePublished": "{{REVIEW_DATE}}",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "{{STAR_RATING}}",
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": "{{REVIEW_TEXT}}"
    }
  ]
}
</script>
```

**Deployment rules:**
1. Only use ratings/reviews that are verifiable on a third-party platform (Google, Zillow, Realtor.ca).
2. `ratingValue` must exactly match the average calculated from real reviews.
3. `ratingCount` and `reviewCount` must match actual totals.
4. Include at least 3 individual `review` objects alongside the `aggregateRating`.
5. Update this schema every time a new review is received.
6. The `@id` references the same RealEstateAgent entity from the homepage graph -- this is intentional. Google merges the data.
7. **Do not deploy until a minimum of 5 verified reviews exist.** Deploying review schema without real reviews violates Google's structured data guidelines and can result in a manual action.

**Activation checklist:**
- [ ] Collect 5+ verified client reviews
- [ ] Calculate accurate average rating
- [ ] Get written permission from each reviewer to display their name
- [ ] Replace all `{{VARIABLES}}` with real data
- [ ] Validate at https://search.google.com/test/rich-results
- [ ] Deploy to homepage `<head>`
- [ ] Set calendar reminder to update monthly

---

## Site-Wide BreadcrumbList Reference

For any page not covered above (buyer sub-pages, seller sub-pages), add a standalone BreadcrumbList. Every page on the site should have breadcrumb schema.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.sellingcalgarycastles.com/{{CURRENT_SLUG}}/#breadcrumb",
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

**Breadcrumb hierarchy map (all remaining pages):**

| Page URL | Breadcrumb Path |
|----------|----------------|
| `/buyers/` | Home > Buyers |
| `/buyers/first-time-buyers/` | Home > Buyers > First Time Buyers |
| `/buyers/making-an-offer/` | Home > Buyers > Making an Offer |
| `/buyers/mortgage-calculator/` | Home > Buyers > Mortgage Calculator |
| `/buyers/mortgage-pre-approval/` | Home > Buyers > Mortgage Pre-Approval |
| `/buyers/financial-terms-glossary/` | Home > Buyers > Financial Terms Glossary |
| `/buyers/personalized-home-search/` | Home > Buyers > Personalized Home Search |
| `/buyers/what-are-closing-costs/` | Home > Buyers > Closing Costs |
| `/sellers/` | Home > Sellers |
| `/sellers/adding-value/` | Home > Sellers > Adding Value |
| `/sellers/free-market-analysis/` | Home > Sellers > Free Market Analysis |
| `/sellers/marketing-your-home/` | Home > Sellers > Marketing Your Home |
| `/sellers/pricing-your-home/` | Home > Sellers > Pricing Your Home |
| `/sellers/showing-your-home/` | Home > Sellers > Showing Your Home |
| `/communities/` | Home > Communities |
| `/featured-listings/` | Home > Featured Listings |

---

## Implementation Checklist (Priority Order)

### P1 -- Deploy First (Highest SEO Impact)

| # | Schema | Page | Impact | Notes |
|---|--------|------|--------|-------|
| 1 | Organization + RealEstateAgent + WebSite + SearchAction + Person (Section 1) | Homepage `/` | Critical | Establishes the entire entity graph. Must go first. |
| 2 | Person full profile (Section 2) | About `/about/` | Critical | E-E-A-T signal. Google merges with homepage Person via matching @id. |
| 3 | LocalBusiness + ContactPoint (Section 3) | Contact `/contact/` | High | NAP + geo signals for local pack. |
| 4 | Buyer FAQ (Section 6) | Buyers `/buyers/` | High | Targets rich results for 6 high-value Calgary buying queries. |
| 5 | Seller FAQ (Section 7) | Sellers `/sellers/` | High | Targets rich results for 5 high-value Calgary selling queries. |

### P2 -- Deploy Second (Content Enrichment)

| # | Schema | Page | Impact | Notes |
|---|--------|------|--------|-------|
| 6 | Article + BreadcrumbList (Section 4) | All 10 community pages | Medium-High | One template, 10 deployments. Update image URLs per community. |
| 7 | BlogPosting + BreadcrumbList (Section 5) | All 4 blog posts | Medium | One template, 4 deployments. Update meta descriptions first (currently 300-524 chars). |
| 8 | BreadcrumbList (Site-Wide) | All remaining 16 pages | Medium | Use the hierarchy map above. Fastest deployment of all items. |

### P3 -- Deploy When Ready (Requires Real Data)

| # | Schema | Page | Impact | Notes |
|---|--------|------|--------|-------|
| 9 | AggregateRating (Section 8) | Homepage or About | High (when ready) | DO NOT deploy until 5+ verified reviews exist. See warning above. |

### Post-Deployment Validation

After deploying each schema block:

1. **Test each page** at https://search.google.com/test/rich-results
2. **Validate JSON-LD** at https://validator.schema.org/
3. **Check Google Search Console** > Enhancements for any new schema errors within 48 hours
4. **Verify image URLs** -- replace all placeholder paths (`/logo.png`, `/neil-rowlandson.jpg`, `/images/*-hero.jpg`) with actual hosted file URLs from the Sierra Interactive media library
5. **Verify social URLs** -- confirm the sameAs links resolve correctly (not through Avanan proxy)
6. **Cross-check visible content** -- every data point in schema must match what is displayed on the page. This is especially important for the FAQ answers (prices, program details, percentages).

### Quarterly Maintenance

- [ ] Update all market data in FAQ schemas (average price, median price, inventory levels)
- [ ] Update `dateModified` on all Article and BlogPosting schemas when content is refreshed
- [ ] Add new community page schemas when new neighborhood pages are created
- [ ] Review and add new blog post schemas as content is published
- [ ] Update AggregateRating when new reviews come in
- [ ] Re-validate all schemas after any site template changes

---

## Technical Notes

**Platform constraint:** Sierra Interactive uses custom code injection for adding JSON-LD. Schema blocks go into the "Custom Header Code" field available per page in the Sierra Interactive CMS admin panel. If per-page injection is not available, use the site-wide header injection and wrap each block in conditional logic based on the page URL (consult Sierra Interactive support for the exact method).

**Canadian compliance:** All FAQ answers use Canadian terminology (CMHC, RRSP, FHSA, provinces, GST) and Alberta-specific data (no PST, no land transfer tax). No US-specific terms (PMI, escrow, states, FHA) appear in any schema. This aligns with the content audit finding that the current site content is incorrectly US-focused.

**@id consistency:** Every entity uses the `www` prefix consistently (`https://www.sellingcalgarycastles.com/...`). Never mix `www` and non-`www` in @id URIs -- this breaks Google's entity linking.

**Currency:** All monetary values reference CAD. The `currenciesAccepted: "CAD"` property is set on business entities.
