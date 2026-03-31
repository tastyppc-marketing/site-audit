"""PPC Audit Analyzer (P11).

Comprehensive Google Ads account audit: campaign structure, search term
analysis with n-gram mining, Quality Score audit, wasted spend detection,
budget/bidding analysis, and auto-generated recommendations.

Research-backed: claude-ads (1,200 stars, 190+ checks), BrainlabsDigital
n-gram mining, Brad Geddes QS methodology.

Outputs to ``ppcAudit`` key in ppc-audit-data.json.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from itertools import islice
from typing import Any, Optional

import structlog


class PPCAnalyzer:
    """Comprehensive PPC/Google Ads audit analyzer."""

    # ------------------------------------------------------------------
    # Thresholds (derived from claude-ads + industry standards)
    # ------------------------------------------------------------------

    # Quality Score
    QS_PASS: float = 7.0
    QS_WARN: float = 5.0
    QS_FAIL_PCT: float = 0.25  # >25% keywords QS ≤ 3 = fail
    QS_BELOW_AVG_FAIL: float = 0.35  # >35% "Below Average" = fail

    # Wasted spend
    ZERO_CONV_CLICK_THRESHOLD: int = 100
    CPA_MULTIPLE_THRESHOLD: float = 3.0  # 3x target CPA = overspending
    WASTED_SPEND_PASS: float = 0.05  # <5% = pass
    WASTED_SPEND_FAIL: float = 0.15  # >15% = fail

    # Structure
    AD_GROUP_KW_PASS: int = 10
    AD_GROUP_KW_WARN: int = 20

    # N-gram analysis
    NGRAM_MIN_IMPRESSIONS: int = 50
    NGRAM_MIN_COST: float = 5.0
    NGRAM_SIZES: list[int] = [1, 2, 3]

    # Scoring (claude-ads pattern)
    SEVERITY_WEIGHTS: dict[str, float] = {
        "critical": 5.0, "high": 3.0, "medium": 1.5, "low": 0.5,
    }
    CATEGORY_WEIGHTS: dict[str, float] = {
        "conversion_tracking": 0.25,
        "wasted_spend": 0.20,
        "structure": 0.15,
        "quality_score": 0.15,
        "ads_assets": 0.15,
        "settings": 0.10,
    }

    GRADE_THRESHOLDS = [
        (90, "A"), (75, "B"), (60, "C"), (40, "D"),
    ]

    # Smart bidding strategies
    SMART_BIDDING = frozenset({
        "MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE",
        "TARGET_CPA", "TARGET_ROAS",
    })

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze(
        self,
        campaigns: list[dict[str, Any]] | None = None,
        ad_groups: list[dict[str, Any]] | None = None,
        keywords: list[dict[str, Any]] | None = None,
        search_terms: list[dict[str, Any]] | None = None,
        target_cpa: float | None = None,
    ) -> dict[str, Any]:
        """Run full PPC audit.

        Args:
            campaigns: Campaign records from Google Ads connector.
            ad_groups: Ad group records.
            keywords: Keyword records with QS data.
            search_terms: Search term report records.
            target_cpa: Target CPA (if not provided, computed from data).

        Returns:
            Dict for ``ppcAudit`` key in ppc-audit-data.json.
        """
        campaigns = campaigns or []
        ad_groups = ad_groups or []
        keywords = keywords or []
        search_terms = search_terms or []

        self.log.info(
            "ppc_audit_start",
            campaigns=len(campaigns),
            ad_groups=len(ad_groups),
            keywords=len(keywords),
            search_terms=len(search_terms),
        )

        # Compute target CPA if not provided
        if target_cpa is None:
            target_cpa = self._compute_account_cpa(keywords)

        structure = self._analyze_structure(campaigns, ad_groups, keywords)
        qs_audit = self._analyze_quality_score(keywords)
        wasted = self._analyze_wasted_spend(keywords, search_terms, target_cpa)
        ngram = self._analyze_ngrams(search_terms)
        budget = self._analyze_budget_bidding(campaigns)

        # Collect all checks for scoring
        all_checks = (
            structure.get("checks", []) +
            qs_audit.get("checks", []) +
            wasted.get("checks", []) +
            budget.get("checks", [])
        )
        score = self._compute_account_score(all_checks)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            structure, qs_audit, wasted, ngram, budget
        )

        result = {
            "accountScore": score,
            "structure": structure,
            "qualityScore": qs_audit,
            "wastedSpend": wasted,
            "ngramAnalysis": ngram,
            "budgetBidding": budget,
            "recommendations": recommendations,
        }

        self.log.info(
            "ppc_audit_complete",
            score=score["score"],
            grade=score["grade"],
            recommendations=len(recommendations),
        )

        return result

    # ------------------------------------------------------------------
    # Campaign Structure Analysis
    # ------------------------------------------------------------------

    def _analyze_structure(
        self,
        campaigns: list[dict[str, Any]],
        ad_groups: list[dict[str, Any]],
        keywords: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Audit campaign and ad group structure."""
        checks: list[dict[str, Any]] = []

        # Brand vs non-brand separation
        has_brand_campaign = any(
            "brand" in (c.get("name") or "").lower() for c in campaigns
        )
        checks.append({
            "id": "ST-04", "name": "Brand/non-brand separation",
            "status": "pass" if has_brand_campaign else "fail",
            "severity": "high", "category": "structure",
            "detail": "Brand campaigns separated" if has_brand_campaign else "No dedicated brand campaign found",
        })

        # Ad group keyword count
        ag_kw_counts: dict[str, int] = defaultdict(int)
        for kw in keywords:
            ag_id = kw.get("ad_group_id") or kw.get("adGroupId") or ""
            if ag_id:
                ag_kw_counts[ag_id] += 1

        oversized = sum(1 for c in ag_kw_counts.values() if c > self.AD_GROUP_KW_WARN)
        total_ags = len(ag_kw_counts) or 1
        checks.append({
            "id": "ST-03", "name": "Ad group theming (keyword count)",
            "status": "pass" if oversized == 0 else ("warn" if oversized / total_ags < 0.3 else "fail"),
            "severity": "medium", "category": "structure",
            "detail": f"{oversized} ad groups have >{self.AD_GROUP_KW_WARN} keywords",
        })

        # Duplicate keywords
        kw_texts: Counter[str] = Counter()
        for kw in keywords:
            text = (kw.get("keyword") or kw.get("keyword_text") or "").lower().strip()
            match_type = (kw.get("match_type") or "").upper()
            if text:
                kw_texts[f"{text}|{match_type}"] += 1

        dupes = sum(1 for count in kw_texts.values() if count > 1)
        checks.append({
            "id": "ST-09", "name": "Duplicate keywords",
            "status": "pass" if dupes == 0 else ("warn" if dupes <= 3 else "fail"),
            "severity": "medium", "category": "structure",
            "detail": f"{dupes} duplicate keyword+match type combinations found",
        })

        # Match type distribution
        match_counts: Counter[str] = Counter()
        for kw in keywords:
            mt = (kw.get("match_type") or "UNKNOWN").upper()
            match_counts[mt] += 1

        total_kws = sum(match_counts.values()) or 1
        broad_pct = match_counts.get("BROAD", 0) / total_kws
        checks.append({
            "id": "QS-08", "name": "Match type distribution",
            "status": "pass" if broad_pct < 0.3 else ("warn" if broad_pct < 0.7 else "fail"),
            "severity": "high", "category": "quality_score",
            "detail": f"Match type mix: Exact {match_counts.get('EXACT', 0)}, Phrase {match_counts.get('PHRASE', 0)}, Broad {match_counts.get('BROAD', 0)}",
        })

        # Dead keywords (0 impressions)
        dead = sum(1 for kw in keywords if (kw.get("impressions") or 0) == 0)
        checks.append({
            "id": "ST-08", "name": "Dead keywords (0 impressions)",
            "status": "pass" if dead == 0 else ("warn" if dead <= 5 else "fail"),
            "severity": "low", "category": "structure",
            "detail": f"{dead} keywords with zero impressions",
        })

        return {
            "summary": {
                "totalCampaigns": len(campaigns),
                "totalAdGroups": len(ad_groups),
                "totalKeywords": len(keywords),
                "duplicateKeywords": dupes,
                "deadKeywords": dead,
                "oversizedAdGroups": oversized,
                "matchTypeDistribution": dict(match_counts),
            },
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # Quality Score Audit
    # ------------------------------------------------------------------

    def _analyze_quality_score(
        self, keywords: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Audit Quality Score distribution and sub-components."""
        checks: list[dict[str, Any]] = []

        # Filter to keywords with QS data
        qs_keywords = [
            kw for kw in keywords
            if kw.get("quality_score") is not None
        ]

        if not qs_keywords:
            return {"summary": {"accountQS": 0, "totalWithQS": 0}, "checks": [], "distribution": {}}

        # Impression-weighted QS (Brad Geddes methodology)
        weighted_sum = sum(
            (kw.get("quality_score") or 0) * (kw.get("impressions") or 0)
            for kw in qs_keywords
        )
        total_impressions = sum(kw.get("impressions") or 0 for kw in qs_keywords) or 1
        account_qs = round(weighted_sum / total_impressions, 1)

        checks.append({
            "id": "QS-01", "name": "Account impression-weighted QS",
            "status": "pass" if account_qs >= self.QS_PASS else ("warn" if account_qs >= self.QS_WARN else "fail"),
            "severity": "high", "category": "quality_score",
            "detail": f"Impression-weighted QS: {account_qs}/10",
        })

        # % with QS ≤ 3
        low_qs = sum(1 for kw in qs_keywords if (kw.get("quality_score") or 0) <= 3)
        low_qs_pct = low_qs / len(qs_keywords)
        checks.append({
            "id": "QS-02", "name": "% keywords with QS ≤ 3",
            "status": "pass" if low_qs_pct < 0.10 else ("warn" if low_qs_pct < self.QS_FAIL_PCT else "fail"),
            "severity": "high", "category": "quality_score",
            "detail": f"{round(low_qs_pct * 100, 1)}% of keywords have QS ≤ 3 ({low_qs} keywords)",
        })

        # QS sub-components (if available)
        for field, label, check_id in [
            ("expected_ctr_status", "Expected CTR", "QS-03"),
            ("ad_relevance_status", "Ad Relevance", "QS-04"),
            ("landing_page_exp_status", "Landing Page Experience", "QS-05"),
        ]:
            below = sum(1 for kw in qs_keywords if (kw.get(field) or "").upper() == "BELOW_AVERAGE")
            with_data = sum(1 for kw in qs_keywords if kw.get(field))
            if with_data > 0:
                below_pct = below / with_data
                checks.append({
                    "id": check_id, "name": f'% keywords "Below Average" {label}',
                    "status": "pass" if below_pct < 0.20 else ("warn" if below_pct < self.QS_BELOW_AVG_FAIL else "fail"),
                    "severity": "medium", "category": "quality_score",
                    "detail": f"{round(below_pct * 100, 1)}% Below Average ({below}/{with_data})",
                })

        # Top spenders QS check
        top_spenders = sorted(qs_keywords, key=lambda k: k.get("cost") or 0, reverse=True)[:20]
        top_low_qs = sum(1 for kw in top_spenders if (kw.get("quality_score") or 10) < 7)
        checks.append({
            "id": "QS-06", "name": "Top-20 spender keywords QS ≥ 7",
            "status": "pass" if top_low_qs == 0 else ("warn" if top_low_qs <= 5 else "fail"),
            "severity": "high", "category": "quality_score",
            "detail": f"{top_low_qs} of top-20 spending keywords have QS < 7",
        })

        # Distribution
        dist: Counter[int] = Counter()
        for kw in qs_keywords:
            qs = kw.get("quality_score") or 0
            dist[qs] += 1

        return {
            "summary": {
                "accountQS": account_qs,
                "totalWithQS": len(qs_keywords),
                "lowQSKeywords": low_qs,
                "lowQSPct": round(low_qs_pct * 100, 1),
            },
            "distribution": dict(sorted(dist.items())),
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # Wasted Spend Detection
    # ------------------------------------------------------------------

    def _analyze_wasted_spend(
        self,
        keywords: list[dict[str, Any]],
        search_terms: list[dict[str, Any]],
        target_cpa: float,
    ) -> dict[str, Any]:
        """Detect wasted spend across keywords and search terms."""
        checks: list[dict[str, Any]] = []
        wasted_items: list[dict[str, Any]] = []

        total_cost = sum(kw.get("cost") or 0 for kw in keywords) or 1

        # Zero-conversion keywords with high clicks
        zero_conv_kws = [
            kw for kw in keywords
            if (kw.get("clicks") or 0) >= self.ZERO_CONV_CLICK_THRESHOLD
            and (kw.get("conversions") or 0) == 0
        ]
        zero_conv_cost = sum(kw.get("cost") or 0 for kw in zero_conv_kws)
        checks.append({
            "id": "WS-06", "name": f"Zero-conversion keywords (≥{self.ZERO_CONV_CLICK_THRESHOLD} clicks)",
            "status": "pass" if len(zero_conv_kws) == 0 else ("warn" if len(zero_conv_kws) <= 3 else "fail"),
            "severity": "high", "category": "wasted_spend",
            "detail": f"{len(zero_conv_kws)} keywords, ${zero_conv_cost:.2f} wasted",
        })

        for kw in zero_conv_kws:
            wasted_items.append({
                "type": "zero_conversion_keyword",
                "keyword": kw.get("keyword") or kw.get("keyword_text") or "",
                "cost": kw.get("cost") or 0,
                "clicks": kw.get("clicks") or 0,
                "severity": "high",
            })

        # CPA overspending keywords
        if target_cpa > 0:
            overspend_kws = [
                kw for kw in keywords
                if (kw.get("conversions") or 0) > 0
                and ((kw.get("cost") or 0) / (kw.get("conversions") or 1)) > target_cpa * self.CPA_MULTIPLE_THRESHOLD
            ]
            checks.append({
                "id": "WS-07", "name": f"Keywords with CPA > {self.CPA_MULTIPLE_THRESHOLD}x target",
                "status": "pass" if len(overspend_kws) == 0 else ("warn" if len(overspend_kws) <= 3 else "fail"),
                "severity": "high", "category": "wasted_spend",
                "detail": f"{len(overspend_kws)} keywords overspending (target CPA: ${target_cpa:.2f})",
            })

        # Broad match without smart bidding
        broad_no_smart = []
        campaign_strategies: dict[str, str] = {}
        for kw in keywords:
            cid = kw.get("campaign_id") or ""
            if cid not in campaign_strategies:
                campaign_strategies[cid] = (kw.get("bidding_strategy_type") or "UNKNOWN").upper()

        for kw in keywords:
            mt = (kw.get("match_type") or "").upper()
            cid = kw.get("campaign_id") or ""
            strategy = campaign_strategies.get(cid, "UNKNOWN")
            if mt == "BROAD" and strategy not in self.SMART_BIDDING:
                broad_no_smart.append(kw)

        checks.append({
            "id": "WS-05", "name": "Broad match without smart bidding",
            "status": "pass" if len(broad_no_smart) == 0 else "fail",
            "severity": "critical", "category": "wasted_spend",
            "detail": f"{len(broad_no_smart)} broad match keywords without smart bidding",
        })

        # Total wasted spend estimate
        total_wasted = zero_conv_cost
        wasted_pct = total_wasted / total_cost if total_cost > 0 else 0
        checks.append({
            "id": "WS-04", "name": "% spend on zero-conversion terms",
            "status": "pass" if wasted_pct < self.WASTED_SPEND_PASS else ("warn" if wasted_pct < self.WASTED_SPEND_FAIL else "fail"),
            "severity": "high", "category": "wasted_spend",
            "detail": f"${total_wasted:.2f} wasted ({round(wasted_pct * 100, 1)}% of total spend)",
        })

        return {
            "summary": {
                "totalCost": round(total_cost, 2),
                "wastedCost": round(total_wasted, 2),
                "wastedPct": round(wasted_pct * 100, 1),
                "zeroConvKeywords": len(zero_conv_kws),
                "targetCpa": round(target_cpa, 2),
            },
            "wastedItems": wasted_items[:20],
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # N-gram Search Term Analysis
    # ------------------------------------------------------------------

    def _analyze_ngrams(
        self, search_terms: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Mine search terms for n-gram patterns (BrainlabsDigital method).

        Critical rule: only sum raw counts, compute rates from aggregated totals.
        """
        if not search_terms:
            return {"summary": {"totalTerms": 0}, "topNgrams": [], "negativeCandidates": []}

        aggregates: dict[str, dict[str, float]] = defaultdict(
            lambda: {"impressions": 0, "clicks": 0, "cost": 0.0, "conversions": 0.0}
        )

        for st in search_terms:
            term = (st.get("search_term") or st.get("query") or "").lower().strip()
            if not term:
                continue

            seen: set[str] = set()
            for n in self.NGRAM_SIZES:
                for gram in self._extract_ngrams(term, n):
                    if gram not in seen:
                        seen.add(gram)
                        agg = aggregates[gram]
                        agg["impressions"] += st.get("impressions") or 0
                        agg["clicks"] += st.get("clicks") or 0
                        agg["cost"] += st.get("cost") or 0
                        agg["conversions"] += st.get("conversions") or 0

        # Compute rates and filter
        results: list[dict[str, Any]] = []
        for gram, agg in aggregates.items():
            if agg["impressions"] < self.NGRAM_MIN_IMPRESSIONS:
                continue
            if agg["cost"] < self.NGRAM_MIN_COST:
                continue

            imps = agg["impressions"] or 1
            clicks = agg["clicks"] or 1
            ctr = agg["clicks"] / imps
            cvr = agg["conversions"] / clicks if agg["clicks"] else 0
            cpa = agg["cost"] / agg["conversions"] if agg["conversions"] else float("inf")

            results.append({
                "ngram": gram,
                "wordCount": len(gram.split()),
                "impressions": agg["impressions"],
                "clicks": int(agg["clicks"]),
                "cost": round(agg["cost"], 2),
                "conversions": round(agg["conversions"], 1),
                "ctr": round(ctr * 100, 2),
                "cvr": round(cvr * 100, 2),
                "cpa": round(cpa, 2) if cpa != float("inf") else None,
            })

        # Sort by cost descending
        results.sort(key=lambda x: x["cost"], reverse=True)

        # Identify negative keyword candidates
        negative_candidates: list[dict[str, Any]] = []
        for r in results:
            if r["conversions"] == 0 and r["cost"] >= self.NGRAM_MIN_COST * 2:
                match_type = "exact" if r["wordCount"] == 1 else "phrase"
                negative_candidates.append({
                    "ngram": r["ngram"],
                    "cost": r["cost"],
                    "clicks": r["clicks"],
                    "recommendedMatchType": match_type,
                    "reason": f"Zero conversions, ${r['cost']:.2f} spent",
                })

        return {
            "summary": {
                "totalTerms": len(search_terms),
                "totalNgrams": len(results),
                "negativeCandidates": len(negative_candidates),
            },
            "topNgrams": results[:50],
            "negativeCandidates": negative_candidates[:25],
        }

    # ------------------------------------------------------------------
    # Budget & Bidding Analysis
    # ------------------------------------------------------------------

    def _analyze_budget_bidding(
        self, campaigns: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Analyze budget pacing and bidding strategy usage."""
        checks: list[dict[str, Any]] = []

        if not campaigns:
            return {"summary": {}, "checks": []}

        # Bidding strategy distribution
        strategies: Counter[str] = Counter()
        for c in campaigns:
            strategy = (c.get("bidding_strategy_type") or c.get("biddingStrategy") or "UNKNOWN").upper()
            strategies[strategy] += 1

        # Smart bidding adoption
        smart_count = sum(strategies.get(s, 0) for s in self.SMART_BIDDING)
        manual_count = strategies.get("MANUAL_CPC", 0) + strategies.get("MANUAL_CPM", 0)

        checks.append({
            "id": "SE-07", "name": "Smart bidding adoption",
            "status": "pass" if manual_count == 0 else ("warn" if smart_count > manual_count else "fail"),
            "severity": "high", "category": "settings",
            "detail": f"Smart bidding: {smart_count} campaigns, Manual: {manual_count} campaigns",
        })

        # Impression share (if available)
        campaigns_with_is = [c for c in campaigns if c.get("search_impression_share") is not None]
        if campaigns_with_is:
            avg_is = sum(c.get("search_impression_share") or 0 for c in campaigns_with_is) / len(campaigns_with_is)
            checks.append({
                "id": "QS-09", "name": "Average Search Impression Share",
                "status": "pass" if avg_is > 0.80 else ("warn" if avg_is > 0.50 else "fail"),
                "severity": "medium", "category": "quality_score",
                "detail": f"Average IS: {round(avg_is * 100, 1)}%",
            })

        return {
            "summary": {
                "totalCampaigns": len(campaigns),
                "biddingStrategies": dict(strategies),
                "smartBiddingCount": smart_count,
                "manualCount": manual_count,
            },
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # Account Score (claude-ads weighted scoring)
    # ------------------------------------------------------------------

    def _compute_account_score(
        self, checks: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Compute weighted account health score.

        Formula: S = Σ(passed × severity_weight × category_weight) /
                     Σ(total × severity_weight × category_weight) × 100
        """
        if not checks:
            return {"score": 0, "grade": "F", "checksPassed": 0, "checksFailed": 0, "checksWarned": 0}

        weighted_pass = 0.0
        weighted_total = 0.0
        passed = 0
        failed = 0
        warned = 0

        for check in checks:
            sev = check.get("severity", "medium")
            cat = check.get("category", "structure")
            status = check.get("status", "fail")

            sev_w = self.SEVERITY_WEIGHTS.get(sev, 1.5)
            cat_w = self.CATEGORY_WEIGHTS.get(cat, 0.10)
            weight = sev_w * cat_w

            weighted_total += weight
            if status == "pass":
                weighted_pass += weight
                passed += 1
            elif status == "warn":
                weighted_pass += weight * 0.5  # Half credit for warnings
                warned += 1
            else:
                failed += 1

        score = round((weighted_pass / weighted_total) * 100) if weighted_total > 0 else 0

        grade = "F"
        for threshold, g in self.GRADE_THRESHOLDS:
            if score >= threshold:
                grade = g
                break

        return {
            "score": score,
            "grade": grade,
            "checksPassed": passed,
            "checksFailed": failed,
            "checksWarned": warned,
            "totalChecks": len(checks),
        }

    # ------------------------------------------------------------------
    # Recommendations Generator
    # ------------------------------------------------------------------

    def _generate_recommendations(
        self,
        structure: dict[str, Any],
        qs_audit: dict[str, Any],
        wasted: dict[str, Any],
        ngram: dict[str, Any],
        budget: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """Generate prioritized recommendations from all audit checks."""
        recs: list[dict[str, Any]] = []

        # Collect all failed/warned checks
        all_checks = (
            structure.get("checks", []) +
            qs_audit.get("checks", []) +
            wasted.get("checks", []) +
            budget.get("checks", [])
        )

        for check in all_checks:
            if check.get("status") in ("fail", "warn"):
                priority = self.SEVERITY_WEIGHTS.get(check.get("severity", "medium"), 1.5) * 20
                recs.append({
                    "checkId": check.get("id", ""),
                    "name": check.get("name", ""),
                    "detail": check.get("detail", ""),
                    "severity": check.get("severity", "medium"),
                    "category": check.get("category", ""),
                    "priority": round(priority),
                })

        # Add negative keyword recommendations from n-gram analysis
        for neg in (ngram.get("negativeCandidates") or [])[:5]:
            recs.append({
                "checkId": "WS-09",
                "name": f"Add negative keyword: [{neg['ngram']}]",
                "detail": f"{neg['reason']} — recommend {neg['recommendedMatchType']} match",
                "severity": "medium",
                "category": "wasted_spend",
                "priority": 30,
            })

        recs.sort(key=lambda r: r["priority"], reverse=True)
        return recs[:30]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_ngrams(text: str, n: int) -> list[str]:
        """Extract n-grams from a text string."""
        tokens = text.lower().split()
        if len(tokens) < n:
            return []
        return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]

    @staticmethod
    def _compute_account_cpa(keywords: list[dict[str, Any]]) -> float:
        """Compute account-level CPA from keyword data."""
        total_cost = sum(kw.get("cost") or 0 for kw in keywords)
        total_conv = sum(kw.get("conversions") or 0 for kw in keywords)
        if total_conv > 0:
            return total_cost / total_conv
        return 50.0  # Default fallback
