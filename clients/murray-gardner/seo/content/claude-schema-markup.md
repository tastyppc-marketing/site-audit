# Schema Markup: Gardner Group Realtors
**Client:** Murray Gardner | Keller Williams Park City
**Website:** https://www.gardnergrouprealtors.com
**Prepared:** March 12, 2026
**Purpose:** Production-ready JSON-LD structured data for all major page types

---

## Conventions Used Throughout This Document

| Convention | Value |
|---|---|
| Base URL | `https://www.gardnergrouprealtors.com` |
| Organization @id | `https://www.gardnergrouprealtors.com/#org` |
| Person @id | `https://www.gardnergrouprealtors.com/#person-murray` |
| RealEstateAgent @id | `https://www.gardnergrouprealtors.com/#agent-murray` |
| WebSite @id | `https://www.gardnergrouprealtors.com/#website` |
| Logo URL | `https://www.gardnergrouprealtors.com/images/gardner-group-logo.png` *(update to actual path)* |
| Profile image | `https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg` *(update to actual path)* |

**@id stability rule:** These URIs must never change. They are the permanent identifiers Google uses to build the Knowledge Graph entity for the business. Once set, treat them as immutable.

---

## Implementation Checklist (Priority Order)

| Priority | Schema Block | Page(s) | Est. Effort | Impact |
|---|---|---|---|---|
| **P1** | Block 1 — Homepage @graph (Org + Agent + WebSite + SearchAction) | Homepage | 30 min | Critical — Knowledge Panel eligibility |
| **P1** | Block 2 — Person (Murray bio) | Homepage | 15 min | Critical — E-E-A-T, AI Overview citation |
| **P1** | Block 3 — About page Person + RealEstateAgent | /about/ | 20 min | High — agent search rankings |
| **P1** | Block 4 — Contact page LocalBusiness + ContactPoint + Geo | /contact/ | 20 min | High — Local Pack, Maps |
| **P2** | Block 7 — Buyer FAQPage | /buyers/ or dedicated FAQ page | 30 min | High — FAQ rich results |
| **P2** | Block 8 — Seller FAQPage | /sellers/ or dedicated FAQ page | 30 min | High — FAQ rich results |
| **P2** | Block 5 — Community/service page template | All ~380 community pages | 2–4 hrs (template) | High — breadcrumbs in SERPs |
| **P3** | Block 6 — BlogPosting template | All 52 blog posts | 2 hrs (template) | Medium — author/date rich results |
| **P3** | Block 9 — AggregateRating | Homepage + About | 15 min | Medium — star ratings in SERPs |

**Implementation notes:**
- All blocks use JSON-LD embedded in a `<script type="application/ld+json">` tag placed in the `<head>` section of each page (or immediately before `</body>` — both are valid).
- Sierra Interactive may support custom `<head>` injection via the platform's Custom Code or Header Script field. Confirm with your SI account manager.
- Validate every block at [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results) before deploying to production.
- After deployment, verify coverage in Google Search Console under Enhancements > Structured Data within 1–2 weeks.

---

## Block 1 — Homepage: Organization + RealEstateAgent + WebSite + SearchAction

**Page:** `https://www.gardnergrouprealtors.com/`
**Purpose:** Establishes the business entity, agent identity, and sitelinks search box. This is the foundational block that all other pages reference via `@id`. Required for Knowledge Panel eligibility.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.gardnergrouprealtors.com/#org",
      "name": "Gardner Group Realtors",
      "alternateName": "Gardner Group | Keller Williams Park City",
      "url": "https://www.gardnergrouprealtors.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.gardnergrouprealtors.com/images/gardner-group-logo.png",
        "width": 300,
        "height": 100
      },
      "image": "https://www.gardnergrouprealtors.com/images/gardner-group-logo.png",
      "description": "Gardner Group Realtors, led by Murray Gardner of Keller Williams Park City, specializes in luxury residential real estate throughout Park City, Deer Valley, Heber Valley, and the greater Wasatch Back. Murray is a former Top Gun instructor, F/A-18 fighter pilot, airline captain, and luxury home builder ranked #3 among all Keller Williams agents in Utah.",
      "telephone": "+14356405184",
      "email": "murray@gardnergrouprealtors.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1375 Village Ski Ln, Suite 201",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Park City",
          "containedInPlace": {
            "@type": "State",
            "name": "Utah"
          }
        },
        {
          "@type": "Place",
          "name": "Deer Valley"
        },
        {
          "@type": "Place",
          "name": "Heber City"
        },
        {
          "@type": "Place",
          "name": "Midway"
        },
        {
          "@type": "Place",
          "name": "Snyderville Basin"
        },
        {
          "@type": "Place",
          "name": "Jordanelle"
        },
        {
          "@type": "Place",
          "name": "Wasatch Back"
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
      "parentOrganization": {
        "@type": "Organization",
        "name": "Keller Williams Realty Park City",
        "url": "https://www.kwparkcity.com"
      },
      "memberOf": {
        "@type": "Organization",
        "name": "Keller Williams Realty International",
        "url": "https://www.kw.com"
      },
      "sameAs": [
        "https://www.facebook.com/GardnerGroupRealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-park-city",
        "https://www.zillow.com/profile/murray-gardner",
        "https://www.homes.com/real-estate-agents/murray-gardner",
        "https://www.yelp.com/biz/gardner-group-realtors-park-city",
        "https://www.kw.com/agent/murray-gardner"
      ],
      "founder": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "employee": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      }
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.gardnergrouprealtors.com/#agent-murray",
      "name": "Murray Gardner",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "image": "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg",
      "telephone": "+14356405184",
      "email": "murray@gardnergrouprealtors.com",
      "description": "Murray Gardner is a Keller Williams Park City REALTOR ranked #3 among all KW agents in Utah. A former Top Gun instructor, F/A-18 fighter pilot, and airline captain, Murray brings exceptional analytical precision to Park City real estate. He is also an experienced luxury home builder with 7 Showcase homes to his credit.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1375 Village Ski Ln, Suite 201",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "knowsAbout": [
        "Park City luxury real estate",
        "Deer Valley homes for sale",
        "ski-in ski-out properties",
        "custom home construction",
        "Park City new construction",
        "Heber Valley real estate",
        "investment properties Park City",
        "luxury home staging"
      ],
      "areaServed": [
        "Park City, UT",
        "Deer Valley, UT",
        "Old Town Park City",
        "Empire Pass",
        "The Colony at White Pine Canyon",
        "Deer Crest",
        "Promontory",
        "Canyons Village",
        "Park Meadows",
        "Heber City, UT",
        "Midway, UT",
        "Snyderville Basin",
        "Jordanelle"
      ],
      "worksFor": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "sameAs": [
        "https://www.facebook.com/GardnerGroupRealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-park-city",
        "https://www.zillow.com/profile/murray-gardner",
        "https://www.yelp.com/biz/gardner-group-realtors-park-city"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.gardnergrouprealtors.com/#website",
      "url": "https://www.gardnergrouprealtors.com",
      "name": "Gardner Group Realtors — Park City Real Estate",
      "description": "Park City, Deer Valley, and Wasatch Back real estate with Murray Gardner of Keller Williams. Search homes, explore neighborhoods, and connect with Park City's #3 KW agent in Utah.",
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.gardnergrouprealtors.com/property-search/results/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

**Notes:**
- Update all `sameAs` URLs to the exact profile URLs once confirmed (e.g., exact Zillow profile URL, exact LinkedIn URL).
- Update the `streetAddress` to match the exact address on the Google Business Profile — NAP consistency is critical.
- The `potentialAction` SearchAction enables the sitelinks search box for branded queries. Update the `urlTemplate` to match your actual IDX search URL pattern if different.
- The `potentialAction` `urlTemplate` uses Sierra Interactive's typical search pattern — verify this works by testing a manual search and checking the resulting URL format.

---

## Block 2 — Homepage: Person Schema (Murray Gardner Bio)

**Page:** `https://www.gardnergrouprealtors.com/`
**Purpose:** Establishes Murray as a named individual with verifiable credentials, professional history, and expertise signals. This schema is the primary E-E-A-T signal Google uses to assess authoritativeness. Combine with Block 1 on the homepage — do not output as a separate `<script>` tag; instead, append this node to the `@graph` array in Block 1.

**Option A — Append this node to the Block 1 `@graph` array (recommended):**

```json
    {
      "@type": "Person",
      "@id": "https://www.gardnergrouprealtors.com/#person-murray",
      "name": "Murray Gardner",
      "givenName": "Murray",
      "familyName": "Gardner",
      "jobTitle": "REALTOR, Luxury Real Estate Specialist",
      "description": "Murray Gardner is a Keller Williams Park City REALTOR and the founder of Gardner Group Realtors, ranked #3 among all Keller Williams agents in Utah. Before entering real estate, Murray served as a U.S. Navy Top Gun instructor and F/A-18 fighter pilot and later as a commercial airline captain — careers that built exceptional analytical discipline, attention to detail, and high-stakes decision-making skills he applies directly to luxury real estate negotiations. Murray is also an experienced luxury home builder with 7 award-winning Showcase homes to his credit, giving his buyers a structural and design eye that no other Park City agent can match. His wife is a professional interior designer, extending that expertise to home staging and presentation. Murray specializes in luxury residential sales throughout Park City, Deer Valley, Empire Pass, The Colony, Old Town, Heber Valley, and the broader Wasatch Back.",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg",
        "caption": "Murray Gardner — Park City REALTOR, Keller Williams"
      },
      "telephone": "+14356405184",
      "email": "murray@gardnergrouprealtors.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1375 Village Ski Ln, Suite 201",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "worksFor": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "hasOccupation": [
        {
          "@type": "Occupation",
          "name": "REALTOR",
          "occupationLocation": {
            "@type": "City",
            "name": "Park City, Utah"
          },
          "description": "Licensed REALTOR specializing in luxury residential real estate in Park City and the Wasatch Back. Ranked #3 among all Keller Williams agents in Utah.",
          "skills": "Luxury home sales, buyer representation, seller representation, new construction, investment properties, negotiation, market analysis"
        },
        {
          "@type": "Occupation",
          "name": "Luxury Home Builder",
          "description": "Builder of 7 award-winning Showcase homes in the Park City area, with deep expertise in construction quality, materials, and structural evaluation."
        }
      ],
      "alumniOf": [
        {
          "@type": "Organization",
          "name": "United States Navy",
          "description": "F/A-18 fighter pilot and Top Gun (TOPGUN) instructor"
        }
      ],
      "award": [
        "Keller Williams #3 Agent in Utah",
        "7 Showcase Home Awards"
      ],
      "knowsAbout": [
        "Park City real estate market",
        "Deer Valley luxury homes",
        "ski-in ski-out properties",
        "luxury home construction and evaluation",
        "Park City new construction",
        "Summit County real estate",
        "Heber Valley homes",
        "investment property analysis",
        "luxury home staging and presentation",
        "Park City neighborhoods and communities"
      ],
      "sameAs": [
        "https://www.facebook.com/GardnerGroupRealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-park-city",
        "https://www.zillow.com/profile/murray-gardner",
        "https://www.yelp.com/biz/gardner-group-realtors-park-city"
      ]
    }
```

**Option B — Standalone `<script>` block if you cannot modify Block 1:**

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.gardnergrouprealtors.com/#person-murray",
  "name": "Murray Gardner",
  "givenName": "Murray",
  "familyName": "Gardner",
  "jobTitle": "REALTOR, Luxury Real Estate Specialist",
  "description": "Murray Gardner is a Keller Williams Park City REALTOR and the founder of Gardner Group Realtors, ranked #3 among all Keller Williams agents in Utah. Before entering real estate, Murray served as a U.S. Navy Top Gun instructor and F/A-18 fighter pilot and later as a commercial airline captain — careers that built exceptional analytical discipline, attention to detail, and high-stakes decision-making skills he applies directly to luxury real estate negotiations. Murray is also an experienced luxury home builder with 7 award-winning Showcase homes to his credit, giving his buyers a structural and design eye that no other Park City agent can match. His wife is a professional interior designer, extending that expertise to home staging and presentation. Murray specializes in luxury residential sales throughout Park City, Deer Valley, Empire Pass, The Colony, Old Town, Heber Valley, and the broader Wasatch Back.",
  "url": "https://www.gardnergrouprealtors.com/about/",
  "image": {
    "@type": "ImageObject",
    "url": "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg",
    "caption": "Murray Gardner — Park City REALTOR, Keller Williams"
  },
  "telephone": "+14356405184",
  "email": "murray@gardnergrouprealtors.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1375 Village Ski Ln, Suite 201",
    "addressLocality": "Park City",
    "addressRegion": "UT",
    "postalCode": "84060",
    "addressCountry": "US"
  },
  "worksFor": {
    "@id": "https://www.gardnergrouprealtors.com/#org"
  },
  "hasOccupation": [
    {
      "@type": "Occupation",
      "name": "REALTOR",
      "occupationLocation": {
        "@type": "City",
        "name": "Park City, Utah"
      },
      "description": "Licensed REALTOR specializing in luxury residential real estate in Park City and the Wasatch Back. Ranked #3 among all Keller Williams agents in Utah.",
      "skills": "Luxury home sales, buyer representation, seller representation, new construction, investment properties, negotiation, market analysis"
    },
    {
      "@type": "Occupation",
      "name": "Luxury Home Builder",
      "description": "Builder of 7 award-winning Showcase homes in the Park City area, with deep expertise in construction quality, materials, and structural evaluation."
    }
  ],
  "alumniOf": [
    {
      "@type": "Organization",
      "name": "United States Navy",
      "description": "F/A-18 fighter pilot and Top Gun (TOPGUN) instructor"
    }
  ],
  "award": [
    "Keller Williams #3 Agent in Utah",
    "7 Showcase Home Awards"
  ],
  "knowsAbout": [
    "Park City real estate market",
    "Deer Valley luxury homes",
    "ski-in ski-out properties",
    "luxury home construction and evaluation",
    "Park City new construction",
    "Summit County real estate",
    "Heber Valley homes",
    "investment property analysis",
    "luxury home staging and presentation",
    "Park City neighborhoods and communities"
  ],
  "sameAs": [
    "https://www.facebook.com/GardnerGroupRealtors",
    "https://www.instagram.com/gardnergrouprealtors",
    "https://www.linkedin.com/in/murray-gardner-park-city",
    "https://www.zillow.com/profile/murray-gardner",
    "https://www.yelp.com/biz/gardner-group-realtors-park-city"
  ]
}
</script>
```

**Notes:**
- The `@id` `https://www.gardnergrouprealtors.com/#person-murray` must match exactly in every schema block across the site. This is what allows Google to merge all references into a single entity.
- The `description` field is the most important text in this block for E-E-A-T purposes. Keep it factual, credential-forward, and free of marketing language. Google will extract facts from this field when constructing Knowledge Panel entries and AI Overview citations.
- `alumniOf` pointing to the U.S. Navy establishes the Top Gun and fighter pilot credentials in structured data — a significant differentiator no competitor can replicate.
- Update `sameAs` URLs to exact verified profile URLs once confirmed. Do not include a URL unless the profile exists and is active.

---

## Block 3 — About Page: Person + RealEstateAgent

**Page:** `https://www.gardnergrouprealtors.com/about/`
**Purpose:** Reinforces entity identity on the About page with deeper credential signals and cross-references the homepage entity IDs.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.gardnergrouprealtors.com/#person-murray",
      "name": "Murray Gardner",
      "givenName": "Murray",
      "familyName": "Gardner",
      "jobTitle": "REALTOR, Luxury Real Estate Specialist",
      "description": "Murray Gardner is the founder of Gardner Group Realtors and a Keller Williams Park City REALTOR ranked #3 among all KW agents in Utah. Before real estate, Murray was a U.S. Navy F/A-18 fighter pilot and Top Gun instructor, then a commercial airline captain — bringing analytical precision and high-stakes decision-making to every transaction. As a luxury home builder with 7 Showcase homes, Murray evaluates properties with a builder's eye for structural quality and long-term value that no other Park City agent can offer.",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg",
        "caption": "Murray Gardner, Park City REALTOR"
      },
      "telephone": "+14356405184",
      "email": "murray@gardnergrouprealtors.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1375 Village Ski Ln, Suite 201",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "worksFor": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "memberOf": [
        {
          "@type": "Organization",
          "name": "Keller Williams Realty Park City",
          "url": "https://www.kwparkcity.com"
        },
        {
          "@type": "Organization",
          "name": "Utah Association of Realtors",
          "url": "https://www.utahrealtors.com"
        },
        {
          "@type": "Organization",
          "name": "National Association of Realtors",
          "url": "https://www.nar.realtor"
        }
      ],
      "alumniOf": [
        {
          "@type": "Organization",
          "name": "United States Navy",
          "description": "F/A-18 Hornet fighter pilot and Top Gun (TOPGUN) instructor"
        }
      ],
      "hasOccupation": [
        {
          "@type": "Occupation",
          "name": "REALTOR",
          "occupationLocation": {
            "@type": "City",
            "name": "Park City, Utah"
          },
          "description": "Luxury residential real estate specialist in Park City, Deer Valley, and the Wasatch Back. Ranked #3 among all Keller Williams agents in Utah.",
          "skills": "Luxury home sales, buyer representation, seller representation, new construction, investment properties, off-market properties, negotiation, market analysis, home construction evaluation"
        },
        {
          "@type": "Occupation",
          "name": "Luxury Home Builder",
          "description": "Builder of 7 award-winning Showcase homes in the Park City, Utah area."
        },
        {
          "@type": "Occupation",
          "name": "Airline Captain",
          "description": "Former commercial airline captain with extensive flight hours and leadership experience."
        },
        {
          "@type": "Occupation",
          "name": "U.S. Navy Fighter Pilot",
          "description": "Former F/A-18 Hornet pilot and Top Gun (Naval Fighter Weapons School) instructor."
        }
      ],
      "award": [
        "Keller Williams #3 Agent in Utah",
        "7 Showcase Home Awards, Park City, UT"
      ],
      "knowsAbout": [
        "Park City real estate",
        "Deer Valley homes for sale",
        "luxury residential real estate",
        "ski-in ski-out properties",
        "custom home construction",
        "Park City new construction homes",
        "Summit County real estate",
        "Wasatch County real estate",
        "Heber Valley homes",
        "Park City luxury home staging",
        "real estate investment Park City"
      ],
      "sameAs": [
        "https://www.facebook.com/GardnerGroupRealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-park-city",
        "https://www.zillow.com/profile/murray-gardner",
        "https://www.homes.com/real-estate-agents/murray-gardner",
        "https://www.yelp.com/biz/gardner-group-realtors-park-city",
        "https://www.kw.com/agent/murray-gardner"
      ]
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.gardnergrouprealtors.com/#agent-murray",
      "name": "Murray Gardner — Gardner Group Realtors",
      "url": "https://www.gardnergrouprealtors.com/about/",
      "image": "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg",
      "telephone": "+14356405184",
      "email": "murray@gardnergrouprealtors.com",
      "description": "Park City REALTOR specializing in luxury homes, Deer Valley estates, ski-in/ski-out properties, and new construction throughout Summit and Wasatch Counties. Keller Williams #3 agent in Utah. Former Top Gun instructor and luxury home builder.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1375 Village Ski Ln, Suite 201",
        "addressLocality": "Park City",
        "addressRegion": "UT",
        "postalCode": "84060",
        "addressCountry": "US"
      },
      "areaServed": [
        "Park City, UT",
        "Deer Valley, UT",
        "Old Town Park City",
        "Empire Pass",
        "Deer Crest",
        "The Colony at White Pine Canyon",
        "Promontory",
        "Canyons Village",
        "Glenwild",
        "Tuhaye",
        "Heber City, UT",
        "Midway, UT",
        "Snyderville Basin",
        "Jordanelle, UT",
        "Jeremy Ranch",
        "Summit County, UT",
        "Wasatch County, UT"
      ],
      "worksFor": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "memberOf": [
        {
          "@type": "Organization",
          "name": "Keller Williams Realty Park City",
          "url": "https://www.kwparkcity.com"
        },
        {
          "@type": "Organization",
          "name": "National Association of Realtors",
          "url": "https://www.nar.realtor"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/GardnerGroupRealtors",
        "https://www.instagram.com/gardnergrouprealtors",
        "https://www.linkedin.com/in/murray-gardner-park-city",
        "https://www.zillow.com/profile/murray-gardner",
        "https://www.yelp.com/biz/gardner-group-realtors-park-city"
      ]
    }
  ]
}
</script>
```

**Notes:**
- The `memberOf` array should list only organizations where Murray holds an active, verifiable membership. Add or remove entries based on what is confirmed. If Realtor.com, BBB, or Chamber of Commerce profiles are created per the audit recommendations, add their `@type Organization` entries here.
- `hasOccupation` with multiple roles is valid schema.org — it directly supports the multi-career narrative that is Murray's primary differentiator.
- Once a Utah real estate license number is available, add: `"hasCredential": { "@type": "EducationalOccupationalCredential", "credentialCategory": "license", "name": "Utah Real Estate License", "recognizedBy": { "@type": "Organization", "name": "Utah Division of Real Estate" }, "identifier": "YOUR_LICENSE_NUMBER" }`

---

## Block 4 — Contact Page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification

**Page:** `https://www.gardnergrouprealtors.com/contact/`
**Purpose:** Establishes the full LocalBusiness entity with precise location data, contact methods, hours, and geographic coordinates. This is the primary schema for Google Maps / Local Pack visibility. The NAP data here must be byte-for-byte identical to the Google Business Profile.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.gardnergrouprealtors.com/#localbusiness",
  "name": "Gardner Group Realtors",
  "alternateName": "Gardner Group | Keller Williams Park City",
  "legalName": "Gardner Group Realtors",
  "url": "https://www.gardnergrouprealtors.com",
  "logo": "https://www.gardnergrouprealtors.com/images/gardner-group-logo.png",
  "image": [
    "https://www.gardnergrouprealtors.com/images/gardner-group-office.jpg",
    "https://www.gardnergrouprealtors.com/images/murray-gardner-headshot.jpg"
  ],
  "description": "Park City real estate specialists serving buyers and sellers throughout Park City, Deer Valley, Heber Valley, and the Wasatch Back. Led by Murray Gardner, Keller Williams Park City — former Top Gun instructor, luxury home builder, and the #3 KW agent in Utah.",
  "telephone": "+14356405184",
  "email": "murray@gardnergrouprealtors.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1375 Village Ski Ln, Suite 201",
    "addressLocality": "Park City",
    "addressRegion": "UT",
    "postalCode": "84060",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.6461",
    "longitude": "-111.4980"
  },
  "hasMap": "https://maps.google.com/?q=Gardner+Group+Realtors+Park+City+UT",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+14356405184",
      "contactType": "sales",
      "areaServed": [
        "Park City, UT",
        "Summit County, UT",
        "Wasatch County, UT"
      ],
      "availableLanguage": "English",
      "contactOption": "TollFree"
    },
    {
      "@type": "ContactPoint",
      "email": "murray@gardnergrouprealtors.com",
      "contactType": "customer support",
      "areaServed": "US",
      "availableLanguage": "English"
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
      "closes": "17:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "15:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "00:00",
      "closes": "00:00",
      "description": "By appointment"
    }
  ],
  "priceRange": "$$$",
  "currenciesAccepted": "USD",
  "paymentAccepted": "Cash, Check, Wire Transfer",
  "areaServed": [
    {
      "@type": "City",
      "name": "Park City",
      "containedInPlace": {
        "@type": "State",
        "name": "Utah"
      }
    },
    {
      "@type": "Place",
      "name": "Deer Valley, UT"
    },
    {
      "@type": "Place",
      "name": "Heber City, UT"
    },
    {
      "@type": "Place",
      "name": "Midway, UT"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Summit County, UT"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Wasatch County, UT"
    }
  ],
  "parentOrganization": {
    "@type": "Organization",
    "name": "Keller Williams Realty Park City",
    "url": "https://www.kwparkcity.com"
  },
  "sameAs": [
    "https://www.facebook.com/GardnerGroupRealtors",
    "https://www.instagram.com/gardnergrouprealtors",
    "https://www.linkedin.com/in/murray-gardner-park-city",
    "https://www.zillow.com/profile/murray-gardner",
    "https://www.yelp.com/biz/gardner-group-realtors-park-city"
  ]
}
</script>
```

**Notes:**
- **GeoCoordinates:** The latitude/longitude provided (`40.6461, -111.4980`) is an approximation for Park City's Village Ski Lift area. Confirm the exact coordinates for the office address using Google Maps before publishing.
- **OpeningHoursSpecification:** Real estate agents are typically available by appointment outside standard hours. Verify current office hours with Murray and update accordingly. Sunday `"00:00"` to `"00:00"` is a valid way to indicate the business is technically closed but available by appointment — alternatively, omit Sunday entirely if there are no set hours.
- **`contactOption: "TollFree"`:** Remove this if the number is not toll-free. For a local (435) area code number, omit this field or use `"HearingImpairedSupported"` if applicable.
- The `geo` coordinates are used by Google Maps and Bing Maps to pin the business location — accuracy matters for Local Pack inclusion.
- This block deliberately uses `@type: "LocalBusiness"` rather than the more specific `"RealEstateAgent"` type because `LocalBusiness` is what drives Maps / Local Pack results. The `RealEstateAgent` type is used in other blocks for agent-specific rich results.

---

## Block 5 — Community/Service Page Template: Article + BreadcrumbList

**Purpose:** Template for all community and service pages. Replace bracketed placeholders with page-specific values. Two filled examples follow the template.

### Base Template

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "[PAGE_URL]#article",
      "headline": "[PAGE H1 TEXT]",
      "name": "[PAGE TITLE]",
      "description": "[PAGE META DESCRIPTION — 150-160 chars]",
      "url": "[PAGE_URL]",
      "image": {
        "@type": "ImageObject",
        "url": "[PAGE_HERO_IMAGE_URL]",
        "width": 1200,
        "height": 628,
        "caption": "[IMAGE ALT TEXT]"
      },
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD — update whenever content changes]",
      "inLanguage": "en-US",
      "isPartOf": {
        "@id": "https://www.gardnergrouprealtors.com/#website"
      },
      "about": {
        "@type": "Place",
        "name": "[COMMUNITY NAME]",
        "containedInPlace": {
          "@type": "City",
          "name": "Park City",
          "containedInPlace": {
            "@type": "State",
            "name": "Utah"
          }
        }
      },
      "keywords": "[comma-separated keywords for this community]",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "[PAGE_URL]"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "[PAGE_URL]#breadcrumbs",
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
          "name": "Communities",
          "item": "https://www.gardnergrouprealtors.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[COMMUNITY NAME]",
          "item": "[PAGE_URL]"
        }
      ]
    }
  ]
}
</script>
```

---

### Example 1 — Empire Pass Community Page (filled)

**Page:** `https://www.gardnergrouprealtors.com/empire-pass/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.gardnergrouprealtors.com/empire-pass/#article",
      "headline": "Empire Pass Park City Homes for Sale — Ski-In Estates, Montage Deer Valley & Alpine Living",
      "name": "Empire Pass Park City Homes for Sale | Ski-In Estates, Montage Deer Valley & Alpine Living",
      "description": "Discover Empire Pass homes for sale in Park City — ski-in/ski-out estates, Silver Strike Express access, Montage Deer Valley, and Talisker Tower. Expert guidance from Murray Gardner.",
      "url": "https://www.gardnergrouprealtors.com/empire-pass/",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.gardnergrouprealtors.com/images/empire-pass-hero.jpg",
        "width": 1200,
        "height": 628,
        "caption": "Empire Pass Park City — ski-in/ski-out homes with Silver Strike Express access"
      },
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "datePublished": "2025-07-01",
      "dateModified": "2026-03-01",
      "inLanguage": "en-US",
      "isPartOf": {
        "@id": "https://www.gardnergrouprealtors.com/#website"
      },
      "about": {
        "@type": "Place",
        "name": "Empire Pass",
        "description": "Empire Pass is Park City's premier ski-in/ski-out residential community, located within the Deer Valley Resort boundary at elevations above 8,000 feet. Notable developments include Montage Deer Valley, Talisker Tower, Flagstaff Lodge, and The Chateaux at Silver Lake. Properties range from luxury condominiums to multi-million-dollar ski estates.",
        "containedInPlace": {
          "@type": "City",
          "name": "Park City",
          "containedInPlace": {
            "@type": "State",
            "name": "Utah"
          }
        }
      },
      "keywords": "Empire Pass Park City, Empire Pass homes for sale, ski-in ski-out Park City, Montage Deer Valley real estate, Talisker Tower condos, Empire Pass luxury homes, Deer Valley ski estates",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.gardnergrouprealtors.com/empire-pass/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/empire-pass/#breadcrumbs",
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
          "name": "Communities",
          "item": "https://www.gardnergrouprealtors.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Deer Valley",
          "item": "https://www.gardnergrouprealtors.com/deer-valley/"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Empire Pass",
          "item": "https://www.gardnergrouprealtors.com/empire-pass/"
        }
      ]
    }
  ]
}
</script>
```

---

### Example 2 — Old Town Park City Community Page (filled)

**Page:** `https://www.gardnergrouprealtors.com/old-town/`

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.gardnergrouprealtors.com/old-town/#article",
      "headline": "Old Town Park City Homes for Sale — Main Street Access, Ski Runs & Historic Charm",
      "name": "Old Town Park City Real Estate | Main Street Access, Ski Runs & Historic Charm",
      "description": "Explore Old Town Park City real estate — Victorians, lift-side condos, and historic homes steps from Main Street restaurants, galleries, and Park City Mountain ski runs.",
      "url": "https://www.gardnergrouprealtors.com/old-town/",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.gardnergrouprealtors.com/images/old-town-park-city-hero.jpg",
        "width": 1200,
        "height": 628,
        "caption": "Old Town Park City — Main Street historic district with ski run access"
      },
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "datePublished": "2025-07-01",
      "dateModified": "2026-03-01",
      "inLanguage": "en-US",
      "isPartOf": {
        "@id": "https://www.gardnergrouprealtors.com/#website"
      },
      "about": {
        "@type": "Place",
        "name": "Old Town Park City",
        "description": "Old Town is Park City's historic core — the original silver mining district now home to the famous Main Street lined with restaurants, galleries, and boutiques. Properties include Victorian-era homes, modern condominiums, and townhomes within walking distance of ski lifts, the Park City Mountain resort base, and the Town Lift.",
        "containedInPlace": {
          "@type": "City",
          "name": "Park City",
          "containedInPlace": {
            "@type": "State",
            "name": "Utah"
          }
        }
      },
      "keywords": "Old Town Park City homes, Old Town Park City real estate, Park City Main Street condos, historic Park City homes, Park City ski-in ski-out Old Town, Old Town Park City Victorian homes",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.gardnergrouprealtors.com/old-town/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/old-town/#breadcrumbs",
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
          "name": "Communities",
          "item": "https://www.gardnergrouprealtors.com/communities/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Park City",
          "item": "https://www.gardnergrouprealtors.com/park-city/"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Old Town",
          "item": "https://www.gardnergrouprealtors.com/old-town/"
        }
      ]
    }
  ]
}
</script>
```

**Community page template notes:**
- **Breadcrumb depth:** Use the full path that reflects your actual URL hierarchy. Old Town is nested under Park City in the navigation, so the 4-level breadcrumb above is correct. Empire Pass is under Deer Valley, so it also uses 4 levels.
- **`dateModified`:** This field is the most important freshness signal in this block. Update it every time you make substantive changes to the page content. This is how Google's freshness algorithm sees that the content is actively maintained. Carlson (your top competitor) uses year-stamps in visible content; `dateModified` does the same thing in structured data.
- **`about` with `Place`:** Providing a rich `about` description in structured data gives Google context about the community beyond what the page title says. This is particularly valuable for AI Overview citations about specific neighborhoods.
- **`keywords`:** This field is not used by Google for ranking but is valid schema.org. It helps other schema consumers understand the page context. Keep it to 6–10 specific, non-padded terms.
- For community sub-pages (e.g., `/empire-pass/5-bedroom/`), use the same template but adjust the breadcrumb to add a 5th level: `{ "position": 5, "name": "5-Bedroom Homes", "item": "https://www.gardnergrouprealtors.com/empire-pass/5-bedroom/" }`.

---

## Block 6 — Blog Post Template: BlogPosting + BreadcrumbList + ImageObject

**Purpose:** Template for all blog posts. One filled example follows.

### Base Template

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "[POST_URL]#blogposting",
      "headline": "[POST TITLE — exact H1 text, max 110 chars]",
      "name": "[POST TITLE]",
      "description": "[POST META DESCRIPTION — 150-160 chars]",
      "url": "[POST_URL]",
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD — update on every content revision]",
      "inLanguage": "en-US",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "image": {
        "@type": "ImageObject",
        "@id": "[POST_URL]#primaryimage",
        "url": "[POST_FEATURED_IMAGE_URL]",
        "width": 1200,
        "height": 628,
        "caption": "[IMAGE CAPTION / ALT TEXT]"
      },
      "thumbnailUrl": "[POST_FEATURED_IMAGE_URL]",
      "isPartOf": {
        "@id": "https://www.gardnergrouprealtors.com/#website"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "[POST_URL]"
      },
      "keywords": "[comma-separated topic keywords]",
      "articleSection": "Park City Real Estate",
      "wordCount": [APPROXIMATE_WORD_COUNT]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "[POST_URL]#breadcrumbs",
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
          "name": "[POST TITLE — shortened if long]",
          "item": "[POST_URL]"
        }
      ]
    }
  ]
}
</script>
```

---

### Filled Example — "Park City vs. Jackson Hole & Sun Valley" Blog Post

**Page:** `https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/` *(confirm exact URL)*

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#blogposting",
      "headline": "Park City vs. Jackson Hole & Sun Valley: What Mountain-Town Living Really Feels Like",
      "name": "Park City vs. Jackson Hole & Sun Valley Real Estate: Insider Guide to Luxury Mountain Living",
      "description": "Compare Park City, Jackson Hole, and Sun Valley through a private-client lens — taxes, ski access, walkability, price per square foot, and quality of life from someone who's lived and worked in all three markets.",
      "url": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/",
      "datePublished": "2025-09-15",
      "dateModified": "2026-03-01",
      "inLanguage": "en-US",
      "author": {
        "@id": "https://www.gardnergrouprealtors.com/#person-murray"
      },
      "publisher": {
        "@id": "https://www.gardnergrouprealtors.com/#org"
      },
      "image": {
        "@type": "ImageObject",
        "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#primaryimage",
        "url": "https://www.gardnergrouprealtors.com/images/blog/park-city-vs-jackson-hole-hero.jpg",
        "width": 1200,
        "height": 628,
        "caption": "Park City Utah ski town compared to Jackson Hole Wyoming and Sun Valley Idaho for luxury real estate buyers"
      },
      "thumbnailUrl": "https://www.gardnergrouprealtors.com/images/blog/park-city-vs-jackson-hole-hero.jpg",
      "isPartOf": {
        "@id": "https://www.gardnergrouprealtors.com/#website"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/"
      },
      "keywords": "Park City vs Jackson Hole, Park City vs Sun Valley, luxury mountain real estate, best ski town to buy real estate, Park City real estate investment, mountain town living comparison",
      "articleSection": "Park City Real Estate",
      "wordCount": 3500,
      "about": [
        {
          "@type": "Place",
          "name": "Park City, Utah"
        },
        {
          "@type": "Place",
          "name": "Jackson Hole, Wyoming"
        },
        {
          "@type": "Place",
          "name": "Sun Valley, Idaho"
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/#breadcrumbs",
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
          "name": "Park City vs. Jackson Hole & Sun Valley",
          "item": "https://www.gardnergrouprealtors.com/blog/park-city-vs-jackson-hole-sun-valley/"
        }
      ]
    }
  ]
}
</script>
```

**Blog post template notes:**
- **`datePublished` and `dateModified`:** `datePublished` should reflect the original publication date. `dateModified` must be updated every time the post content is substantively revised. Google uses `dateModified` as the primary freshness signal for blog content, not the publication date. Adding "(2026)" to the post title (as recommended in the audit) combined with an updated `dateModified` creates a double freshness signal.
- **`wordCount`:** Use an approximate count. Accurate word counts are a minor validity signal but do not need to be exact.
- **`about` array:** For posts that discuss multiple locations (like this comparison post), list all major entities in the `about` array. This is how Google understands the comparative intent of the content and may cite it in response to "Park City vs X" queries.
- **Image URL pattern:** Update the `url` values to match actual hosted image paths. The 1200×628 ratio is the standard Open Graph and rich results image size.

---

## Block 7 — Buyer FAQ: FAQPage

**Page:** `https://www.gardnergrouprealtors.com/buyers/` (or a dedicated FAQ page)
**Purpose:** Targets featured snippet placements and People Also Ask boxes for buyer-intent queries. All Q&A pairs are drawn directly from actual Park City market data identified in the audit research.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the median home price in Park City, Utah?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The median home price in Park City, Utah is approximately $1.8–2.2 million as of early 2026, with single-family homes typically commanding a premium over condominiums. Prices vary significantly by neighborhood: Old Town and Park Meadows homes generally range from $1M to $4M+, while ski-in/ski-out properties in Empire Pass and Deer Crest regularly sell between $3M and $15M+. The broader Park City area (including Heber Valley and Snyderville Basin) offers more accessible price points starting around $700,000–$900,000."
      }
    },
    {
      "@type": "Question",
      "name": "Is Park City a buyers or sellers market in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City's luxury segment ($2M+) remains a seller's market in 2026, driven by limited ski-adjacent inventory and sustained demand from out-of-state buyers — particularly from California, Texas, and the Pacific Northwest. The broader Park City market has seen modest inventory increases over the past 12 months, creating slightly more negotiating room for buyers in the $800K–$1.5M range. However, well-priced properties in top-tier communities like Empire Pass, Old Town, and The Colony still attract multiple offers. Acting quickly with pre-approval or proof of funds is essential in this market."
      }
    },
    {
      "@type": "Question",
      "name": "Can you find affordable homes near Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The most affordable options near Park City are found in Heber City, Midway, Silver Creek Village, Kimball Junction, and Snyderville Basin, where single-family homes are available starting in the $700,000–$950,000 range. Eastern Summit County communities — including Kamas, Woodland/Francis, and Peoa — offer rural properties with acreage at significantly lower price points than in-town Park City. These areas provide reasonable commute times to Park City (15–30 minutes) while offering substantially more value per square foot."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best ski-in ski-out communities in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City's top ski-in/ski-out communities are Empire Pass (within Deer Valley Resort, home to Montage Deer Valley, Talisker Tower, and Flagstaff Lodge), Deer Crest (exclusive gated community above Deer Valley with St. Regis Deer Crest funicular access), and The Colony at White Pine Canyon (Park City Mountain Resort ski access on private lots from 5–100+ acres). Canyons Village at Park City Mountain Resort also offers slope-side condominiums and townhomes at a range of price points. Empire Pass is considered the most prestigious ski-in/ski-out address in Utah."
      }
    },
    {
      "@type": "Question",
      "name": "How do I buy a home in Park City as an out-of-state buyer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Buying in Park City from out of state requires a few additional steps: (1) Get pre-approved or arrange proof of funds first — Park City's competitive market moves quickly and over 50% of transactions are cash purchases. (2) Work with a local buyer's agent who can conduct video tours, provide neighborhood-by-neighborhood guidance, and alert you to new listings before they hit the public market. (3) Understand Utah-specific practices, including title insurance customs, escrow procedures, and HOA disclosure requirements that differ from many other states. (4) If purchasing as a vacation rental investment, review current Park City short-term rental regulations, which restrict STR permits to certain zones. Murray Gardner specializes in representing out-of-state buyers and can guide you through every step."
      }
    },
    {
      "@type": "Question",
      "name": "What are short-term rental rules in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City has strict short-term rental (STR) regulations. STR permits are only available in certain zoning districts — primarily Resort Commercial zones and some Mixed-Use areas near ski resorts. Most residential neighborhoods in Park City proper do not allow STRs. If purchasing for rental income, buyers must confirm the specific property's zoning allows STR use before closing, as permits are not transferable in most cases and waiting lists can be long. Heber City has more flexible rental regulations. Consult a local real estate attorney and review Park City Municipal Code Chapter 15-9B for current requirements."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between Park City and Deer Valley for real estate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Park City Mountain Resort and Deer Valley Resort share the same town but attract different buyer profiles. Deer Valley is skier-only (no snowboards), known for impeccable grooming, five-star amenities, and exclusive ski-in/ski-out communities like Empire Pass, Upper Deer Valley, and Deer Crest. Properties in the Deer Valley corridor command the highest prices in the Park City market, often $3M–$20M+. Park City Mountain Resort (operated by Vail Resorts) covers more terrain, is snowboard-friendly, and its adjacent neighborhoods — Old Town, Canyons Village, Park Meadows — offer a wider price range starting around $700K. Deer Valley is expanding with the new East Village development, adding ski terrain and driving investment interest in surrounding communities like Jordanelle and Mayflower."
      }
    }
  ]
}
</script>
```

**Notes:**
- Place this schema on any page that contains these FAQs as body content. Google requires that the question and answer text in the schema matches (or closely reflects) visible content on the page. Do not add schema for Q&A pairs that don't appear visibly on the page.
- The STR rules answer directly references Park City Municipal Code — this kind of specific local detail scores highly for E-E-A-T and is the type of content Google cites in AI Overviews.
- Update the median price figures (Block 7, Q1) monthly or quarterly to maintain freshness. Stale market data is one of the fastest ways to lose AI Overview citations.

---

## Block 8 — Seller FAQ: FAQPage

**Page:** `https://www.gardnergrouprealtors.com/sellers/` (or a dedicated seller FAQ page)
**Purpose:** Targets seller-intent queries and People Also Ask placements. All data is drawn from Park City market specifics identified in the audit.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best time to sell a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Park City, there are two peak selling seasons that align with the resort lifestyle. The primary selling season runs from February through June — the heart of ski season through spring, when buyer activity is highest and affluent visitors touring the area convert into purchasers. The secondary selling season is August through October, when summer visitors explore the area's mountain biking, hiking, and golf communities and begin evaluating real estate. The slowest periods are typically late October through November (the transition between seasons) and late January (deep ski season, minimal traffic). For luxury properties ($3M+), seasonality matters less — serious buyers transact year-round. For mid-market properties, listing in February or March maximizes exposure to the maximum pool of active buyers."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Days on market in Park City vary significantly by price tier and community. In 2025, well-priced single-family homes in desirable communities like Old Town, Park Meadows, and Canyons Village averaged 30–60 days on market. Luxury properties ($3M+) and ski-in/ski-out estates in Empire Pass or Deer Crest typically took 60–120 days due to the smaller buyer pool, though exceptional properties at the right price point have sold in under 30 days. Properties priced above market or in less sought-after locations can sit 180+ days. Proper pricing, professional staging, and strategic marketing — including targeted outreach to Keller Williams' national network — are the primary factors in reducing time on market."
      }
    },
    {
      "@type": "Question",
      "name": "What are closing costs for sellers in Utah?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Utah, sellers typically pay 5–7% of the sale price in total closing costs, including: real estate commission (negotiated, typically 4–6% split between buyer's and listing agent), title insurance (seller pays the owner's policy in Utah, typically 0.3–0.5% of sale price), escrow/closing fees ($500–$1,500), recording fees ($50–$200), and any negotiated buyer concessions. Utah does not impose a transfer tax, which is an advantage compared to many other states. On a $2M Park City home, a seller should budget approximately $100,000–$140,000 in total transaction costs, depending on negotiated commission and any repair credits."
      }
    },
    {
      "@type": "Question",
      "name": "How do I find a good realtor to sell my home in Park City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "When evaluating a Park City listing agent, look for: (1) Verifiable local sales history — ask for a list of recent comparable transactions and verify them in the MLS. (2) Knowledge of your specific neighborhood — agents who specialize in Old Town should know Old Town's micro-market, not just Park City in general. (3) A marketing plan that goes beyond MLS — top agents use professional photography, videography, Matterport 3D tours, targeted digital advertising, and network outreach to qualified buyers. (4) Brokerage reach — Keller Williams Park City has one of the largest agent networks in the region, providing access to buyers nationally. (5) Construction and staging expertise — an agent who can identify a home's structural strengths and recommend cost-effective improvements before listing will maximize your sale price. Murray Gardner, as both a former luxury home builder and top-producing KW agent, provides this unique combination of skills."
      }
    },
    {
      "@type": "Question",
      "name": "What improvements add the most value to a Park City home before selling?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Park City's luxury and mountain home market, the improvements with the highest return on investment before selling are: (1) Professional staging — Park City's buyer pool is highly visual; staged homes sell faster and at higher prices. (2) Ski storage and mudroom upgrades — buyers in this market expect functional ski-in lifestyle infrastructure. (3) Outdoor living spaces — decks, fire pits, and hot tubs with mountain views dramatically increase perceived value. (4) Radiant floor heating and high-end mechanical systems — buyers in cold-climate markets scrutinize utility infrastructure. (5) Fresh paint, updated fixtures, and deep cleaning — high-end buyers are accustomed to turnkey properties and will discount heavily for dated finishes. Major renovations (kitchen, bath) rarely return full cost in the short term — focus on presentation and lifestyle infrastructure."
      }
    }
  ]
}
</script>
```

**Notes:**
- The closing costs answer includes specific Utah tax details (no transfer tax) — this is the kind of state-specific, accurate detail that distinguishes Park City expert content from generic real estate advice and is the type of answer Google prioritizes for AI Overview citations.
- Update the days-on-market statistics in Q2 annually or when quarterly market data is published.
- These FAQs can also be used on a standalone "Park City Home Seller FAQ" page, which the audit recommends creating. That dedicated page should have visible H2/H3 question text matching the schema questions exactly.

---

## Block 9 — AggregateRating Schema

**Pages:** Homepage (`https://www.gardnergrouprealtors.com/`) and About page (`https://www.gardnergrouprealtors.com/about/`)
**Purpose:** Displays star ratings in SERPs when Google surfaces the agent's profile for branded and agent-comparison queries. Requires real, verified review data.

> **IMPORTANT: Do not publish this schema with placeholder data.** The `ratingValue`, `reviewCount`, and `bestRating` fields must reflect actual verified reviews. Using false data is a violation of Google's structured data guidelines and will result in a manual penalty. Collect and verify your review data from Google Business Profile, Zillow, or Yelp before publishing this block.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.gardnergrouprealtors.com/#agent-murray",
  "name": "Murray Gardner — Gardner Group Realtors",
  "url": "https://www.gardnergrouprealtors.com",
  "telephone": "+14356405184",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[UPDATE WITH ACTUAL AVERAGE — e.g., 5.0]",
    "reviewCount": "[UPDATE WITH ACTUAL COUNT — e.g., 47]",
    "bestRating": "5",
    "worstRating": "1",
    "itemReviewed": {
      "@type": "RealEstateAgent",
      "name": "Murray Gardner — Gardner Group Realtors",
      "url": "https://www.gardnergrouprealtors.com"
    }
  }
}
</script>
```

**How to get the data to populate this block:**

1. Log into your **Google Business Profile** → Reviews tab. Count total reviews and calculate average rating.
2. Check your **Zillow agent profile** for reviews and ratings (Zillow uses a 5-star scale).
3. Check **Yelp** (you have 89 photos listed but review count was not confirmed in the audit).
4. Use the platform with the most reviews and highest count as the primary source, or aggregate across platforms if you use a review aggregation service.
5. Once confirmed, replace the bracketed placeholders and publish.

**Review count targets to unlock SERPs display:**
- Google typically displays AggregateRating rich results for agents with 5+ reviews — so the threshold is low.
- Agents with 50+ Google reviews see significantly higher branded SERP click-through rates.
- The audit notes the site has no visible review count currently. Building Google reviews is the #1 trust signal recommended in the audit's E-E-A-T section. Each review also extends the freshness signal of this schema block.

**Once populated, append this block to the Block 1 `@graph` array** rather than outputting as a separate `<script>` tag, keeping all homepage schema in one consolidated `@graph`.

---

## Cross-Page @id Reference Map

This table documents every `@id` URI used across all schema blocks. These must be consistent — copy-paste from this table, do not retype.

| Entity | @id URI | Used In |
|---|---|---|
| Organization | `https://www.gardnergrouprealtors.com/#org` | Blocks 1, 2, 3, 4, 5, 6 |
| Person (Murray) | `https://www.gardnergrouprealtors.com/#person-murray` | Blocks 1, 2, 3, 5, 6 |
| RealEstateAgent | `https://www.gardnergrouprealtors.com/#agent-murray` | Blocks 1, 3, 4, 9 |
| WebSite | `https://www.gardnergrouprealtors.com/#website` | Blocks 1, 5, 6 |
| LocalBusiness | `https://www.gardnergrouprealtors.com/#localbusiness` | Block 4 |
| Article (community pages) | `[PAGE_URL]#article` | Block 5 (per-page) |
| BlogPosting | `[POST_URL]#blogposting` | Block 6 (per-page) |
| BreadcrumbList | `[PAGE_URL]#breadcrumbs` | Blocks 5, 6 (per-page) |
| Primary Image | `[POST_URL]#primaryimage` | Block 6 (per-page) |

---

## Validation Checklist

Before deploying any schema block to production, validate it through these tools in order:

| Step | Tool | URL | What to Check |
|---|---|---|---|
| 1 | Google Rich Results Test | https://search.google.com/test/rich-results | No errors; eligible rich result types shown |
| 2 | Schema.org Validator | https://validator.schema.org | No critical warnings; proper @type hierarchy |
| 3 | Google Search Console | After deploying | Check Enhancements section for errors within 1–2 weeks |

**Common errors to watch for:**

| Error | Cause | Fix |
|---|---|---|
| "Missing field: @type" | A node is missing its `@type` declaration | Add `"@type"` to the affected node |
| "The value of field 'url' must be a valid URL" | Relative URLs used instead of absolute | Change all URLs to `https://www.gardnergrouprealtors.com/path/` |
| "Either 'streetAddress' or 'name' should be specified" | Incomplete PostalAddress | Add `streetAddress` to all address nodes |
| "The value of 'ratingValue' must be between 1 and 5" | Rating out of valid range | Verify actual rating is ≤5.0 |
| "Items must have 'item' property" | BreadcrumbList ListItem missing `item` URL | Add `"item"` URL to every ListItem |
| "Duplicate @id" | Same @id URI used for two different entities | Each entity must have a unique @id |

---

## sameAs Profile URLs — Update Log

The `sameAs` arrays across all blocks use placeholder-style profile URLs. Before publishing, replace every `sameAs` URL with the exact verified URL from the live profile. Use this log to track confirmed URLs:

| Platform | Placeholder Used | Confirmed URL | Status |
|---|---|---|---|
| Facebook | `https://www.facebook.com/GardnerGroupRealtors` | | Needs confirmation |
| Instagram | `https://www.instagram.com/gardnergrouprealtors` | | Needs confirmation |
| LinkedIn | `https://www.linkedin.com/in/murray-gardner-park-city` | | Needs confirmation |
| Zillow | `https://www.zillow.com/profile/murray-gardner` | | Needs confirmation |
| Homes.com | `https://www.homes.com/real-estate-agents/murray-gardner` | | Needs confirmation |
| Yelp | `https://www.yelp.com/biz/gardner-group-realtors-park-city` | | Needs confirmation |
| KW National | `https://www.kw.com/agent/murray-gardner` | | Needs confirmation |
| Realtor.com | — | | Create profile (audit priority) |
| Redfin | — | | Create profile (audit priority) |
| Trulia | — | | Create profile (audit priority) |

> Once Realtor.com, Redfin, and Trulia profiles are created (audit recommendation P1), add their URLs to the `sameAs` arrays in Blocks 1, 2, 3, and 4.

---

*Document prepared March 12, 2026 for Murray Gardner | Gardner Group Realtors | Keller Williams Park City*
*All schema follows schema.org vocabulary and Google's Structured Data guidelines (developers.google.com/search/docs/appearance/structured-data)*
*Validate all blocks at https://search.google.com/test/rich-results before deployment*
