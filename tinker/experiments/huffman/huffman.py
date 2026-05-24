#!/usr/bin/env python3
"""huffman — Huffman-encode text from stdin and report compression ratio."""

import heapq
import sys
from collections import Counter


def build_tree(text):
    if not text:
        return None
    freq = Counter(text)
    seq = 0
    heap = []
    for ch, count in freq.items():
        heapq.heappush(heap, (count, seq, ch))
        seq += 1
    if len(heap) == 1:
        return heap[0][2]
    while len(heap) > 1:
        c1, _, left = heapq.heappop(heap)
        c2, _, right = heapq.heappop(heap)
        heapq.heappush(heap, (c1 + c2, seq, (left, right)))
        seq += 1
    return heap[0][2]


def build_codes(tree, prefix="", out=None):
    if out is None:
        out = {}
    if isinstance(tree, tuple):
        left, right = tree
        build_codes(left, prefix + "0", out)
        build_codes(right, prefix + "1", out)
    elif tree is not None:
        out[tree] = prefix or "0"
    return out


def encode(text):
    tree = build_tree(text)
    codes = build_codes(tree)
    bits = "".join(codes[c] for c in text)
    return bits, codes


def decode(bits, codes):
    if not bits:
        return ""
    inverse = {v: k for k, v in codes.items()}
    out = []
    buf = ""
    for b in bits:
        buf += b
        if buf in inverse:
            out.append(inverse[buf])
            buf = ""
    return "".join(out)


def main(argv):
    text = sys.stdin.read()
    if not text:
        print("usage: huffman.py < input.txt", file=sys.stderr)
        return 2
    bits, codes = encode(text)
    original_bits = len(text) * 8
    compressed_bits = len(bits)
    ratio = compressed_bits / original_bits if original_bits else 0
    print(f"input chars:      {len(text)}")
    print(f"unique symbols:   {len(codes)}")
    print(f"original bits:    {original_bits}")
    print(f"compressed bits:  {compressed_bits}")
    print(f"compression:      {ratio:.1%} ({1 - ratio:.1%} savings)")
    print("sample codes (shortest first):")
    for ch, code in sorted(codes.items(), key=lambda kv: (len(kv[1]), kv[0]))[:8]:
        display = repr(ch) if ch in (" ", "\n", "\t") else ch
        print(f"  {display:>6} -> {code}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
