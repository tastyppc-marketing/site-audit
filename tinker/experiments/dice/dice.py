#!/usr/bin/env python3
"""dice — roll dice in NdM±K notation, with ASCII art for d6 rolls."""

import random
import re
import sys

D6_ART = {
    1: ["┌─────┐", "│     │", "│  •  │", "│     │", "└─────┘"],
    2: ["┌─────┐", "│ •   │", "│     │", "│   • │", "└─────┘"],
    3: ["┌─────┐", "│ •   │", "│  •  │", "│   • │", "└─────┘"],
    4: ["┌─────┐", "│ • • │", "│     │", "│ • • │", "└─────┘"],
    5: ["┌─────┐", "│ • • │", "│  •  │", "│ • • │", "└─────┘"],
    6: ["┌─────┐", "│ • • │", "│ • • │", "│ • • │", "└─────┘"],
}

PATTERN = re.compile(r"^(\d+)?d(\d+)([+-]\d+)?$", re.IGNORECASE)


def parse(spec):
    m = PATTERN.match(spec.strip().replace(" ", ""))
    if not m:
        raise ValueError(f"invalid dice spec: {spec!r}")
    n = int(m.group(1) or "1")
    sides = int(m.group(2))
    mod = int(m.group(3) or "0")
    if n < 1 or sides < 2:
        raise ValueError(f"need at least 1 die and 2 sides, got {spec!r}")
    return n, sides, mod


def roll(n, sides, mod, rng=None):
    rng = rng or random
    rolls = [rng.randint(1, sides) for _ in range(n)]
    return rolls, sum(rolls) + mod


def render_d6(rolls):
    rows = ["", "", "", "", ""]
    for r in rolls:
        for i, line in enumerate(D6_ART[r]):
            rows[i] += line + " "
    return "\n".join(row.rstrip() for row in rows)


def main(argv):
    if not argv:
        argv = ["1d6"]
    spec = argv[0]
    seed = None
    for arg in argv[1:]:
        if arg.startswith("--seed="):
            seed = int(arg.split("=", 1)[1])
    rng = random.Random(seed) if seed is not None else random
    try:
        n, sides, mod = parse(spec)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2
    rolls, total = roll(n, sides, mod, rng)
    if sides == 6 and n <= 10:
        print(render_d6(rolls))
    print(f"rolls: {rolls}  modifier: {mod:+d}  total: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
