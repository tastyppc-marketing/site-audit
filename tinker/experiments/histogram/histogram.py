#!/usr/bin/env python3
"""histogram — print a horizontal bar histogram from numbers or label:value pairs."""

import sys


def read_pairs(args):
    if args:
        source = "\n".join(args)
    else:
        source = sys.stdin.read()
    pairs = []
    for line in source.replace(",", "\n").splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" in line:
            label, value = line.split(":", 1)
            pairs.append((label.strip(), float(value)))
        else:
            for tok in line.split():
                pairs.append(("", float(tok)))
    if pairs and all(p[0] == "" for p in pairs):
        pairs = [(str(i), v) for i, (_, v) in enumerate(pairs)]
    return pairs


def render(pairs, width=40):
    if not pairs:
        return ""
    label_w = max(len(p[0]) for p in pairs)
    max_v = max(p[1] for p in pairs) or 1
    lines = []
    for label, value in pairs:
        bar = "█" * int(value / max_v * width)
        lines.append(f"  {label.rjust(label_w)} │ {bar} {value:g}")
    return "\n".join(lines)


def main(argv):
    pairs = read_pairs(argv)
    out = render(pairs)
    if out:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
