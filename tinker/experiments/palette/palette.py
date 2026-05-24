#!/usr/bin/env python3
"""Generate a 5-color palette from a hex seed and print with true-color swatches.

Usage: python3 palette.py "#3b82f6"
"""

import colorsys
import sys


def parse_hex(s):
    s = s.strip().lstrip("#")
    if len(s) == 3:
        s = "".join(c * 2 for c in s)
    if len(s) != 6:
        raise ValueError(f"expected a 3- or 6-digit hex color, got {s!r}")
    return tuple(int(s[i:i + 2], 16) / 255 for i in (0, 2, 4))


def to_hex(rgb):
    return "#" + "".join(f"{int(round(c * 255)):02x}" for c in rgb)


def shift(rgb, dh=0.0, ds=0.0, dl=0.0):
    h, l, s = colorsys.rgb_to_hls(*rgb)
    h = (h + dh) % 1.0
    s = max(0.0, min(1.0, s + ds))
    l = max(0.0, min(1.0, l + dl))
    return colorsys.hls_to_rgb(h, l, s)


def palette(seed_rgb):
    # complement + two analogous tints + one deep shade — a balanced 5-stop ramp.
    return [
        shift(seed_rgb, dl=+0.30, ds=-0.10),  # tint
        shift(seed_rgb, dl=+0.15),            # light
        seed_rgb,                              # base
        shift(seed_rgb, dl=-0.18, ds=+0.05),  # shade
        shift(seed_rgb, dh=+0.5),              # complement
    ]


def swatch(rgb, label):
    r, g, b = (int(round(c * 255)) for c in rgb)
    block = f"\x1b[48;2;{r};{g};{b}m       \x1b[0m"
    return f"{block}  {to_hex(rgb)}  {label}"


LABELS = ["tint", "light", "base", "shade", "complement"]


def main():
    if len(sys.argv) != 2:
        print("usage: palette.py <hex-color>", file=sys.stderr)
        sys.exit(2)
    seed = parse_hex(sys.argv[1])
    for color, name in zip(palette(seed), LABELS):
        print(swatch(color, name))


if __name__ == "__main__":
    main()
