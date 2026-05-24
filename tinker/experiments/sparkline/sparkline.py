#!/usr/bin/env python3
"""Print a unicode sparkline from numbers given on argv or stdin."""

import sys

BARS = "▁▂▃▄▅▆▇█"


def sparkline(values):
    if not values:
        return ""
    lo, hi = min(values), max(values)
    span = hi - lo or 1
    return "".join(BARS[min(len(BARS) - 1, int((v - lo) / span * len(BARS)))] for v in values)


def read_numbers(args):
    if args:
        source = " ".join(args)
    else:
        source = sys.stdin.read()
    tokens = source.replace(",", " ").split()
    return [float(t) for t in tokens]


if __name__ == "__main__":
    print(sparkline(read_numbers(sys.argv[1:])))
