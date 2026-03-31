"""Content quality models.

Data structures for content analysis results including readability metrics,
content scoring, duplicate detection, and keyword cannibalization findings.
Used by the content quality analyzer in both site-audit and content-review modes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ReadabilityMetrics(BaseModel):
    """Readability scores and text statistics for a piece of content."""

    flesch_reading_ease: float = 0.0
    flesch_kincaid_grade: float = 0.0
    gunning_fog_index: float = 0.0
    # P1 audit improvements: additional formulas (textstat-backed)
    smog_index: float = 0.0
    automated_readability_index: float = 0.0  # ARI — character-based
    coleman_liau_index: float = 0.0  # character-based, no syllable counting
    dale_chall_score: float = 0.0  # uses 3,000-word common list
    text_standard: str = ""  # consensus grade across all formulas
    difficult_word_count: int = 0  # words not in common-word list
    avg_sentence_length: float = 0.0
    avg_word_length: float = 0.0
    syllable_count: int = 0
    sentence_count: int = 0
    word_count: int = 0
    paragraph_count: int = 0
    reading_level: str = ""  # e.g., "6th grade", "college", "professional"


class KeywordUsage(BaseModel):
    """How a target keyword is used within the content."""

    keyword: str
    density: float = 0.0  # percentage of total words
    count: int = 0
    in_title: bool = False
    in_h1: bool = False
    in_first_100_words: bool = False
    in_meta_description: bool = False
    in_url: bool = False
    heading_count: int = 0  # how many H2-H6 contain the keyword
    prominence_score: float = 0.0  # 0-100, weighted placement score
    is_over_optimized: bool = False  # density > 3.5% threshold


class ContentStructure(BaseModel):
    """Structural analysis of content layout and formatting."""

    heading_count: int = 0
    heading_hierarchy_valid: bool = True  # no skipped levels (H1 -> H3)
    heading_levels_skipped: list[str] = Field(default_factory=list)  # e.g., ["H1->H3"]
    h2_count: int = 0
    h3_count: int = 0
    list_count: int = 0  # <ul> + <ol>
    image_count: int = 0
    images_with_alt: int = 0
    table_count: int = 0
    avg_paragraph_length: float = 0.0  # in words
    short_paragraphs: int = 0  # under 20 words
    long_paragraphs: int = 0  # over 150 words
    internal_links: int = 0
    external_links: int = 0
    has_toc: bool = False  # table of contents detected
    has_faq_schema: bool = False
    # E-E-A-T structural signals
    has_author_byline: bool = False
    has_publication_date: bool = False
    has_author_schema: bool = False
    external_citation_count: int = 0  # outbound links to authoritative sources


class ContentQualityRecord(BaseModel):
    """Complete content quality assessment for a single page or draft.

    Works in two modes:
    - **Audit mode**: URL + crawled HTML analyzed as part of a site audit.
    - **Review mode**: Raw text/HTML analyzed during content creation to
      check quality before publishing.
    """

    # Identification
    url: str = ""  # empty in review mode
    title: str = ""
    mode: str = "audit"  # "audit" or "review"

    # Overall scores (0-100)
    quality_score: float = 0.0
    readability_score: float = 0.0
    seo_score: float = 0.0
    structure_score: float = 0.0

    # Detailed breakdowns
    readability: ReadabilityMetrics = Field(default_factory=ReadabilityMetrics)
    keyword_usage: Optional[KeywordUsage] = None
    structure: ContentStructure = Field(default_factory=ContentStructure)

    # Flags
    is_thin: bool = False  # below word count threshold
    thin_threshold: int = 300  # the threshold used
    is_duplicate: bool = False
    duplicate_of: str = ""  # URL or identifier of the original
    similarity_score: float = 0.0  # 0-1, how similar to duplicate_of

    # Freshness
    last_modified: Optional[datetime] = None
    content_age_days: Optional[int] = None
    is_stale: bool = False  # exceeds staleness threshold

    # Issues and recommendations
    issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    # Fingerprint for duplicate detection
    simhash: Optional[str] = None

    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


class DuplicateGroup(BaseModel):
    """A group of pages with near-duplicate content."""

    fingerprint: str  # shared simhash or cluster identifier
    pages: list[str]  # URLs or identifiers
    similarity: float  # average pairwise similarity (0-1)
    word_count_range: tuple[int, int] = (0, 0)
    recommendation: str = ""  # e.g., "canonicalize", "merge", "differentiate"


class CannibalizationRecord(BaseModel):
    """Pages competing for the same keyword in search results."""

    keyword: str
    pages: list[dict[str, Any]] = Field(default_factory=list)
    # Each dict: {"url": str, "clicks": int, "impressions": int, "position": float}
    severity: str = ""  # "high", "medium", "low"
    recommendation: str = ""
