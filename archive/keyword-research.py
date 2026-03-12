#!/usr/bin/env python3
"""
Keyword research via DuckDuckGo HTML search.
Searches multiple keywords and produces structured output for analysis.
"""
import subprocess
import re
import json
import sys
import time
import html as html_module
from urllib.parse import unquote, urlparse, quote_plus

KEYWORDS = [
    # Brand/agent terms
    "park city real estate agent",
    "park city utah realtor",
    "best realtor park city utah",
    "laura willis park city real estate",
    # Property terms
    "park city homes for sale",
    "park city luxury real estate",
    "park city condos for sale",
    "park city ski homes for sale",
    # Area terms
    "summit county real estate",
    "deer valley homes for sale",
    "park city vacation homes",
    "heber city utah real estate",
    # Intent terms
    "buy home park city utah",
    "sell home park city",
    "park city real estate market",
    "park city real estate market 2025",
    # Long-tail
    "luxury ski homes park city",
    "park city investment property",
    "park city real estate agent reviews",
    "best neighborhoods park city utah",
    # Additional competitive terms
    "park city utah homes",
    "park city mountain homes",
    "deer valley real estate agent",
    "summit county homes for sale",
    "park city townhomes for sale",
]

TARGETS = ['livingparkcityutah.com', 'laurawillisrealestate.com']

def search_ddg(query):
    """Search DuckDuckGo HTML version and extract results."""
    encoded = quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}"

    try:
        result = subprocess.run(
            ['curl', '-s', '-A',
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
             url],
            capture_output=True, text=True, timeout=30
        )
        content = result.stdout
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None

    # Extract results
    raw_results = re.findall(
        r'class="result__a"[^>]*href="[^"]*uddg=([^&"]+)[^"]*"[^>]*>([^<]+)<',
        content
    )
    snippets = re.findall(r'class="result__snippet"[^>]*>([^<]+)', content)

    organic = []
    for i, (url_enc, title) in enumerate(raw_results):
        decoded_url = unquote(url_enc)
        title = html_module.unescape(title.strip())

        # Skip ads (duckduckgo.com/y.js URLs)
        if 'duckduckgo.com/y.js' in decoded_url:
            continue

        try:
            domain = urlparse(decoded_url).hostname or ''
        except:
            domain = ''

        snippet = html_module.unescape(snippets[i].strip()) if i < len(snippets) else ''

        organic.append({
            'position': len(organic) + 1,
            'title': title,
            'url': decoded_url,
            'domain': domain,
            'snippet': snippet[:300],
        })

    # Find target positions
    target_positions = {}
    for target in TARGETS:
        target_clean = target.replace('www.', '')
        positions = []
        for r in organic:
            if target_clean in (r['domain'] or ''):
                positions.append({'position': r['position'], 'title': r['title'], 'url': r['url']})
        target_positions[target] = positions if positions else None

    return {
        'keyword': query,
        'total_results': len(organic),
        'organic': organic,
        'target_positions': target_positions,
    }

def main():
    all_results = []
    competitor_domains = {}

    for i, keyword in enumerate(KEYWORDS):
        print(f"[{i+1}/{len(KEYWORDS)}] Searching: {keyword}", file=sys.stderr)

        result = search_ddg(keyword)
        if result:
            all_results.append(result)

            # Track competitor domains
            for r in result['organic'][:10]:  # Top 10 only
                domain = r.get('domain', '')
                if domain and not any(skip in domain for skip in ['duckduckgo.com', 'bing.com', 'google.com']):
                    if domain not in competitor_domains:
                        competitor_domains[domain] = {'count': 0, 'keywords': []}
                    competitor_domains[domain]['count'] += 1
                    competitor_domains[domain]['keywords'].append(keyword)

        # Rate limit
        if i < len(KEYWORDS) - 1:
            time.sleep(1.5)

    # Sort competitors by frequency
    sorted_competitors = sorted(competitor_domains.items(), key=lambda x: x[1]['count'], reverse=True)

    output = {
        'search_results': all_results,
        'competitor_analysis': {d: v for d, v in sorted_competitors[:30]},
        'total_keywords_searched': len(KEYWORDS),
    }

    print(json.dumps(output, indent=2))

if __name__ == '__main__':
    main()
