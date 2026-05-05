#!/usr/bin/env python3
"""tier5_python_smoke.py — Smoke gate E-Smoke-Python.

Validates the env-isolation flow on the Python side:
  1. os.environ['DATAFORSEO_LOGIN'] is unset before the run.
  2. ClientContext.from_slug('matt-wallmow') loads creds via
     dotenv_values() into a per-context Settings object without touching
     os.environ.
  3. DataForSEOConnector(ctx=ctx) successfully calls a credentialed
     endpoint (get_domain_metrics) end-to-end.
  4. After the credentialed call, os.environ['DATAFORSEO_LOGIN'] is
     STILL unset — proving the dotenv_values-only path with no
     load_dotenv()-style mutation.

Exits 0 on success, 1 on any assertion failure. Safe to re-run.
"""
from __future__ import annotations

import os
import sys


def _fail(msg: str) -> "NoReturn":  # type: ignore[name-defined]
    sys.stderr.write(f"FAIL: {msg}\n")
    sys.exit(1)


def main() -> None:
    pre_login = os.environ.get("DATAFORSEO_LOGIN")
    if pre_login:
        _fail(
            "DATAFORSEO_LOGIN is already set in os.environ before the run. "
            "Cannot prove non-mutation. Re-run from a clean shell."
        )

    # Imports come AFTER the pre-check so that any dotenv side effects in
    # module init would also be caught.
    from audit_platform.config.client_context import ClientContext
    from audit_platform.connectors.dataforseo import DataForSEOConnector

    ctx = ClientContext.from_slug("matt-wallmow")
    if not ctx.DATAFORSEO_LOGIN or not ctx.DATAFORSEO_PASSWORD:
        _fail(
            "ClientContext for matt-wallmow has empty DATAFORSEO_LOGIN/PASSWORD. "
            "Verify clients/matt-wallmow/.env is populated."
        )

    # Mid-flight assertion: ClientContext construction must not have
    # touched os.environ.
    if os.environ.get("DATAFORSEO_LOGIN") is not None:
        _fail("os.environ['DATAFORSEO_LOGIN'] was set by ClientContext construction.")

    connector = DataForSEOConnector(ctx=ctx)
    metrics = connector.get_domain_metrics("mattwallmow.com")
    if metrics is None:
        _fail("DataForSEOConnector.get_domain_metrics returned None.")

    # The connector returned a DomainMetrics dataclass; spot-check it has
    # something usable. We do not pin to specific values since DFS data
    # changes daily.
    referring_domains = getattr(metrics, "referring_domains", None)
    backlinks_count = getattr(metrics, "backlinks", None)
    if referring_domains is None and backlinks_count is None:
        _fail(
            f"DomainMetrics looks empty (referring_domains={referring_domains!r}, "
            f"backlinks={backlinks_count!r}). Auth or shape problem."
        )

    # Final assertion: the credentialed call must not have touched
    # os.environ.
    post_login = os.environ.get("DATAFORSEO_LOGIN")
    if post_login is not None:
        _fail(
            f"os.environ['DATAFORSEO_LOGIN'] was set after the credentialed call: "
            f"{post_login!r}"
        )

    print("PASS: tier5_python_smoke")
    print(f"  client slug:           matt-wallmow")
    print(f"  ctx.DATAFORSEO_LOGIN:  <{len(ctx.DATAFORSEO_LOGIN or '')} chars>")
    print(f"  referring_domains:     {referring_domains}")
    print(f"  backlinks:             {backlinks_count}")
    print(f"  os.environ login:      <unset before, during, and after>")


if __name__ == "__main__":
    main()
