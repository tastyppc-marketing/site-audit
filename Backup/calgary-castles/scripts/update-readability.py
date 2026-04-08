#!/usr/bin/env python3
"""
update-readability.py — Replace estimated readability scores in audit-data.json
with real Flesch scores from page-text-analysis.json.
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT_ANALYSIS = os.path.join(BASE_DIR, 'seo', 'research', 'page-text-analysis.json')
AUDIT_DATA = os.path.join(BASE_DIR, 'seo', 'audit-data.json')

def main():
    print('[update-readability] Reading page-text-analysis.json...')
    with open(TEXT_ANALYSIS, 'r', encoding='utf-8') as f:
        text_data = json.load(f)

    print('[update-readability] Reading audit-data.json...')
    with open(AUDIT_DATA, 'r', encoding='utf-8') as f:
        audit_data = json.load(f)

    # Build lookup by URL
    analysis_by_url = {}
    for page in text_data['pages']:
        analysis_by_url[page['url']] = page

    updated_count = 0
    readability_scores = []

    for audit_page in audit_data['contentQuality']['pages']:
        url = audit_page['url']
        if url in analysis_by_url:
            real = analysis_by_url[url]

            # Handle the site-map outlier: cap FRE at 0, FK grade at 30
            fre = real['fleschReadingEase']
            fkg = real['fleschKincaidGrade']
            if fre < 0:
                fre = 0.0
            if fkg > 30:
                fkg = 30.0

            # Update readabilityScore (top-level field, typically = FRE)
            audit_page['readabilityScore'] = round(fre, 1)

            # Update readability sub-object
            audit_page['readability']['fleschReadingEase'] = round(fre, 1)
            audit_page['readability']['fleschKincaidGrade'] = round(fkg, 1)
            audit_page['readability']['wordCount'] = real['wordCount']
            audit_page['readability']['scoreExplanation'] = real['scoreExplanation']

            readability_scores.append(fre)
            updated_count += 1

            print(f'  Updated: {url} -> FRE={fre}, FK={fkg}, words={real["wordCount"]}')
        else:
            print(f'  WARNING: No analysis found for {url}')
            # Keep existing score for average calculation
            if 'readabilityScore' in audit_page:
                readability_scores.append(audit_page['readabilityScore'])

    # Recalculate summary average
    if readability_scores:
        avg = round(sum(readability_scores) / len(readability_scores), 1)
        old_avg = audit_data['contentQuality']['summary'].get('avgReadabilityScore', 'N/A')
        audit_data['contentQuality']['summary']['avgReadabilityScore'] = avg
        print(f'\n[update-readability] Average readability score: {old_avg} -> {avg}')

    print(f'[update-readability] Updated {updated_count}/{len(audit_data["contentQuality"]["pages"])} pages.')

    # Write back
    with open(AUDIT_DATA, 'w', encoding='utf-8') as f:
        json.dump(audit_data, f, indent=2, ensure_ascii=False)

    print(f'[update-readability] Saved updated audit-data.json')

if __name__ == '__main__':
    main()
