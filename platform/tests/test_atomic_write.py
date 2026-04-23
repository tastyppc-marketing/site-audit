"""Tests for audit_platform.utils.atomic_write.

Mirrors the JS-side semantics in template/scripts/lib/atomic-write.js:
crash-safe replace-then-rename, with a .bak copy of the prior file.
"""

from __future__ import annotations

import builtins
import json
from pathlib import Path

import pytest

from audit_platform.utils.atomic_write import write_json_atomic


def test_round_trip(tmp_path: Path) -> None:
    """Writing then reading should return the same payload."""
    target = tmp_path / "audit.json"
    payload = {"client": "matt", "competitors": ["a.com", "b.com"], "score": 42}

    write_json_atomic(target, payload)

    assert target.exists()
    assert json.loads(target.read_text()) == payload


def test_existing_target_backed_up(tmp_path: Path) -> None:
    """A pre-existing target gets copied to .bak before being overwritten."""
    target = tmp_path / "audit.json"
    target.write_text(json.dumps({"version": "old"}))

    write_json_atomic(target, {"version": "new"})

    bak = target.with_name(target.name + ".bak")
    assert bak.exists(), "expected .bak to be preserved"
    assert json.loads(bak.read_text()) == {"version": "old"}
    assert json.loads(target.read_text()) == {"version": "new"}


def test_crash_during_write_leaves_target_intact(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """If json.dump raises, the target stays at its prior contents and no .tmp leaks."""
    target = tmp_path / "audit.json"
    target.write_text(json.dumps({"version": "preserve_me"}))

    # Force json.dump to raise during the tmp-write step.
    def boom(*_args, **_kwargs):
        raise RuntimeError("simulated crash mid-write")

    monkeypatch.setattr(json, "dump", boom)

    with pytest.raises(RuntimeError, match="simulated crash mid-write"):
        write_json_atomic(target, {"version": "new"})

    # Target unchanged.
    assert json.loads(target.read_text()) == {"version": "preserve_me"}

    # No leftover .tmp-* files in the directory.
    leftovers = list(tmp_path.glob("audit.json.tmp-*"))
    assert leftovers == [], f"expected no .tmp leftovers, found: {leftovers}"


def test_first_write_no_backup(tmp_path: Path) -> None:
    """When the target doesn't exist yet, no .bak is created (nothing to back up)."""
    target = tmp_path / "fresh.json"
    assert not target.exists()

    write_json_atomic(target, {"hello": "world"})

    assert target.exists()
    assert not target.with_name(target.name + ".bak").exists()
