"""SERP Rank Tracker with Historical Comparison.

Tracks keyword positions for client + competitor domains over time,
stores history as JSON, and produces data for Chart.js visualizations.

Research-backed: SerpBear (1,900 stars) flat date→position model,
Google-rank-tracker (298 stars) multi-domain per keyword pattern.

Outputs to ``rankHistory`` key in audit-data.json and persists
to ``rank-history.json`` in the client research directory.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import structlog

from audit_platform.connectors.dataforseo import DataForSEOConnector


class RankTracker:
    """Track keyword positions for client + competitors over time."""

    def __init__(
        self,
        connector: DataForSEOConnector,
        history_path: str | Path,
        client_domain: str,
    ) -> None:
        self.connector = connector
        self.history_path = Path(history_path)
        self.client_domain = self._norm_domain(client_domain)
        self.log = structlog.get_logger(self.__class__.__name__)
        self.history: dict[str, Any] = self._load_history()

    def check_positions(
        self,
        keywords: list[str],
        competitor_domains: list[str] | None = None,
        date: str | None = None,
        label: str | None = None,
        location_code: int = 2840,
        device: str = "desktop",
    ) -> dict[str, Any]:
        """Check SERP positions for all keywords and all domains.

        One API call per keyword (not per domain) — scans results for
        all domains simultaneously.

        Args:
            keywords: Target keywords to check.
            competitor_domains: Competitor domains to track alongside client.
            date: Snapshot date (YYYY-MM-DD). Defaults to today.
            label: Milestone label (e.g., "Audit Baseline").
            location_code: DataForSEO location code.
            device: "desktop" or "mobile".

        Returns:
            Summary dict with current positions and changes.
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        all_domains = [self.client_domain]
        for d in (competitor_domains or []):
            norm = self._norm_domain(d)
            if norm and norm not in all_domains:
                all_domains.append(norm)

        self.log.info(
            "rank_check_start",
            keywords=len(keywords),
            domains=len(all_domains),
            date=date,
        )

        # Add milestone if labeled
        if label:
            milestones = self.history.setdefault("milestones", [])
            # Don't duplicate
            if not any(m["date"] == date for m in milestones):
                milestones.append({"id": label.lower().replace(" ", "-"), "label": label, "date": date})

        kw_data = self.history.setdefault("keywords", {})
        results_summary: list[dict[str, Any]] = []

        for keyword in keywords:
            kw_lower = keyword.strip().lower()
            if not kw_lower:
                continue

            # Fetch SERP once per keyword
            positions = self._fetch_positions(kw_lower, all_domains, location_code, device)

            # Store in history
            kw_entry = kw_data.setdefault(kw_lower, {"positions": {}})
            for domain in all_domains:
                domain_positions = kw_entry["positions"].setdefault(domain, {})
                pos = positions.get(domain)
                domain_positions[date] = pos  # int or None

            # Build summary row
            client_pos = positions.get(self.client_domain)
            prev_date = self._get_previous_date(kw_entry, self.client_domain, date)
            prev_pos = None
            if prev_date:
                prev_pos = kw_entry["positions"].get(self.client_domain, {}).get(prev_date)

            results_summary.append({
                "keyword": kw_lower,
                "clientPosition": client_pos,
                "previousPosition": prev_pos,
                "change": self._compute_change(prev_pos, client_pos),
                "competitorPositions": {
                    d: positions.get(d) for d in all_domains if d != self.client_domain
                },
            })

        # Update meta
        self.history["meta"] = {
            "client_domain": self.client_domain,
            "last_updated": date,
            "total_keywords": len(kw_data),
            "total_snapshots": len(self._get_all_dates()),
        }

        # Save
        self._save_history()

        self.log.info(
            "rank_check_complete",
            keywords_checked=len(results_summary),
            date=date,
        )

        return {
            "date": date,
            "label": label,
            "results": results_summary,
            "summary": self._build_check_summary(results_summary),
        }

    def get_history_for_report(
        self, max_competitors: int = 3
    ) -> dict[str, Any]:
        """Get rank history formatted for the HTML report's Chart.js rendering.

        Returns a structure ready to inject as ``rankHistory`` in audit-data.json.
        """
        kw_data = self.history.get("keywords", {})
        all_dates = sorted(self._get_all_dates())
        milestones = self.history.get("milestones", [])

        # Build milestone label map
        milestone_labels = {}
        for m in milestones:
            milestone_labels[m["date"]] = m["label"]

        # Determine competitor domains to include
        all_competitor_domains: set[str] = set()
        for kw, entry in kw_data.items():
            for domain in entry.get("positions", {}):
                if domain != self.client_domain:
                    all_competitor_domains.add(domain)

        comp_list = sorted(all_competitor_domains)[:max_competitors]

        # Build per-keyword history
        keywords_history: dict[str, Any] = {}
        for kw, entry in kw_data.items():
            positions = entry.get("positions", {})
            history: dict[str, dict[str, Optional[int]]] = {}

            for domain in [self.client_domain] + comp_list:
                domain_history = positions.get(domain, {})
                history[domain] = {d: domain_history.get(d) for d in all_dates}

            keywords_history[kw] = {
                "volume": entry.get("volume"),
                "difficulty": entry.get("difficulty"),
                "history": history,
            }

        # Labels for chart X-axis
        chart_labels = [milestone_labels.get(d, d) for d in all_dates]

        return {
            "snapshots": all_dates,
            "chartLabels": chart_labels,
            "milestoneLabels": milestone_labels,
            "domains": {
                "client": self.client_domain,
                "competitors": comp_list,
            },
            "keywords": keywords_history,
        }

    def compare_snapshots(
        self, date_a: str, date_b: str
    ) -> list[dict[str, Any]]:
        """Compare two snapshots and return per-keyword deltas.

        Args:
            date_a: Earlier date (YYYY-MM-DD).
            date_b: Later date (YYYY-MM-DD).

        Returns:
            List of dicts with keyword, position_a, position_b, change, direction.
        """
        kw_data = self.history.get("keywords", {})
        deltas: list[dict[str, Any]] = []

        for kw, entry in kw_data.items():
            client_positions = entry.get("positions", {}).get(self.client_domain, {})
            pos_a = client_positions.get(date_a)
            pos_b = client_positions.get(date_b)

            change_info = self._compute_change(pos_a, pos_b)

            deltas.append({
                "keyword": kw,
                "positionA": pos_a,
                "positionB": pos_b,
                "dateA": date_a,
                "dateB": date_b,
                **change_info,
            })

        # Sort: biggest improvements first
        deltas.sort(key=lambda d: d.get("delta", 0), reverse=True)
        return deltas

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _fetch_positions(
        self,
        keyword: str,
        domains: list[str],
        location_code: int,
        device: str,
    ) -> dict[str, Optional[int]]:
        """Fetch SERP for one keyword, extract positions for all domains."""
        positions: dict[str, Optional[int]] = {d: None for d in domains}

        try:
            serp_items = self.connector.get_serp(
                keyword,
                location_code=location_code,
                device=device,
                depth=100,
            )

            for item in serp_items:
                item_domain = self._norm_domain(item.get("domain", ""))
                rank = item.get("rank_group") or item.get("rank_absolute")

                if item_domain in positions and rank is not None:
                    # Keep the best (lowest) rank if domain appears multiple times
                    current = positions[item_domain]
                    if current is None or rank < current:
                        positions[item_domain] = int(rank)

        except Exception as exc:
            self.log.warning("serp_fetch_failed", keyword=keyword, error=str(exc))

        return positions

    @staticmethod
    def _compute_change(
        old_pos: Optional[int], new_pos: Optional[int]
    ) -> dict[str, Any]:
        """Compute position change with direction label."""
        if old_pos is None and new_pos is None:
            return {"delta": 0, "direction": "unchanged", "label": "Not ranking"}
        if old_pos is None and new_pos is not None:
            return {"delta": new_pos, "direction": "new", "label": f"New entry at #{new_pos}"}
        if old_pos is not None and new_pos is None:
            return {"delta": 0, "direction": "lost", "label": "Lost ranking"}

        delta = old_pos - new_pos  # Positive = improved (moved toward #1)
        if delta > 0:
            return {"delta": delta, "direction": "improved", "label": f"Improved {delta} positions"}
        elif delta < 0:
            return {"delta": delta, "direction": "declined", "label": f"Declined {abs(delta)} positions"}
        else:
            return {"delta": 0, "direction": "unchanged", "label": "No change"}

    def _get_previous_date(
        self, kw_entry: dict, domain: str, current_date: str
    ) -> Optional[str]:
        """Get the most recent date before current_date for a domain."""
        positions = kw_entry.get("positions", {}).get(domain, {})
        dates = sorted(d for d in positions if d < current_date)
        return dates[-1] if dates else None

    def _get_all_dates(self) -> set[str]:
        """Get all unique dates across all keywords and domains."""
        dates: set[str] = set()
        for kw_entry in self.history.get("keywords", {}).values():
            for domain_positions in kw_entry.get("positions", {}).values():
                dates.update(domain_positions.keys())
        return dates

    def _build_check_summary(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """Build a summary of the rank check results."""
        ranking = sum(1 for r in results if r["clientPosition"] is not None)
        not_ranking = sum(1 for r in results if r["clientPosition"] is None)
        top_10 = sum(1 for r in results if r["clientPosition"] is not None and r["clientPosition"] <= 10)
        top_3 = sum(1 for r in results if r["clientPosition"] is not None and r["clientPosition"] <= 3)
        improved = sum(1 for r in results if r["change"].get("direction") == "improved")
        declined = sum(1 for r in results if r["change"].get("direction") == "declined")

        positions = [r["clientPosition"] for r in results if r["clientPosition"] is not None]
        avg_position = round(sum(positions) / len(positions), 1) if positions else None

        return {
            "totalKeywords": len(results),
            "ranking": ranking,
            "notRanking": not_ranking,
            "top3": top_3,
            "top10": top_10,
            "improved": improved,
            "declined": declined,
            "avgPosition": avg_position,
        }

    def _load_history(self) -> dict[str, Any]:
        """Load rank history from JSON file."""
        if self.history_path.exists():
            try:
                with open(self.history_path) as f:
                    return json.load(f)
            except Exception:
                pass
        return {"meta": {}, "milestones": [], "keywords": {}}

    def _save_history(self) -> None:
        """Save rank history to JSON file (atomic write)."""
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.history_path.with_suffix(".tmp")
        try:
            with open(tmp_path, "w") as f:
                json.dump(self.history, f, indent=2, default=str)
            os.replace(str(tmp_path), str(self.history_path))
        except Exception as exc:
            self.log.warning("history_save_failed", error=str(exc))

    @staticmethod
    def _norm_domain(domain: str) -> str:
        """Normalize domain for comparison."""
        if not domain:
            return ""
        domain = domain.lower().strip()
        if "://" in domain:
            from urllib.parse import urlparse
            domain = urlparse(domain).hostname or domain
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
