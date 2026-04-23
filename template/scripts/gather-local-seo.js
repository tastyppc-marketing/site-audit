#!/usr/bin/env node
'use strict';

/**
 * gather-local-seo.js — Gathers local SEO data from public web sources.
 * No API auth required. Uses HTTPS fetch only (no Playwright).
 *
 * Usage:
 *   node scripts/gather-local-seo.js --domain <domain> --name "<Client Name>" --location "<City, State>"
 *   node scripts/gather-local-seo.js --config client-config.json
 *
 * Output: seo/research/local-seo.json
 *
 * What it gathers:
 *   - NAP from client contact/about pages (via HTTPS fetch of HTML)
 *   - Directory presence check (Yelp, Realtor.com, Zillow, BBB, Facebook, Google Maps)
 *
 * What it does NOT gather (requires GBP API or paid APIs):
 *   - GBP rating, review count, photos count, hours, verification status
 *   - Review text and sentiment
 *   - Local performance data (impressions, calls, directions)
 *   - Map pack positions
 *
 * Output shape:
 * {
 *   businessProfile: {
 *     name, address, phone, website, category,
 *     rating: null, reviewCount: 0, gbpVerified: false,
 *     source: "web-research",
 *     note: "..."
 *   },
 *   napConsistency: {
 *     websiteNap: { name, address, phone },
 *     directoryListings: [{ directory, found, url, napMatch }]
 *   },
 *   competitorGbp: [],
 *   reviews: [],
 *   errors: [],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO
 * }
 */

const fs = require('fs');
const path = require('path');
const { requestJson } = require('./lib/fetch-with-retry');

const errors = [];

// ── Arg parsing ──────────────────────────────────────────────────────────────

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function loadConfig() {
  const configFlag = getArg('--config');
  if (configFlag) {
    const configPath = path.resolve(configFlag);
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
          domain: cfg.domain || cfg.clientDomain || '',
          name: cfg.clientName || cfg.name || '',
          location: cfg.location || cfg.targetLocation || '',
          company: cfg.clientCompany || cfg.company || '',
        };
      } catch (e) {
        console.error(`Warning: Could not parse ${configPath}: ${e.message}`);
      }
    } else {
      console.error(`Warning: client-config.json not found at ${configPath}`);
    }
  }
  return {
    domain: getArg('--domain') || '',
    name: getArg('--name') || '',
    location: getArg('--location') || '',
    company: getArg('--company') || '',
  };
}

// ── HTTP fetch ───────────────────────────────────────────────────────────────

function fetchHtml(url, timeoutMs) {
  const timeout = timeoutMs || 15000;
  // requestJson returns {statusCode, headers, body}; body falls back to the raw
  // string when the response isn't valid JSON (which is the common case here —
  // we're fetching HTML). The previous version called requestText, which
  // returns just res.body — so .statusCode was always undefined and every
  // directory check silently reported note="HTTP undefined" with body="".
  return requestJson(url, {
    timeout,
    followRedirects: 1,
    label: `HTML fetch ${url}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }).then((response) => ({
    ok: response.statusCode === 200,
    status: response.statusCode,
    body: response.statusCode === 200 ? String(response.body || '') : '',
  })).catch((err) => ({
    ok: false,
    status: 0,
    body: '',
    err: err.message,
  }));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── NAP extraction ───────────────────────────────────────────────────────────

/**
 * Extract Name, Address, Phone from HTML.
 * Looks for: JSON-LD LocalBusiness schema, tel: links, address-like patterns.
 */
function extractNapFromHtml(html, domain) {
  const nap = { name: '', address: '', phone: '' };
  if (!html) return nap;

  // Try JSON-LD schema first
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      const schema = JSON.parse(content);
      const entries = Array.isArray(schema) ? schema : [schema];
      for (const entry of entries) {
        const types = [].concat(entry['@type'] || []);
        const isLocal = types.some(t => /(LocalBusiness|RealEstateAgent|RealEstateListing|Organization|Person|ProfessionalService)/.test(t));
        if (!isLocal) continue;

        if (!nap.name && entry.name) nap.name = entry.name;

        const addr = entry.address;
        if (!nap.address && addr) {
          if (typeof addr === 'string') {
            nap.address = addr;
          } else if (typeof addr === 'object') {
            const parts = [
              addr.streetAddress,
              addr.addressLocality,
              addr.addressRegion,
              addr.postalCode,
              addr.addressCountry,
            ].filter(Boolean);
            nap.address = parts.join(', ');
          }
        }

        if (!nap.phone && entry.telephone) nap.phone = String(entry.telephone);
      }
    } catch (e) { /* skip malformed JSON-LD */ }

    if (nap.name && nap.address && nap.phone) break;
  }

  // Fallback: scan for tel: links
  if (!nap.phone) {
    const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
    if (telMatch) nap.phone = telMatch[1].trim();
  }

  // Fallback: address-like text pattern near "address" or in footer
  if (!nap.address) {
    const addrMatch = html.match(/\d{1,5}\s+[A-Za-z][A-Za-z0-9\s,\.]+(?:Ave|St|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Suite|Ste)[,\s]+[A-Za-z]+[,\s]+[A-Z]{2}\s+\d{5}/i);
    if (addrMatch) nap.address = addrMatch[0].replace(/\s+/g, ' ').trim();
  }

  return nap;
}

// ── Directory presence check ─────────────────────────────────────────────────

/**
 * Check if client appears on a directory by fetching a search URL and
 * looking for the client domain or name in the response.
 */
async function checkDirectory(dirName, searchUrl, clientDomain, clientName) {
  const result = { directory: dirName, found: false, url: '', napMatch: false };

  try {
    console.error(`  Checking ${dirName}...`);
    const res = await fetchHtml(searchUrl, 12000);
    await sleep(1000); // polite delay between checks

    if (!res.ok) {
      result.note = `HTTP ${res.status}`;
      return result;
    }

    const lowerBody = res.body.toLowerCase();
    const lowerDomain = clientDomain.replace(/^www\./, '').toLowerCase();
    const lowerName = (clientName || '').toLowerCase().trim();

    // Require either an exact domain hit OR the FULL business name as a
    // substring. The previous heuristic (first-word substring of the name)
    // matched any page containing e.g. "matt" -> "Matt's Deli", inflating
    // the found count with false positives.
    const domainFound = lowerDomain && lowerBody.includes(lowerDomain);
    const fullNameFound = lowerName.length > 3 && lowerBody.includes(lowerName);

    result.found = domainFound || fullNameFound;
    if (result.found) result.url = searchUrl;
  } catch (e) {
    result.note = e.message;
    errors.push({ directory: dirName, reason: e.message });
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const { domain, name, location, company } = config;

  if (!domain) {
    console.error('Error: --domain <domain> is required (or use --config client-config.json)');
    console.error('Usage: node gather-local-seo.js --domain example.com --name "Client Name" --location "City, ST"');
    process.exit(1);
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  const siteUrl = `https://${cleanDomain}`;

  console.error(`\nGathering local SEO data for: ${name || cleanDomain}`);
  console.error(`Domain: ${cleanDomain} | Location: ${location || 'unspecified'}\n`);

  // ── Step 1: NAP from contact page ──────────────────────────────────────
  let websiteNap = { name: '', address: '', phone: '' };
  const contactUrls = [
    `${siteUrl}/contact/`,
    `${siteUrl}/contact-us/`,
    `${siteUrl}/about/`,
    `${siteUrl}/about-us/`,
    siteUrl,
  ];

  console.error('Scraping contact page for NAP...');
  for (const url of contactUrls) {
    try {
      const res = await fetchHtml(url, 12000);
      if (res.ok && res.body) {
        const extracted = extractNapFromHtml(res.body, cleanDomain);
        if (extracted.name || extracted.address || extracted.phone) {
          websiteNap = extracted;
          // Fallback name from config
          if (!websiteNap.name && name) websiteNap.name = name;
          console.error(`  Found NAP on: ${url}`);
          break;
        }
      }
      await sleep(500);
    } catch (e) {
      errors.push({ url, reason: e.message });
    }
  }
  if (!websiteNap.name && name) websiteNap.name = name;

  // ── Step 2: Directory presence ─────────────────────────────────────────
  const encodedName = encodeURIComponent(name || cleanDomain);
  const encodedLocation = encodeURIComponent(location || '');

  const directoriesToCheck = [
    {
      name: 'Yelp',
      url: `https://www.yelp.com/search?find_desc=${encodedName}&find_loc=${encodedLocation}`,
    },
    {
      name: 'BBB',
      url: `https://www.bbb.org/search?find_text=${encodedName}&find_loc=${encodedLocation}`,
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/search/pages/?q=${encodedName}`,
    },
    {
      name: 'Google Maps',
      url: `https://www.google.com/maps/search/${encodedName}+${encodedLocation}`,
    },
  ];

  // Real estate-specific directories. Test against name + location + company so
  // clients whose business identity lives in clientCompany (e.g. "Wallmow Realty,
  // Inc / Lakeland Realty" — the personal name "Matt Wallmow" alone has no
  // RE keyword) still trigger Realtor.com / Zillow lookups.
  if (/real.?estate|realtor|realt|property|homes|housing/i.test([name, location, company].filter(Boolean).join(' '))) {
    directoriesToCheck.push(
      {
        name: 'Realtor.com',
        url: `https://www.realtor.com/realestateagents/${encodedLocation}?name=${encodedName}`,
      },
      {
        name: 'Zillow',
        url: `https://www.zillow.com/professionals/real-estate-agent-reviews/${encodedLocation.replace(/%20/g, '-').toLowerCase()}/`,
      }
    );
  }

  console.error('\nChecking directory presence...');
  const directoryListings = [];
  for (const dir of directoriesToCheck) {
    const result = await checkDirectory(dir.name, dir.url, cleanDomain, name || '');
    directoryListings.push(result);
  }

  // ── Step 3: Build output ───────────────────────────────────────────────
  const foundCount = directoryListings.filter(d => d.found).length;
  const totalChecked = directoryListings.length;

  const output = {
    businessProfile: {
      name: websiteNap.name || name || '',
      address: websiteNap.address || '',
      phone: websiteNap.phone || '',
      website: siteUrl,
      category: '',
      rating: null,
      reviewCount: 0,
      gbpVerified: false,
      source: 'web-research',
      note: 'GBP data gathered from public web research. For full data (reviews, photos, hours, map pack positions), grant Google Business Profile API access in client-config.json.',
    },
    napConsistency: {
      websiteNap: {
        name: websiteNap.name || '',
        address: websiteNap.address || '',
        phone: websiteNap.phone || '',
      },
      directoryListings,
    },
    citations: {
      totalFound: foundCount,
      consistent: foundCount,
      inconsistent: 0,
      missing: directoryListings.filter(d => !d.found).map(d => d.directory),
      issues: [],
    },
    competitorGbp: [],
    reviews: [],
    errors,
    status: errors.length === 0 ? 'success' : (foundCount > 0 || websiteNap.phone ? 'partial' : 'failed'),
    gatheredAt: new Date().toISOString(),
  };

  // ── Write output ───────────────────────────────────────────────────────
  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'local-seo.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.error(`\nWritten: ${outputPath}`);
  console.error(`  NAP: ${websiteNap.address ? 'address found' : 'no address'}, ${websiteNap.phone ? 'phone found' : 'no phone'}`);
  console.error(`  Directories: ${foundCount}/${totalChecked} found`);
  if (errors.length) console.error(`  Errors: ${errors.length} (status: ${output.status})`);
  console.error(`\nNote: For full GBP data (rating, reviews, hours), configure GBP API access in client-config.json.`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
