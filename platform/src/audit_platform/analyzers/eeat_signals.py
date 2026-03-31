"""E-E-A-T & Page Quality Signal Analyzer.

Detects Experience, Expertise, Authoritativeness, and Trust signals
as defined in Google's Search Quality Evaluator Guidelines (Sept 2025).

This analyzer checks for the specific signals that Google's human
quality raters are trained to look for when evaluating page quality.

Reference: /docs/searchqualityevaluatorguidelines.pdf (182 pages)

Key sections implemented:
- Section 2.3: YMYL topic detection
- Section 3.2: MC quality signals (effort, originality, skill)
- Section 3.3: Reputation signals
- Section 3.4: E-E-A-T signals
- Section 4.6: Spam/scaled content signals

Outputs to ``eeatSignals`` key in audit-data.json.
"""

from __future__ import annotations

import re
from collections import Counter
from typing import Any, Optional
from urllib.parse import urlparse

import structlog


class EEATSignalAnalyzer:
    """Detect E-E-A-T and page quality signals from crawl data.

    Maps directly to Google's Search Quality Evaluator Guidelines.
    """

    # YMYL topic keywords (Section 2.3)
    YMYL_INDICATORS: dict[str, list[str]] = {
        "health": [
            "health", "medical", "medication", "drug", "treatment",
            "symptom", "diagnosis", "hospital", "doctor", "patient",
            "disease", "cancer", "surgery", "prescription",
        ],
        "finance": [
            "invest", "mortgage", "loan", "credit", "bank",
            "tax", "retirement", "insurance", "financial",
            "stock", "crypto", "trading", "debt",
        ],
        "legal": [
            "lawyer", "attorney", "legal", "lawsuit", "court",
            "custody", "divorce", "immigration", "visa",
        ],
        "safety": [
            "emergency", "safety", "disaster", "evacuation",
            "recall", "hazard", "warning",
        ],
    }

    # Trust signals in HTML (Section 3.4)
    TRUST_SIGNALS = {
        "has_about_page": re.compile(r'href=["\'][^"\']*(?:/about|/about-us|/our-team|/who-we-are)', re.I),
        "has_contact_page": re.compile(r'href=["\'][^"\']*(?:/contact|/contact-us|/get-in-touch)', re.I),
        "has_privacy_policy": re.compile(r'href=["\'][^"\']*(?:/privacy|/privacy-policy)', re.I),
        "has_terms": re.compile(r'href=["\'][^"\']*(?:/terms|/terms-of-service|/tos)', re.I),
    }

    # Author/expertise signals
    AUTHOR_PATTERNS = [
        re.compile(r'(?:written|authored|by|author)[:\s]+[A-Z][a-z]+\s+[A-Z][a-z]+', re.I),
        re.compile(r'class=["\'][^"\']*author[^"\']*["\']', re.I),
        re.compile(r'rel=["\']author["\']', re.I),
        re.compile(r'itemprop=["\']author["\']', re.I),
    ]

    DATE_PATTERNS = [
        re.compile(r'(?:published|updated|modified|posted)[:\s]+\w+\s+\d{1,2},?\s+\d{4}', re.I),
        re.compile(r'<time\b[^>]*datetime=', re.I),
        re.compile(r'itemprop=["\']datePublished["\']', re.I),
        re.compile(r'itemprop=["\']dateModified["\']', re.I),
        re.compile(r'article:published_time', re.I),
        re.compile(r'article:modified_time', re.I),
    ]

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze(
        self,
        pages: list[dict[str, Any]],
        site_html: str | None = None,
    ) -> dict[str, Any]:
        """Analyze E-E-A-T signals across site pages.

        Args:
            pages: Crawl data pages (url, title, description, schemaTypes, etc.)
            site_html: Optional raw HTML of homepage for site-level trust checks.

        Returns:
            Dict for ``eeatSignals`` key in audit-data.json.
        """
        self.log.info("eeat_analysis_start", pages=len(pages))

        # Site-level trust signals
        site_trust = self._analyze_site_trust(pages, site_html)

        # Per-page E-E-A-T signals
        page_signals: list[dict[str, Any]] = []
        ymyl_pages = 0
        pages_with_author = 0
        pages_with_date = 0
        pages_with_schema = 0
        pages_with_expertise = 0

        for page in pages:
            signals = self._analyze_page_eeat(page)
            if signals["isYmyl"]:
                ymyl_pages += 1
            if signals["hasAuthor"]:
                pages_with_author += 1
            if signals["hasPublicationDate"]:
                pages_with_date += 1
            if signals["hasExpertiseSchema"]:
                pages_with_schema += 1
            if signals["expertiseScore"] >= 50:
                pages_with_expertise += 1

            page_signals.append(signals)

        # Overall E-E-A-T score (0-100)
        eeat_score = self._compute_eeat_score(
            site_trust, page_signals, len(pages)
        )

        # Issues and recommendations
        issues = self._generate_issues(
            site_trust, page_signals, eeat_score, len(pages)
        )

        summary = {
            "eeatScore": eeat_score["score"],
            "eeatGrade": eeat_score["grade"],
            "trustScore": eeat_score["trustScore"],
            "expertiseScore": eeat_score["expertiseScore"],
            "authorityScore": eeat_score["authorityScore"],
            "experienceScore": eeat_score["experienceScore"],
            "ymylPages": ymyl_pages,
            "pagesWithAuthor": pages_with_author,
            "pagesWithDate": pages_with_date,
            "pagesWithExpertiseSchema": pages_with_schema,
            "totalPages": len(pages),
        }

        self.log.info(
            "eeat_analysis_complete",
            score=eeat_score["score"],
            grade=eeat_score["grade"],
            ymyl_pages=ymyl_pages,
        )

        return {
            "summary": summary,
            "siteTrust": site_trust,
            "pageSignals": page_signals[:50],  # Top 50 for report
            "eeatScore": eeat_score,
            "issues": issues,
        }

    # ------------------------------------------------------------------
    # Site-Level Trust Signals (Section 3.3, 3.4)
    # ------------------------------------------------------------------

    def _analyze_site_trust(
        self, pages: list[dict[str, Any]], site_html: str | None
    ) -> dict[str, Any]:
        """Check site-level trust signals that Google raters look for."""
        signals: dict[str, bool] = {
            "hasAboutPage": False,
            "hasContactPage": False,
            "hasPrivacyPolicy": False,
            "hasTermsOfService": False,
            "hasPhysicalAddress": False,
            "hasPhoneNumber": False,
            "hasSecureConnection": False,
            "hasOrganizationSchema": False,
            "hasLocalBusinessSchema": False,
        }

        # Check from page URLs
        for page in pages:
            url = (page.get("url") or "").lower()
            if "/about" in url:
                signals["hasAboutPage"] = True
            if "/contact" in url:
                signals["hasContactPage"] = True
            if "/privacy" in url:
                signals["hasPrivacyPolicy"] = True
            if "/terms" in url or "/tos" in url:
                signals["hasTermsOfService"] = True
            if url.startswith("https://"):
                signals["hasSecureConnection"] = True

            # Schema checks
            schema_types = page.get("schemaTypes") or []
            for st in schema_types:
                st_lower = (st or "").lower()
                if "organization" in st_lower:
                    signals["hasOrganizationSchema"] = True
                if "localbusiness" in st_lower or "realestate" in st_lower:
                    signals["hasLocalBusinessSchema"] = True

        # Count how many trust signals are present
        trust_count = sum(1 for v in signals.values() if v)
        trust_pct = round(trust_count / len(signals) * 100, 1)

        return {
            **signals,
            "trustSignalCount": trust_count,
            "trustSignalTotal": len(signals),
            "trustSignalPct": trust_pct,
        }

    # ------------------------------------------------------------------
    # Per-Page E-E-A-T Signals
    # ------------------------------------------------------------------

    def _analyze_page_eeat(self, page: dict[str, Any]) -> dict[str, Any]:
        """Check E-E-A-T signals for a single page."""
        url = page.get("url") or ""
        title = page.get("title") or ""
        description = page.get("description") or page.get("meta_description") or ""
        h1_list = page.get("h1") or []
        h1_text = " ".join(h1_list) if isinstance(h1_list, list) else str(h1_list)
        word_count = page.get("wordCount") or page.get("word_count") or 0
        schema_types = page.get("schemaTypes") or []
        schema_data = page.get("schemaData") or []

        combined_text = f"{title} {h1_text} {description}".lower()

        # YMYL detection (Section 2.3)
        ymyl_category = self._detect_ymyl(combined_text, url)

        # Author signals (Section 3.4 - Experience/Expertise)
        has_author = self._has_author_signal(page, schema_data)

        # Publication date signal
        has_date = self._has_date_signal(page, schema_data)

        # Expertise schema (Person, Author, credentials)
        has_expertise_schema = any(
            st.lower() in ("person", "author", "physician", "attorney", "accountant")
            for st in schema_types
        )

        # Content depth as effort signal (Section 3.2)
        effort_score = self._score_effort(word_count, page)

        # Expertise score
        expertise_score = self._score_expertise(
            has_author, has_expertise_schema, schema_types, page
        )

        return {
            "url": url,
            "isYmyl": ymyl_category is not None,
            "ymylCategory": ymyl_category,
            "hasAuthor": has_author,
            "hasPublicationDate": has_date,
            "hasExpertiseSchema": has_expertise_schema,
            "effortScore": effort_score,
            "expertiseScore": expertise_score,
            "schemaTypes": schema_types,
        }

    def _detect_ymyl(self, text: str, url: str) -> Optional[str]:
        """Detect if page is on a YMYL topic (Section 2.3)."""
        url_lower = url.lower()
        for category, keywords in self.YMYL_INDICATORS.items():
            for kw in keywords:
                if kw in text or kw in url_lower:
                    return category
        return None

    def _has_author_signal(
        self, page: dict[str, Any], schema_data: list[Any]
    ) -> bool:
        """Check for author attribution signals."""
        # Check schema data for author
        for schema in schema_data:
            if not isinstance(schema, dict):
                continue
            if schema.get("author"):
                return True
            # Check @graph
            for item in schema.get("@graph", []):
                if isinstance(item, dict) and item.get("author"):
                    return True

        # Check OG/meta for author
        if page.get("ogAuthor") or page.get("author"):
            return True

        return False

    def _has_date_signal(
        self, page: dict[str, Any], schema_data: list[Any]
    ) -> bool:
        """Check for publication/modification date signals."""
        for schema in schema_data:
            if not isinstance(schema, dict):
                continue
            if schema.get("datePublished") or schema.get("dateModified"):
                return True
            for item in schema.get("@graph", []):
                if isinstance(item, dict) and (item.get("datePublished") or item.get("dateModified")):
                    return True
        return False

    def _score_effort(self, word_count: int, page: dict[str, Any]) -> int:
        """Score content effort 0-100 (Section 3.2: effort, originality, skill)."""
        score = 0

        # Word count (depth of content)
        if word_count >= 2000:
            score += 30
        elif word_count >= 1000:
            score += 20
        elif word_count >= 500:
            score += 10
        elif word_count >= 300:
            score += 5

        # Has images (visual effort)
        img_count = page.get("imgCount") or page.get("image_count") or 0
        if img_count >= 5:
            score += 15
        elif img_count >= 1:
            score += 8

        # Has structured headings
        h2_count = page.get("h2Count") or page.get("h2_count") or 0
        if h2_count >= 3:
            score += 15
        elif h2_count >= 1:
            score += 8

        # Has schema markup (technical effort)
        if page.get("hasSchema"):
            score += 10

        # Has internal links (editorial effort)
        internal_links = page.get("contextualInternalLinks") or page.get("totalInternalLinks") or 0
        if internal_links >= 5:
            score += 15
        elif internal_links >= 2:
            score += 8

        # Has external citations
        external_links = page.get("externalLinks") or 0
        if external_links >= 3:
            score += 15
        elif external_links >= 1:
            score += 8

        return min(score, 100)

    def _score_expertise(
        self,
        has_author: bool,
        has_expertise_schema: bool,
        schema_types: list[str],
        page: dict[str, Any],
    ) -> int:
        """Score expertise signals 0-100 (Section 3.4)."""
        score = 0

        if has_author:
            score += 25

        if has_expertise_schema:
            score += 20

        # Has relevant schema types
        valuable_schemas = {"Article", "BlogPosting", "NewsArticle", "FAQPage",
                           "HowTo", "Recipe", "Review", "LocalBusiness", "RealEstateAgent"}
        if any(st in valuable_schemas for st in schema_types):
            score += 15

        # Has publication date
        if self._has_date_signal(page, page.get("schemaData") or []):
            score += 15

        # Has descriptive title (not generic)
        title = page.get("title") or ""
        if len(title) >= 30 and title.lower() not in ("home", "homepage", "welcome"):
            score += 10

        # Has meta description
        desc = page.get("description") or page.get("meta_description") or ""
        if len(desc) >= 50:
            score += 10

        # Has OG tags (professional publishing signals)
        if page.get("ogTitle"):
            score += 5

        return min(score, 100)

    # ------------------------------------------------------------------
    # Overall E-E-A-T Score
    # ------------------------------------------------------------------

    def _compute_eeat_score(
        self,
        site_trust: dict[str, Any],
        page_signals: list[dict[str, Any]],
        total_pages: int,
    ) -> dict[str, Any]:
        """Compute overall E-E-A-T score (0-100).

        Based on Google's hierarchy: Trust > Expertise > Authority > Experience.
        """
        if not page_signals:
            return {"score": 0, "grade": "F", "trustScore": 0, "expertiseScore": 0, "authorityScore": 0, "experienceScore": 0}

        # Trust score (40% weight) — from site-level trust signals
        trust_pct = site_trust.get("trustSignalPct", 0)
        trust_score = round(trust_pct)

        # Expertise score (30% weight) — from page-level expertise signals
        avg_expertise = sum(p.get("expertiseScore", 0) for p in page_signals) / len(page_signals)
        expertise_score = round(avg_expertise)

        # Authority score (20% weight) — schema presence + structured data
        pages_with_schema = sum(1 for p in page_signals if p.get("hasExpertiseSchema") or p.get("schemaTypes"))
        schema_pct = pages_with_schema / max(total_pages, 1) * 100
        authority_score = min(round(schema_pct), 100)

        # Experience score (10% weight) — author + date signals
        pages_with_author = sum(1 for p in page_signals if p.get("hasAuthor"))
        pages_with_date = sum(1 for p in page_signals if p.get("hasPublicationDate"))
        experience_signals = (pages_with_author + pages_with_date) / max(total_pages * 2, 1) * 100
        experience_score = min(round(experience_signals), 100)

        # Weighted composite
        composite = (
            trust_score * 0.40 +
            expertise_score * 0.30 +
            authority_score * 0.20 +
            experience_score * 0.10
        )
        composite = round(min(composite, 100))

        # Grade
        if composite >= 80:
            grade = "Strong"
        elif composite >= 60:
            grade = "Moderate"
        elif composite >= 40:
            grade = "Weak"
        else:
            grade = "Poor"

        return {
            "score": composite,
            "grade": grade,
            "trustScore": trust_score,
            "expertiseScore": expertise_score,
            "authorityScore": authority_score,
            "experienceScore": experience_score,
        }

    # ------------------------------------------------------------------
    # Issue Generation
    # ------------------------------------------------------------------

    def _generate_issues(
        self,
        site_trust: dict[str, Any],
        page_signals: list[dict[str, Any]],
        eeat_score: dict[str, Any],
        total_pages: int,
    ) -> list[dict[str, Any]]:
        """Generate actionable issues from E-E-A-T analysis."""
        issues: list[dict[str, Any]] = []

        # Site-level trust issues
        if not site_trust.get("hasAboutPage"):
            issues.append({
                "issue": "MISSING_ABOUT_PAGE",
                "detail": "No About page found. Google raters check 'what the website says about itself' as a trust signal.",
                "severity": "high",
                "reference": "Search Quality Guidelines Section 3.4",
            })

        if not site_trust.get("hasContactPage"):
            issues.append({
                "issue": "MISSING_CONTACT_PAGE",
                "detail": "No Contact page found. Lack of contact information reduces trust, especially for YMYL sites.",
                "severity": "high",
                "reference": "Search Quality Guidelines Section 3.3",
            })

        if not site_trust.get("hasPrivacyPolicy"):
            issues.append({
                "issue": "MISSING_PRIVACY_POLICY",
                "detail": "No Privacy Policy found. Required for sites that collect user data.",
                "severity": "medium",
                "reference": "Search Quality Guidelines Section 3.3",
            })

        if not site_trust.get("hasOrganizationSchema") and not site_trust.get("hasLocalBusinessSchema"):
            issues.append({
                "issue": "MISSING_ORGANIZATION_SCHEMA",
                "detail": "No Organization or LocalBusiness schema. This structured data tells Google who is responsible for the site.",
                "severity": "high",
                "reference": "Search Quality Guidelines Section 2.5",
            })

        # Page-level E-E-A-T issues
        pages_without_author = sum(1 for p in page_signals if not p.get("hasAuthor"))
        if pages_without_author > total_pages * 0.5:
            issues.append({
                "issue": "LOW_AUTHOR_ATTRIBUTION",
                "detail": f"{pages_without_author} of {total_pages} pages lack author attribution. Google raters look for who created the content.",
                "severity": "high",
                "reference": "Search Quality Guidelines Section 3.4 - Experience & Expertise",
            })

        pages_without_date = sum(1 for p in page_signals if not p.get("hasPublicationDate"))
        if pages_without_date > total_pages * 0.5:
            issues.append({
                "issue": "LOW_DATE_ATTRIBUTION",
                "detail": f"{pages_without_date} of {total_pages} pages lack publication dates. Freshness signals matter for E-E-A-T.",
                "severity": "medium",
                "reference": "Search Quality Guidelines Section 18.0 - Freshness",
            })

        # YMYL pages with low expertise
        ymyl_low_expertise = [
            p for p in page_signals
            if p.get("isYmyl") and p.get("expertiseScore", 0) < 40
        ]
        if ymyl_low_expertise:
            issues.append({
                "issue": "YMYL_LOW_EXPERTISE",
                "detail": f"{len(ymyl_low_expertise)} YMYL pages have low expertise signals. Google applies 'very high Page Quality rating standards' to YMYL content.",
                "severity": "critical",
                "reference": "Search Quality Guidelines Section 2.3 - YMYL + Section 3.4.1",
            })

        # Low effort content
        low_effort = [p for p in page_signals if p.get("effortScore", 0) < 20]
        if len(low_effort) > total_pages * 0.3:
            issues.append({
                "issue": "HIGH_LOW_EFFORT_CONTENT",
                "detail": f"{len(low_effort)} pages show low-effort signals (thin content, no images, no structure). Section 3.2 evaluates 'effort, originality, and talent or skill.'",
                "severity": "high",
                "reference": "Search Quality Guidelines Section 3.2 - Quality of MC",
            })

        return issues
