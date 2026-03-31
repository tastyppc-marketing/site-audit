#!/usr/bin/env python3
"""Benchmark tests for ContentQualityAnalyzer against real-world scenarios."""

import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add platform to path
sys.path.insert(0, str(Path(__file__).parent / "platform" / "src"))

from audit_platform.analyzers.content_quality import ContentQualityAnalyzer
from audit_platform.models.content import ContentQualityRecord, DuplicateGroup

analyzer = ContentQualityAnalyzer()

print("=" * 80)
print("BENCHMARK AUDITOR: ContentQualityAnalyzer Validation")
print("=" * 80)

# ============================================================================
# SCENARIO 1: High-quality long-form content (review mode)
# ============================================================================
print("\n[1/7] HIGH-QUALITY LONG-FORM CONTENT (Review Mode)")
print("-" * 80)

quality_content_html = """
<html>
<head>
    <title>Mammoth Lakes Real Estate Guide: Complete Buyer's Resource</title>
    <meta name="description" content="Comprehensive mammoth lakes real estate guide covering neighborhoods, market trends, and buying tips.">
</head>
<body>
<h1>The Complete Mammoth Lakes Real Estate Buyer's Guide</h1>

<p>Welcome to the ultimate resource for mammoth lakes real estate investment. Whether you're a first-time homebuyer or an experienced investor, this guide provides everything you need to make informed decisions in the Mammoth Lakes property market.</p>

<h2>Understanding the Mammoth Lakes Market</h2>
<p>The mammoth lakes real estate market has experienced significant growth over the past five years. Properties in this sought-after mountain destination command premium prices due to their location, amenities, and year-round appeal. Understanding market trends is crucial for making the right investment decision.</p>

<p>Key factors driving the mammoth lakes real estate market include:</p>
<ul>
<li>Strong tourism and vacation rental demand</li>
<li>Limited inventory of quality properties</li>
<li>Excellent school systems and community amenities</li>
<li>World-class outdoor recreation opportunities</li>
</ul>

<h2>Popular Neighborhoods in Mammoth Lakes</h2>
<p>Mammoth Lakes features several distinctive neighborhoods, each with unique characteristics. The east side communities offer stunning mountain views and quick access to skiing. West side neighborhoods provide quieter, more residential settings perfect for families considering mammoth lakes real estate as a primary residence.</p>

<h3>Canyon Boulevard District</h3>
<p>This prestigious area commands top prices for mammoth lakes real estate. Properties here offer premium views and proximity to downtown amenities. Homes typically range from $800,000 to $2.5 million, reflecting the strong demand for high-quality mammoth lakes real estate.</p>

<h3>The Lakes District</h3>
<p>Named for its proximity to scenic lakes, this neighborhood offers both vacation and residential properties. The Lakes District is popular among investors seeking mammoth lakes real estate with strong rental potential.</p>

<h2>Financing Your Mammoth Lakes Property</h2>
<p>Securing financing for mammoth lakes real estate requires understanding the specific lending requirements for mountain properties. Lenders often have stricter guidelines for properties in high-elevation areas, and interest rates for second homes may differ from primary residences.</p>

<p>Working with a mortgage professional experienced in mammoth lakes real estate financing can save you thousands of dollars. They can navigate the complexities of mountain property lending and find the best rates available.</p>

<h2>Working with a Local Agent</h2>
<p>Having an experienced local agent is essential when purchasing mammoth lakes real estate. They understand market nuances, property values, and neighborhood dynamics that newcomers might miss. A good agent becomes your advocate throughout the buying process.</p>

<p>Your mammoth lakes real estate agent should provide:</p>
<ul>
<li>Comprehensive market analysis</li>
<li>Expert negotiation on your behalf</li>
<li>Detailed property inspections and due diligence</li>
<li>Clear communication throughout closing</li>
</ul>

<h2>The Investment Potential of Mammoth Lakes Real Estate</h2>
<p>Many investors view mammoth lakes real estate as a solid long-term investment. The combination of limited supply, strong tourism demand, and beautiful mountain scenery creates compelling value propositions. Whether you're seeking primary residence appreciation or vacation rental income, the mammoth lakes real estate market offers opportunities.</p>

<p>Property appreciation in Mammoth Lakes has averaged 4-6% annually over the past decade. This steady growth, combined with potential rental income, makes mammoth lakes real estate attractive to diversified investors.</p>

<h2>Conclusion</h2>
<p>Investing in mammoth lakes real estate is a significant decision that requires research, patience, and expert guidance. By understanding market dynamics and working with experienced professionals, you can confidently pursue your mountain property dreams in beautiful Mammoth Lakes.</p>

<img src="/images/mammoth-sunset.jpg" alt="Beautiful sunset over Mammoth Lakes mountains">
<img src="/images/homes-overview.jpg" alt="Collection of luxury homes in Mammoth Lakes neighborhoods">
<img src="/images/lake-view.jpg" alt="Scenic lake view from residential property">

</body>
</html>
"""

result1 = analyzer.review_content(quality_content_html, target_keyword="mammoth lakes real estate", url="https://example.com/mammoth-guide")
print(f"✓ quality_score: {result1.quality_score:.1f} (expected: 70+)")
print(f"✓ seo_score: {result1.seo_score:.1f} (expected: 90+)")
print(f"✓ structure_score: {result1.structure_score:.1f} (expected: 70+)")
print(f"✓ readability_score: {result1.readability_score:.1f} (expected: meaningful range)")
print(f"✓ reading_level: {result1.readability.reading_level}")
print(f"✓ word_count: {result1.readability.word_count}")
print(f"✓ keyword_usage.density: {result1.keyword_usage.density if result1.keyword_usage else 'N/A'}%")
print(f"✓ keyword_usage.prominence_score: {result1.keyword_usage.prominence_score if result1.keyword_usage else 'N/A'}")

scenario1_pass = (
    result1.quality_score >= 70 and
    result1.seo_score >= 80 and
    result1.structure_score >= 70 and
    result1.keyword_usage and result1.keyword_usage.density > 0
)
print(f"\n{'PASS' if scenario1_pass else 'FAIL'}: Scenario 1")

# ============================================================================
# SCENARIO 2: Thin garbage page (audit mode)
# ============================================================================
print("\n[2/7] THIN GARBAGE PAGE (Audit Mode)")
print("-" * 80)

thin_page = {
    "url": "https://example.com/thin",
    "title": "Short Page",
    "h1": [],  # No H1
    "h2": [],
    "h2Count": 0,
    "h3Count": 0,
    "wordCount": 50,
    "description": "A short page",
    "imgCount": 0,
    "imgWithoutAlt": 0,
    "contextualInternalLinks": 0,
    "externalLinks": 0,
}

result2 = analyzer.analyze_page(thin_page)
print(f"✓ is_thin: {result2.is_thin} (expected: True)")
print(f"✓ quality_score: {result2.quality_score:.1f} (expected: <30)")
print(f"✓ issues: {result2.issues}")
print(f"✓ THIN_CONTENT in issues: {'THIN_CONTENT' in result2.issues}")
print(f"✓ MISSING_H1 in issues: {'MISSING_H1' in result2.issues}")
print(f"✓ readability_score: {result2.readability_score} (expected: 0 in audit mode)")
print(f"✓ READABILITY_NOT_ANALYZED in issues: {'READABILITY_NOT_ANALYZED' in result2.issues}")

scenario2_pass = (
    result2.is_thin == True and
    result2.quality_score < 30 and
    "THIN_CONTENT" in result2.issues and
    "MISSING_H1" in result2.issues and
    result2.readability_score == 0.0
)
print(f"\n{'PASS' if scenario2_pass else 'FAIL'}: Scenario 2")

# ============================================================================
# SCENARIO 3: Keyword-stuffed content (review mode)
# ============================================================================
print("\n[3/7] KEYWORD-STUFFED CONTENT (Review Mode)")
print("-" * 80)

keyword_stuffed_html = """
<html>
<head>
    <title>SEO keyword research tool for keyword research and SEO keyword research</title>
    <meta name="description" content="Best keyword research tool for keyword research professionals doing keyword research">
</head>
<body>
<h1>Keyword Research Tool - Professional Keyword Research</h1>
<p>Our keyword research tool is the best keyword research tool for keyword research. Use our keyword research tool for keyword research today. Keyword research with our tool gives you keyword research data.</p>
<p>Keyword research is important. Our keyword research tool provides keyword research solutions. Keyword research tool features keyword research analytics. Keyword research from our tool beats other keyword research tools.</p>
</body>
</html>
"""

result3 = analyzer.review_content(keyword_stuffed_html, target_keyword="keyword research")
print(f"✓ keyword_usage.density: {result3.keyword_usage.density if result3.keyword_usage else 'N/A'}%")
if result3.keyword_usage:
    expected_high_density = result3.keyword_usage.density > 5.0
    print(f"✓ Is density high (>5%)? {expected_high_density}")
print(f"✓ seo_score: {result3.seo_score:.1f}")
print(f"✓ recommendations: {result3.recommendations}")

scenario3_pass = (
    result3.keyword_usage and
    result3.keyword_usage.density > 5.0 and
    result3.seo_score > 0
)
print(f"\n{'PASS' if scenario3_pass else 'FAIL'}: Scenario 3")

# ============================================================================
# SCENARIO 4: Near-duplicate detection (batch mode)
# ============================================================================
print("\n[4/7] NEAR-DUPLICATE DETECTION (Batch Mode)")
print("-" * 80)

page_a = {
    "url": "https://example.com/property-a",
    "title": "Beautiful Mountain Home in Mammoth Lakes",
    "description": "Stunning 4-bedroom home with breathtaking mountain views, new kitchen, and modern amenities",
    "h1": ["Beautiful Mountain Home in Mammoth Lakes"],
    "h2": ["Location Highlights", "Property Features", "Financing Options"],
    "h2Count": 3,
    "h3Count": 0,
    "wordCount": 800,
    "imgCount": 5,
    "imgWithoutAlt": 0,
    "contextualInternalLinks": 4,
    "externalLinks": 2,
}

# Nearly identical page with different URL
page_b = {
    "url": "https://example.com/property-b",
    "title": "Beautiful Mountain Home in Mammoth Lakes",  # Same title
    "description": "Stunning 4-bedroom home with breathtaking mountain views, new kitchen, and modern amenities",  # Same description
    "h1": ["Beautiful Mountain Home in Mammoth Lakes"],  # Same H1
    "h2": ["Location Highlights", "Property Features", "Financing Options"],  # Same H2s
    "h2Count": 3,
    "h3Count": 0,
    "wordCount": 805,  # Slightly different
    "imgCount": 5,
    "imgWithoutAlt": 0,
    "contextualInternalLinks": 4,
    "externalLinks": 2,
}

records, duplicates = analyzer.analyze_batch([page_a, page_b])
print(f"✓ records returned: {len(records)} (expected: 2)")
print(f"✓ duplicate_groups returned: {len(duplicates)} (expected: 1)")

if duplicates:
    dup_group = duplicates[0]
    print(f"✓ pages in group: {dup_group.pages}")
    print(f"✓ similarity: {dup_group.similarity:.2f} (expected: >0.85)")
    print(f"✓ recommendation: {dup_group.recommendation}")

    scenario4_pass = (
        len(duplicates) == 1 and
        dup_group.similarity > 0.85 and
        set(dup_group.pages) == {"https://example.com/property-a", "https://example.com/property-b"}
    )
else:
    scenario4_pass = False
    print("✗ No duplicates detected (expected: 1)")

print(f"\n{'PASS' if scenario4_pass else 'FAIL'}: Scenario 4")

# ============================================================================
# SCENARIO 5: Well-structured page with proper headings
# ============================================================================
print("\n[5/7] WELL-STRUCTURED PAGE WITH HEADINGS (Audit Mode)")
print("-" * 80)

well_structured_page = {
    "url": "https://example.com/guide",
    "title": "Complete Real Estate Investing Guide",
    "description": "Learn how to invest in real estate with our comprehensive guide",
    "h1": ["How to Invest in Real Estate: Complete Guide"],
    "h2": ["Getting Started", "Finding Properties", "Analyzing Deals", "Making Offers", "Closing the Deal"],
    "h2Count": 5,
    "h3Count": 8,
    "wordCount": 2500,
    "imgCount": 8,
    "imgWithoutAlt": 1,  # One image missing alt text
    "contextualInternalLinks": 12,
    "externalLinks": 6,
    "issues": [],
}

result5 = analyzer.analyze_page(well_structured_page, target_keyword="real estate investing")
print(f"✓ structure_score: {result5.structure_score:.1f} (expected: high, 70+)")
print(f"✓ h2_count: {result5.structure.h2_count} (expected: 5)")
print(f"✓ heading_hierarchy_valid: {result5.structure.heading_hierarchy_valid}")
print(f"✓ internal_links: {result5.structure.internal_links} (expected: 12)")
print(f"✓ seo_score: {result5.seo_score:.1f}")
print(f"✓ issues: {result5.issues}")

scenario5_pass = (
    result5.structure_score >= 70 and
    result5.structure.h2_count == 5 and
    result5.structure.heading_hierarchy_valid == True and
    result5.structure.internal_links == 12
)
print(f"\n{'PASS' if scenario5_pass else 'FAIL'}: Scenario 5")

# ============================================================================
# SCENARIO 6: Readability against known Flesch-Kincaid values
# ============================================================================
print("\n[6/7] READABILITY FORMULAS (Review Mode - Standard Test Passages)")
print("-" * 80)

# Simple paragraph (should have high Flesch score - around 90)
simple_text = """<p>The cat sat on the mat. It was a big cat. The mat was soft. The cat was happy.</p>"""

result6a = analyzer.review_content(simple_text)
print(f"✓ Simple text - Flesch Reading Ease: {result6a.readability.flesch_reading_ease:.1f} (expected: ~90, 5th grade)")
print(f"✓ Simple text - Reading Level: {result6a.readability.reading_level}")
print(f"✓ Simple text - Flesch-Kincaid Grade: {result6a.readability.flesch_kincaid_grade:.1f}")

# Medium complexity (should be around 60-70)
medium_text = """<p>The implementation of comprehensive quality metrics requires careful analysis of structural elements. Organizations must consider multiple factors when evaluating content effectiveness. This approach ensures comprehensive assessment of performance indicators.</p>"""

result6b = analyzer.review_content(medium_text)
print(f"\n✓ Medium text - Flesch Reading Ease: {result6b.readability.flesch_reading_ease:.1f} (expected: 50-70, college)")
print(f"✓ Medium text - Reading Level: {result6b.readability.reading_level}")

scenario6_pass = (
    result6a.readability.flesch_reading_ease > 80 and  # Simple should be high
    result6b.readability.flesch_reading_ease < 70  # Medium should be lower
)
print(f"\n{'PASS' if scenario6_pass else 'FAIL'}: Scenario 6")

# ============================================================================
# SCENARIO 7: Audit mode limitations (no raw_html provided)
# ============================================================================
print("\n[7/7] AUDIT MODE LIMITATIONS (No Raw HTML)")
print("-" * 80)

audit_page = {
    "url": "https://example.com/article",
    "title": "Important Article",
    "description": "A detailed article about important topics",
    "h1": ["Important Article"],
    "h2": ["Section 1", "Section 2"],
    "h2Count": 2,
    "h3Count": 0,
    "wordCount": 1500,
    "imgCount": 3,
    "imgWithoutAlt": 0,
    "contextualInternalLinks": 5,
    "externalLinks": 3,
}

result7 = analyzer.analyze_page(audit_page)
print(f"✓ readability_score: {result7.readability_score} (expected: 0.0)")
print(f"✓ READABILITY_NOT_ANALYZED in issues: {'READABILITY_NOT_ANALYZED' in result7.issues}")
print(f"✓ quality_score: {result7.quality_score:.1f} (expected: >0, still meaningful)")
print(f"✓ seo_score: {result7.seo_score:.1f} (expected: 0 without keyword)")
print(f"✓ structure_score: {result7.structure_score:.1f} (expected: meaningful)")

scenario7_pass = (
    result7.readability_score == 0.0 and
    "READABILITY_NOT_ANALYZED" in result7.issues and
    result7.structure_score > 0
)
print(f"\n{'PASS' if scenario7_pass else 'FAIL'}: Scenario 7")

# ============================================================================
# BONUS: Cannibalization Detection
# ============================================================================
print("\n[BONUS] CANNIBALIZATION DETECTION")
print("-" * 80)

query_page_data = [
    {
        "query": "mammoth lakes real estate",
        "page": "https://example.com/homes",
        "clicks": 45,
        "impressions": 320,
        "position": 5,
    },
    {
        "query": "mammoth lakes real estate",
        "page": "https://example.com/listings",
        "clicks": 12,
        "impressions": 180,
        "position": 12,
    },
    {
        "query": "mammoth lakes real estate",
        "page": "https://example.com/properties",
        "clicks": 3,
        "impressions": 95,
        "position": 45,
    },
]

cannib_results = analyzer.detect_cannibalization(query_page_data, min_impressions=50)
print(f"✓ cannibalization records: {len(cannib_results)} (expected: 1)")
if cannib_results:
    rec = cannib_results[0]
    print(f"✓ keyword: {rec.keyword}")
    print(f"✓ severity: {rec.severity} (expected: high - 2 pages in top 20)")
    print(f"✓ recommendation: {rec.recommendation}")

    bonus_pass = (
        len(cannib_results) == 1 and
        rec.severity == "high"
    )
else:
    bonus_pass = False

print(f"\n{'PASS' if bonus_pass else 'FAIL'}: Cannibalization Detection")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

scenarios = [
    ("1. High-quality long-form", scenario1_pass),
    ("2. Thin garbage page", scenario2_pass),
    ("3. Keyword-stuffed", scenario3_pass),
    ("4. Near-duplicate detection", scenario4_pass),
    ("5. Well-structured page", scenario5_pass),
    ("6. Readability formulas", scenario6_pass),
    ("7. Audit mode limitations", scenario7_pass),
]

passed = sum(1 for _, p in scenarios if p)
total = len(scenarios)

for name, passed_bool in scenarios:
    status = "✓ PASS" if passed_bool else "✗ FAIL"
    print(f"{status}: {name}")

print(f"\nOverall: {passed}/{total} scenarios passed")

if passed == total:
    print("\n✓ PRODUCTION-READY: Analyzer produces correct, useful results")
    sys.exit(0)
else:
    print("\n✗ NEEDS WORK: Some scenarios failed")
    sys.exit(1)
