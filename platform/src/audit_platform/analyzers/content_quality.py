"""Content quality analyzer.

Standalone analysis class for scoring page content quality, readability,
SEO keyword usage, duplicate detection (SimHash), and keyword cannibalization.
Works in two modes:
  - audit: from crawl-data.json page dicts (no raw HTML)
  - review: from raw HTML/text strings (full readability)
"""

from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any, Optional

import structlog

from audit_platform.models.content import (
    CannibalizationRecord,
    ContentQualityRecord,
    ContentStructure,
    DuplicateGroup,
    KeywordUsage,
    ReadabilityMetrics,
)


def _safe_int(val: Any, default: int = 0) -> int:
    """Safely cast a value to int, returning default on failure."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _add_issue(issues: list[str], issue: str) -> None:
    """Append issue string only if not already present."""
    if issue not in issues:
        issues.append(issue)


class _TextExtractor(HTMLParser):
    """Extract visible paragraph text from HTML, skipping script/style/nav/etc."""

    SKIP_TAGS = {"script", "style", "head", "nav", "footer", "header"}

    def __init__(self) -> None:
        super().__init__()
        self._skip_depth: int = 0
        self.paragraphs: list[str] = []
        self._current_para: list[str] = []
        self.list_count: int = 0
        self.table_count: int = 0
        self.has_toc: bool = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
        if tag in ("ul", "ol"):
            self.list_count += 1
        if tag == "table":
            self.table_count += 1
        if tag == "nav":
            for name, value in attrs:
                if name in ("id", "class") and value is not None:
                    if "toc" in value.lower() or "table-of-contents" in value.lower():
                        self.has_toc = True
        if tag == "p":
            self._current_para = []

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
        if tag == "p":
            text = " ".join(self._current_para).strip()
            if text:
                self.paragraphs.append(text)

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            self._current_para.append(data)

    @property
    def full_text(self) -> str:
        """Join all collected paragraphs into a single string."""
        return " ".join(p for p in self.paragraphs if p)


class ContentQualityAnalyzer:
    """Standalone content quality analysis. No HTTP calls."""

    THIN_THRESHOLD: int = 300
    STALE_DAYS: int = 365
    SIMHASH_BITS: int = 64
    DUPLICATE_HAMMING_THRESHOLD: int = 3
    NEAR_DUPLICATE_HAMMING_THRESHOLD: int = 8

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def analyze_page(
        self,
        page_data: dict[str, Any],
        target_keyword: Optional[str] = None,
        raw_html: Optional[str] = None,
    ) -> ContentQualityRecord:
        """Analyze a single page from crawl data, optionally enriched with raw HTML."""
        self.log.debug("analyze_page_start", url=page_data.get("url", ""), mode="audit")

        url = page_data.get("url", "")
        title = page_data.get("title", "")
        description = page_data.get("description", "")
        h1_list: list[str] = page_data.get("h1", [])
        h2_list: list[str] = page_data.get("h2", [])
        h2_count = _safe_int(page_data.get("h2Count", 0))
        h3_count = _safe_int(page_data.get("h3Count", 0))
        word_count = _safe_int(page_data.get("wordCount", 0))
        img_count = _safe_int(page_data.get("imgCount", 0))
        img_without_alt = _safe_int(page_data.get("imgWithoutAlt", 0))
        internal_links = _safe_int(page_data.get("contextualInternalLinks", 0))
        external_links = _safe_int(page_data.get("externalLinks", 0))
        existing_issues: list[str] = page_data.get("issues", [])
        last_modified_raw = page_data.get("lastModified", None)

        last_modified: Optional[datetime] = None
        if last_modified_raw is not None:
            if isinstance(last_modified_raw, datetime):
                last_modified = last_modified_raw.replace(tzinfo=None)
            elif isinstance(last_modified_raw, str):
                try:
                    last_modified = datetime.fromisoformat(
                        last_modified_raw.replace("Z", "+00:00")
                    ).replace(tzinfo=None)
                except (ValueError, TypeError, AttributeError):
                    last_modified = None

        issues: list[str] = list(existing_issues)

        is_thin = word_count < self.THIN_THRESHOLD
        if is_thin:
            _add_issue(issues, "THIN_CONTENT")

        is_stale, content_age_days = self._check_freshness(last_modified)
        if is_stale:
            _add_issue(issues, "STALE_CONTENT")

        if len(h1_list) == 0:
            heading_hierarchy_valid = False
            _add_issue(issues, "MISSING_H1")
        elif len(h1_list) > 1:
            heading_hierarchy_valid = False
            _add_issue(issues, "MULTIPLE_H1")
        else:
            heading_hierarchy_valid = True

        heading_count = len(h1_list) + h2_count + h3_count
        images_with_alt = max(0, img_count - img_without_alt)

        if img_without_alt > 0:
            _add_issue(issues, "MISSING_ALT_TEXT")
        if internal_links == 0:
            _add_issue(issues, "NO_INTERNAL_LINKS")

        structure = ContentStructure(
            heading_count=heading_count,
            heading_hierarchy_valid=heading_hierarchy_valid,
            h2_count=h2_count,
            h3_count=h3_count,
            list_count=0,
            image_count=img_count,
            images_with_alt=images_with_alt,
            table_count=0,
            avg_paragraph_length=0.0,
            short_paragraphs=0,
            long_paragraphs=0,
            internal_links=internal_links,
            external_links=external_links,
            has_toc=False,
            has_faq_schema="FAQPage" in page_data.get("schemaTypes", []),
        )

        full_text: Optional[str] = None
        paragraphs: list[str] = []
        readability: ReadabilityMetrics
        readability_score: float

        if raw_html is not None and raw_html.strip() != "":
            full_text, paragraphs, list_count, table_count, has_toc = self._extract_text_from_html(raw_html)
            if not full_text.strip() and raw_html.strip():
                full_text = raw_html.strip()
                paragraphs = [full_text]
            readability = self._compute_readability(full_text, paragraphs)
            readability_score = max(0.0, min(100.0, readability.flesch_reading_ease))
            structure.list_count = list_count
            structure.table_count = table_count
            structure.has_toc = has_toc
            para_lengths = [len(p.split()) for p in paragraphs]
            structure.avg_paragraph_length = sum(para_lengths) / len(para_lengths) if para_lengths else 0.0
            structure.short_paragraphs = sum(1 for length in para_lengths if length < 20)
            structure.long_paragraphs = sum(1 for length in para_lengths if length > 150)
            readability.paragraph_count = len(paragraphs)
            if readability.word_count > 0 and word_count == 0:
                word_count = readability.word_count
                is_thin = word_count < self.THIN_THRESHOLD
        else:
            readability = ReadabilityMetrics(word_count=word_count)
            readability_score = 0.0
            _add_issue(issues, "READABILITY_NOT_ANALYZED")

        keyword_usage = self._compute_keyword_usage(
            target_keyword, url, title, description, h1_list, h2_list,
            full_text=full_text, word_count=word_count,
        )
        if target_keyword is None or (isinstance(target_keyword, str) and target_keyword.strip() == ""):
            keyword_usage = None
            _add_issue(issues, "NO_KEYWORD_PROVIDED")

        seo_score = self._compute_seo_score(keyword_usage, mode="audit")
        if seo_score < 50.0 and keyword_usage is not None:
            _add_issue(issues, "LOW_SEO_SCORE")

        structure_score = self._compute_structure_score(structure)
        if structure_score < 50.0:
            _add_issue(issues, "LOW_STRUCTURE_SCORE")

        simhash_hex = self._simhash(title, h1_list, h2_list, description)
        quality_score = self._compute_quality_score(seo_score, readability_score, structure_score, is_thin)
        recommendations = self._generate_recommendations(issues, word_count, content_age_days)

        record = ContentQualityRecord(
            url=url,
            title=title,
            mode="audit",
            quality_score=quality_score,
            readability_score=readability_score,
            seo_score=seo_score,
            structure_score=structure_score,
            readability=readability,
            keyword_usage=keyword_usage,
            structure=structure,
            is_thin=is_thin,
            thin_threshold=self.THIN_THRESHOLD,
            is_duplicate=False,
            duplicate_of="",
            similarity_score=0.0,
            last_modified=last_modified,
            content_age_days=content_age_days,
            is_stale=is_stale,
            issues=issues,
            recommendations=recommendations,
            simhash=simhash_hex,
        )

        self.log.debug("analyze_page_done", url=url, quality_score=quality_score)
        return record

    def review_content(
        self,
        raw_content: str,
        target_keyword: Optional[str] = None,
        url: str = "",
    ) -> ContentQualityRecord:
        """Analyze raw HTML or plain text content before publishing."""
        self.log.debug("review_content_start", url=url, content_length=len(raw_content))

        full_text, paragraphs, list_count, table_count, has_toc = self._extract_text_from_html(raw_content)

        if full_text.strip() == "" and raw_content.strip() != "":
            full_text = raw_content.strip()
            paragraphs = [full_text]

        words = full_text.split()
        word_count = len(words)

        m = re.search(r"<title[^>]*>(.*?)</title>", raw_content, re.IGNORECASE | re.DOTALL)
        title = m.group(1).strip() if m else ""

        h1_list = [h.strip() for h in re.findall(r"<h1[^>]*>(.*?)</h1>", raw_content, re.IGNORECASE | re.DOTALL)]
        h2_list = [h.strip() for h in re.findall(r"<h2[^>]*>(.*?)</h2>", raw_content, re.IGNORECASE | re.DOTALL)]
        h3_matches = re.findall(r"<h3[^>]*>(.*?)</h3>", raw_content, re.IGNORECASE | re.DOTALL)

        m2 = re.search(
            r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
            raw_content, re.IGNORECASE
        )
        description = m2.group(1).strip() if m2 else ""

        img_tags = re.findall(r"<img\b[^>]*>", raw_content, re.IGNORECASE)
        img_count = len(img_tags)
        img_without_alt = sum(
            1 for tag in img_tags
            if not re.search(r'alt\s*=\s*["\'][^"\']+["\']', tag, re.IGNORECASE)
        )
        images_with_alt = img_count - img_without_alt

        all_links = re.findall(r'<a\b[^>]*href\s*=\s*["\']([^"\']*)["\']', raw_content, re.IGNORECASE)
        domain_match = re.match(r"https?://([^/]+)", url) if url else None
        domain = domain_match.group(1) if domain_match else None
        internal_links = sum(1 for link in all_links if domain and domain in link)
        external_links = len(all_links) - internal_links

        is_thin = word_count < self.THIN_THRESHOLD
        issues: list[str] = []
        if is_thin:
            _add_issue(issues, "THIN_CONTENT")

        if len(h1_list) == 0:
            heading_hierarchy_valid = False
            _add_issue(issues, "MISSING_H1")
        elif len(h1_list) > 1:
            heading_hierarchy_valid = False
            _add_issue(issues, "MULTIPLE_H1")
        else:
            heading_hierarchy_valid = True

        if img_without_alt > 0:
            _add_issue(issues, "MISSING_ALT_TEXT")
        if internal_links == 0:
            _add_issue(issues, "NO_INTERNAL_LINKS")

        readability = self._compute_readability(full_text, paragraphs)
        readability_score = max(0.0, min(100.0, readability.flesch_reading_ease))

        para_lengths = [len(p.split()) for p in paragraphs]
        avg_paragraph_length = sum(para_lengths) / len(para_lengths) if para_lengths else 0.0
        short_paragraphs = sum(1 for length in para_lengths if length < 20)
        long_paragraphs = sum(1 for length in para_lengths if length > 150)

        structure = ContentStructure(
            heading_count=len(h1_list) + len(h2_list) + len(h3_matches),
            heading_hierarchy_valid=heading_hierarchy_valid,
            h2_count=len(h2_list),
            h3_count=len(h3_matches),
            list_count=list_count,
            image_count=img_count,
            images_with_alt=images_with_alt,
            table_count=table_count,
            avg_paragraph_length=avg_paragraph_length,
            short_paragraphs=short_paragraphs,
            long_paragraphs=long_paragraphs,
            internal_links=internal_links,
            external_links=external_links,
            has_toc=has_toc,
            has_faq_schema=any(
                "faqpage" in block.lower()
                for block in re.findall(
                    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                    raw_content,
                    re.IGNORECASE | re.DOTALL,
                )
            ),
        )

        keyword_usage = self._compute_keyword_usage(
            target_keyword, url, title, description, h1_list, h2_list,
            full_text=full_text, word_count=word_count,
        )
        if target_keyword is None or (isinstance(target_keyword, str) and target_keyword.strip() == ""):
            keyword_usage = None
            _add_issue(issues, "NO_KEYWORD_PROVIDED")

        seo_score = self._compute_seo_score(keyword_usage, mode="review")
        if seo_score < 50.0 and keyword_usage is not None:
            _add_issue(issues, "LOW_SEO_SCORE")

        structure_score = self._compute_structure_score(structure)
        if structure_score < 50.0:
            _add_issue(issues, "LOW_STRUCTURE_SCORE")

        simhash_hex = self._simhash(title, h1_list, h2_list, description)
        quality_score = self._compute_quality_score(seo_score, readability_score, structure_score, is_thin)
        recommendations = self._generate_recommendations(issues, word_count, None)

        record = ContentQualityRecord(
            url=url,
            title=title,
            mode="review",
            quality_score=quality_score,
            readability_score=readability_score,
            seo_score=seo_score,
            structure_score=structure_score,
            readability=readability,
            keyword_usage=keyword_usage,
            structure=structure,
            is_thin=is_thin,
            thin_threshold=self.THIN_THRESHOLD,
            is_duplicate=False,
            duplicate_of="",
            similarity_score=0.0,
            last_modified=None,
            content_age_days=None,
            is_stale=False,
            issues=issues,
            recommendations=recommendations,
            simhash=simhash_hex,
        )

        self.log.debug("review_content_done", url=url, quality_score=quality_score, word_count=word_count)
        return record

    def analyze_batch(
        self,
        pages: list[dict[str, Any]],
        target_keywords: Optional[dict[str, str]] = None,
    ) -> tuple[list[ContentQualityRecord], list[DuplicateGroup]]:
        """Analyze all pages and detect duplicate content groups via SimHash."""
        self.log.info("analyze_batch_start", total=len(pages))

        if len(pages) == 0:
            return ([], [])

        records: list[ContentQualityRecord] = []
        for i, page_data in enumerate(pages):
            page_url = page_data.get("url", "")
            kw = None
            if target_keywords is not None:
                kw = target_keywords.get(page_url)
            record = self.analyze_page(page_data, target_keyword=kw)
            records.append(record)
            if (i + 1) % 10 == 0:
                self.log.info("batch_progress", completed=i + 1, total=len(pages))

        if len(pages) % 10 != 0:
            self.log.info("batch_progress", completed=len(pages), total=len(pages))

        simhash_map: dict[str, int] = {}
        for record in records:
            if record.simhash is not None:
                simhash_map[record.url] = int(record.simhash, 16)

        urls = list(simhash_map.keys())
        n = len(urls)
        duplicate_pairs: list[tuple[str, str, int]] = []

        if n <= 1000:
            for i in range(n):
                for j in range(i + 1, n):
                    dist = self._hamming_distance(simhash_map[urls[i]], simhash_map[urls[j]])
                    if dist <= self.NEAR_DUPLICATE_HAMMING_THRESHOLD:
                        duplicate_pairs.append((urls[i], urls[j], dist))
        else:
            self.log.warning(
                "near_duplicate_detection_degraded",
                n=n,
                threshold=1000,
                note="Only exact SimHash matches detected above threshold",
            )
            buckets: dict[str, list[str]] = defaultdict(list)
            for url_key in urls:
                hex_fp = f"{simhash_map[url_key]:016x}"
                buckets[hex_fp].append(url_key)
            for _hex_fp, bucket_urls in buckets.items():
                if len(bucket_urls) >= 2:
                    for i in range(len(bucket_urls)):
                        for j in range(i + 1, len(bucket_urls)):
                            duplicate_pairs.append((bucket_urls[i], bucket_urls[j], 0))

        parent: dict[str, str] = {}

        def find(x: str) -> str:
            while parent.get(x, x) != x:
                parent[x] = parent.get(parent[x], parent[x])
                x = parent[x]
            return x

        def union(a: str, b: str) -> None:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb

        for url_a, url_b, _dist in duplicate_pairs:
            union(url_a, url_b)

        group_distances: dict[str, list[int]] = defaultdict(list)
        for url_a, url_b, dist in duplicate_pairs:
            root = find(url_a)
            group_distances[root].append(dist)

        url_to_root: dict[str, str] = {}
        for url_key in simhash_map:
            root = find(url_key)
            if root in group_distances:
                url_to_root[url_key] = root

        grouped: dict[str, list[str]] = defaultdict(list)
        for url_key, root in url_to_root.items():
            grouped[root].append(url_key)

        url_to_record = {r.url: r for r in records}
        duplicate_groups: list[DuplicateGroup] = []
        dup_threshold = 1.0 - (self.DUPLICATE_HAMMING_THRESHOLD / 64)

        for root, group_urls in grouped.items():
            if len(group_urls) < 2:
                continue
            fingerprint = f"{simhash_map[group_urls[0]]:016x}"
            dists = group_distances[root]
            avg_hamming = sum(dists) / len(dists)
            similarity = 1.0 - (avg_hamming / 64)
            wc_list = [url_to_record[u].readability.word_count for u in group_urls]
            word_count_range = (min(wc_list), max(wc_list))

            if avg_hamming <= self.DUPLICATE_HAMMING_THRESHOLD and max(wc_list) > 1.5 * min(wc_list):
                recommendation = "Canonicalize to longer page"
            elif avg_hamming <= self.DUPLICATE_HAMMING_THRESHOLD:
                recommendation = "Merge or 301 redirect"
            else:
                recommendation = "Differentiate content"

            dup_group = DuplicateGroup(
                fingerprint=fingerprint,
                pages=group_urls,
                similarity=similarity,
                word_count_range=word_count_range,
                recommendation=recommendation,
            )
            duplicate_groups.append(dup_group)

            for u in group_urls:
                rec = url_to_record[u]
                rec.is_duplicate = True
                rec.similarity_score = similarity
                rec.duplicate_of = group_urls[1] if u == group_urls[0] else group_urls[0]

                if similarity >= dup_threshold:
                    issue_str = "DUPLICATE_CONTENT"
                    rec_str = f"Duplicate of {rec.duplicate_of}. Consider 301 redirect or canonical tag."
                else:
                    issue_str = "NEAR_DUPLICATE_CONTENT"
                    rec_str = f"Near-duplicate of {rec.duplicate_of}. Differentiate content."

                if issue_str not in rec.issues:
                    rec.issues.append(issue_str)
                    rec.recommendations.append(rec_str)

        self.log.info("analyze_batch_done", total=len(records), duplicate_groups=len(duplicate_groups))
        return (records, duplicate_groups)

    def detect_cannibalization(
        self,
        query_page_data: list[dict[str, Any]],
        min_impressions: int = 50,
    ) -> list[CannibalizationRecord]:
        """Detect keyword cannibalization from Search Console query/page data."""
        self.log.debug(
            "detect_cannibalization_start",
            rows=len(query_page_data),
            min_impressions=min_impressions,
        )

        groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in query_page_data:
            query = row.get("query", "")
            if query:
                groups[query].append(row)

        results: list[CannibalizationRecord] = []
        for query, rows in groups.items():
            total_impressions = sum(r.get("impressions", 0) for r in rows)
            if total_impressions < min_impressions:
                continue
            if len(rows) < 2:
                continue

            rows.sort(key=lambda r: r.get("clicks", 0), reverse=True)

            pages_in_top20 = sum(1 for r in rows if r.get("position", 100) < 20)
            if pages_in_top20 >= 2:
                severity = "high"
            elif pages_in_top20 == 1:
                severity = "medium"
            else:
                severity = "low"

            page_list = [
                {
                    "url": r.get("page", ""),
                    "clicks": r.get("clicks", 0),
                    "impressions": r.get("impressions", 0),
                    "position": r.get("position", 0.0),
                }
                for r in rows
            ]

            winner_url = page_list[0]["url"]
            loser_urls = ", ".join(p["url"] for p in page_list[1:])

            if severity == "high":
                recommendation = f"Consolidate. Redirect {loser_urls} \u2192 {winner_url} or canonicalize."
            elif severity == "medium":
                recommendation = f"Differentiate: ensure {loser_urls} target a distinct keyword variant."
            else:
                recommendation = f"Low priority. Monitor {loser_urls} as rankings improve."

            record = CannibalizationRecord(
                keyword=query,
                pages=page_list,
                severity=severity,
                recommendation=recommendation,
            )
            results.append(record)

        severity_order = {"high": 0, "medium": 1, "low": 2}
        results.sort(
            key=lambda r: (
                severity_order.get(r.severity, 3),
                -sum(p.get("impressions", 0) for p in r.pages),
            )
        )

        self.log.info("detect_cannibalization_done", total_records=len(results))
        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _count_syllables(self, word: str) -> int:
        """Estimate syllable count for a single word using vowel-group heuristic."""
        word = word.lower().strip(".,!?;:")
        if not word:
            return 0
        count = len(re.findall(r"[aeiou]+", word))
        if word.endswith("e") and count > 1:
            count -= 1
        return max(1, count)

    def _compute_readability(self, text: str, paragraphs: list[str]) -> ReadabilityMetrics:
        """Compute readability metrics using textstat (6+ formulas) with fallback.

        Uses textstat library (1,400 stars) for accurate syllable counting via
        CMU dictionary and industry-standard formulas: Flesch, FK, Gunning Fog,
        SMOG, ARI, Coleman-Liau, Dale-Chall, plus consensus text_standard.
        Falls back to hand-rolled formulas if textstat is not installed.
        """
        if not text.strip():
            return ReadabilityMetrics()

        words = text.split()
        word_count = len(words)
        if word_count == 0:
            return ReadabilityMetrics()

        sentences = re.split(r"(?<=[.!?])\s+", text)
        sentences = [s for s in sentences if s.strip()]
        sentence_count = len(sentences) if sentences else 1
        avg_sentence_length = word_count / sentence_count
        avg_word_length = sum(len(w) for w in words) / word_count

        # Try textstat for accurate multi-formula analysis
        try:
            import textstat
            flesch = textstat.flesch_reading_ease(text)
            flesch = max(0.0, min(100.0, flesch))
            fk_grade = textstat.flesch_kincaid_grade(text)
            fog = textstat.gunning_fog(text)
            smog = textstat.smog_index(text)
            ari = textstat.automated_readability_index(text)
            coleman_liau = textstat.coleman_liau_index(text)
            dale_chall = textstat.dale_chall_readability_score(text)
            text_std = textstat.text_standard(text, float_output=False)
            difficult = textstat.difficult_words(text)
            total_syllables = textstat.syllable_count(text)
        except (ImportError, Exception):
            # Fallback to hand-rolled formulas
            total_syllables = sum(self._count_syllables(w) for w in words)
            complex_word_count = sum(1 for w in words if self._count_syllables(w) >= 3)
            flesch = 206.835 - 1.015 * avg_sentence_length - 84.6 * (total_syllables / word_count)
            flesch = max(0.0, min(100.0, flesch))
            fk_grade = 0.39 * avg_sentence_length + 11.8 * (total_syllables / word_count) - 15.59
            fog = 0.4 * (avg_sentence_length + 100.0 * (complex_word_count / word_count))
            smog = 0.0
            ari = 0.0
            coleman_liau = 0.0
            dale_chall = 0.0
            text_std = ""
            difficult = 0

        # Determine reading level from Flesch score
        if flesch >= 90:
            reading_level = "5th grade"
        elif flesch >= 80:
            reading_level = "6th grade"
        elif flesch >= 70:
            reading_level = "7th grade"
        elif flesch >= 60:
            reading_level = "8th-9th grade"
        elif flesch >= 50:
            reading_level = "10th-12th grade"
        elif flesch >= 30:
            reading_level = "college"
        else:
            reading_level = "professional/technical"

        return ReadabilityMetrics(
            flesch_reading_ease=round(flesch, 2),
            flesch_kincaid_grade=round(fk_grade, 2),
            gunning_fog_index=round(fog, 2),
            smog_index=round(smog, 2),
            automated_readability_index=round(ari, 2),
            coleman_liau_index=round(coleman_liau, 2),
            dale_chall_score=round(dale_chall, 2),
            text_standard=text_std or reading_level,
            difficult_word_count=difficult,
            avg_sentence_length=round(avg_sentence_length, 2),
            avg_word_length=round(avg_word_length, 2),
            syllable_count=total_syllables,
            sentence_count=sentence_count,
            word_count=word_count,
            paragraph_count=len(paragraphs),
            reading_level=reading_level,
        )

    def _compute_keyword_usage(
        self,
        target_keyword: Optional[str],
        url: str,
        title: str,
        description: str,
        h1_list: list[str],
        h2_list: list[str],
        full_text: Optional[str],
        word_count: int,
    ) -> Optional[KeywordUsage]:
        """Compute keyword placement flags and density metrics."""
        if target_keyword is None or target_keyword.strip() == "":
            return None

        kw_lower = target_keyword.strip().lower()
        in_title = kw_lower in title.lower()
        in_h1 = any(kw_lower in h.lower() for h in h1_list)
        in_meta_description = kw_lower in description.lower()
        in_url = (
            kw_lower.replace(" ", "-") in url.lower()
            or kw_lower.replace(" ", "") in url.lower()
            or kw_lower in url.lower()
        )

        if full_text is not None:
            first_100 = " ".join(full_text.split()[:100]).lower()
            in_first_100_words = kw_lower in first_100
        else:
            in_first_100_words = False

        heading_count = sum(1 for h in h2_list if kw_lower in h.lower())

        count = 0
        density = 0.0
        if full_text is not None and word_count > 0:
            kw_words = kw_lower.split()
            text_lower = full_text.lower()
            start = 0
            while True:
                idx = text_lower.find(kw_lower, start)
                if idx == -1:
                    break
                count += 1
                start = idx + 1
            density = (count * len(kw_words) / word_count) * 100.0

        prominence = 0.0
        if in_title:
            prominence += 30.0
        if in_h1:
            prominence += 25.0
        if in_first_100_words:
            prominence += 20.0
        if in_meta_description:
            prominence += 15.0
        if in_url:
            prominence += 10.0

        is_over_optimized = density > 3.5

        return KeywordUsage(
            keyword=target_keyword.strip(),
            density=round(density, 2),
            count=count,
            in_title=in_title,
            in_h1=in_h1,
            in_first_100_words=in_first_100_words,
            in_meta_description=in_meta_description,
            in_url=in_url,
            heading_count=heading_count,
            prominence_score=round(prominence, 2),
            is_over_optimized=is_over_optimized,
        )

    def _compute_seo_score(self, keyword_usage: Optional[KeywordUsage], mode: str) -> float:
        """Score keyword SEO placement 0-100 (max 85 audit, 100 review)."""
        if keyword_usage is None:
            return 0.0
        score = 0.0
        if keyword_usage.in_title:
            score += 25.0
        if keyword_usage.in_h1:
            score += 20.0
        if keyword_usage.in_meta_description:
            score += 15.0
        if mode == "review" and keyword_usage.in_first_100_words:
            score += 15.0
        if keyword_usage.in_url:
            score += 15.0
        if keyword_usage.heading_count >= 1:
            score += 10.0
        return score

    def _compute_structure_score(self, structure: ContentStructure) -> float:
        """Score content structure 0-100 based on heading, links, lists, images."""
        score = 0.0
        if structure.heading_hierarchy_valid:
            score += 30.0
        if structure.h2_count >= 2:
            score += 20.0
        if structure.internal_links >= 3:
            score += 15.0
        if structure.image_count == 0:
            score += 15.0
        elif structure.images_with_alt / structure.image_count >= 0.80:
            score += 15.0
        if structure.list_count >= 1:
            score += 10.0
        if structure.long_paragraphs == 0:
            score += 10.0
        return score

    def _compute_quality_score(
        self,
        seo_score: float,
        readability_score: float,
        structure_score: float,
        is_thin: bool,
    ) -> float:
        """Compute weighted composite quality score (0-100)."""
        thin_bonus = 100.0 if not is_thin else 0.0
        quality = (
            0.35 * seo_score
            + 0.30 * readability_score
            + 0.25 * structure_score
            + 0.10 * thin_bonus
        )
        return round(quality, 2)

    def _simhash(
        self,
        title: str,
        h1_list: list[str],
        h2_list: list[str],
        description: str,
        full_text: Optional[str] = None,
    ) -> Optional[str]:
        """Compute 64-bit SimHash fingerprint.

        Uses full body text when available (more accurate for detecting
        pages with identical content but different metadata). Falls back
        to title+headings+description when body text is unavailable.
        """
        if full_text and len(full_text.split()) >= 20:
            # Use body text for higher-fidelity duplicate detection
            raw = full_text
        else:
            h1_joined = " ".join(h1_list)
            h2_joined = " ".join(h2_list)
            raw = f"{title} {h1_joined} {h2_joined} {description}"
        normalized = re.sub(r"[^\w\s]", "", raw.lower())
        tokens = normalized.split()

        if len(tokens) < 3:
            return None

        shingles: Counter[str] = Counter()
        for i in range(len(tokens) - 2):
            shingle = tokens[i] + tokens[i + 1] + tokens[i + 2]
            shingles[shingle] += 1

        V = [0] * 64
        for shingle, count in shingles.items():
            raw_hash = hashlib.sha256(shingle.encode()).digest()[:8]
            h = int.from_bytes(raw_hash, "big")
            for i in range(64):
                if (h >> i) & 1:
                    V[i] += count
                else:
                    V[i] -= count

        simhash = 0
        for i in range(64):
            if V[i] > 0:
                simhash |= 1 << i

        return f"{simhash:016x}"

    def _hamming_distance(self, a: int, b: int) -> int:
        """Count differing bits between two 64-bit SimHash integers."""
        return bin(a ^ b).count("1")

    def _extract_text_from_html(
        self,
        html: str,
    ) -> tuple[str, list[str], int, int, bool]:
        """Parse HTML and return (full_text, paragraphs, list_count, table_count, has_toc)."""
        extractor = _TextExtractor()
        extractor.feed(html)
        extractor.close()
        return (
            extractor.full_text,
            extractor.paragraphs,
            extractor.list_count,
            extractor.table_count,
            extractor.has_toc,
        )

    def _check_freshness(
        self,
        last_modified: Optional[datetime],
    ) -> tuple[bool, Optional[int]]:
        """Return (is_stale, content_age_days) based on last_modified date."""
        if last_modified is None:
            return (False, None)
        try:
            age_days = (datetime.now(timezone.utc).replace(tzinfo=None) - last_modified).days
        except TypeError:
            return (False, None)
        is_stale = age_days > self.STALE_DAYS
        return (is_stale, age_days)

    def _generate_recommendations(
        self,
        issues: list[str],
        word_count: int,
        content_age_days: Optional[int],
    ) -> list[str]:
        """Generate human-readable recommendations from issue codes."""
        recommendations: list[str] = []
        for issue in issues:
            if issue == "THIN_CONTENT":
                recommendations.append(
                    f"Page has only {word_count} words. Expand to {self.THIN_THRESHOLD}+ for substantive content."
                )
            elif issue == "STALE_CONTENT":
                if content_age_days is not None:
                    recommendations.append(f"Content is {content_age_days} days old. Consider refreshing.")
            elif issue == "MISSING_H1":
                recommendations.append("Add an H1 tag to this page.")
            elif issue == "MULTIPLE_H1":
                recommendations.append("Use only one H1 tag per page.")
            elif issue == "NO_KEYWORD_PROVIDED":
                recommendations.append("Provide a target keyword for SEO analysis.")
            elif issue == "LOW_SEO_SCORE":
                recommendations.append(
                    "Improve keyword placement: add target keyword to title, H1, meta description, and URL."
                )
            elif issue == "LOW_STRUCTURE_SCORE":
                recommendations.append(
                    "Improve content structure: add H2 subheadings, internal links, and lists."
                )
            elif issue == "NO_INTERNAL_LINKS":
                recommendations.append("Add internal links to relevant pages on this site.")
            elif issue == "MISSING_ALT_TEXT":
                recommendations.append("Add descriptive alt text to all images.")
            elif issue == "READABILITY_NOT_ANALYZED":
                pass  # informational only
            # DUPLICATE_CONTENT and NEAR_DUPLICATE_CONTENT handled in analyze_batch()
        return recommendations
