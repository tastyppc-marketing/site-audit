#!/bin/bash
# Search DuckDuckGo via curl and extract results
# Usage: bash search-curl.sh "query"
QUERY="$1"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote_plus('$QUERY'))")

echo "=== DDG RESULTS FOR: \"$QUERY\" ==="
echo ""

curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  "https://html.duckduckgo.com/html/?q=${ENCODED}" 2>/dev/null | \
  python3 -c "
import sys, re, html
from urllib.parse import unquote

content = sys.stdin.read()

# Extract results
results = re.findall(r'class=\"result__a\"[^>]*href=\"[^\"]*uddg=([^&\"]+)[^\"]*\"[^>]*>([^<]+)<', content)
snippets = re.findall(r'class=\"result__snippet\"[^>]*>([^<]+)', content)

print(f'--- Organic Results ({len(results)}) ---')
for i, (url_enc, title) in enumerate(results):
    url = unquote(url_enc)
    title = html.unescape(title.strip())
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).hostname or ''
    except:
        domain = ''
    snippet = html.unescape(snippets[i].strip()) if i < len(snippets) else ''
    print(f'  #{i+1}: {title}')
    print(f'    URL: {url}')
    print(f'    Domain: {domain}')
    if snippet:
        print(f'    Snippet: {snippet[:200]}')
    print()

print('--- TARGET SITE POSITIONS ---')
targets = ['livingparkcityutah.com', 'laurawillisrealestate.com']
for target in targets:
    found = False
    for i, (url_enc, title) in enumerate(results):
        url = unquote(url_enc)
        if target.replace('www.','') in url:
            print(f'  {target}: Position #{i+1} - \"{html.unescape(title.strip())}\"')
            found = True
    if not found:
        print(f'  {target}: NOT FOUND in top {len(results)} results')
"
