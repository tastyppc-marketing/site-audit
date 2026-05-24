#!/usr/bin/env python3
"""markov — train a Markov chain on stdin text, generate new text."""

import random
import sys
from collections import defaultdict


def tokenize(text):
    return text.split()


def build(tokens, order=1):
    chain = defaultdict(list)
    if len(tokens) <= order:
        return chain
    for i in range(len(tokens) - order):
        key = tuple(tokens[i:i + order])
        chain[key].append(tokens[i + order])
    return chain


def generate(chain, length, order=1, seed=None):
    if not chain:
        return ""
    rng = random.Random(seed)
    keys = list(chain.keys())
    start = rng.choice(keys)
    output = list(start)
    for _ in range(length - order):
        key = tuple(output[-order:])
        choices = chain.get(key)
        if not choices:
            output.extend(rng.choice(keys))
            continue
        output.append(rng.choice(choices))
    return " ".join(output[:length])


def main(argv):
    order = 1
    length = 30
    seed = None
    for flag in argv:
        if flag.startswith("--order="):
            order = int(flag.split("=", 1)[1])
        elif flag.startswith("--length="):
            length = int(flag.split("=", 1)[1])
        elif flag.startswith("--seed="):
            seed = int(flag.split("=", 1)[1])
        else:
            print(f"unknown flag: {flag}", file=sys.stderr)
            return 2
    text = sys.stdin.read()
    tokens = tokenize(text)
    chain = build(tokens, order=order)
    print(generate(chain, length, order=order, seed=seed))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
