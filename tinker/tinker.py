#!/usr/bin/env python3
"""tinker — runner for the experiments in this repo.

Subcommands:
  list                   print every experiment with its one-line description
  run <name> [args...]   execute experiments/<name>/<name>.py with passthrough args
  new <name>             scaffold a new experiment with a starter .py and README
  test                   run the test suite (python -m unittest discover tests)
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXPERIMENTS = ROOT / "experiments"


def discover():
    if not EXPERIMENTS.is_dir():
        return []
    out = []
    for entry in sorted(EXPERIMENTS.iterdir()):
        if not entry.is_dir() or entry.name.startswith((".", "_")):
            continue
        script = entry / f"{entry.name}.py"
        if script.is_file():
            out.append(entry.name)
    return out


def one_liner(name):
    script = EXPERIMENTS / name / f"{name}.py"
    try:
        with script.open() as f:
            for line in f:
                line = line.strip()
                if line.startswith('"""'):
                    desc = line.strip('"').strip()
                    if desc:
                        return desc
                    return next(f).strip()
    except (OSError, StopIteration):
        pass
    return "(no description)"


def cmd_list():
    names = discover()
    if not names:
        print("no experiments found under experiments/", file=sys.stderr)
        return 1
    width = max(len(n) for n in names)
    for name in names:
        print(f"  {name.ljust(width)}  {one_liner(name)}")
    return 0


def cmd_run(args):
    if not args:
        print("usage: tinker.py run <name> [args...]", file=sys.stderr)
        return 2
    name, *rest = args
    script = EXPERIMENTS / name / f"{name}.py"
    if not script.is_file():
        print(f"no experiment named {name!r} (looked for {script})", file=sys.stderr)
        return 1
    return subprocess.call([sys.executable, str(script), *rest])


SCAFFOLD_PY = '''#!/usr/bin/env python3
"""{name} — TODO: one-line description."""

import sys


def main(argv):
    print("hello from {name}", argv)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
'''

SCAFFOLD_MD = """# {name}

TODO: describe what this experiment does.

```sh
python3 {name}.py
```
"""


def cmd_new(args):
    if len(args) != 1:
        print("usage: tinker.py new <name>", file=sys.stderr)
        return 2
    name = args[0]
    if not name.isidentifier():
        print(f"experiment name must be a valid identifier, got {name!r}", file=sys.stderr)
        return 2
    folder = EXPERIMENTS / name
    if folder.exists():
        print(f"refusing to overwrite existing folder {folder}", file=sys.stderr)
        return 1
    folder.mkdir(parents=True)
    (folder / f"{name}.py").write_text(SCAFFOLD_PY.format(name=name))
    (folder / "README.md").write_text(SCAFFOLD_MD.format(name=name))
    print(f"scaffolded {folder.relative_to(ROOT)}/")
    return 0


def cmd_test():
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT) + os.pathsep + env.get("PYTHONPATH", "")
    return subprocess.call(
        [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-t", str(ROOT)],
        cwd=str(ROOT),
        env=env,
    )


def main(argv):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__.strip())
        return 0
    cmd, *rest = argv
    if cmd == "list":
        return cmd_list()
    if cmd == "run":
        return cmd_run(rest)
    if cmd == "new":
        return cmd_new(rest)
    if cmd == "test":
        return cmd_test()
    print(f"unknown command: {cmd}", file=sys.stderr)
    print(__doc__.strip(), file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
