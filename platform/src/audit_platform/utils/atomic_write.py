"""Atomic, backed-up JSON writer for pipeline data files.

Python twin of ``template/scripts/lib/atomic-write.js`` (see lines 35-72 there).
A crash, signal, or concurrent write between flush and rename cannot leave the
target in a partial/invalid state. The prior version is preserved at
``${target}.bak`` for recovery.

Flow:
    1. If target exists, copy it to ``${target}.bak`` (overwrites any prior .bak).
    2. Write JSON to ``${target}.tmp-<pid>-<ms>``, flush, and ``os.fsync`` the fd.
    3. ``os.replace(tmp, target)`` — atomic POSIX rename within a filesystem.

On any exception between steps 1 and 3: the target bytes are untouched, the
``.bak`` is preserved, and the ``.tmp-*`` file is best-effort removed.
"""

from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any


def write_json_atomic(target: Path | str, data: Any, *, indent: int = 2) -> None:
    """Write ``data`` as JSON to ``target`` atomically with a ``.bak`` of the prior file.

    Args:
        target: Path to the final file (str or Path).
        data: Any JSON-serializable value.
        indent: ``json.dumps`` indent (default 2). Pass ``None`` for compact output.
    """
    target_path = Path(target).resolve()
    bak_path = target_path.with_name(target_path.name + ".bak")
    tmp_path = target_path.with_name(
        f"{target_path.name}.tmp-{os.getpid()}-{int(time.time() * 1000)}"
    )

    # 1. Back up prior version if present.
    if target_path.exists():
        shutil.copy2(target_path, bak_path)

    # 2. Write tmp + fsync so the bytes are durable before the rename.
    try:
        with open(tmp_path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=indent, default=str)
            fh.flush()
            os.fsync(fh.fileno())
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise

    # 3. Atomic rename. On failure, drop the tmp; .bak + original target are intact.
    try:
        os.replace(tmp_path, target_path)
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise
