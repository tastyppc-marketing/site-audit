# Script Audit: `template/scripts/gather-local-seo.js`

Last updated: 2026-04-17

File: [template/scripts/gather-local-seo.js](/root/site-audit/template/scripts/gather-local-seo.js:1)

## Purpose

`gather-local-seo.js` is the no-auth public-web local SEO collector. It tries
to build a lightweight local SEO research artifact without GBP API access.

It gathers:

- website NAP data
- directory presence checks
- citation summary scaffolding

It writes:

- `seo/research/local-seo.json`

## Inputs

### CLI inputs

- `--domain`
- `--name`
- `--location`
- `--config <client-config.json>`

### Runtime dependencies

- public HTTP access only
- `scripts/lib/fetch-with-retry.js`

## Outputs

- `seo/research/local-seo.json`

Output includes:

- `businessProfile`
- `napConsistency`
- `citations`
- `competitorGbp`
- `reviews`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Loads config or flags

It can read a config JSON or direct CLI values for:

- domain
- name
- location

### 2. Attempts website NAP extraction

It probes a small list of common URLs:

- `/contact/`
- `/contact-us/`
- `/about/`
- `/about-us/`
- homepage

It then extracts NAP using:

- JSON-LD parsing
- `tel:` links
- regex-like address matching

### 3. Checks public directory presence

It searches:

- Yelp
- BBB
- Facebook
- Google Maps

and conditionally:

- Realtor.com
- Zillow

for real-estate flavored clients.

### 4. Builds a fallback local SEO artifact

It writes a public-web approximation of a business profile with GBP-specific
fields intentionally left empty or false.

## Strengths

- honest about what it cannot gather without GBP API access
- useful fallback when no Google credentials exist
- outputs a structured local SEO file instead of only notes

## Weaknesses

### Very heuristic NAP extraction

The address and name extraction strategy is useful but fragile. It will miss
many valid NAP patterns and can misread pages with multiple offices.

### Directory checks are shallow

Presence is determined by checking whether returned HTML contains the domain or
fragments of the business name. That is not strong verification.

### Real-estate detection is simplistic

The script switches directory targets based on a regex against combined name and
location text. That may work often enough, but it is not a reliable vertical
classifier.

### No review or GBP depth

The script correctly documents that it cannot provide deeper GBP signals, but
that means downstream consumers must not overinterpret this file as true local
performance data.

## Failure Modes

- config parse failure
- website pages lacking extractable NAP
- public directory pages blocking or rendering insufficiently for HTML checks
- false positives in directory presence checks

## Improvement Targets

### High priority

- Make the distinction between verified data and heuristic data explicit per
  field, not just in a general note
- Strengthen directory presence verification

### Medium priority

- Expand NAP extraction logic to handle multi-location and alternate layouts
- Add optional competitor-local placeholders if competitor data is available

### Low priority

- Separate citation discovery from business-profile approximation into two
  clearer modules

## Bottom Line

`gather-local-seo.js` is a pragmatic fallback script for local SEO when GBP API
access is unavailable. It is valuable because it creates a structured artifact,
but most of its findings are heuristic and should be treated as provisional.
