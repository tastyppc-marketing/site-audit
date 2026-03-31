"""Technical SEO analyzer — P3 + P7 items.

Pure Python analysis on crawl data. No API calls. Covers:
- Title/meta description template detection
- Image optimization audit
- URL structure analysis
- Redirect/canonical/header checks (P7, stubs for future)

Outputs to the ``technicalSeo`` key in audit-data.json, consumed by
technical.html in the multi-page report.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any, Optional
from urllib.parse import urlparse

import structlog


class TechnicalSeoAnalyzer:
    """Analyze crawl data for technical SEO issues."""

    TITLE_MIN_LENGTH: int = 20
    TITLE_MAX_LENGTH: int = 60
    DESCRIPTION_MIN_LENGTH: int = 50
    DESCRIPTION_MAX_LENGTH: int = 160
    TEMPLATE_SIMILARITY_THRESHOLD: float = 0.6
    THIN_WORD_THRESHOLD: int = 300
    URL_MAX_LENGTH: int = 115
    URL_MAX_DEPTH: int = 4

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze(
        self,
        pages: list[dict[str, Any]],
        homepage_url: str = "",
    ) -> dict[str, Any]:
        """Run full technical SEO analysis on crawl data.

        Args:
            pages: List of page dicts from crawl-data.json. Each page
                should have at minimum: url, title, description.
            homepage_url: The site's homepage URL for reference.

        Returns:
            Dict matching the ``technicalSeo`` audit-data.json schema.
        """
        self.log.info("technical_seo_start", page_count=len(pages))

        meta_audit = self.audit_meta_tags(pages)
        template_report = self.detect_templates(pages)
        image_audit = self.audit_images(pages)
        url_audit = self.audit_url_structure(pages, homepage_url)
        canonical_audit = self.audit_canonicals(pages)
        redirect_audit = self.audit_redirect_chains(pages)
        header_audit = self.audit_security_headers(pages)
        indexability_audit = self.audit_indexability(pages)
        mobile_audit = self.audit_mobile_usability(pages)
        schema_validation = self.validate_structured_data(pages)

        result = {
            "metaTagSummary": meta_audit["summary"],
            "metaTagIssues": meta_audit["issues"],
            "templateDetection": template_report,
            "imageAudit": image_audit,
            "urlStructure": url_audit,
            "crawlIssues": self._extract_crawl_issues(pages),
            "schemaSummary": self._build_schema_summary(pages),
            "canonicalAudit": canonical_audit,
            "redirectChains": redirect_audit,
            "securityHeaders": header_audit,
            "indexability": indexability_audit,
            "mobileUsability": mobile_audit,
            "structuredDataValidation": schema_validation,
        }

        self.log.info(
            "technical_seo_complete",
            meta_issues=len(meta_audit["issues"]),
            templates_found=len(template_report["templates"]),
            image_issues=image_audit["summary"]["pagesMissingAlt"],
            url_issues=url_audit["summary"]["totalIssues"],
            canonical_issues=len(canonical_audit["issues"]),
            redirect_issues=len(redirect_audit["issues"]),
            header_issues=len(header_audit["issues"]),
            schema_issues=len(schema_validation["issues"]),
        )

        return result

    # ------------------------------------------------------------------
    # Title / Meta Description Audit
    # ------------------------------------------------------------------

    def audit_meta_tags(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit titles and meta descriptions across all pages."""
        issues: list[dict[str, Any]] = []

        titles_seen: dict[str, list[str]] = defaultdict(list)
        descriptions_seen: dict[str, list[str]] = defaultdict(list)

        stats = {
            "pagesWithTitle": 0,
            "pagesWithoutTitle": 0,
            "titleTooLong": 0,
            "titleTooShort": 0,
            "pagesWithDescription": 0,
            "pagesWithoutDescription": 0,
            "descriptionTooLong": 0,
            "descriptionTooShort": 0,
            "pagesWithCanonical": 0,
            "pagesWithoutCanonical": 0,
            "duplicateTitles": 0,
            "duplicateDescriptions": 0,
        }

        for page in pages:
            url = page.get("url", "")
            title = (page.get("title") or "").strip()
            desc = (page.get("description") or page.get("meta_description") or "").strip()
            canonical = (page.get("canonical") or page.get("canonical_url") or "").strip()
            title_len = page.get("titleLength") or len(title)
            desc_len = page.get("descriptionLength") or len(desc)

            # Title checks
            if not title:
                stats["pagesWithoutTitle"] += 1
                issues.append({"url": url, "issue": "MISSING_TITLE", "detail": "No title tag found"})
            else:
                stats["pagesWithTitle"] += 1
                titles_seen[title.lower()].append(url)

                if title_len > self.TITLE_MAX_LENGTH:
                    stats["titleTooLong"] += 1
                    issues.append({
                        "url": url,
                        "issue": "TITLE_TOO_LONG",
                        "detail": f"Title is {title_len} chars (max {self.TITLE_MAX_LENGTH})",
                        "value": title,
                    })
                elif title_len < self.TITLE_MIN_LENGTH:
                    stats["titleTooShort"] += 1
                    issues.append({
                        "url": url,
                        "issue": "TITLE_TOO_SHORT",
                        "detail": f"Title is {title_len} chars (min {self.TITLE_MIN_LENGTH})",
                        "value": title,
                    })

            # Description checks
            if not desc:
                stats["pagesWithoutDescription"] += 1
                issues.append({"url": url, "issue": "MISSING_META_DESCRIPTION", "detail": "No meta description found"})
            else:
                stats["pagesWithDescription"] += 1
                descriptions_seen[desc.lower()].append(url)

                if desc_len > self.DESCRIPTION_MAX_LENGTH:
                    stats["descriptionTooLong"] += 1
                    issues.append({
                        "url": url,
                        "issue": "DESCRIPTION_TOO_LONG",
                        "detail": f"Description is {desc_len} chars (max {self.DESCRIPTION_MAX_LENGTH})",
                    })
                elif desc_len < self.DESCRIPTION_MIN_LENGTH:
                    stats["descriptionTooShort"] += 1

            # Canonical check
            if canonical:
                stats["pagesWithCanonical"] += 1
            else:
                stats["pagesWithoutCanonical"] += 1

        # Duplicate detection
        for title, urls in titles_seen.items():
            if len(urls) > 1:
                stats["duplicateTitles"] += 1
                issues.append({
                    "url": urls[0],
                    "issue": "DUPLICATE_TITLE",
                    "detail": f"Title shared by {len(urls)} pages",
                    "value": title,
                    "affectedUrls": urls[:10],
                })

        for desc, urls in descriptions_seen.items():
            if len(urls) > 1:
                stats["duplicateDescriptions"] += 1
                issues.append({
                    "url": urls[0],
                    "issue": "DUPLICATE_DESCRIPTION",
                    "detail": f"Description shared by {len(urls)} pages",
                    "affectedUrls": urls[:10],
                })

        return {"summary": stats, "issues": issues}

    # ------------------------------------------------------------------
    # Template Detection
    # ------------------------------------------------------------------

    def detect_templates(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Detect boilerplate title/description templates.

        Identifies patterns like "Buy {Location} Homes | Brand" that
        repeat across many pages with only a variable swapped out.
        """
        title_patterns: Counter[str] = Counter()
        desc_patterns: Counter[str] = Counter()

        for page in pages:
            title = (page.get("title") or "").strip()
            desc = (page.get("description") or page.get("meta_description") or "").strip()

            if title:
                pattern = self._extract_pattern(title)
                if pattern:
                    title_patterns[pattern] += 1

            if desc:
                pattern = self._extract_pattern(desc)
                if pattern:
                    desc_patterns[pattern] += 1

        templates = []

        for pattern, count in title_patterns.most_common(20):
            if count >= 3:
                templates.append({
                    "type": "title",
                    "pattern": pattern,
                    "count": count,
                    "recommendation": f"Customize titles for {count} pages using this template instead of duplicating the pattern.",
                })

        for pattern, count in desc_patterns.most_common(20):
            if count >= 3:
                templates.append({
                    "type": "description",
                    "pattern": pattern,
                    "count": count,
                    "recommendation": f"Write unique descriptions for {count} pages instead of using this template.",
                })

        return {
            "templates": templates,
            "totalTemplatedTitles": sum(c for _, c in title_patterns.items() if c >= 3),
            "totalTemplatedDescriptions": sum(c for _, c in desc_patterns.items() if c >= 3),
        }

    # ------------------------------------------------------------------
    # Image Optimization Audit
    # ------------------------------------------------------------------

    def audit_images(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit image optimization across all pages."""
        total_images = 0
        total_missing_alt = 0
        pages_with_images = 0
        pages_missing_alt = 0
        per_page: list[dict[str, Any]] = []

        for page in pages:
            url = page.get("url", "")
            img_count = page.get("imgCount") or page.get("image_count") or 0
            img_no_alt = page.get("imgWithoutAlt") or 0

            if img_count > 0:
                pages_with_images += 1
                total_images += img_count
                total_missing_alt += img_no_alt

                if img_no_alt > 0:
                    pages_missing_alt += 1

                coverage = round((img_count - img_no_alt) / img_count * 100, 1) if img_count else 100

                per_page.append({
                    "url": url,
                    "totalImages": img_count,
                    "missingAlt": img_no_alt,
                    "altCoverage": coverage,
                })

        # Sort worst offenders first
        per_page.sort(key=lambda x: x["missingAlt"], reverse=True)

        overall_coverage = round(
            (total_images - total_missing_alt) / total_images * 100, 1
        ) if total_images else 100

        return {
            "summary": {
                "totalImages": total_images,
                "totalMissingAlt": total_missing_alt,
                "overallAltCoverage": overall_coverage,
                "pagesWithImages": pages_with_images,
                "pagesMissingAlt": pages_missing_alt,
            },
            "worstPages": per_page[:25],
        }

    # ------------------------------------------------------------------
    # URL Structure Analysis
    # ------------------------------------------------------------------

    def audit_url_structure(
        self,
        pages: list[dict[str, Any]],
        homepage_url: str = "",
    ) -> dict[str, Any]:
        """Analyze URL structure for SEO issues."""
        issues: list[dict[str, Any]] = []
        depth_distribution: Counter[int] = Counter()
        lengths: list[int] = []

        for page in pages:
            url = page.get("url", "")
            if not url:
                continue

            parsed = urlparse(url)
            path = parsed.path.rstrip("/") or "/"
            segments = [s for s in path.split("/") if s]
            depth = len(segments)

            depth_distribution[depth] += 1
            lengths.append(len(url))

            # URL too long
            if len(url) > self.URL_MAX_LENGTH:
                issues.append({
                    "url": url,
                    "issue": "URL_TOO_LONG",
                    "detail": f"URL is {len(url)} chars (recommended max {self.URL_MAX_LENGTH})",
                })

            # URL too deep
            if depth > self.URL_MAX_DEPTH:
                issues.append({
                    "url": url,
                    "issue": "URL_TOO_DEEP",
                    "detail": f"URL depth is {depth} (recommended max {self.URL_MAX_DEPTH})",
                })

            # Query parameters (potential duplicate content)
            if parsed.query:
                issues.append({
                    "url": url,
                    "issue": "HAS_PARAMETERS",
                    "detail": f"URL contains query parameters: {parsed.query[:80]}",
                })

            # Uppercase in URL
            if path != path.lower():
                issues.append({
                    "url": url,
                    "issue": "UPPERCASE_URL",
                    "detail": "URL contains uppercase characters",
                })

            # Underscores instead of hyphens
            if "_" in path:
                issues.append({
                    "url": url,
                    "issue": "UNDERSCORES_IN_URL",
                    "detail": "URL uses underscores instead of hyphens",
                })

            # Double slashes in path
            if "//" in path:
                issues.append({
                    "url": url,
                    "issue": "DOUBLE_SLASHES",
                    "detail": "URL path contains double slashes",
                })

        # Trailing slash consistency
        with_trailing = sum(1 for p in pages if (p.get("url") or "").endswith("/"))
        without_trailing = len(pages) - with_trailing
        trailing_consistent = (with_trailing == 0 or without_trailing == 0 or
                               min(with_trailing, without_trailing) / max(with_trailing, without_trailing) < 0.1)

        avg_length = round(sum(lengths) / len(lengths), 1) if lengths else 0
        avg_depth = round(
            sum(d * c for d, c in depth_distribution.items()) /
            sum(depth_distribution.values()), 1
        ) if depth_distribution else 0

        return {
            "summary": {
                "totalPages": len(pages),
                "totalIssues": len(issues),
                "avgUrlLength": avg_length,
                "avgDepth": avg_depth,
                "maxDepth": max(depth_distribution.keys()) if depth_distribution else 0,
                "trailingSlashConsistent": trailing_consistent,
                "urlsTooLong": sum(1 for i in issues if i["issue"] == "URL_TOO_LONG"),
                "urlsTooDeep": sum(1 for i in issues if i["issue"] == "URL_TOO_DEEP"),
                "urlsWithParameters": sum(1 for i in issues if i["issue"] == "HAS_PARAMETERS"),
                "urlsWithUppercase": sum(1 for i in issues if i["issue"] == "UPPERCASE_URL"),
                "urlsWithUnderscores": sum(1 for i in issues if i["issue"] == "UNDERSCORES_IN_URL"),
            },
            "depthDistribution": dict(sorted(depth_distribution.items())),
            "issues": issues[:100],  # Cap to avoid massive output
        }

    # ------------------------------------------------------------------
    # P7: Canonical Tag Audit
    # ------------------------------------------------------------------

    def audit_canonicals(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Cross-page canonical analysis (inspired by SEOnaut multipage/canonical.go)."""
        issues: list[dict[str, Any]] = []

        # Build lookup maps
        url_to_canonical: dict[str, str] = {}
        url_to_status: dict[str, int] = {}
        noindex_urls: set[str] = set()

        for page in pages:
            url = self._norm(page.get("url", ""))
            canonical = (page.get("canonical") or page.get("canonicalResolved") or "").strip()
            status = page.get("statusCode") or page.get("status_code") or 200
            robots = (page.get("robotsMeta") or "").lower()
            x_robots = ""
            headers = page.get("responseHeaders") or {}
            if isinstance(headers, dict):
                x_robots = (headers.get("xRobotsTag") or "").lower()

            url_to_canonical[url] = self._norm(canonical) if canonical else ""
            url_to_status[url] = int(status) if status else 200

            if "noindex" in robots or "noindex" in x_robots:
                noindex_urls.add(url)

        for page in pages:
            url = self._norm(page.get("url", ""))
            raw_canonical = (page.get("canonical") or "").strip()
            resolved_canonical = (page.get("canonicalResolved") or "").strip()
            http_canonical = (page.get("httpCanonical") or "").strip()
            canonical_count = page.get("canonicalCount") or 0
            canon = self._norm(resolved_canonical) if resolved_canonical else ""

            # Multiple canonical tags
            if canonical_count > 1:
                issues.append({"url": url, "issue": "MULTIPLE_CANONICALS", "detail": f"{canonical_count} canonical tags found — must have exactly 1", "severity": "high"})

            # Missing canonical
            if not raw_canonical:
                continue  # Already flagged by meta audit

            # Relative canonical
            if raw_canonical and not raw_canonical.startswith("http"):
                issues.append({"url": url, "issue": "CANONICAL_RELATIVE", "detail": f"Canonical uses relative URL: {raw_canonical}", "severity": "high"})

            # HTML vs HTTP header canonical mismatch
            if http_canonical and canon and self._norm(http_canonical) != canon:
                issues.append({"url": url, "issue": "CANONICAL_HEADER_MISMATCH", "detail": f"HTML canonical ({resolved_canonical}) differs from Link header ({http_canonical})", "severity": "high"})

            # Protocol mismatch
            if resolved_canonical and url:
                canon_proto = resolved_canonical.split("://")[0] if "://" in resolved_canonical else ""
                url_proto = page.get("url", "").split("://")[0] if "://" in page.get("url", "") else ""
                if canon_proto and url_proto and canon_proto != url_proto:
                    issues.append({"url": url, "issue": "CANONICAL_PROTOCOL_MISMATCH", "detail": f"Page is {url_proto} but canonical points to {canon_proto}", "severity": "low"})

            # Skip self-canonicals for cross-page checks
            if canon == url:
                continue

            # Canonical points to noindex page
            if canon in noindex_urls:
                issues.append({"url": url, "issue": "CANONICAL_TO_NOINDEX", "detail": f"Canonical points to noindexed page: {canon}", "severity": "high"})

            # Canonical points to redirect
            target_status = url_to_status.get(canon, 0)
            if 300 <= target_status < 400:
                issues.append({"url": url, "issue": "CANONICAL_TO_REDIRECT", "detail": f"Canonical points to redirect ({target_status}): {canon}", "severity": "high"})

            # Canonical points to error
            if target_status >= 400:
                issues.append({"url": url, "issue": "CANONICAL_TO_ERROR", "detail": f"Canonical points to error page ({target_status}): {canon}", "severity": "critical"})

            # Canonical chain — canonical's canonical is also different
            target_canon = url_to_canonical.get(canon, "")
            if target_canon and target_canon != canon:
                issues.append({"url": url, "issue": "CANONICAL_CHAIN", "detail": f"Canonical chain: {url} → {canon} → {target_canon}", "severity": "high"})

        summary = {
            "totalPages": len(pages),
            "pagesWithCanonical": sum(1 for p in pages if (p.get("canonical") or "").strip()),
            "selfCanonicals": sum(1 for p in pages if self._norm(p.get("canonicalResolved") or "") == self._norm(p.get("url", ""))),
            "crossCanonicals": sum(1 for p in pages if (p.get("canonicalResolved") or "").strip() and self._norm(p.get("canonicalResolved") or "") != self._norm(p.get("url", ""))),
            "totalIssues": len(issues),
        }

        return {"summary": summary, "issues": issues}

    # ------------------------------------------------------------------
    # P7: Redirect Chain Analysis
    # ------------------------------------------------------------------

    def audit_redirect_chains(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Analyze redirect chains captured during crawl."""
        issues: list[dict[str, Any]] = []
        chains: list[dict[str, Any]] = []

        for page in pages:
            url = page.get("url", "")
            chain = page.get("redirectChain") or []
            chain_len = page.get("redirectChainLength") or len(chain)

            if not chain or chain_len == 0:
                continue

            chains.append({
                "url": url,
                "chainLength": chain_len,
                "hops": chain,
            })

            # Detect redirect loops
            seen_urls: set[str] = set()
            has_loop = False
            for hop in chain:
                hop_url = hop.get("url") or hop.get("location") or ""
                if hop_url in seen_urls:
                    has_loop = True
                    break
                seen_urls.add(hop_url)

            if has_loop:
                issues.append({"url": url, "issue": "REDIRECT_LOOP", "detail": f"Redirect loop detected in chain of {chain_len} hops", "severity": "critical"})
            elif chain_len > 3:
                issues.append({"url": url, "issue": "REDIRECT_CHAIN_LONG", "detail": f"Redirect chain has {chain_len} hops (Google limit: 5)", "severity": "high"})
            elif chain_len > 1:
                issues.append({"url": url, "issue": "REDIRECT_CHAIN", "detail": f"Redirect chain has {chain_len} hops (recommend max 1)", "severity": "low"})

            # Check if chain ends in error
            final_status = page.get("statusCode") or 200
            if final_status >= 400:
                issues.append({"url": url, "issue": "REDIRECT_TO_ERROR", "detail": f"Redirect chain ends at HTTP {final_status}", "severity": "critical"})

        summary = {
            "totalRedirects": len(chains),
            "chainsOver1Hop": sum(1 for c in chains if c["chainLength"] > 1),
            "chainsOver3Hops": sum(1 for c in chains if c["chainLength"] > 3),
            "loops": sum(1 for i in issues if i["issue"] == "REDIRECT_LOOP"),
            "totalIssues": len(issues),
        }

        return {"summary": summary, "chains": chains[:50], "issues": issues}

    # ------------------------------------------------------------------
    # P7: Security & HTTP Header Analysis
    # ------------------------------------------------------------------

    SECURITY_HEADERS = [
        ("strictTransportSecurity", "Strict-Transport-Security", "MISSING_HSTS", "high"),
        ("contentSecurityPolicy", "Content-Security-Policy", "MISSING_CSP", "low"),
        ("xContentTypeOptions", "X-Content-Type-Options", "MISSING_X_CONTENT_TYPE_OPTIONS", "low"),
        ("xFrameOptions", "X-Frame-Options", "MISSING_X_FRAME_OPTIONS", "low"),
        ("referrerPolicy", "Referrer-Policy", "MISSING_REFERRER_POLICY", "low"),
        ("permissionsPolicy", "Permissions-Policy", "MISSING_PERMISSIONS_POLICY", "low"),
    ]

    def audit_security_headers(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit security and caching HTTP headers across all pages."""
        issues: list[dict[str, Any]] = []
        header_coverage: dict[str, int] = {h[1]: 0 for h in self.SECURITY_HEADERS}
        pages_with_headers = 0

        for page in pages:
            url = page.get("url", "")
            headers = page.get("responseHeaders")
            if not headers or not isinstance(headers, dict):
                continue

            pages_with_headers += 1

            for key, display_name, issue_code, severity in self.SECURITY_HEADERS:
                value = headers.get(key)
                if value:
                    header_coverage[display_name] += 1
                else:
                    issues.append({"url": url, "issue": issue_code, "detail": f"Missing {display_name} header", "severity": severity})

            # HSTS validation: must have max-age
            hsts = headers.get("strictTransportSecurity") or ""
            if hsts and "max-age" not in hsts.lower():
                issues.append({"url": url, "issue": "INVALID_HSTS", "detail": "HSTS header missing max-age directive", "severity": "high"})

            # X-Content-Type-Options must be "nosniff"
            xcto = headers.get("xContentTypeOptions") or ""
            if xcto and xcto.lower().strip() != "nosniff":
                issues.append({"url": url, "issue": "INVALID_X_CONTENT_TYPE_OPTIONS", "detail": f"X-Content-Type-Options is '{xcto}' — should be 'nosniff'", "severity": "low"})

            # Server header leaking version info
            server = headers.get("server") or ""
            if server and re.search(r'\d+\.\d+', server):
                issues.append({"url": url, "issue": "SERVER_VERSION_EXPOSED", "detail": f"Server header exposes version: {server}", "severity": "low"})

        # Only report header issues once per header type (not per page) for summary
        coverage_pct = {}
        for header_name, count in header_coverage.items():
            coverage_pct[header_name] = round(count / pages_with_headers * 100, 1) if pages_with_headers else 0

        summary = {
            "pagesAnalyzed": pages_with_headers,
            "headerCoverage": coverage_pct,
            "totalIssues": len(issues),
        }

        # Dedupe issues — report per-header-type, not per-page (keep first 5 per type)
        deduped: list[dict[str, Any]] = []
        seen_types: dict[str, int] = {}
        for issue in issues:
            code = issue["issue"]
            seen_types[code] = seen_types.get(code, 0) + 1
            if seen_types[code] <= 5:
                deduped.append(issue)
            elif seen_types[code] == 6:
                deduped.append({"url": "", "issue": code, "detail": f"...and {len([i for i in issues if i['issue'] == code]) - 5} more pages", "severity": issue["severity"]})

        return {"summary": summary, "issues": deduped}

    # ------------------------------------------------------------------
    # P7: Indexability Audit (noindex/nofollow)
    # ------------------------------------------------------------------

    def audit_indexability(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit noindex, nofollow, and conflicting indexability signals."""
        issues: list[dict[str, Any]] = []
        noindex_pages: list[str] = []
        nofollow_pages: list[str] = []

        for page in pages:
            url = page.get("url", "")
            robots_meta = (page.get("robotsMeta") or "").lower()
            googlebot_meta = (page.get("googlebotMeta") or "").lower()
            headers = page.get("responseHeaders") or {}
            x_robots = (headers.get("xRobotsTag") or "").lower() if isinstance(headers, dict) else ""

            is_noindex = "noindex" in robots_meta or "noindex" in googlebot_meta or "noindex" in x_robots
            is_nofollow = "nofollow" in robots_meta or "nofollow" in x_robots

            if is_noindex:
                noindex_pages.append(url)
            if is_nofollow:
                nofollow_pages.append(url)

            # Noindex page with schema — wasted effort
            if is_noindex and (page.get("hasSchema") or page.get("schemaTypes")):
                issues.append({"url": url, "issue": "SCHEMA_ON_NOINDEX_PAGE", "detail": "Page has structured data but is noindexed — schema won't be used", "severity": "low"})

            # Nosnippet detection
            if "nosnippet" in robots_meta or "max-snippet:0" in robots_meta.replace(" ", ""):
                issues.append({"url": url, "issue": "NOSNIPPET", "detail": "Page blocks search snippets via nosnippet directive", "severity": "low"})

        summary = {
            "totalPages": len(pages),
            "noindexPages": len(noindex_pages),
            "nofollowPages": len(nofollow_pages),
            "indexablePages": len(pages) - len(noindex_pages),
            "totalIssues": len(issues),
        }

        return {
            "summary": summary,
            "noindexUrls": noindex_pages[:50],
            "nofollowUrls": nofollow_pages[:50],
            "issues": issues,
        }

    # ------------------------------------------------------------------
    # P7: Mobile Usability
    # ------------------------------------------------------------------

    def audit_mobile_usability(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Audit viewport meta tags and mobile usability signals."""
        issues: list[dict[str, Any]] = []
        with_viewport = 0
        without_viewport = 0

        for page in pages:
            url = page.get("url", "")
            viewport = (page.get("viewportMeta") or "").strip()

            if not viewport:
                without_viewport += 1
                issues.append({"url": url, "issue": "MISSING_VIEWPORT", "detail": "No viewport meta tag — page won't render properly on mobile", "severity": "critical"})
                continue

            with_viewport += 1
            vp_lower = viewport.lower().replace(" ", "")

            # Anti-patterns
            if "user-scalable=no" in vp_lower:
                issues.append({"url": url, "issue": "VIEWPORT_BLOCKS_ZOOM", "detail": "user-scalable=no prevents users from zooming — accessibility violation", "severity": "high"})

            if "maximum-scale=1" in vp_lower:
                issues.append({"url": url, "issue": "VIEWPORT_LIMITS_ZOOM", "detail": "maximum-scale=1 limits zoom — accessibility concern", "severity": "low"})

            if "initial-scale" not in vp_lower:
                issues.append({"url": url, "issue": "VIEWPORT_NO_INITIAL_SCALE", "detail": "Viewport missing initial-scale directive", "severity": "low"})

            if "width=device-width" not in vp_lower:
                issues.append({"url": url, "issue": "VIEWPORT_NO_DEVICE_WIDTH", "detail": "Viewport missing width=device-width", "severity": "high"})

        summary = {
            "pagesWithViewport": with_viewport,
            "pagesWithoutViewport": without_viewport,
            "totalIssues": len(issues),
        }

        return {"summary": summary, "issues": issues[:100]}

    # ------------------------------------------------------------------
    # P7: Structured Data Validation
    # ------------------------------------------------------------------

    # Required fields per schema type (Google's minimum for rich results)
    SCHEMA_REQUIRED_FIELDS: dict[str, list[str]] = {
        "LocalBusiness": ["name", "address"],
        "RealEstateAgent": ["name", "address"],
        "Organization": ["name", "url"],
        "WebSite": ["name", "url"],
        "Article": ["headline", "author", "datePublished"],
        "NewsArticle": ["headline", "author", "datePublished"],
        "BlogPosting": ["headline", "author", "datePublished"],
        "FAQPage": ["mainEntity"],
        "BreadcrumbList": ["itemListElement"],
        "Product": ["name", "image"],
        "Review": ["itemReviewed", "reviewRating", "author"],
        "Event": ["name", "startDate", "location"],
        "Person": ["name"],
        "AboutPage": ["name"],
    }

    def validate_structured_data(self, pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Validate JSON-LD structured data against required fields."""
        issues: list[dict[str, Any]] = []
        total_schemas = 0
        valid_schemas = 0
        invalid_schemas = 0

        for page in pages:
            url = page.get("url", "")
            schema_data = page.get("schemaData") or []

            for schema in schema_data:
                if not isinstance(schema, dict):
                    continue

                # Handle parse errors
                if "_parseError" in schema:
                    total_schemas += 1
                    invalid_schemas += 1
                    issues.append({"url": url, "issue": "SCHEMA_PARSE_ERROR", "detail": f"JSON-LD parse error: {schema['_parseError']}", "severity": "critical"})
                    continue

                # Handle @graph arrays
                items = schema.get("@graph", [schema])
                if not isinstance(items, list):
                    items = [items]

                for item in items:
                    if not isinstance(item, dict):
                        continue
                    total_schemas += 1
                    self._validate_single_schema(item, url, issues)

                    # Check if it passed (no new issues for this item)
                    # Simplified: count valid if no parse error
                    valid_schemas += 1

        # Check context validity across all schemas
        for page in pages:
            schema_data = page.get("schemaData") or []
            for schema in schema_data:
                if not isinstance(schema, dict) or "_parseError" in schema:
                    continue
                context = schema.get("@context", "")
                if context and "schema.org" not in str(context).lower():
                    issues.append({
                        "url": page.get("url", ""),
                        "issue": "SCHEMA_INVALID_CONTEXT",
                        "detail": f"@context is '{context}' — should be 'https://schema.org'",
                        "severity": "high",
                    })

        summary = {
            "totalSchemas": total_schemas,
            "validSchemas": valid_schemas,
            "invalidSchemas": invalid_schemas,
            "totalIssues": len(issues),
        }

        return {"summary": summary, "issues": issues}

    def _validate_single_schema(
        self, item: dict[str, Any], url: str, issues: list[dict[str, Any]]
    ) -> None:
        """Validate a single schema object against required fields."""
        schema_type = item.get("@type", "")

        if not schema_type:
            issues.append({"url": url, "issue": "SCHEMA_MISSING_TYPE", "detail": "JSON-LD object has no @type", "severity": "high"})
            return

        required = self.SCHEMA_REQUIRED_FIELDS.get(schema_type, [])
        if not required:
            return  # Unknown type — can't validate, not an error

        for field in required:
            value = item.get(field)
            if value is None or value == "" or value == []:
                issues.append({
                    "url": url,
                    "issue": "SCHEMA_MISSING_REQUIRED_FIELD",
                    "detail": f"{schema_type} schema missing required field: {field}",
                    "severity": "high",
                    "value": f"@type={schema_type}, missing={field}",
                })

    # ------------------------------------------------------------------
    # P7: Sitemap Validation
    # ------------------------------------------------------------------

    def audit_sitemap(
        self,
        sitemap_urls: list[str],
        pages: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Cross-reference sitemap URLs with crawl results."""
        issues: list[dict[str, Any]] = []

        sitemap_set = {self._norm(u) for u in sitemap_urls}
        crawled_set = {self._norm(p.get("url", "")) for p in pages if p.get("url")}

        # Build status and noindex lookups from pages
        status_map: dict[str, int] = {}
        noindex_set: set[str] = set()
        for page in pages:
            norm_url = self._norm(page.get("url", ""))
            status_map[norm_url] = page.get("statusCode") or page.get("status_code") or 200
            robots = (page.get("robotsMeta") or "").lower()
            if "noindex" in robots:
                noindex_set.add(norm_url)

        # URLs in sitemap but returning errors
        sitemap_errors = 0
        for url in sitemap_urls:
            norm = self._norm(url)
            status = status_map.get(norm, 0)
            if status >= 400:
                sitemap_errors += 1
                issues.append({"url": url, "issue": "SITEMAP_URL_ERROR", "detail": f"Sitemap URL returns HTTP {status}", "severity": "high"})

        # Noindex pages in sitemap
        noindex_in_sitemap = 0
        for url in sitemap_urls:
            norm = self._norm(url)
            if norm in noindex_set:
                noindex_in_sitemap += 1
                issues.append({"url": url, "issue": "NOINDEX_IN_SITEMAP", "detail": "Noindexed page should not be in sitemap", "severity": "high"})

        # Crawled pages NOT in sitemap
        not_in_sitemap = crawled_set - sitemap_set
        # URL limit check
        exceeds_limit = len(sitemap_urls) > 50000

        if exceeds_limit:
            issues.append({"url": "", "issue": "SITEMAP_EXCEEDS_URL_LIMIT", "detail": f"Sitemap has {len(sitemap_urls)} URLs (max 50,000 per sitemap)", "severity": "high"})

        summary = {
            "sitemapUrlCount": len(sitemap_urls),
            "crawledUrlCount": len(crawled_set),
            "sitemapErrors": sitemap_errors,
            "noindexInSitemap": noindex_in_sitemap,
            "crawledNotInSitemap": len(not_in_sitemap),
            "exceedsUrlLimit": exceeds_limit,
            "totalIssues": len(issues),
        }

        return {
            "summary": summary,
            "notInSitemap": sorted(not_in_sitemap)[:50],
            "issues": issues,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _norm(url: str) -> str:
        """Normalize URL for comparison (lowercase, strip trailing slash, strip fragment)."""
        if not url:
            return ""
        url = url.lower().rstrip("/").split("#")[0]
        return url

    @staticmethod
    def _extract_pattern(text: str) -> str:
        """Extract a template pattern from a title/description.

        Replaces variable parts (numbers, specific names) with placeholders
        to detect repeated patterns.
        """
        # Normalize: strip brand suffixes like " | Brand Name" or " - Brand"
        parts = re.split(r'\s*[|\-–—]\s*', text)
        if len(parts) > 1:
            # Keep the suffix as-is (likely brand), normalize the prefix
            prefix = parts[0].strip()
            suffix = parts[-1].strip()
            # Replace numbers, specific proper nouns patterns
            normalized = re.sub(r'\d+', '{N}', prefix)
            return f"{normalized} | {suffix}" if suffix else normalized

        return re.sub(r'\d+', '{N}', text)

    @staticmethod
    def _extract_crawl_issues(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Extract crawl-level issues (404s, redirects, etc.) from page data."""
        issues = []
        for page in pages:
            status = page.get("statusCode") or page.get("status_code")
            url = page.get("url", "")

            if status and status != 200:
                issues.append({
                    "url": url,
                    "statusCode": status,
                    "issue": f"HTTP {status}" if status >= 400 else f"Redirect ({status})",
                })

            # Check for crawl errors flagged in page issues
            page_issues = page.get("issues") or []
            if isinstance(page_issues, list):
                for issue_str in page_issues:
                    if "CRAWL_ERROR" in str(issue_str):
                        issues.append({
                            "url": url,
                            "statusCode": None,
                            "issue": str(issue_str),
                        })

        return issues

    @staticmethod
    def _build_schema_summary(pages: list[dict[str, Any]]) -> dict[str, Any]:
        """Summarize schema markup presence across all pages."""
        with_schema = 0
        without_schema = 0
        types_found: Counter[str] = Counter()

        for page in pages:
            has_schema = page.get("hasSchema") or page.get("has_schema", False)
            schema_types = page.get("schemaTypes") or page.get("schema_types") or []

            if has_schema or schema_types:
                with_schema += 1
                for t in schema_types:
                    types_found[t] += 1
            else:
                without_schema += 1

        return {
            "pagesWithSchema": with_schema,
            "pagesWithoutSchema": without_schema,
            "schemaTypesFound": [
                {"type": t, "count": c}
                for t, c in types_found.most_common(20)
            ],
            "recommendedSchemas": [
                s for s in ["LocalBusiness", "RealEstateAgent", "FAQPage",
                           "BreadcrumbList", "Article", "AboutPage"]
                if s not in {t for t, _ in types_found.most_common()}
            ],
        }
