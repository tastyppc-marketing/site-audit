"""Tests for ClientContext — per-client env/config wrapper."""

from __future__ import annotations

import json
import os
from pathlib import Path

from audit_platform.config.client_context import ClientContext


def test_missing_client_returns_defaults(tmp_path: Path) -> None:
    """Slug with no clients/<slug>/ dir yields default-empty Settings + {}."""
    ctx = ClientContext.from_slug("nonexistent", repo_root=tmp_path)
    assert ctx.slug == "nonexistent"
    assert ctx.client_root == tmp_path / "clients" / "nonexistent"
    assert ctx.client_config == {}
    assert ctx.DATAFORSEO_LOGIN == ""
    assert ctx.DATAFORSEO_PASSWORD == ""
    assert ctx.PAGESPEED_API_KEY is None


def test_loads_env_values_from_client_dot_env(tmp_path: Path) -> None:
    """Per-client .env values populate Settings field-by-field."""
    client_dir = tmp_path / "clients" / "alpha"
    client_dir.mkdir(parents=True)
    (client_dir / ".env").write_text(
        "DATAFORSEO_LOGIN=alpha-user\n"
        "DATAFORSEO_PASSWORD=alpha-pass\n"
        "PAGESPEED_API_KEY=alpha-key\n"
        "GA4_PROPERTY_ID=123456\n"
    )
    ctx = ClientContext.from_slug("alpha", repo_root=tmp_path)
    assert ctx.DATAFORSEO_LOGIN == "alpha-user"
    assert ctx.DATAFORSEO_PASSWORD == "alpha-pass"
    assert ctx.PAGESPEED_API_KEY == "alpha-key"
    assert ctx.GA4_PROPERTY_ID == "123456"


def test_loads_client_config_json(tmp_path: Path) -> None:
    """client-config.json is parsed into the .client_config dict."""
    client_dir = tmp_path / "clients" / "beta"
    client_dir.mkdir(parents=True)
    (client_dir / "client-config.json").write_text(
        json.dumps({
            "clientDomain": "beta.com",
            "clientName": "Beta LLC",
            "competitors": ["c1.com", "c2.com"],
        })
    )
    ctx = ClientContext.from_slug("beta", repo_root=tmp_path)
    assert ctx.client_config["clientDomain"] == "beta.com"
    assert ctx.client_config["clientName"] == "Beta LLC"
    assert ctx.client_config["competitors"] == ["c1.com", "c2.com"]


def test_does_not_mutate_os_environ(tmp_path: Path) -> None:
    """The whole point: reading a client's .env must NOT pollute os.environ."""
    client_dir = tmp_path / "clients" / "iso"
    client_dir.mkdir(parents=True)
    (client_dir / ".env").write_text("DATAFORSEO_LOGIN=should-not-leak\n")

    env_before = dict(os.environ)
    ctx = ClientContext.from_slug("iso", repo_root=tmp_path)
    env_after = dict(os.environ)

    assert env_after == env_before
    # The value made it into the context, just not into the global env
    assert ctx.DATAFORSEO_LOGIN == "should-not-leak"


def test_malformed_client_config_falls_back_to_empty(tmp_path: Path) -> None:
    """Bad JSON in client-config.json yields {} rather than raising."""
    client_dir = tmp_path / "clients" / "broken"
    client_dir.mkdir(parents=True)
    (client_dir / "client-config.json").write_text("{not valid json")
    ctx = ClientContext.from_slug("broken", repo_root=tmp_path)
    assert ctx.client_config == {}


def test_default_repo_root_is_cwd(tmp_path: Path, monkeypatch) -> None:
    """When repo_root is omitted, ClientContext resolves against cwd."""
    client_dir = tmp_path / "clients" / "gamma"
    client_dir.mkdir(parents=True)
    (client_dir / ".env").write_text("DATAFORSEO_LOGIN=cwd-user\n")
    monkeypatch.chdir(tmp_path)
    ctx = ClientContext.from_slug("gamma")
    assert ctx.DATAFORSEO_LOGIN == "cwd-user"
    assert ctx.client_root == tmp_path / "clients" / "gamma"
