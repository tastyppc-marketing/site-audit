#!/usr/bin/env python3
"""Reset audit-data.json to raw pipeline shape for normalization testing."""
import json

with open('audit-data.json') as f:
    data = json.load(f)

tech = data.get('technicalSeo', {})

# Remove top-level hoists (normalization should re-create them)
data.pop('coreWebVitals', None)
data.pop('pageSpeedComparison', None)

# Reset lighthouseResults back to dict format
lr = tech.get('lighthouseResults', [])
if isinstance(lr, list) and lr:
    pages_by_url = {}
    for entry in lr:
        url = entry.get('url', '')
        if url not in pages_by_url:
            pages_by_url[url] = {'url': url}
        strategy = entry.get('strategy', '')
        score = entry.get('performanceScore')
        lcp = entry.get('lcp')
        if strategy == 'mobile':
            pages_by_url[url]['mobileScore'] = score
            pages_by_url[url]['mobileLcp'] = lcp
        elif strategy == 'desktop':
            pages_by_url[url]['desktopScore'] = score
            pages_by_url[url]['desktopLcp'] = lcp
    tech['lighthouseResults'] = {
        'clientPages': list(pages_by_url.values()),
        'avgClientMobile': 0.845,
        'avgClientDesktop': 0.8775
    }
    print("Reset lighthouseResults to dict format")

# Reset pageSpeedComparison to raw format
psc = tech.get('pageSpeedComparison', [])
if isinstance(psc, list) and psc and 'name' in psc[0]:
    raw_psc = []
    for entry in psc:
        name = entry['name'].replace(' (Client)', '')
        raw_psc.append({
            'domain': name,
            'mobileScore': 0.79,
            'desktopScore': 0.95,
            'isClient': '(Client)' in entry.get('name', '')
        })
    tech['pageSpeedComparison'] = raw_psc
    print("Reset pageSpeedComparison to raw format")

# Remove pageAudits (normalization should rebuild from crawl-data.json)
tech.pop('pageAudits', None)
print("Removed pageAudits")

# Remove score alias from CWV
cwv = tech.get('coreWebVitals', {})
for device in ['mobile', 'desktop']:
    if device in cwv:
        cwv[device].pop('score', None)
        print(f"Removed {device}.score alias")

with open('audit-data.json', 'w') as f:
    json.dump(data, f, indent=2)

print("\nReset complete - data is back to raw pipeline shape.")
