"""Tests for RankTracker."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from audit_platform.analyzers.rank_tracker import RankTracker


@pytest.fixture()
def mock_connector():
    connector = MagicMock()
    connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 1, "domain": "zillow.com", "url": "https://zillow.com/page"},
        {"type": "organic", "rank_group": 3, "domain": "redfin.com", "url": "https://redfin.com/page"},
        {"type": "organic", "rank_group": 7, "domain": "example.com", "url": "https://example.com/homes"},
        {"type": "organic", "rank_group": 12, "domain": "competitor1.com", "url": "https://competitor1.com/page"},
    ]
    return connector


@pytest.fixture()
def tracker(mock_connector, tmp_path):
    history_path = tmp_path / "rank-history.json"
    return RankTracker(mock_connector, history_path, "example.com")


# --- Position Check Tests ---

def test_check_positions_basic(tracker):
    result = tracker.check_positions(
        keywords=["homes for sale"],
        competitor_domains=["competitor1.com"],
        date="2026-03-24",
        label="Baseline",
    )
    assert result["date"] == "2026-03-24"
    assert len(result["results"]) == 1
    assert result["results"][0]["clientPosition"] == 7
    assert result["results"][0]["competitorPositions"]["competitor1.com"] == 12


def test_check_positions_not_found(mock_connector, tmp_path):
    mock_connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 1, "domain": "zillow.com"},
    ]
    tracker = RankTracker(mock_connector, tmp_path / "h.json", "notfound.com")
    result = tracker.check_positions(keywords=["test"], date="2026-03-24")
    assert result["results"][0]["clientPosition"] is None


def test_check_positions_stores_null_not_zero(tracker):
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 1, "domain": "other.com"},
    ]
    tracker.check_positions(keywords=["test kw"], competitor_domains=["missing.com"], date="2026-03-24")
    kw_data = tracker.history["keywords"]["test kw"]["positions"]
    assert kw_data["example.com"]["2026-03-24"] is None
    assert kw_data["missing.com"]["2026-03-24"] is None


def test_check_positions_summary(tracker):
    result = tracker.check_positions(
        keywords=["homes for sale", "condos for sale"],
        date="2026-03-24",
    )
    summary = result["summary"]
    assert summary["totalKeywords"] == 2
    assert summary["ranking"] >= 1
    assert summary["top10"] >= 1


def test_milestone_stored(tracker):
    tracker.check_positions(keywords=["test"], date="2026-03-24", label="Audit Baseline")
    milestones = tracker.history["milestones"]
    assert len(milestones) == 1
    assert milestones[0]["label"] == "Audit Baseline"
    assert milestones[0]["date"] == "2026-03-24"


def test_no_duplicate_milestones(tracker):
    tracker.check_positions(keywords=["test"], date="2026-03-24", label="Baseline")
    tracker.check_positions(keywords=["test"], date="2026-03-24", label="Baseline Again")
    assert len(tracker.history["milestones"]) == 1


# --- History Persistence ---

def test_history_saved_to_file(tracker, tmp_path):
    tracker.check_positions(keywords=["test kw"], date="2026-03-24")
    assert tracker.history_path.exists()
    loaded = json.loads(tracker.history_path.read_text())
    assert "test kw" in loaded["keywords"]


def test_history_loaded_on_init(mock_connector, tmp_path):
    path = tmp_path / "h.json"
    path.write_text(json.dumps({
        "meta": {}, "milestones": [],
        "keywords": {"old kw": {"positions": {"example.com": {"2026-01-01": 5}}}}
    }))
    tracker = RankTracker(mock_connector, path, "example.com")
    assert "old kw" in tracker.history["keywords"]


# --- Change Detection ---

def test_change_improved(tracker):
    # First check
    tracker.check_positions(keywords=["test"], date="2026-03-01")
    # Change SERP to rank higher
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 3, "domain": "example.com"},
    ]
    result = tracker.check_positions(keywords=["test"], date="2026-04-01")
    assert result["results"][0]["change"]["direction"] == "improved"
    assert result["results"][0]["change"]["delta"] > 0


def test_change_declined(tracker):
    tracker.check_positions(keywords=["test"], date="2026-03-01")
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 50, "domain": "example.com"},
    ]
    result = tracker.check_positions(keywords=["test"], date="2026-04-01")
    assert result["results"][0]["change"]["direction"] == "declined"


def test_change_new_entry(tracker):
    # First check: not ranking
    tracker.connector.get_serp.return_value = []
    tracker.check_positions(keywords=["test"], date="2026-03-01")
    # Second check: now ranking
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 15, "domain": "example.com"},
    ]
    result = tracker.check_positions(keywords=["test"], date="2026-04-01")
    assert result["results"][0]["change"]["direction"] == "new"


def test_change_lost(tracker):
    tracker.check_positions(keywords=["test"], date="2026-03-01")
    tracker.connector.get_serp.return_value = []
    result = tracker.check_positions(keywords=["test"], date="2026-04-01")
    assert result["results"][0]["change"]["direction"] == "lost"


# --- Snapshot Comparison ---

def test_compare_snapshots(tracker):
    tracker.check_positions(keywords=["kw1", "kw2"], date="2026-03-01")
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 3, "domain": "example.com"},
    ]
    tracker.check_positions(keywords=["kw1", "kw2"], date="2026-04-01")

    deltas = tracker.compare_snapshots("2026-03-01", "2026-04-01")
    assert len(deltas) == 2
    assert all("keyword" in d for d in deltas)
    assert all("delta" in d for d in deltas)


# --- Report Export ---

def test_get_history_for_report(tracker):
    tracker.check_positions(
        keywords=["kw1"],
        competitor_domains=["competitor1.com"],
        date="2026-03-24",
        label="Baseline",
    )
    report = tracker.get_history_for_report()

    assert "snapshots" in report
    assert "chartLabels" in report
    assert "domains" in report
    assert "keywords" in report
    assert report["domains"]["client"] == "example.com"
    assert "2026-03-24" in report["snapshots"]
    assert "Baseline" in report["chartLabels"]


def test_report_multiple_snapshots(tracker):
    tracker.check_positions(keywords=["kw1"], date="2026-03-01", label="Before")
    tracker.connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 5, "domain": "example.com"},
    ]
    tracker.check_positions(keywords=["kw1"], date="2026-04-01", label="After")

    report = tracker.get_history_for_report()
    assert len(report["snapshots"]) == 2
    kw_history = report["keywords"]["kw1"]["history"]["example.com"]
    assert "2026-03-01" in kw_history
    assert "2026-04-01" in kw_history


# --- Domain Normalization ---

def test_domain_normalization(tracker):
    assert tracker._norm_domain("www.example.com") == "example.com"
    assert tracker._norm_domain("https://www.example.com/page") == "example.com"
    assert tracker._norm_domain("EXAMPLE.COM") == "example.com"


# --- API Error Handling ---

def test_serp_error_returns_null_positions(tracker):
    tracker.connector.get_serp.side_effect = Exception("API timeout")
    result = tracker.check_positions(keywords=["test"], date="2026-03-24")
    assert result["results"][0]["clientPosition"] is None
