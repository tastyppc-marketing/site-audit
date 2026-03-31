"""Indexation & Crawlability Analyzer (P8).

Analyzes crawl budget health: URL parameter taxonomy, pagination audit,
soft 404 detection, index coverage estimation, and Search Console orphan
page cross-referencing.

Outputs to ``indexationCrawlability`` key in audit-data.json.
"""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from typing import Any, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import structlog


class IndexCrawlabilityAnalyzer:
    """Analyze indexation health and crawl budget waste."""

    # Parameter taxonomy for URL audit
    PARAMETER_TAXONOMY: dict[str, list[str]] = {
        "filter": [
            "color", "colour", "size", "brand", "type", "category", "price",
            "min_price", "max_price", "rating", "material", "style", "bedrooms",
            "bathrooms", "property_type", "amenities",
        ],
        "sort": [
            "sort", "order", "orderby", "sort_by", "sortby", "dir", "direction",
        ],
        "pagination": [
            "page", "p", "pg", "start", "offset", "limit", "per_page", "paged",
        ],
        "tracking": [
            "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
            "fbclid", "gclid", "msclkid", "_ga", "_gl", "ref", "referrer",
        ],
        "session": [
            "sessionid", "sid", "phpsessid", "jsessionid", "session_id", "token",
        ],
        "search": [
            "q", "query", "s", "search", "keyword", "keywords", "term", "find",
        ],
        "display": [
            "view", "format", "layout", "display", "tab", "panel", "mode",
        ],
    }

    # Known soft 404 patterns in titles/H1s
    SOFT_404_PATTERNS = re.compile(
        r"\b(not found|404|page (not|doesn't|does not) exist|no (results|content|page)|"
        r"error|sorry|unavailable|removed|deleted|oops|nothing here)\b",
        re.IGNORECASE,
    )

    # Tracking params to strip for SC URL normalization
    TRACKING_PARAMS = frozenset({
        "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
        "fbclid", "gclid", "msclkid", "_ga", "_gl", "ref", "referrer",
    })

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze(
        self,
        pages: list[dict[str, Any]],
        sitemap_urls: list[str] | None = None,
        sc_pages: list[dict[str, Any]] | None = None,
        inbound_links: dict[str, set[str]] | None = None,
    ) -> dict[str, Any]:
        """Run full indexation and crawlability analysis.

        Args:
            pages: Crawl data pages from crawl-data.json.
            sitemap_urls: URLs from sitemap.xml.
            sc_pages: Search Console page data [{page, clicks, impressions, ...}].
            inbound_links: Inbound link map from InternalLinkAnalyzer (url -> set of linking urls).

        Returns:
            Dict for ``indexationCrawlability`` key in audit-data.json.
        """
        self.log.info("indexation_analysis_start", pages=len(pages))

        param_audit = self.audit_url_parameters(pages)
        pagination_audit = self.audit_pagination(pages)
        soft_404s = self.detect_soft_404s(pages)
        index_orphans = self.detect_index_orphans(
            pages, sc_pages or [], inbound_links or {}
        )
        crawl_budget = self.compute_crawl_budget_health(
            pages, param_audit, soft_404s, index_orphans
        )

        result = {
            "parameterAudit": param_audit,
            "paginationAudit": pagination_audit,
            "soft404s": soft_404s,
            "indexOrphans": index_orphans,
            "crawlBudgetHealth": crawl_budget,
        }

        self.log.info(
            "indexation_analysis_complete",
            param_issues=param_audit["summary"]["totalParameterizedUrls"],
            soft_404s=soft_404s["summary"]["totalSoft404s"],
            index_orphans=index_orphans["summary"]["totalOrphans"],
            budget_score=crawl_budget["score"],
        )

        return result

    # ------------------------------------------------------------------
    # URL Parameter Audit
    # ------------------------------------------------------------------

    def audit_url_parameters(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Classify URL parameters and detect crawl traps."""
        issues: list[dict[str, Any]] = []
        param_pages: list[dict[str, Any]] = []
        base_path_variants: dict[str, list[str]] = defaultdict(list)
        category_counts: Counter[str] = Counter()

        for page in pages:
            url = page.get("url", "")
            if not url:
                continue

            parsed = urlparse(url)
            if not parsed.query:
                continue

            params = parse_qs(parsed.query, keep_blank_values=True)
            base_path = urlunparse(parsed._replace(query="", fragment=""))

            # Classify each parameter
            param_categories: list[dict[str, str]] = []
            for param_name in params:
                category = self._classify_parameter(param_name)
                param_categories.append({"name": param_name, "category": category})
                category_counts[category] += 1

            base_path_variants[base_path].append(url)

            param_pages.append({
                "url": url,
                "basePath": base_path,
                "parameters": param_categories,
            })

            # Faceted navigation detection: 2+ filter params on same URL
            filter_count = sum(1 for p in param_categories if p["category"] == "filter")
            if filter_count >= 2:
                issues.append({
                    "url": url,
                    "issue": "FACETED_NAVIGATION",
                    "detail": f"URL has {filter_count} filter parameters — potential faceted navigation crawl trap",
                    "severity": "high",
                })

            # Session ID detection
            session_params = [p for p in param_categories if p["category"] == "session"]
            if session_params:
                issues.append({
                    "url": url,
                    "issue": "SESSION_ID_IN_URL",
                    "detail": f"Session parameter '{session_params[0]['name']}' creates unique URLs per user",
                    "severity": "critical",
                })

            # Tracking parameters without canonical
            tracking_params = [p for p in param_categories if p["category"] == "tracking"]
            canonical = (page.get("canonical") or "").strip()
            if tracking_params and (not canonical or "?" in canonical):
                issues.append({
                    "url": url,
                    "issue": "TRACKING_PARAMS_NO_CANONICAL",
                    "detail": f"Tracking parameter(s) present without clean canonical URL",
                    "severity": "high",
                })

        # Parameter explosion detection
        for base_path, variants in base_path_variants.items():
            if len(variants) >= 5:
                issues.append({
                    "url": base_path,
                    "issue": "PARAMETER_EXPLOSION",
                    "detail": f"{len(variants)} URL variants with different parameters on same base path",
                    "severity": "high",
                })

        summary = {
            "totalParameterizedUrls": len(param_pages),
            "parameterCategories": dict(category_counts),
            "facetedNavUrls": sum(1 for i in issues if i["issue"] == "FACETED_NAVIGATION"),
            "sessionIdUrls": sum(1 for i in issues if i["issue"] == "SESSION_ID_IN_URL"),
            "explosionPaths": sum(1 for i in issues if i["issue"] == "PARAMETER_EXPLOSION"),
            "totalIssues": len(issues),
        }

        return {"summary": summary, "pages": param_pages[:50], "issues": issues}

    # ------------------------------------------------------------------
    # Pagination Audit
    # ------------------------------------------------------------------

    def audit_pagination(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit rel=next/prev pagination signals."""
        issues: list[dict[str, Any]] = []
        paginated_pages: list[dict[str, Any]] = []

        # Build URL status lookup
        url_status: dict[str, int] = {}
        noindex_urls: set[str] = set()
        for page in pages:
            url = self._norm_url(page.get("url", ""))
            url_status[url] = page.get("statusCode") or 200
            robots = (page.get("robotsMeta") or "").lower()
            if "noindex" in robots:
                noindex_urls.add(url)

        for page in pages:
            url = page.get("url", "")
            next_url = page.get("paginationNext") or page.get("paginationNextResolved")
            prev_url = page.get("paginationPrev") or page.get("paginationPrevResolved")

            if not next_url and not prev_url:
                continue

            paginated_pages.append({
                "url": url,
                "next": next_url,
                "prev": prev_url,
            })

            norm_url = self._norm_url(url)

            # Check: noindex on paginated page
            if norm_url in noindex_urls:
                issues.append({
                    "url": url,
                    "issue": "PAGINATION_NOINDEX",
                    "detail": "Paginated page has noindex — blocks crawler from deeper content",
                    "severity": "high",
                })

            # Check: next URL returns error
            if next_url:
                next_norm = self._norm_url(next_url)
                next_status = url_status.get(next_norm, 0)
                if next_status >= 400:
                    issues.append({
                        "url": url,
                        "issue": "PAGINATION_BROKEN_NEXT",
                        "detail": f"rel=next points to {next_url} which returns HTTP {next_status}",
                        "severity": "high",
                    })

            # Check: canonical strategy
            canonical = (page.get("canonicalResolved") or page.get("canonical") or "").strip()
            if canonical:
                canon_norm = self._norm_url(canonical)
                if canon_norm == norm_url:
                    pass  # Self-canonical — optimal
                elif canon_norm != norm_url and next_url:
                    # Canonical to different page on a paginated page
                    issues.append({
                        "url": url,
                        "issue": "PAGINATION_CANONICAL_OTHER",
                        "detail": f"Paginated page canonicalizes to {canonical} instead of self",
                        "severity": "low",
                    })

        summary = {
            "totalPaginatedPages": len(paginated_pages),
            "noindexPaginated": sum(1 for i in issues if i["issue"] == "PAGINATION_NOINDEX"),
            "brokenNext": sum(1 for i in issues if i["issue"] == "PAGINATION_BROKEN_NEXT"),
            "totalIssues": len(issues),
        }

        return {"summary": summary, "pages": paginated_pages[:50], "issues": issues}

    # ------------------------------------------------------------------
    # Soft 404 Detection
    # ------------------------------------------------------------------

    def detect_soft_404s(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Detect pages returning HTTP 200 that appear to be error pages.

        Uses title/H1 pattern matching and near-empty content detection.
        No additional HTTP calls needed — works on crawl data.
        """
        soft_404s: list[dict[str, Any]] = []

        for page in pages:
            status = page.get("statusCode") or page.get("status_code") or 200
            if status != 200:
                continue

            url = page.get("url", "")
            title = page.get("title") or ""
            h1_list = page.get("h1") or []
            h1_text = " ".join(h1_list) if isinstance(h1_list, list) else str(h1_list)
            word_count = page.get("wordCount") or page.get("word_count") or 0

            reasons: list[str] = []

            # Check title for error patterns
            if self.SOFT_404_PATTERNS.search(title):
                reasons.append(f"Title matches error pattern: '{title}'")

            # Check H1 for error patterns
            if self.SOFT_404_PATTERNS.search(h1_text):
                reasons.append(f"H1 matches error pattern: '{h1_text[:80]}'")

            # Near-empty page
            if word_count < 50:
                reasons.append(f"Page has only {word_count} words (likely empty/error)")

            if reasons:
                soft_404s.append({
                    "url": url,
                    "title": title,
                    "wordCount": word_count,
                    "reasons": reasons,
                    "severity": "high" if len(reasons) >= 2 else "medium",
                })

        summary = {
            "totalSoft404s": len(soft_404s),
            "byReason": {
                "titlePattern": sum(1 for s in soft_404s if any("Title" in r for r in s["reasons"])),
                "h1Pattern": sum(1 for s in soft_404s if any("H1" in r for r in s["reasons"])),
                "nearEmpty": sum(1 for s in soft_404s if any("words" in r for r in s["reasons"])),
            },
        }

        return {"summary": summary, "pages": soft_404s[:50]}

    # ------------------------------------------------------------------
    # Index Orphan Detection (SC Cross-Reference)
    # ------------------------------------------------------------------

    def detect_index_orphans(
        self,
        pages: list[dict[str, Any]],
        sc_pages: list[dict[str, Any]],
        inbound_links: dict[str, set[str]],
    ) -> dict[str, Any]:
        """Find pages Google knows about (via SC) with no internal links.

        Cross-references Search Console page data with the crawl link graph
        to find pages that Google crawls but nothing links to internally.
        """
        if not sc_pages:
            return {"summary": {"totalOrphans": 0}, "orphans": []}

        # Build normalized inbound link lookup
        inbound_norm: dict[str, int] = {}
        for url, linkers in inbound_links.items():
            inbound_norm[self._norm_url_for_sc(url)] = len(linkers)

        # Also build from crawl data contextual links
        crawl_inbound: dict[str, int] = {}
        for page in pages:
            for target in (page.get("contextualLinkTargets") or []):
                norm_target = self._norm_url_for_sc(target)
                crawl_inbound[norm_target] = crawl_inbound.get(norm_target, 0) + 1

        # Merge inbound counts
        all_inbound = dict(inbound_norm)
        for url, count in crawl_inbound.items():
            all_inbound[url] = all_inbound.get(url, 0) + count

        # Build crawled URL set for 404 filtering
        crawled_status: dict[str, int] = {}
        for page in pages:
            norm = self._norm_url_for_sc(page.get("url", ""))
            crawled_status[norm] = page.get("statusCode") or 200

        orphans: list[dict[str, Any]] = []
        for sc_entry in sc_pages:
            sc_url = sc_entry.get("page") or (sc_entry[0] if isinstance(sc_entry, (list, tuple)) else "")
            if not sc_url:
                continue

            norm_sc = self._norm_url_for_sc(sc_url)

            # Skip if page returns 404 in crawl (it's gone, not orphaned)
            status = crawled_status.get(norm_sc, 0)
            if status >= 400:
                continue

            inbound_count = all_inbound.get(norm_sc, 0)
            if inbound_count == 0:
                impressions = 0
                clicks = 0
                if isinstance(sc_entry, dict):
                    impressions = sc_entry.get("impressions", 0)
                    clicks = sc_entry.get("clicks", 0)
                elif isinstance(sc_entry, (list, tuple)) and len(sc_entry) >= 3:
                    clicks = sc_entry[1] or 0
                    impressions = sc_entry[2] or 0

                priority = "high" if impressions > 100 else ("medium" if impressions > 10 else "low")

                orphans.append({
                    "url": sc_url,
                    "impressions": impressions,
                    "clicks": clicks,
                    "priority": priority,
                    "recommendation": "Add internal links to this page from relevant content pages.",
                })

        # Sort by impressions (highest first — biggest opportunity)
        orphans.sort(key=lambda o: o["impressions"], reverse=True)

        summary = {
            "totalOrphans": len(orphans),
            "highPriority": sum(1 for o in orphans if o["priority"] == "high"),
            "mediumPriority": sum(1 for o in orphans if o["priority"] == "medium"),
            "lowPriority": sum(1 for o in orphans if o["priority"] == "low"),
            "scPagesAnalyzed": len(sc_pages),
        }

        return {"summary": summary, "orphans": orphans[:50]}

    # ------------------------------------------------------------------
    # Crawl Budget Health Score
    # ------------------------------------------------------------------

    def compute_crawl_budget_health(
        self,
        pages: list[dict[str, Any]],
        param_audit: dict[str, Any],
        soft_404s: dict[str, Any],
        index_orphans: dict[str, Any],
    ) -> dict[str, Any]:
        """Compute a crawl budget health score (0-100).

        Based on Google's documented crawl budget waste factors.
        100 = no waste, 0 = severe waste.
        """
        total = len(pages) or 1

        # Factor 1: Parameterized URL ratio (weight 30)
        param_count = param_audit.get("summary", {}).get("totalParameterizedUrls", 0)
        param_ratio = min(param_count / total, 1.0)
        param_waste = param_ratio * 30

        # Factor 2: Orphan rate (weight 20)
        orphan_count = index_orphans.get("summary", {}).get("totalOrphans", 0)
        orphan_ratio = min(orphan_count / total, 1.0)
        orphan_waste = orphan_ratio * 20

        # Factor 3: Redirect chains (weight 15)
        redirect_pages = sum(
            1 for p in pages
            if (p.get("redirectChainLength") or 0) > 1
        )
        redirect_ratio = min(redirect_pages / total, 1.0)
        redirect_waste = redirect_ratio * 15

        # Factor 4: Soft 404s (weight 20)
        soft_404_count = soft_404s.get("summary", {}).get("totalSoft404s", 0)
        soft_404_ratio = min(soft_404_count / total, 1.0)
        soft_404_waste = soft_404_ratio * 20

        # Factor 5: Deep pages — depth > 3 (weight 15)
        deep_pages = sum(
            1 for p in pages
            if len(urlparse(p.get("url", "")).path.strip("/").split("/")) > 3
        )
        deep_ratio = min(deep_pages / total, 1.0)
        deep_waste = deep_ratio * 15

        total_waste = param_waste + orphan_waste + redirect_waste + soft_404_waste + deep_waste
        score = max(0, round(100 - total_waste))

        # Determine grade
        if score >= 80:
            grade = "good"
        elif score >= 50:
            grade = "needs-improvement"
        else:
            grade = "poor"

        return {
            "score": score,
            "grade": grade,
            "factors": {
                "parameterizedUrls": {"count": param_count, "ratio": round(param_ratio, 3), "waste": round(param_waste, 1)},
                "orphanPages": {"count": orphan_count, "ratio": round(orphan_ratio, 3), "waste": round(orphan_waste, 1)},
                "redirectChains": {"count": redirect_pages, "ratio": round(redirect_ratio, 3), "waste": round(redirect_waste, 1)},
                "soft404s": {"count": soft_404_count, "ratio": round(soft_404_ratio, 3), "waste": round(soft_404_waste, 1)},
                "deepPages": {"count": deep_pages, "ratio": round(deep_ratio, 3), "waste": round(deep_waste, 1)},
            },
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _classify_parameter(self, param_name: str) -> str:
        """Classify a URL parameter into a taxonomy category."""
        name_lower = param_name.lower().strip()
        for category, keywords in self.PARAMETER_TAXONOMY.items():
            if name_lower in keywords:
                return category
        return "unknown"

    @staticmethod
    def _norm_url(url: str) -> str:
        """Basic URL normalization."""
        if not url:
            return ""
        return url.lower().rstrip("/").split("#")[0]

    def _norm_url_for_sc(self, url: str) -> str:
        """Normalize URL for Search Console comparison.

        Strips tracking parameters to prevent false orphan matches.
        """
        if not url:
            return ""
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=True)
        clean_params = {k: v for k, v in params.items() if k.lower() not in self.TRACKING_PARAMS}
        clean_query = urlencode(clean_params, doseq=True) if clean_params else ""
        return urlunparse(parsed._replace(
            fragment="",
            query=clean_query,
            path=parsed.path.rstrip("/") or "/",
            scheme=parsed.scheme.lower(),
            netloc=parsed.netloc.lower(),
        ))
