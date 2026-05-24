#!/usr/bin/env python3
"""entropy — compute Shannon entropy of bytes from a file or stdin."""

import math
import sys
from collections import Counter


def shannon(data):
    if not data:
        return 0.0
    counts = Counter(data)
    total = len(data)
    return -sum((c / total) * math.log2(c / total) for c in counts.values())


def histogram(data, width=60):
    if not data:
        return ""
    counts = Counter(data)
    max_count = max(counts.values())
    lines = []
    for b in sorted(counts.keys()):
        bar = "█" * max(1, int(counts[b] / max_count * width))
        display = chr(b) if 32 <= b < 127 else "."
        lines.append(f"  0x{b:02x} {display!r:>5}  {bar} {counts[b]}")
    return "\n".join(lines)


def main(argv):
    if argv:
        with open(argv[0], "rb") as f:
            data = f.read()
        label = argv[0]
    else:
        data = sys.stdin.buffer.read()
        label = "<stdin>"
    e = shannon(data)
    print(f"source:   {label}")
    print(f"bytes:    {len(data)}")
    print(f"entropy:  {e:.4f} bits/byte (max 8.0)")
    if e:
        print(f"density:  {e / 8:.1%} of optimal")
    if 0 < len(data) <= 4096:
        print()
        print(histogram(data))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
