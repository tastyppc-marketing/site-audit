"""Comprehensive tests for the content quality analyzer."""

from __future__ import annotations

import json
from datetime import datetime, timedelta

import pytest

from audit_platform.analyzers.content_quality import ContentQualityAnalyzer
from audit_platform.models.content import (
    CannibalizationRecord,
    ContentQualityRecord,
    ContentStructure,
    DuplicateGroup,
    KeywordUsage,
    ReadabilityMetrics,
)


@pytest.fixture()
def analyzer() -> ContentQualityAnalyzer:
    return ContentQualityAnalyzer()


# ---------------------------------------------------------------------------
# 1. Readability scoring accuracy
# ---------------------------------------------------------------------------


class TestReadabilityScoring:
    def test_simple_text_high_flesch(self, analyzer):
        """Simple monosyllabic sentences → Flesch 90+."""
        text = "The cat sat on the mat. The dog ran fast. The sun is hot. He ran far."
        result = analyzer.review_content(text)
        assert result.readability.flesch_reading_ease >= 90.0
        assert result.readability.reading_level == "5th grade"

    def test_complex_text_lower_flesch(self, analyzer):
        """Complex multisyllabic academic text → Flesch below 50."""
        text = (
            "The pharmaceutical administration systematically disseminated immunosuppressant "
            "medications to counterbalance the inflammatory characteristics. "
            "Neurophysiological investigations corroborated the epidemiological hypothesis "
            "that administrators systematically obfuscate organizational responsibilities."
        )
        result = analyzer.review_content(text)
        assert result.readability.flesch_reading_ease < 50.0

    def test_word_count_accuracy(self, analyzer):
        text = "one two three four five six seven eight nine ten"
        result = analyzer.review_content(text)
        assert result.readability.word_count == 10

    def test_sentence_count_accuracy(self, analyzer):
        text = "First sentence. Second sentence! Third sentence? Fourth sentence."
        result = analyzer.review_content(text)
        assert result.readability.sentence_count == 4

    def test_reading_level_5th_grade(self, analyzer):
        text = "I see the dog. The dog is big. I like the dog. He runs fast."
        result = analyzer.review_content(text)
        assert result.readability.reading_level == "5th grade"

    def test_flesch_capped_0_to_100(self, analyzer):
        text = "I go. He hops. We run. She sat. A big red hat."
        result = analyzer.review_content(text)
        assert 0.0 <= result.readability.flesch_reading_ease <= 100.0

    def test_empty_text_zero_metrics(self, analyzer):
        result = analyzer.review_content("")
        assert result.readability.word_count == 0
        assert result.readability.flesch_reading_ease == 0.0


# ---------------------------------------------------------------------------
# 2. Thin content detection (boundary conditions)
# ---------------------------------------------------------------------------


class TestThinContentDetection:
    def test_300_words_not_thin(self, analyzer):
        page_data = {"url": "https://example.com/a", "wordCount": 300, "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.is_thin is False
        assert "THIN_CONTENT" not in result.issues

    def test_299_words_thin(self, analyzer):
        page_data = {"url": "https://example.com/b", "wordCount": 299, "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.is_thin is True
        assert "THIN_CONTENT" in result.issues

    def test_0_words_thin(self, analyzer):
        page_data = {"url": "https://example.com/c", "wordCount": 0, "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.is_thin is True
        assert "THIN_CONTENT" in result.issues

    def test_thin_threshold_value_is_300(self, analyzer):
        page_data = {"url": "https://example.com/d", "wordCount": 100, "h1": ["T"], "h2": [], "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.thin_threshold == 300

    def test_review_thin_below_300(self, analyzer):
        html = "<html><body><h1>Short</h1><p>" + "word " * 50 + "</p></body></html>"
        result = analyzer.review_content(html)
        assert result.is_thin is True

    def test_review_not_thin_at_300(self, analyzer):
        html = "<html><body><h1>Long</h1><p>" + "word " * 300 + "</p></body></html>"
        result = analyzer.review_content(html)
        assert result.is_thin is False


# ---------------------------------------------------------------------------
# 3. Keyword usage / density
# ---------------------------------------------------------------------------


class TestKeywordUsage:
    def _make_html(self, keyword, extra_words=400):
        body_text = (keyword + " ") * 5 + "word " * 90
        filler = "filler text " * (extra_words // 2)
        return (
            f"<html><head><title>Best {keyword} Guide</title></head>"
            f"<body><h1>The Ultimate {keyword} Resource</h1>"
            f"<h2>About {keyword} explained</h2>"
            f"<p>{body_text}</p><p>{filler}</p></body></html>"
        )

    def test_keyword_in_title(self, analyzer):
        html = self._make_html("mountain biking")
        result = analyzer.review_content(html, target_keyword="mountain biking")
        assert result.keyword_usage is not None
        assert result.keyword_usage.in_title is True

    def test_keyword_in_h1(self, analyzer):
        html = self._make_html("mountain biking")
        result = analyzer.review_content(html, target_keyword="mountain biking")
        assert result.keyword_usage is not None
        assert result.keyword_usage.in_h1 is True

    def test_keyword_in_first_100_words(self, analyzer):
        html = self._make_html("mountain biking")
        result = analyzer.review_content(html, target_keyword="mountain biking")
        assert result.keyword_usage is not None
        assert result.keyword_usage.in_first_100_words is True

    def test_keyword_density_nonzero(self, analyzer):
        html = self._make_html("seo")
        result = analyzer.review_content(html, target_keyword="seo")
        assert result.keyword_usage is not None
        assert result.keyword_usage.density > 0.0
        assert result.keyword_usage.count > 0

    def test_keyword_heading_count(self, analyzer):
        html = self._make_html("mountain biking")
        result = analyzer.review_content(html, target_keyword="mountain biking")
        assert result.keyword_usage is not None
        assert result.keyword_usage.heading_count >= 1

    def test_no_keyword_returns_none(self, analyzer):
        page_data = {"url": "https://example.com/", "wordCount": 500, "h1": ["Home"], "h2": [], "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.keyword_usage is None
        assert "NO_KEYWORD_PROVIDED" in result.issues

    def test_empty_keyword_string_treated_as_none(self, analyzer):
        page_data = {"url": "https://example.com/kw", "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 400}
        result = analyzer.analyze_page(page_data, target_keyword="   ")
        assert result.keyword_usage is None

    def test_keyword_not_in_content(self, analyzer):
        html = "<html><body><h1>Hello World</h1><p>" + "word " * 300 + "</p></body></html>"
        result = analyzer.review_content(html, target_keyword="python programming")
        assert result.keyword_usage is not None
        assert result.keyword_usage.in_title is False
        assert result.keyword_usage.in_h1 is False
        assert result.keyword_usage.count == 0
        assert result.keyword_usage.density == 0.0

    def test_keyword_density_3_in_100_words(self, analyzer):
        """3 occurrences in 100 words → density = 3%."""
        body = "cat " * 3 + "word " * 97
        html = f"<html><body><h1>Animals</h1><p>{body}</p></body></html>"
        result = analyzer.review_content(html, target_keyword="cat")
        assert result.keyword_usage is not None
        assert result.keyword_usage.count == 3
        assert abs(result.keyword_usage.density - 3.0) < 0.1

    def test_prominence_score_all_placements(self, analyzer):
        """Keyword in title + h1 + first 100 words + meta desc + url → prominence 90+."""
        html = (
            "<html><head>"
            "<title>seo tips guide</title>"
            '<meta name="description" content="seo tips for beginners"/>'
            "</head><body>"
            "<h1>Best seo tips</h1>"
            "<h2>Advanced seo tips techniques</h2>"
            "<p>seo tips " + "word " * 95 + "</p>"
            "<p>" + "filler " * 200 + "</p>"
            "</body></html>"
        )
        result = analyzer.review_content(html, target_keyword="seo tips", url="https://example.com/seo-tips/")
        assert result.keyword_usage is not None
        assert result.keyword_usage.prominence_score >= 90.0


# ---------------------------------------------------------------------------
# 4. SimHash duplicate detection
# ---------------------------------------------------------------------------


class TestSimHashDuplicateDetection:
    def _rich_page(self, url, title, h1, h2s, desc):
        return {
            "url": url, "title": title, "h1": [h1], "h2": h2s, "description": desc,
            "wordCount": 500, "h2Count": len(h2s), "h3Count": 0,
        }

    def test_identical_content_same_simhash(self, analyzer):
        base = {"title": "Best Hiking Trails in Colorado", "h1": ["Best Hiking Trails in Colorado"],
                "h2": ["Rocky Mountain Trails", "Easy Beginner Paths", "Advanced Routes"],
                "description": "Explore the best hiking trails in Colorado mountains",
                "wordCount": 500, "h2Count": 3, "h3Count": 0}
        r1 = analyzer.analyze_page(dict(base, url="https://a.com/p1"))
        r2 = analyzer.analyze_page(dict(base, url="https://a.com/p2"))
        assert r1.simhash is not None
        assert r1.simhash == r2.simhash

    def test_different_content_different_simhash(self, analyzer):
        p1 = self._rich_page("https://a.com/1", "Best Hiking Trails in Colorado",
                              "Best Hiking Trails in Colorado",
                              ["Rocky Mountain Trails", "Easy Beginner Paths"],
                              "Explore the best hiking trails in Colorado")
        p2 = self._rich_page("https://a.com/2", "Python Programming for Beginners",
                              "Introduction to Python Programming",
                              ["Variables and Data Types", "Functions and Classes"],
                              "Learn Python programming from scratch with examples")
        r1 = analyzer.analyze_page(p1)
        r2 = analyzer.analyze_page(p2)
        assert r1.simhash != r2.simhash

    def test_simhash_none_for_sparse_content(self, analyzer):
        """Fewer than 3 tokens → simhash is None."""
        page_data = {"url": "https://a.com/sparse", "title": "Hi", "h1": [], "h2": [],
                     "description": "", "wordCount": 5, "h2Count": 0, "h3Count": 0}
        result = analyzer.analyze_page(page_data)
        assert result.simhash is None

    def test_hamming_distance_identical_is_zero(self, analyzer):
        a = 0xDEADBEEFCAFEBABE
        assert analyzer._hamming_distance(a, a) == 0

    def test_hamming_distance_all_bits_differ(self, analyzer):
        assert analyzer._hamming_distance(0, 0xFFFFFFFFFFFFFFFF) == 64

    def test_batch_identical_pages_form_duplicate_group(self, analyzer):
        """2 pages with same simhash + 1 unique → exactly 1 DuplicateGroup."""
        shared = {"title": "Best Hiking Trails in Colorado Mountains",
                  "h1": ["Best Hiking Trails in Colorado"],
                  "h2": ["Rocky Mountain Trails", "Easy Beginner Paths", "Advanced Summit Routes"],
                  "description": "Complete guide to hiking trails in Colorado mountains"}
        page1 = dict(shared, url="https://a.com/p1", wordCount=500, h2Count=3, h3Count=0)
        page2 = dict(shared, url="https://a.com/p2", wordCount=500, h2Count=3, h3Count=0)
        page3 = self._rich_page("https://a.com/p3", "Python Programming Language Tutorial",
                                "Learn Python Programming", ["Variables", "Functions", "Classes"],
                                "Complete Python programming language tutorial")
        records, dup_groups = analyzer.analyze_batch([page1, page2, page3])
        assert len(dup_groups) == 1
        assert set(dup_groups[0].pages) == {"https://a.com/p1", "https://a.com/p2"}

    def test_batch_duplicate_records_flagged(self, analyzer):
        shared = {"title": "Identical Page Title Same Content Here",
                  "h1": ["Identical H1 Heading Content"],
                  "h2": ["Section One Two", "Section Three Four", "Section Five Six"],
                  "description": "Identical meta description for both pages here"}
        p1 = dict(shared, url="https://a.com/x1", wordCount=400, h2Count=3, h3Count=0)
        p2 = dict(shared, url="https://a.com/x2", wordCount=400, h2Count=3, h3Count=0)
        records, _ = analyzer.analyze_batch([p1, p2])
        url_to_rec = {r.url: r for r in records}
        assert url_to_rec["https://a.com/x1"].is_duplicate is True
        assert url_to_rec["https://a.com/x2"].is_duplicate is True

    def test_batch_unique_pages_no_duplicate_flag(self, analyzer):
        p1 = self._rich_page("https://a.com/ski", "Skiing in Alps Winter Sports",
                              "Alpine Skiing Tips Techniques",
                              ["Equipment", "Technique", "Safety"],
                              "Complete guide to skiing in the Alps mountains")
        p2 = self._rich_page("https://a.com/pasta", "Cooking Italian Pasta Recipes",
                              "Classic Italian Pasta Dishes",
                              ["Carbonara", "Bolognese", "Pesto"],
                              "Authentic Italian pasta recipes cooking techniques")
        records, dup_groups = analyzer.analyze_batch([p1, p2])
        assert len(dup_groups) == 0
        for r in records:
            assert r.is_duplicate is False


# ---------------------------------------------------------------------------
# 5. Content structure scoring
# ---------------------------------------------------------------------------


class TestStructureScoring:
    def test_perfect_structure_score_is_100(self, analyzer):
        """heading_hierarchy + 2 H2s + 3 internal links + no images + list + no long paras → 100."""
        structure = ContentStructure(
            heading_count=5, heading_hierarchy_valid=True, h2_count=3, h3_count=1,
            list_count=2, image_count=0, images_with_alt=0, table_count=0,
            avg_paragraph_length=50.0, short_paragraphs=0, long_paragraphs=0,
            internal_links=5, external_links=2,
        )
        score = analyzer._compute_structure_score(structure)
        assert score == 100.0

    def test_missing_h1_invalid_hierarchy(self, analyzer):
        page_data = {"url": "https://a.com/no-h1", "h1": [], "h2": ["S1", "S2"],
                     "h2Count": 2, "h3Count": 0, "wordCount": 500, "contextualInternalLinks": 5}
        result = analyzer.analyze_page(page_data)
        assert result.structure.heading_hierarchy_valid is False
        assert "MISSING_H1" in result.issues

    def test_multiple_h1_invalid_hierarchy(self, analyzer):
        page_data = {"url": "https://a.com/multi-h1", "h1": ["First H1", "Second H1"],
                     "h2": ["Section"], "h2Count": 1, "h3Count": 0, "wordCount": 500}
        result = analyzer.analyze_page(page_data)
        assert result.structure.heading_hierarchy_valid is False
        assert "MULTIPLE_H1" in result.issues

    def test_no_internal_links_issue(self, analyzer):
        page_data = {"url": "https://a.com/isolated", "h1": ["Good H1"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500, "contextualInternalLinks": 0}
        result = analyzer.analyze_page(page_data)
        assert "NO_INTERNAL_LINKS" in result.issues

    def test_low_structure_score_below_50(self, analyzer):
        structure = ContentStructure(heading_hierarchy_valid=False, h2_count=0,
                                     internal_links=0, image_count=0, list_count=0, long_paragraphs=1)
        score = analyzer._compute_structure_score(structure)
        assert score < 50.0

    def test_images_at_80pct_alt_gets_points(self, analyzer):
        """5 images, 4 with alt → 80% → gets +15."""
        structure = ContentStructure(heading_hierarchy_valid=True, h2_count=2, internal_links=3,
                                     image_count=5, images_with_alt=4, list_count=1, long_paragraphs=0)
        score = analyzer._compute_structure_score(structure)
        assert score == 100.0

    def test_images_below_80pct_alt_loses_points(self, analyzer):
        """5 images, 3 with alt → 60% → loses +15 → score is 85."""
        structure = ContentStructure(heading_hierarchy_valid=True, h2_count=2, internal_links=3,
                                     image_count=5, images_with_alt=3, list_count=1, long_paragraphs=0)
        score = analyzer._compute_structure_score(structure)
        assert score == 85.0


# ---------------------------------------------------------------------------
# 6. Freshness checks
# ---------------------------------------------------------------------------


class TestFreshnessChecks:
    def test_stale_400_days(self, analyzer):
        stale_date = datetime.utcnow() - timedelta(days=400)
        page_data = {"url": "https://a.com/stale", "h1": ["Old Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500,
                     "lastModified": stale_date.isoformat()}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is True
        assert result.content_age_days >= 400
        assert "STALE_CONTENT" in result.issues

    def test_fresh_100_days(self, analyzer):
        fresh_date = datetime.utcnow() - timedelta(days=100)
        page_data = {"url": "https://a.com/fresh", "h1": ["New Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500,
                     "lastModified": fresh_date.isoformat()}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is False
        assert 99 <= result.content_age_days <= 101
        assert "STALE_CONTENT" not in result.issues

    def test_no_last_modified_not_stale(self, analyzer):
        page_data = {"url": "https://a.com/no-date", "h1": ["Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is False
        assert result.content_age_days is None

    def test_exactly_365_days_not_stale(self, analyzer):
        """Threshold is > 365. Exactly 365 days → is_stale=False."""
        boundary = datetime.utcnow() - timedelta(days=365)
        page_data = {"url": "https://a.com/boundary", "h1": ["Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500,
                     "lastModified": boundary.isoformat()}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is False

    def test_366_days_is_stale(self, analyzer):
        stale_date = datetime.utcnow() - timedelta(days=366)
        page_data = {"url": "https://a.com/366", "h1": ["Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500,
                     "lastModified": stale_date.isoformat()}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is True

    def test_invalid_date_string_not_stale(self, analyzer):
        page_data = {"url": "https://a.com/bad-date", "h1": ["Title"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 400,
                     "lastModified": "not-a-valid-date"}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is False
        assert result.last_modified is None

    def test_datetime_object_last_modified(self, analyzer):
        """lastModified as a datetime object (not string) is also handled."""
        stale_dt = datetime.utcnow() - timedelta(days=400)
        page_data = {"url": "https://a.com/dt-obj", "h1": ["Page"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 500, "lastModified": stale_dt}
        result = analyzer.analyze_page(page_data)
        assert result.is_stale is True


# ---------------------------------------------------------------------------
# 7. Dual-mode consistency (audit vs review)
# ---------------------------------------------------------------------------


class TestDualMode:
    def test_mode_fields(self, analyzer):
        page_data = {"url": "https://a.com/test", "h1": ["Test"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 400}
        html = "<html><body><h1>Test</h1><p>" + "word " * 400 + "</p></body></html>"
        assert analyzer.analyze_page(page_data).mode == "audit"
        assert analyzer.review_content(html).mode == "review"

    def test_thin_detection_consistent(self, analyzer):
        html = "<html><body><h1>Short</h1><p>" + "word " * 50 + "</p></body></html>"
        page_data = {"url": "https://a.com/thin", "h1": ["Short"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 50}
        assert analyzer.review_content(html).is_thin is True
        assert analyzer.analyze_page(page_data).is_thin is True

    def test_review_mode_computes_readability(self, analyzer):
        html = "<html><body><h1>Hi</h1><p>" + "The cat sat. " * 50 + "</p></body></html>"
        result = analyzer.review_content(html)
        assert result.readability.flesch_reading_ease > 0.0
        assert result.readability.word_count > 0
        assert "READABILITY_NOT_ANALYZED" not in result.issues

    def test_audit_without_html_no_readability(self, analyzer):
        page_data = {"url": "https://a.com/audit", "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 500}
        result = analyzer.analyze_page(page_data)
        assert "READABILITY_NOT_ANALYZED" in result.issues

    def test_keyword_in_title_and_h1_both_modes(self, analyzer):
        kw = "hiking trails"
        page_data = {"url": "https://a.com/hiking", "title": "Best hiking trails guide",
                     "h1": ["Top hiking trails for beginners"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 400}
        html = ("<html><head><title>Best hiking trails guide</title></head>"
                "<body><h1>Top hiking trails for beginners</h1>"
                "<p>" + "hiking trails " * 10 + "word " * 370 + "</p></body></html>")
        audit = analyzer.analyze_page(page_data, target_keyword=kw)
        review = analyzer.review_content(html, target_keyword=kw)
        assert audit.keyword_usage.in_title is True
        assert review.keyword_usage.in_title is True
        assert audit.keyword_usage.in_h1 is True
        assert review.keyword_usage.in_h1 is True

    def test_audit_with_raw_html_overrides_word_count(self, analyzer):
        html = "<html><body><h1>Title</h1><p>" + "word " * 400 + "</p></body></html>"
        page_data = {"url": "https://a.com/wc", "h1": ["Title"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 0}
        result = analyzer.analyze_page(page_data, raw_html=html)
        assert result.is_thin is False
        assert result.readability.word_count > 0


# ---------------------------------------------------------------------------
# 8. Batch analysis
# ---------------------------------------------------------------------------


class TestBatchAnalysis:
    def test_batch_empty(self, analyzer):
        records, groups = analyzer.analyze_batch([])
        assert records == []
        assert groups == []

    def test_batch_returns_all_records(self, analyzer):
        pages = [{"url": f"https://a.com/{i}", "h1": [f"Page {i}"], "h2": [],
                  "h2Count": 0, "h3Count": 0, "wordCount": 400} for i in range(5)]
        records, _ = analyzer.analyze_batch(pages)
        assert len(records) == 5

    def test_batch_2_duplicates_1_unique(self, analyzer):
        shared = {"title": "Best Hiking Trails in Colorado Mountains",
                  "h1": ["Best Hiking Trails Colorado"],
                  "h2": ["Rocky Mountain Trails", "Easy Beginner Paths", "Advanced Routes"],
                  "description": "Complete guide to hiking in Colorado mountains"}
        p1 = dict(shared, url="https://a.com/dup1", wordCount=500, h2Count=3, h3Count=0)
        p2 = dict(shared, url="https://a.com/dup2", wordCount=500, h2Count=3, h3Count=0)
        p3 = {"url": "https://a.com/unique", "title": "Best Restaurants New York City Dining",
              "h1": ["Top NYC Restaurants"], "h2": ["Fine Dining", "Budget Options", "Street Food"],
              "description": "Find the best restaurants in New York City",
              "wordCount": 500, "h2Count": 3, "h3Count": 0}
        records, dup_groups = analyzer.analyze_batch([p1, p2, p3])
        assert len(dup_groups) == 1
        assert set(dup_groups[0].pages) == {"https://a.com/dup1", "https://a.com/dup2"}

    def test_batch_duplicate_group_has_recommendation(self, analyzer):
        shared = {"title": "Same Title Content Words Here All",
                  "h1": ["Same H1 Words Here"],
                  "h2": ["Section A Words", "Section B Words", "Section C Words"],
                  "description": "Same description text here for both pages"}
        p1 = dict(shared, url="https://a.com/r1", wordCount=400, h2Count=3, h3Count=0)
        p2 = dict(shared, url="https://a.com/r2", wordCount=400, h2Count=3, h3Count=0)
        _, dup_groups = analyzer.analyze_batch([p1, p2])
        assert len(dup_groups) == 1
        assert dup_groups[0].recommendation != ""

    def test_batch_target_keywords_applied(self, analyzer):
        pages = [{"url": "https://a.com/p1", "title": "Hiking boots guide",
                  "h1": ["Best hiking boots"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 400}]
        records, _ = analyzer.analyze_batch(pages, target_keywords={"https://a.com/p1": "hiking boots"})
        assert records[0].keyword_usage is not None
        assert records[0].keyword_usage.keyword == "hiking boots"

    def test_batch_single_page_no_duplicates(self, analyzer):
        pages = [{"url": "https://a.com/only", "title": "Some Unique Title",
                  "h1": ["Some Unique H1"], "h2": ["Section A", "Section B"],
                  "h2Count": 2, "h3Count": 0, "wordCount": 400}]
        records, dup_groups = analyzer.analyze_batch(pages)
        assert len(records) == 1
        assert len(dup_groups) == 0


# ---------------------------------------------------------------------------
# 9. Cannibalization detection
# ---------------------------------------------------------------------------


class TestCannibalizationDetection:
    def test_two_pages_in_top20_severity_high(self, analyzer):
        data = [
            {"query": "best hiking boots", "page": "https://a.com/b1", "clicks": 100, "impressions": 500, "position": 3.0},
            {"query": "best hiking boots", "page": "https://a.com/b2", "clicks": 50, "impressions": 200, "position": 8.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 1
        assert results[0].severity == "high"
        assert results[0].keyword == "best hiking boots"

    def test_one_page_in_top20_severity_medium(self, analyzer):
        data = [
            {"query": "winter jackets", "page": "https://a.com/j1", "clicks": 100, "impressions": 500, "position": 5.0},
            {"query": "winter jackets", "page": "https://a.com/j2", "clicks": 30, "impressions": 100, "position": 25.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 1
        assert results[0].severity == "medium"

    def test_zero_pages_in_top20_severity_low(self, analyzer):
        data = [
            {"query": "obscure keyword", "page": "https://a.com/ob1", "clicks": 5, "impressions": 100, "position": 30.0},
            {"query": "obscure keyword", "page": "https://a.com/ob2", "clicks": 3, "impressions": 80, "position": 35.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 1
        assert results[0].severity == "low"

    def test_single_page_per_keyword_no_cannibalization(self, analyzer):
        data = [
            {"query": "hiking boots", "page": "https://a.com/1", "clicks": 100, "impressions": 500, "position": 3.0},
            {"query": "trail shoes", "page": "https://a.com/2", "clicks": 80, "impressions": 400, "position": 4.0},
            {"query": "running shoes", "page": "https://a.com/3", "clicks": 60, "impressions": 300, "position": 5.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 0

    def test_min_impressions_filter(self, analyzer):
        data = [
            {"query": "rare keyword", "page": "https://a.com/r1", "clicks": 1, "impressions": 20, "position": 3.0},
            {"query": "rare keyword", "page": "https://a.com/r2", "clicks": 1, "impressions": 10, "position": 4.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 0

    def test_severity_ordering_high_medium_low(self, analyzer):
        data = [
            # low
            {"query": "low kw", "page": "https://a.com/L1", "clicks": 5, "impressions": 100, "position": 30.0},
            {"query": "low kw", "page": "https://a.com/L2", "clicks": 3, "impressions": 80, "position": 35.0},
            # high
            {"query": "high kw", "page": "https://a.com/H1", "clicks": 100, "impressions": 500, "position": 2.0},
            {"query": "high kw", "page": "https://a.com/H2", "clicks": 50, "impressions": 200, "position": 5.0},
            # medium
            {"query": "med kw", "page": "https://a.com/M1", "clicks": 50, "impressions": 300, "position": 4.0},
            {"query": "med kw", "page": "https://a.com/M2", "clicks": 10, "impressions": 100, "position": 25.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results) == 3
        assert [r.severity for r in results] == ["high", "medium", "low"]

    def test_cannibalization_pages_list_content(self, analyzer):
        data = [
            {"query": "test kw", "page": "https://a.com/p1", "clicks": 100, "impressions": 500, "position": 3.0},
            {"query": "test kw", "page": "https://a.com/p2", "clicks": 50, "impressions": 200, "position": 7.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert len(results[0].pages) == 2
        urls = {p["url"] for p in results[0].pages}
        assert urls == {"https://a.com/p1", "https://a.com/p2"}

    def test_position_20_not_top20(self, analyzer):
        """position=20 is NOT < 20 → pages_in_top20=0 → severity=low."""
        data = [
            {"query": "boundary kw", "page": "https://a.com/b1", "clicks": 50, "impressions": 300, "position": 20.0},
            {"query": "boundary kw", "page": "https://a.com/b2", "clicks": 30, "impressions": 200, "position": 22.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert results[0].severity == "low"

    def test_position_19_counts_as_top20(self, analyzer):
        data = [
            {"query": "near kw", "page": "https://a.com/n1", "clicks": 50, "impressions": 300, "position": 19.0},
            {"query": "near kw", "page": "https://a.com/n2", "clicks": 30, "impressions": 200, "position": 15.0},
        ]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert results[0].severity == "high"

    def test_cannibalization_empty_input(self, analyzer):
        assert analyzer.detect_cannibalization([]) == []


# ---------------------------------------------------------------------------
# 10. Edge cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_empty_page_data_no_crash(self, analyzer):
        result = analyzer.analyze_page({})
        assert isinstance(result, ContentQualityRecord)
        assert result.is_thin is True

    def test_zero_word_count(self, analyzer):
        result = analyzer.analyze_page({"wordCount": 0, "h1": [], "h2": [], "h2Count": 0, "h3Count": 0})
        assert result.is_thin is True
        assert result.readability.word_count == 0

    def test_none_numeric_values_use_defaults(self, analyzer):
        """None for numeric fields → _safe_int returns 0, no crash."""
        page_data = {"url": "https://a.com/none", "wordCount": None, "h2Count": None, "h3Count": None}
        result = analyzer.analyze_page(page_data)
        assert isinstance(result, ContentQualityRecord)
        assert result.readability.word_count == 0

    def test_review_empty_content(self, analyzer):
        result = analyzer.review_content("")
        assert isinstance(result, ContentQualityRecord)
        assert result.is_thin is True

    def test_review_plain_text_word_count(self, analyzer):
        """Plain text (no HTML) falls through to raw_content fallback, word count is correct."""
        text = "This is plain text. " * 30  # 120 words
        result = analyzer.review_content(text)
        assert result.readability.word_count == 120
        assert result.is_thin is True  # 120 < 300

    def test_cannibalization_missing_query_field_skipped(self, analyzer):
        data = [{"page": "https://a.com/1", "clicks": 100, "impressions": 500, "position": 3.0}]
        results = analyzer.detect_cannibalization(data, min_impressions=50)
        assert results == []


# ---------------------------------------------------------------------------
# 11. Pydantic model serialization
# ---------------------------------------------------------------------------


class TestPydanticSerialization:
    def test_readability_metrics_roundtrip(self):
        m = ReadabilityMetrics(flesch_reading_ease=75.5, word_count=300, reading_level="7th grade")
        restored = ReadabilityMetrics.model_validate_json(m.model_dump_json())
        assert restored.flesch_reading_ease == 75.5
        assert restored.word_count == 300

    def test_keyword_usage_roundtrip(self):
        ku = KeywordUsage(keyword="test keyword", density=1.5, count=5, in_title=True, in_h1=False)
        restored = KeywordUsage.model_validate_json(ku.model_dump_json())
        assert restored.keyword == "test keyword"
        assert restored.in_title is True

    def test_content_structure_roundtrip(self):
        cs = ContentStructure(heading_count=5, h2_count=3, internal_links=4)
        restored = ContentStructure.model_validate_json(cs.model_dump_json())
        assert restored.heading_count == 5
        assert restored.h2_count == 3

    def test_content_quality_record_json(self, analyzer):
        page_data = {"url": "https://a.com/serialize", "title": "Test Page",
                     "h1": ["Test H1"], "h2": ["Section"], "h2Count": 1, "h3Count": 0, "wordCount": 400}
        record = analyzer.analyze_page(page_data, target_keyword="test")
        data = json.loads(record.model_dump_json())
        assert data["url"] == "https://a.com/serialize"
        assert data["mode"] == "audit"
        assert "quality_score" in data
        assert "readability" in data
        assert "structure" in data

    def test_record_with_keyword_usage_serializes(self, analyzer):
        page_data = {"url": "https://a.com/kw-test", "title": "Keyword test page",
                     "h1": ["Keyword H1"], "h2": [], "h2Count": 0, "h3Count": 0, "wordCount": 400}
        record = analyzer.analyze_page(page_data, target_keyword="keyword")
        assert record.keyword_usage is not None
        data = json.loads(record.model_dump_json())
        assert data["keyword_usage"]["keyword"] == "keyword"

    def test_record_null_keyword_usage_serializes(self, analyzer):
        page_data = {"url": "https://a.com/no-kw", "h1": ["Title"], "h2": [],
                     "h2Count": 0, "h3Count": 0, "wordCount": 400}
        record = analyzer.analyze_page(page_data)
        data = json.loads(record.model_dump_json())
        assert data["keyword_usage"] is None

    def test_duplicate_group_roundtrip(self):
        dg = DuplicateGroup(fingerprint="abcdef0123456789",
                            pages=["https://a.com/1", "https://a.com/2"],
                            similarity=0.95, word_count_range=(400, 420),
                            recommendation="Merge or 301 redirect")
        restored = DuplicateGroup.model_validate_json(dg.model_dump_json())
        assert restored.similarity == 0.95
        assert len(restored.pages) == 2
        assert restored.word_count_range == (400, 420)

    def test_cannibalization_record_roundtrip(self):
        cr = CannibalizationRecord(
            keyword="best hiking boots",
            pages=[{"url": "https://a.com/1", "clicks": 100, "impressions": 500, "position": 3.0}],
            severity="high", recommendation="Consolidate.")
        restored = CannibalizationRecord.model_validate_json(cr.model_dump_json())
        assert restored.keyword == "best hiking boots"
        assert restored.severity == "high"

    def test_all_fields_present_in_dump(self, analyzer):
        record = analyzer.review_content(
            "<html><body><h1>Title</h1><p>" + "word " * 400 + "</p></body></html>",
            target_keyword="word")
        data = record.model_dump()
        expected_keys = {
            "url", "title", "mode", "quality_score", "readability_score", "seo_score",
            "structure_score", "readability", "keyword_usage", "structure",
            "is_thin", "thin_threshold", "is_duplicate", "duplicate_of",
            "similarity_score", "last_modified", "content_age_days", "is_stale",
            "issues", "recommendations", "simhash", "analyzed_at",
        }
        assert expected_keys.issubset(data.keys())
